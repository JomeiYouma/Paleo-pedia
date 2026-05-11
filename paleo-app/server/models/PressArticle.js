/**
 * PressArticle.js — Modèle MySQL pour les articles de presse affichés
 * sur la page publique /presse.
 */
import pool from '../lib/db.js';

const ALLOWED_FIELDS = [
  'title',
  'source',
  'published_date',
  'url',
  'thumbnail_path',
  'excerpt',
  'display_order',
  'is_published',
];

export const PressArticleModel = {

  /**
   * Liste les articles. Par défaut tri par date de publication décroissante
   * (les plus récents d'abord), puis display_order et created_at.
   * @param {object} [opts]
   * @param {boolean} [opts.publishedOnly=false] - filtre les articles non publiés
   */
  async findAll({ publishedOnly = false } = {}) {
    let sql = 'SELECT * FROM press_articles';
    if (publishedOnly) sql += ' WHERE is_published = 1';
    sql += ' ORDER BY published_date DESC, display_order ASC, created_at DESC';
    const [rows] = await pool.query(sql);
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM press_articles WHERE id = ?', [id]);
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
      title,
      source:         data.source         ?? null,
      published_date: data.published_date || null,
      url:            data.url            ?? null,
      thumbnail_path: data.thumbnail_path ?? null,
      excerpt:        data.excerpt        ?? null,
      display_order:  Number.isFinite(+data.display_order) ? +data.display_order : 0,
      is_published:   data.is_published === false ? 0 : 1,
    };
    await pool.query(
      `INSERT INTO press_articles
        (id, title, source, published_date, url, thumbnail_path, excerpt, display_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.title,
        payload.source,
        payload.published_date,
        payload.url,
        payload.thumbnail_path,
        payload.excerpt,
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
        if (k === 'is_published')   v = v ? 1 : 0;
        if (k === 'display_order')  v = Number.isFinite(+v) ? +v : 0;
        if (k === 'published_date' && !v) v = null;
        sets.push(`\`${k}\` = ?`);
        vals.push(v ?? null);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    await pool.query(`UPDATE press_articles SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM press_articles WHERE id = ?', [id]);
  },
};
