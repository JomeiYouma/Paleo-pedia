import { query } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const UserModel = {

  async create({ email, password, role = 'contributor', can_create_cartel = true, can_publish_cartel = false, can_manage_admin = false, can_create_subsite = false, can_manage_team = false, can_export_cartel = false, home_subsite_id = null }) {
    const hash = await bcrypt.hash(password, 12);
    const id = randomUUID();
    await query(
      `INSERT INTO users (id, email, password_hash, role, can_create_cartel, can_publish_cartel, can_manage_admin, can_create_subsite, can_manage_team, can_export_cartel, home_subsite_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, email, hash, role, can_create_cartel ? 1 : 0, can_publish_cartel ? 1 : 0, can_manage_admin ? 1 : 0, can_create_subsite ? 1 : 0, can_manage_team ? 1 : 0, can_export_cartel ? 1 : 0, home_subsite_id]
    );
    return this.findById(id);
  },

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, email, role, can_create_cartel, can_publish_cartel, can_manage_admin, can_create_subsite, can_manage_team, can_export_cartel, home_subsite_id, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ limit = 50, offset = 0 } = {}) {
    const { rows } = await query(
      'SELECT id, email, role, can_create_cartel, can_publish_cartel, can_manage_admin, can_create_subsite, can_manage_team, can_export_cartel, home_subsite_id, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  },

  async findBySubsite(subsiteId, { limit = 100, offset = 0 } = {}) {
    const { rows } = await query(
      'SELECT id, email, role, can_create_cartel, can_publish_cartel, can_manage_admin, can_create_subsite, can_manage_team, can_export_cartel, home_subsite_id, created_at, updated_at FROM users WHERE home_subsite_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [subsiteId, limit, offset]
    );
    return rows;
  },

  async update(id, fields) {
    const allowed = ['role', 'can_create_cartel', 'can_publish_cartel', 'can_manage_admin', 'can_create_subsite', 'can_manage_team', 'can_export_cartel', 'home_subsite_id'];
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k} = ?`); values.push(v); }
    }
    if (!sets.length) throw new Error('Aucun champ modifiable fourni');
    values.push(id);
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await query('DELETE FROM users WHERE id = ?', [id]);
  },

  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  /** Définit un nouveau mot de passe (hash bcrypt, coût 12). */
  async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    return true;
  },
};
