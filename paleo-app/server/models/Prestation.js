/**
 * Prestation.js — Modèle MySQL pour les cards de prestation affichées
 * sur la page publique /prestations.
 */
import pool from '../lib/db.js';

const ALLOWED_FIELDS = [
  'title',
  'title_en',
  'intro',
  'intro_en',
  'description',
  'description_en',
  'bullet_points',
  'bullet_points_en',
  'image_path',
  'partners_image_path',
  'icon_name',
  'pdf_path',
  'pdf_label',
  'pdf_label_en',
  'display_order',
  'is_published',
];

export const PrestationModel = {

  /**
   * Liste les prestations triées par display_order puis created_at.
   * @param {object} [opts]
   * @param {boolean} [opts.publishedOnly=false]
   */
  async findAll({ publishedOnly = false } = {}) {
    let sql = 'SELECT * FROM prestations';
    if (publishedOnly) sql += ' WHERE is_published = 1';
    sql += ' ORDER BY display_order ASC, created_at ASC';
    const [rows] = await pool.query(sql);
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM prestations WHERE id = ?', [id]);
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
      title_en:         data.title_en         ?? null,
      intro:            data.intro            ?? null,
      intro_en:         data.intro_en         ?? null,
      description:      data.description      ?? null,
      description_en:   data.description_en   ?? null,
      bullet_points:    data.bullet_points    ?? null,
      bullet_points_en: data.bullet_points_en ?? null,
      image_path:       data.image_path       ?? null,
      partners_image_path: data.partners_image_path ?? null,
      icon_name:        data.icon_name        ?? null,
      pdf_path:         data.pdf_path         ?? null,
      pdf_label:        data.pdf_label        ?? null,
      pdf_label_en:     data.pdf_label_en     ?? null,
      display_order: Number.isFinite(+data.display_order) ? +data.display_order : 0,
      is_published:  data.is_published === false ? 0 : 1,
    };
    await pool.query(
      `INSERT INTO prestations
        (id, title, title_en, intro, intro_en, description, description_en, bullet_points, bullet_points_en, image_path, partners_image_path, icon_name, pdf_path, pdf_label, pdf_label_en, display_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.title,
        payload.title_en,
        payload.intro,
        payload.intro_en,
        payload.description,
        payload.description_en,
        payload.bullet_points,
        payload.bullet_points_en,
        payload.image_path,
        payload.partners_image_path,
        payload.icon_name,
        payload.pdf_path,
        payload.pdf_label,
        payload.pdf_label_en,
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
        if (k === 'is_published')  v = v ? 1 : 0;
        if (k === 'display_order') v = Number.isFinite(+v) ? +v : 0;
        sets.push(`\`${k}\` = ?`);
        vals.push(v ?? null);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    await pool.query(`UPDATE prestations SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM prestations WHERE id = ?', [id]);
  },
};
