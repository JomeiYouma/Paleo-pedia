import { query, getClient } from '../lib/db.js';
import { randomUUID } from 'crypto';

const TEXT_FIELDS = [
  'titre', 'titre_en', 'annee', 'description', 'description_en',
  'exhume_par', 'location', 'location_en', 'image_path', 'url_qr',
  'date', 'visible', 'lat', 'lng',
];

/** Requête de sélection complète avec catégories (compatibilité xampp ancienne version) */
const SELECT_FULL = `
  SELECT
    c.*,
    u.email AS created_by_email,
    GROUP_CONCAT(
      DISTINCT CONCAT_WS('||', cat.id, cat.name, cat.name_en, cat.color, cat.icon)
      SEPARATOR ';;'
    ) AS categories_raw
  FROM cartels c
  LEFT JOIN users u ON u.id = c.created_by
  LEFT JOIN cartel_categories cc ON cc.cartel_id = c.id
  LEFT JOIN categories cat ON cat.id = cc.category_id
`;

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
  row.imageCredit = row.image_credit || '';
  delete row.image_credit;
  // Convertir TINYINT(1) en boolean
  row.visible = !!row.visible;
  return row;
}

export const CartelModel = {

  async findAll({ status, visible, category, search, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const values = [];

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
      `${SELECT_FULL} ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      values
    );
    return rows.map(parseCartel);
  },

  async findById(id) {
    const { rows } = await query(
      `${SELECT_FULL} WHERE c.id = ? GROUP BY c.id`,
      [id]
    );
    return parseCartel(rows[0]);
  },

  async create(data, userId, submitterIp = null) {
    const client = await getClient();
    try {
      await client.query('START TRANSACTION');
      const id = randomUUID();

      await client.query(
        `INSERT INTO cartels (
           id, created_by, titre, titre_en, annee, description, description_en,
           exhume_par, location, location_en, lat, lng,
           image_path, image_credit, url_qr, date, status, visible, submitter_ip
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId ?? null,
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
          data.date              ?? null,
          data.status            ?? 'draft',
          data.visible           ? 1 : 0,
          submitterIp,
        ]
      );

      await CartelModel._syncCategories(client, id, data.category_ids ?? []);
      await client.query('COMMIT');
      return this.findById(id);
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
      if (sets.length) {
        values.push(id);
        await client.query(`UPDATE cartels SET ${sets.join(', ')} WHERE id = ?`, values);
      }

      if (data.category_ids !== undefined) {
        await CartelModel._syncCategories(client, id, data.category_ids);
      }

      await client.query('COMMIT');
      return this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async setStatus(id, status) {
    const values = [status, id];
    if (status === 'published') {
      await query('UPDATE cartels SET status = ?, published_at = NOW() WHERE id = ?', values);
    } else {
      await query('UPDATE cartels SET status = ? WHERE id = ?', values);
    }
    return this.findById(id);
  },

  async delete(id) {
    await query('DELETE FROM cartels WHERE id = ?', [id]);
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
};
