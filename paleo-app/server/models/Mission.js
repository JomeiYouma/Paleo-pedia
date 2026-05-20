/**
 * Mission.js — Modèle MySQL pour les missions affichées sur la page
 * publique /participer (appels à participation thématiques, dépliables).
 */
import pool from '../lib/db.js';

const ALLOWED_FIELDS = [
  'theme',
  'name',
  'name_en',
  'text',
  'text_en',
  'link_url',
  'link_label',
  'display_order',
  'is_published',
];

export const MissionModel = {

  /**
   * Liste les missions. Par défaut tri par display_order ASC puis created_at ASC
   * (les plus anciennes d'abord — l'ordre est défini par l'admin).
   * @param {object} [opts]
   * @param {boolean} [opts.publishedOnly=false]
   */
  async findAll({ publishedOnly = false } = {}) {
    let sql = 'SELECT * FROM missions';
    if (publishedOnly) sql += ' WHERE is_published = 1';
    sql += ' ORDER BY display_order ASC, created_at ASC';
    const [rows] = await pool.query(sql);
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM missions WHERE id = ?', [id]);
    return row ?? null;
  },

  async create(data) {
    const id = crypto.randomUUID();
    const theme = (data.theme || '').trim();
    const name  = (data.name  || '').trim();
    if (!theme) { const e = new Error('theme est requis'); e.status = 400; throw e; }
    if (!name)  { const e = new Error('name est requis');  e.status = 400; throw e; }

    const payload = {
      theme,
      name,
      name_en:       data.name_en       ?? null,
      text:          data.text          ?? null,
      text_en:       data.text_en       ?? null,
      link_url:      data.link_url      ?? null,
      link_label:    data.link_label    ?? null,
      display_order: Number.isFinite(+data.display_order) ? +data.display_order : 0,
      is_published:  data.is_published === false ? 0 : 1,
    };

    await pool.query(
      `INSERT INTO missions
        (id, theme, name, name_en, text, text_en, link_url, link_label, display_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.theme,
        payload.name,
        payload.name_en,
        payload.text,
        payload.text_en,
        payload.link_url,
        payload.link_label,
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
    await pool.query(`UPDATE missions SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM missions WHERE id = ?', [id]);
  },
};
