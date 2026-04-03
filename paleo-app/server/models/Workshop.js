import { query, getClient } from '../lib/db.js';
import { randomUUID } from 'crypto';

export const WorkshopModel = {

  async findAll() {
    const { rows } = await query(
      `SELECT w.*,
        u.email AS created_by_email,
        COUNT(wc.cartel_id) AS cartel_count
       FROM workshops w
       LEFT JOIN users u ON u.id = w.created_by
       LEFT JOIN workshop_cartels wc ON wc.workshop_id = w.id
       GROUP BY w.id
       ORDER BY w.created_at DESC`
    );
    return rows.map(r => ({ ...r, is_immersive: !!r.is_immersive, cartel_count: Number(r.cartel_count) }));
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT w.*, GROUP_CONCAT(wc.cartel_id SEPARATOR ',') AS cartel_ids
       FROM workshops w
       LEFT JOIN workshop_cartels wc ON wc.workshop_id = w.id
       WHERE w.id = ?
       GROUP BY w.id`,
      [id]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      ...row,
      is_immersive: !!row.is_immersive,
      cartelIds: row.cartel_ids ? row.cartel_ids.split(',') : [],
    };
  },

  async create({ name, is_immersive = false, cartelIds = [] }, userId) {
    const client = await getClient();
    try {
      await client.query('START TRANSACTION');
      const id = randomUUID();
      await client.query(
        'INSERT INTO workshops (id, name, is_immersive, created_by) VALUES (?, ?, ?, ?)',
        [id, name, is_immersive ? 1 : 0, userId ?? null]
      );
      for (const cartelId of cartelIds) {
        await client.query(
          'INSERT IGNORE INTO workshop_cartels (workshop_id, cartel_id) VALUES (?, ?)',
          [id, cartelId]
        );
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

  async update(id, { name, is_immersive }) {
    const sets = [];
    const vals = [];
    if (name !== undefined)         { sets.push('name = ?');         vals.push(name); }
    if (is_immersive !== undefined) { sets.push('is_immersive = ?'); vals.push(is_immersive ? 1 : 0); }
    if (!sets.length) throw new Error('Aucun champ modifiable');
    vals.push(id);
    await query(`UPDATE workshops SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async addCartels(id, cartelIds) {
    for (const cartelId of cartelIds) {
      await query(
        'INSERT IGNORE INTO workshop_cartels (workshop_id, cartel_id) VALUES (?, ?)',
        [id, cartelId]
      );
    }
    return this.findById(id);
  },

  async removeCartel(workshopId, cartelId) {
    await query(
      'DELETE FROM workshop_cartels WHERE workshop_id = ? AND cartel_id = ?',
      [workshopId, cartelId]
    );
  },

  async delete(id) {
    await query('DELETE FROM workshops WHERE id = ?', [id]);
  },
};
