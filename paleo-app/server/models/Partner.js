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

  async getSiteSelection() {
    const [rows] = await pool.query(`
      SELECT p.*, sp.partner_tier, sp.sort_order
      FROM site_partners sp
      JOIN partners p ON p.id = sp.partner_id
      ORDER BY CASE WHEN sp.partner_tier = 'primary' THEN 0 ELSE 1 END, sp.sort_order ASC, p.name ASC
    `);

    const primary_partners = rows.filter(r => r.partner_tier === 'primary');
    const partners = rows.filter(r => r.partner_tier === 'regular');
    return { primary_partners, partners };
  },

  async setSiteSelection({ primaryPartnerIds = [], partnerIds = [] } = {}) {
    const client = await pool.getConnection();
    try {
      await client.beginTransaction();

      const primary = Array.from(new Set((primaryPartnerIds || []).map(String)));
      const regular = Array.from(new Set((partnerIds || []).map(String))).filter(id => !primary.includes(id));

      await client.query('DELETE FROM site_partners');

      const rows = [
        ...primary.map((partnerId, index) => [partnerId, 'primary', index]),
        ...regular.map((partnerId, index) => [partnerId, 'regular', index]),
      ];

      if (rows.length) {
        await client.query(
          'INSERT INTO site_partners (partner_id, partner_tier, sort_order) VALUES ?',
          [rows]
        );
      }

      await client.commit();
    } catch (e) {
      await client.rollback();
      throw e;
    } finally {
      client.release();
    }

    return this.getSiteSelection();
  },
};
