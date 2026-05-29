/**
 * Subsite.js — Modèle MySQL pour les sous-sites
 *
 * Un subsite est lié à UNE source qui détermine son corpus de cartels :
 *   - mode catégorie : `category_id` set, `workshop_id` null. Les cartels
 *     du subsite sont ceux dont `cartels.subsite_id = subsite.id`
 *     (curation manuelle via l'admin du subsite).
 *   - mode atelier   : `workshop_id` set, `category_id` null. Les cartels
 *     du subsite sont ceux de l'atelier via la table `workshop_cartels`
 *     (vue live, pas de modif de `cartels.subsite_id`).
 *
 * La contrainte « exactement un des deux » est appliquée au niveau du
 * controller (cf. SubsiteController).
 */
import pool from '../lib/db.js';

const parseBlocks = (raw) => {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
};

// JOIN partagé entre findAll et findBySlug. Les LEFT JOIN permettent au
// subsite d'avoir EITHER category_id OR workshop_id sans perdre la row.
const BASE_SELECT = `
  SELECT s.*,
         c.name  AS category_name,
         c.color AS category_color,
         w.name  AS workshop_name
  FROM subsites s
  LEFT JOIN categories c ON c.id = s.category_id
  LEFT JOIN workshops  w ON w.id = s.workshop_id
`;

export const SubsiteModel = {

  /** Tous les sous-sites (avec nom de la source : catégorie ou atelier) */
  async findAll() {
    const [rows] = await pool.query(`${BASE_SELECT} ORDER BY s.name ASC`);
    return rows.map(r => ({
      ...r,
      content_blocks: parseBlocks(r.content_blocks),
      content_blocks_en: parseBlocks(r.content_blocks_en),
    }));
  },

  /** Un sous-site par slug, avec ses partenaires (picks + obligatoires + exclusifs) */
  async findBySlug(slug) {
    const [[row]] = await pool.query(`${BASE_SELECT} WHERE s.slug = ?`, [slug]);
    if (!row) return null;

    // Picks explicites (via subsite_partners)
    const [picked] = await pool.query(`
      SELECT p.*, sp.sort_order, sp.partner_tier
      FROM partners p
      JOIN subsite_partners sp ON sp.partner_id = p.id
      WHERE sp.subsite_id = ?
      ORDER BY CASE WHEN sp.partner_tier = 'primary' THEN 0 ELSE 1 END, sp.sort_order ASC, p.name ASC
    `, [row.id]);

    // Obligatoires (affichés en regular sur tous les sous-sites, sauf si déjà picked)
    const [mandatory] = await pool.query(`
      SELECT * FROM partners WHERE is_mandatory = 1 ORDER BY name ASC
    `);

    const pickedIds = new Set(picked.map(p => p.id));
    const extraMandatory = mandatory
      .filter(p => !pickedIds.has(p.id))
      .map(p => ({ ...p, partner_tier: 'regular', sort_order: 9999 }));

    const all = [...picked, ...extraMandatory];
    const primary_partners = all.filter(p => p.partner_tier === 'primary');
    const regular_partners = all.filter(p => p.partner_tier !== 'primary');

    return {
      ...row,
      content_blocks: parseBlocks(row.content_blocks),
      content_blocks_en: parseBlocks(row.content_blocks_en),
      primary_partners,
      partners: regular_partners,
    };
  },

  /** Créer un sous-site (mode catégorie OU mode atelier — XOR appliqué côté controller) */
  async create({ slug, name, category_id = null, workshop_id = null, primary_color = '#D65A5A', content_blocks = [], content_blocks_en = [] }) {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO subsites (id, slug, name, category_id, workshop_id, primary_color, content_blocks, content_blocks_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, slug, name, category_id, workshop_id, primary_color, JSON.stringify(content_blocks), JSON.stringify(content_blocks_en)]
    );
    return this.findBySlug(slug);
  },

  /** Mettre à jour un sous-site.
   *  `allowedFields` restreint les colonnes éditables — passé par le
   *  controller selon le rôle (owner = sous-ensemble, superadmin = tout
   *  sauf source qui reste figée une fois le subsite créé). */
  async update(slug, data, allowedFields = ['name', 'primary_color', 'content_blocks', 'content_blocks_en', 'slug']) {
    const JSON_FIELDS = new Set(['content_blocks', 'content_blocks_en']);
    const sets = [];
    const vals = [];
    for (const k of allowedFields) {
      if (k in data) {
        sets.push(`\`${k}\` = ?`);
        vals.push(JSON_FIELDS.has(k) ? JSON.stringify(data[k]) : data[k]);
      }
    }
    if (!sets.length) return this.findBySlug(slug);
    vals.push(slug);
    await pool.query(`UPDATE subsites SET ${sets.join(', ')} WHERE slug = ?`, vals);
    return this.findBySlug(data.slug ?? slug);
  },

  /** Associer des partenaires à un sous-site (remplace tout) */
  async setPartners(subsiteId, payload = []) {
    const isArrayPayload = Array.isArray(payload);
    const primaryPartnerIds = isArrayPayload ? [] : (payload.primaryPartnerIds || []);
    const partnerIds = isArrayPayload ? payload : (payload.partnerIds || []);

    const primary = Array.from(new Set(primaryPartnerIds.map(String)));
    const regular = Array.from(new Set(partnerIds.map(String))).filter(id => !primary.includes(id));

    await pool.query('DELETE FROM subsite_partners WHERE subsite_id = ?', [subsiteId]);
    const rows = [
      ...primary.map((pid, i) => [subsiteId, pid, 'primary', i]),
      ...regular.map((pid, i) => [subsiteId, pid, 'regular', i]),
    ];

    if (!rows.length) return;
    await pool.query(
      'INSERT INTO subsite_partners (subsite_id, partner_id, partner_tier, sort_order) VALUES ?',
      [rows]
    );
  },

  /** Supprimer un sous-site */
  async delete(slug) {
    await pool.query('DELETE FROM subsites WHERE slug = ?', [slug]);
  },
};
