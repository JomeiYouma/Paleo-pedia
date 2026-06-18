import { query, getClient } from '../lib/db.js';
import { randomUUID } from 'crypto';

const TEXT_FIELDS = [
  'titre', 'titre_en', 'annee', 'description', 'description_en',
  'exhume_par', 'location', 'location_en', 'image_path', 'url_qr',
  'date', 'visible', 'lat', 'lng', 'submitter_contact',
];

// `details_blocks` est un JSON.stringify d'un tableau de blocs en BDD.
// `use_internal_details` est un TINYINT(1) qu'on expose en boolean côté API.
const parseDetailsBlocks = (raw) => {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
};

function buildSelectFull({ includeWorkshops = false } = {}) {
  return `
  SELECT
    c.*,
    u.email AS created_by_email,
    s.slug  AS subsite_slug,
    s.name  AS subsite_name,
    GROUP_CONCAT(
      DISTINCT CONCAT_WS('||', cat.id, cat.name, cat.name_en, cat.color, cat.icon)
      SEPARATOR ';;'
    ) AS categories_raw${includeWorkshops ? `,
    GROUP_CONCAT(
      DISTINCT CONCAT_WS('||', w.id, w.name, w.is_immersive)
      SEPARATOR ';;'
    ) AS workshops_raw` : ''}
  FROM cartels c
  LEFT JOIN users u ON u.id = c.created_by
  LEFT JOIN subsites s ON s.id = c.subsite_id
  LEFT JOIN cartel_categories cc ON cc.cartel_id = c.id
  LEFT JOIN categories cat ON cat.id = cc.category_id${includeWorkshops ? '\n  LEFT JOIN workshop_cartels wc ON wc.cartel_id = c.id\n  LEFT JOIN workshops w ON w.id = wc.workshop_id' : ''}
`;
}

/** Parse les catégories retournées (MySQL renvoie du JSON en string selon le driver) */
function parseCartel(row) {
  if (!row) return null;
  
  if (row.categories_raw) {
    const cats_full = row.categories_raw.split(';;').map(catStr => {
      const [id, name, name_en, color, icon] = catStr.split('||');
      return { id, name, name_en, color, icon };
    }).filter(c => c.id);
    row.categories = cats_full.map(c => c.name);
    row.categories_en = cats_full.map(c => c.name_en || c.name);
    row.category_objects = cats_full;
  } else {
    row.categories = [];
    row.categories_en = [];
    row.category_objects = [];
  }
  delete row.categories_raw;

  if (row.workshops_raw) {
    const workshops = row.workshops_raw.split(';;').map(workshopStr => {
      const [id, name, isImmersive] = workshopStr.split('||');
      return { id, name, is_immersive: isImmersive === '1' || isImmersive === 'true' };
    }).filter(w => w.id);
    row.workshopIds = workshops.map(w => w.id);
    row.workshop_objects = workshops;
  } else {
    row.workshopIds = [];
    row.workshop_objects = [];
  }
  delete row.workshops_raw;

  row.imageCredit = row.image_credit || '';
  delete row.image_credit;
  // Convertir TINYINT(1) en boolean
  row.visible = !!row.visible;
  row.use_internal_details = !!row.use_internal_details;
  row.details_blocks = parseDetailsBlocks(row.details_blocks);
  return row;
}

export const CartelModel = {

  async findAll({ status, visible, category, search, limit = 50, offset = 0, includeWorkshops = false, subsiteFilter } = {}) {
    const conditions = [];
    const values = [];

    // Isolation par sous-site — toujours appliquée, même valeur 'none' = pas de filtre
    // (superadmin uniquement ; les contrôleurs sont responsables de ne jamais envoyer 'none' pour un non-superadmin)
    //
    // Subsite « mode atelier » : si le filtre contient workshopId, le corpus
    // n'est PAS cartels.subsite_id = subsite.id (vide la plupart du temps,
    // les cartels d'un atelier vivant ailleurs) mais l'ensemble des cartels
    // membres de l'atelier via workshop_cartels. C'est une vue live sur
    // l'atelier — adds/removals dans l'atelier se reflètent immédiatement.
    if (subsiteFilter === 'main') {
      conditions.push('c.subsite_id IS NULL');
    } else if (subsiteFilter === 'main_feed') {
      conditions.push('(c.subsite_id IS NULL OR c.visible_on_main = 1)');
    } else if (subsiteFilter && typeof subsiteFilter === 'object' && subsiteFilter.workshopId) {
      conditions.push('c.id IN (SELECT cartel_id FROM workshop_cartels WHERE workshop_id = ?)');
      values.push(subsiteFilter.workshopId);
    } else if (subsiteFilter && typeof subsiteFilter === 'object' && subsiteFilter.id) {
      conditions.push('c.subsite_id = ?');
      values.push(subsiteFilter.id);
    }
    // subsiteFilter === 'none' ou undefined → aucun filtre (superadmin global)

    if (status)              { conditions.push('c.status = ?');   values.push(status); }
    if (visible !== undefined) { conditions.push('c.visible = ?'); values.push(visible ? 1 : 0); }
    if (category) {
      conditions.push('c.id IN (SELECT cartel_id FROM cartel_categories WHERE category_id = ?)');
      values.push(category);
    }
    if (search) {
      conditions.push('(c.titre LIKE ? OR c.description LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await query(
      `${buildSelectFull({ includeWorkshops })} ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      values
    );
    return rows.map(parseCartel);
  },

  async findById(id, { includeWorkshops = false } = {}) {
    const { rows } = await query(
      `${buildSelectFull({ includeWorkshops })} WHERE c.id = ? GROUP BY c.id`,
      [id]
    );
    return parseCartel(rows[0]);
  },

  async create(data, userId, submitterIp = null, subsiteId = null) {
    const client = await getClient();
    try {
      await client.query('START TRANSACTION');
      const id = randomUUID();

      // `visible` suit `status='published'` : la colonne est vestigiale mais
      // encore lue côté frontend pour masquer les cartels non publiés. On la
      // synchronise ici pour qu'un cartel créé directement en 'published'
      // apparaisse aux visiteurs anonymes.
      const cartelStatus = data.status ?? 'draft';
      const visible = cartelStatus === 'published' ? 1 : (data.visible ? 1 : 0);

      // submitter_contact : email/tél du contact à recontacter au sujet du cartel.
      // - Visiteur anonyme : son propre contact (champ obligatoire côté UI).
      // - Admin connecté : contact d'un tiers s'il saisit le cartel pour quelqu'un
      //   d'autre (cf. Create.jsx label "Contact de l'auteur"). Si vide, on stocke
      //   null et on retombera sur l'email du compte au moment du recontact.
      const submitterContact = typeof data.submitter_contact === 'string'
        ? data.submitter_contact.trim().slice(0, 255) || null
        : null;

      const detailsBlocksJson = Array.isArray(data.details_blocks)
        ? JSON.stringify(data.details_blocks)
        : null;
      const useInternalDetails = data.use_internal_details ? 1 : 0;

      await client.query(
        `INSERT INTO cartels (
           id, created_by, subsite_id, titre, titre_en, annee, description, description_en,
           exhume_par, location, location_en, lat, lng,
           image_path, image_credit, url_qr, details_blocks, use_internal_details,
           date, status, visible, submitter_ip, submitter_contact
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId ?? null, subsiteId,
          data.titre,            data.titre_en      ?? '',
          data.annee             ?? '',
          data.description       ?? '',
          data.description_en    ?? '',
          data.exhume_par        ?? '',
          data.location          ?? '',
          data.location_en       ?? '',
          data.lat               ?? null,
          data.lng               ?? null,
          data.image_path        ?? '',
          data.imageCredit       ?? data.image_credit ?? '',
          data.url_qr            ?? '',
          detailsBlocksJson,
          useInternalDetails,
          data.date              ?? null,
          cartelStatus,
          visible,
          submitterIp,
          submitterContact,
        ]
      );

      await CartelModel._syncCategories(client, id, data.category_ids ?? []);
      if (data.workshop_ids !== undefined || data.workshopIds !== undefined) {
        await CartelModel._syncWorkshops(client, id, data.workshop_ids ?? data.workshopIds ?? []);
      }
      await client.query('COMMIT');
      return this.findById(id, { includeWorkshops: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const client = await getClient();
    try {
      await client.query('START TRANSACTION');

      const sets = [];
      const values = [];
      for (const field of TEXT_FIELDS) {
        if (field in data) {
          sets.push(`${field} = ?`);
          values.push(field === 'visible' ? (data[field] ? 1 : 0) : data[field]);
        }
      }
      if ('imageCredit' in data) {
        sets.push('image_credit = ?');
        values.push(data.imageCredit ?? '');
      } else if ('image_credit' in data) {
        sets.push('image_credit = ?');
        values.push(data.image_credit ?? '');
      }
      if ('details_blocks' in data) {
        sets.push('details_blocks = ?');
        values.push(Array.isArray(data.details_blocks) ? JSON.stringify(data.details_blocks) : null);
      }
      if ('use_internal_details' in data) {
        sets.push('use_internal_details = ?');
        values.push(data.use_internal_details ? 1 : 0);
      }
      if (sets.length) {
        values.push(id);
        await client.query(`UPDATE cartels SET ${sets.join(', ')} WHERE id = ?`, values);
      }

      if (data.category_ids !== undefined) {
        await CartelModel._syncCategories(client, id, data.category_ids);
      }
      if (data.workshop_ids !== undefined || data.workshopIds !== undefined) {
        await CartelModel._syncWorkshops(client, id, data.workshop_ids ?? data.workshopIds ?? []);
      }

      await client.query('COMMIT');
      return this.findById(id, { includeWorkshops: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async setStatus(id, status) {
    // `visible` est une colonne vestigiale encore lue par le frontend
    // (Library.jsx filtre les visiteurs anonymes sur c.visible). On la
    // synchronise avec le statut : visible=1 uniquement quand publié.
    const visible = status === 'published' ? 1 : 0;
    if (status === 'published') {
      await query(
        'UPDATE cartels SET status = ?, visible = ?, published_at = NOW() WHERE id = ?',
        [status, visible, id]
      );
    } else {
      await query(
        'UPDATE cartels SET status = ?, visible = ? WHERE id = ?',
        [status, visible, id]
      );
    }
    return this.findById(id);
  },

  /** Marque un cartel de sous-site comme soumis pour validation sur le site principal */
  /**
   * Marque un cartel comme soumis pour validation sur le site principal.
   * Idempotent : si submitted_to_main_at est déjà renseigné, on conserve
   * l'horodatage de la première soumission (évite de perdre l'historique
   * quand le contrôleur appelle cette méthode sur chaque update).
   */
  async markSubmittedToMain(id) {
    await query(
      `UPDATE cartels
         SET submitted_to_main_at = IFNULL(submitted_to_main_at, NOW()),
             visible_on_main = 0
       WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  },

  /** Retire une soumission (owner side) ou la rejette (superadmin side) */
  async clearSubmissionToMain(id) {
    await query(
      'UPDATE cartels SET submitted_to_main_at = NULL, visible_on_main = 0 WHERE id = ?',
      [id]
    );
    return this.findById(id);
  },

  /** Superadmin : approuve un cartel soumis pour affichage sur le site principal */
  async approveForMain(id) {
    await query('UPDATE cartels SET visible_on_main = 1 WHERE id = ?', [id]);
    return this.findById(id);
  },

  /**
   * Re-met en file de validation principale un cartel DÉJÀ approuvé qui vient
   * d'être modifié par son sous-site (mode 'strict'). On retire du principal
   * (visible_on_main = 0) et on rafraîchit l'horodatage pour que la soumission
   * réapparaisse en bas de la file (≠ markSubmittedToMain qui conserve la date
   * d'origine via IFNULL).
   */
  async requeueForMain(id) {
    await query(
      'UPDATE cartels SET visible_on_main = 0, submitted_to_main_at = NOW() WHERE id = ?',
      [id]
    );
    return this.findById(id);
  },

  /** Liste des cartels de sous-sites soumis et en attente de décision */
  async findPendingSubmissions({ limit = 50, offset = 0 } = {}) {
    const { rows } = await query(
      `${buildSelectFull()}
       WHERE c.submitted_to_main_at IS NOT NULL
         AND c.visible_on_main = 0
         AND c.subsite_id IS NOT NULL
       GROUP BY c.id
       ORDER BY c.submitted_to_main_at ASC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      []
    );
    return rows.map(parseCartel);
  },

  async delete(id) {
    await query('DELETE FROM cartels WHERE id = ?', [id]);
  },

  /**
   * Agrégations pour la page de statistiques admin.
   *
   * Tous les filtres s'appliquent à la sous-population de cartels comptée par
   * chaque agrégation. On enchaîne plusieurs requêtes en parallèle plutôt
   * qu'une grosse requête agrégée : plus simple à lire, chaque GROUP BY a sa
   * propre logique.
   *
   * `subsiteFilter` suit le même contrat que findAll() : 'none' = aucun filtre
   * (superadmin global), 'main' = site principal uniquement, { id } = un sous-site.
   * Le contrôleur est responsable de ne jamais passer 'none' à un non-superadmin.
   */
  async getStats({
    subsiteFilter,
    categoryIds,
    statuses,
    createdFrom,
    createdTo,
    yearMin,
    yearMax,
    exhumePar,
    visible,
  } = {}) {
    const conditions = [];
    const values = [];

    // Cf. findAll() pour la sémantique du subsiteFilter (notamment workshopId).
    if (subsiteFilter === 'main') {
      conditions.push('c.subsite_id IS NULL');
    } else if (subsiteFilter && typeof subsiteFilter === 'object' && subsiteFilter.workshopId) {
      conditions.push('c.id IN (SELECT cartel_id FROM workshop_cartels WHERE workshop_id = ?)');
      values.push(subsiteFilter.workshopId);
    } else if (subsiteFilter && typeof subsiteFilter === 'object' && subsiteFilter.id) {
      conditions.push('c.subsite_id = ?');
      values.push(subsiteFilter.id);
    }

    if (Array.isArray(statuses) && statuses.length) {
      conditions.push(`c.status IN (${statuses.map(() => '?').join(',')})`);
      values.push(...statuses);
    }
    if (createdFrom) { conditions.push('c.created_at >= ?'); values.push(createdFrom); }
    if (createdTo)   { conditions.push('c.created_at <= ?'); values.push(createdTo); }
    if (exhumePar)   { conditions.push('c.exhume_par LIKE ?'); values.push(`%${exhumePar}%`); }
    if (visible !== undefined) { conditions.push('c.visible = ?'); values.push(visible ? 1 : 0); }

    // Bornes sur `annee` : la colonne est VARCHAR (peut contenir "Antiquité",
    // "vers 1750"…). On n'applique le filtre numérique qu'aux valeurs
    // entièrement composées d'un entier (signe optionnel).
    if (yearMin !== undefined && yearMin !== null && yearMin !== '') {
      conditions.push(`c.annee REGEXP '^-?[0-9]+$' AND CAST(c.annee AS SIGNED) >= ?`);
      values.push(parseInt(yearMin, 10));
    }
    if (yearMax !== undefined && yearMax !== null && yearMax !== '') {
      conditions.push(`c.annee REGEXP '^-?[0-9]+$' AND CAST(c.annee AS SIGNED) <= ?`);
      values.push(parseInt(yearMax, 10));
    }

    if (Array.isArray(categoryIds) && categoryIds.length) {
      conditions.push(
        `c.id IN (SELECT cartel_id FROM cartel_categories WHERE category_id IN (${categoryIds.map(() => '?').join(',')}))`
      );
      values.push(...categoryIds);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const andOrWhere = where ? 'AND' : 'WHERE';

    const [
      totalRes,
      byCategoryRes,
      bySubsiteRes,
      byStatusRes,
      byMonthRes,
      byYearRes,
      topExhumeRes,
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM cartels c ${where}`, values),

      query(
        `SELECT cat.id, cat.name, cat.name_en, cat.color, COUNT(DISTINCT c.id) AS count
           FROM cartels c
           JOIN cartel_categories cc ON cc.cartel_id = c.id
           JOIN categories cat ON cat.id = cc.category_id
           ${where}
           GROUP BY cat.id, cat.name, cat.name_en, cat.color
           ORDER BY count DESC`,
        values
      ),

      query(
        `SELECT s.id, s.name, s.slug, s.primary_color, COUNT(*) AS count
           FROM cartels c
           LEFT JOIN subsites s ON s.id = c.subsite_id
           ${where}
           GROUP BY s.id, s.name, s.slug, s.primary_color
           ORDER BY count DESC`,
        values
      ),

      query(
        `SELECT c.status, COUNT(*) AS count
           FROM cartels c
           ${where}
           GROUP BY c.status`,
        values
      ),

      query(
        `SELECT DATE_FORMAT(c.created_at, '%Y-%m') AS month, COUNT(*) AS count
           FROM cartels c
           ${where}
           GROUP BY month
           ORDER BY month ASC`,
        values
      ),

      // Distribution par époque : on ne garde que les `annee` numériques pour
      // que le client puisse bucketiser proprement (50 ou 100 ans selon plage).
      query(
        `SELECT CAST(c.annee AS SIGNED) AS year, COUNT(*) AS count
           FROM cartels c
           ${where} ${andOrWhere} c.annee REGEXP '^-?[0-9]+$'
           GROUP BY year
           ORDER BY year ASC`,
        values
      ),

      // `exhume_par` est saisi librement et contient souvent plusieurs noms
      // séparés par virgules, "et" ou "&" (« Jean Dupont, Marie Curie et Paul X »).
      // On récupère donc les chaînes brutes et on splitte côté JS pour compter
      // chaque contributeur individuellement, sinon "Alice, Bob" et "Alice"
      // seraient comptés comme deux contributeurs distincts.
      query(
        `SELECT c.exhume_par AS raw
           FROM cartels c
           ${where} ${andOrWhere} TRIM(c.exhume_par) <> ''`,
        values
      ),
    ]);

    // Agrégation des contributeurs : split sur "," "&" et "et" (avec frontières
    // de mot pour ne pas casser des noms comme "Etienne"), trim, dédup par
    // forme normalisée (lower + sans diacritiques + collapse spaces) pour
    // fusionner "Cédric Carles", "Cedric Carles" et "cedric  carles". Pour
    // l'affichage, on garde la graphie la plus accentuée rencontrée (Cédric
    // l'emporte sur Cedric), à comptage de diacritiques égal la première.
    const SPLIT_RE = /\s*(?:,|&|\bet\b|\bET\b)\s*/g;
    const normalizeKey = (s) =>
      s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ');
    const diacriticCount = (s) => {
      const decomposed = s.normalize('NFD');
      const stripped = decomposed.replace(/\p{Diacritic}/gu, '');
      return decomposed.length - stripped.length;
    };
    const exhumeCounts = new Map(); // key normalisée → { name, count }
    for (const row of topExhumeRes.rows) {
      const raw = (row.raw || '').trim();
      if (!raw) continue;
      const parts = raw.split(SPLIT_RE).map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        const key = normalizeKey(part);
        const existing = exhumeCounts.get(key);
        if (existing) {
          existing.count += 1;
          if (diacriticCount(part) > diacriticCount(existing.name)) {
            existing.name = part;
          }
        } else {
          exhumeCounts.set(key, { name: part, count: 1 });
        }
      }
    }
    const topExhumePar = [...exhumeCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      total: totalRes.rows[0]?.total ?? 0,
      byCategory: byCategoryRes.rows.map(r => ({
        id: r.id, name: r.name, name_en: r.name_en, color: r.color, count: Number(r.count),
      })),
      bySubsite: bySubsiteRes.rows.map(r => ({
        id: r.id, name: r.name || 'Site principal', slug: r.slug, color: r.primary_color, count: Number(r.count),
      })),
      byStatus: byStatusRes.rows.map(r => ({ status: r.status, count: Number(r.count) })),
      byMonth: byMonthRes.rows.map(r => ({ month: r.month, count: Number(r.count) })),
      byYear: byYearRes.rows.map(r => ({ year: Number(r.year), count: Number(r.count) })),
      topExhumePar,
    };
  },

  async _syncCategories(client, cartelId, categoryIds) {
    await client.query('DELETE FROM cartel_categories WHERE cartel_id = ?', [cartelId]);
    for (const catId of categoryIds) {
      await client.query(
        'INSERT IGNORE INTO cartel_categories (cartel_id, category_id) VALUES (?, ?)',
        [cartelId, catId]
      );
    }
  },

  async _syncWorkshops(client, cartelId, workshopIds) {
    await client.query('DELETE FROM workshop_cartels WHERE cartel_id = ?', [cartelId]);
    for (const workshopId of workshopIds) {
      await client.query(
        'INSERT IGNORE INTO workshop_cartels (workshop_id, cartel_id) VALUES (?, ?)',
        [workshopId, cartelId]
      );
    }
  },
};
