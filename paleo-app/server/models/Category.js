import { query } from '../lib/db.js';

export const CategoryModel = {

  async findAll() {
    const { rows } = await query('SELECT * FROM categories ORDER BY name');
    return rows;
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ id, name, name_en = '', description = '', color = '#888888', icon = '' }) {
    await query(
      `INSERT INTO categories (id, name, name_en, description, color, icon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, name_en, description, color, icon]
    );
    return this.findById(id);
  },

  async update(id, fields) {
    const allowed = ['name', 'name_en', 'description', 'color', 'icon'];
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k} = ?`); values.push(v); }
    }
    if (!sets.length) throw new Error('Aucun champ modifiable fourni');
    values.push(id);
    await query(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await query('DELETE FROM categories WHERE id = ?', [id]);
  },
};
