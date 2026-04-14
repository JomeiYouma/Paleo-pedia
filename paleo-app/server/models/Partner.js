/**
 * Partner.js — Modèle MySQL pour les partenaires
 */
import pool from '../lib/db.js';

export const PartnerModel = {

  async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM partners ORDER BY name ASC'
    );
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM partners WHERE id = ?', [id]);
    return row ?? null;
  },

  async create({ name, logo_path = null, url = null }) {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO partners (id, name, logo_path, url) VALUES (?, ?, ?, ?)',
      [id, name, logo_path, url]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const allowed = ['name', 'logo_path', 'url'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (k in data) { sets.push(`\`${k}\` = ?`); vals.push(data[k]); }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    await pool.query(`UPDATE partners SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM partners WHERE id = ?', [id]);
  },
};
