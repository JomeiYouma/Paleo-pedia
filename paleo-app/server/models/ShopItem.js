/**
 * ShopItem.js — Modèle MySQL pour les liens shop (livres, jeux, autres)
 * affichés sur la page publique /ouvrages. Pas de panier ni paiement :
 * c'est une vitrine qui renvoie vers le PrestaShop externe.
 */
import pool from '../lib/db.js';

const ALLOWED_CATEGORIES = new Set(['book', 'game', 'other']);

const ALLOWED_FIELDS = [
  'category',
  'title',
  'subtitle',
  'description',
  'image_path',
  'external_url',
  'price_text',
  'display_order',
  'is_published',
];

function normalizeCategory(value) {
  if (typeof value !== 'string') return 'book';
  const v = value.trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(v) ? v : 'book';
}

export const ShopItemModel = {

  async findAll({ publishedOnly = false } = {}) {
    let sql = `
      SELECT * FROM shop_items
    `;
    if (publishedOnly) sql += ` WHERE is_published = 1`;
    sql += ` ORDER BY FIELD(category, 'book', 'game', 'other'), display_order ASC, created_at ASC`;
    const [rows] = await pool.query(sql);
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM shop_items WHERE id = ?', [id]);
    return row ?? null;
  },

  async create(data) {
    const id = crypto.randomUUID();
    const title = (data.title || '').trim();
    if (!title) {
      const err = new Error('title est requis');
      err.status = 400;
      throw err;
    }
    const payload = {
      category:      normalizeCategory(data.category),
      title,
      subtitle:      data.subtitle      ?? null,
      description:   data.description   ?? null,
      image_path:    data.image_path    ?? null,
      external_url:  data.external_url  ?? null,
      price_text:    data.price_text    ?? null,
      display_order: Number.isFinite(+data.display_order) ? +data.display_order : 0,
      is_published:  data.is_published === false ? 0 : 1,
    };
    await pool.query(
      `INSERT INTO shop_items
        (id, category, title, subtitle, description, image_path, external_url, price_text, display_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.category,
        payload.title,
        payload.subtitle,
        payload.description,
        payload.image_path,
        payload.external_url,
        payload.price_text,
        payload.display_order,
        payload.is_published,
      ]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const sets = [];
    const vals = [];
    for (const k of ALLOWED_FIELDS) {
      if (k in data) {
        let v = data[k];
        if (k === 'category')      v = normalizeCategory(v);
        if (k === 'is_published')  v = v ? 1 : 0;
        if (k === 'display_order') v = Number.isFinite(+v) ? +v : 0;
        sets.push(`\`${k}\` = ?`);
        vals.push(v ?? null);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    await pool.query(`UPDATE shop_items SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM shop_items WHERE id = ?', [id]);
  },
};
