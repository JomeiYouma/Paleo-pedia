/**
 * Partner.js — Modèle MySQL pour les partenaires
 */
import pool from '../lib/db.js';
import { SettingModel } from './Setting.js';

export const PartnerModel = {

  /**
   * Récupère les partenaires selon un filtre :
   *   - 'all'            → tous (superadmin uniquement)
   *   - { id: X }        → pool public + exclusifs du sous-site X
   *   - 'public_pool'    → uniquement pool public (owner_subsite_id IS NULL)
   * Par défaut 'all' — les contrôleurs doivent restreindre explicitement.
   */
  async findAll({ subsiteFilter = 'all' } = {}) {
    let sql = 'SELECT * FROM partners';
    const values = [];
    if (subsiteFilter === 'public_pool') {
      sql += ' WHERE owner_subsite_id IS NULL';
    } else if (subsiteFilter && typeof subsiteFilter === 'object' && subsiteFilter.id) {
      sql += ' WHERE owner_subsite_id IS NULL OR owner_subsite_id = ?';
      values.push(subsiteFilter.id);
    }
    sql += ' ORDER BY name ASC';
    const [rows] = await pool.query(sql, values);
    return rows;
  },

  /** Partenaires marqués comme obligatoires (affichés sur tous les sous-sites) */
  async findMandatory() {
    const [rows] = await pool.query(
      'SELECT * FROM partners WHERE is_mandatory = 1 ORDER BY name ASC'
    );
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM partners WHERE id = ?', [id]);
    return row ?? null;
  },

  async create({ name, logo_path = null, url = null, is_mandatory = false, owner_subsite_id = null }) {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO partners (id, name, logo_path, url, is_mandatory, owner_subsite_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, logo_path, url, is_mandatory ? 1 : 0, owner_subsite_id]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const allowed = ['name', 'logo_path', 'url', 'is_mandatory', 'owner_subsite_id'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (k in data) {
        sets.push(`\`${k}\` = ?`);
        vals.push(k === 'is_mandatory' ? (data[k] ? 1 : 0) : data[k]);
      }
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

    if (rows.length) {
      const primary_partners = rows.filter(r => r.partner_tier === 'primary');
      const partners = rows.filter(r => r.partner_tier === 'regular');
      return { primary_partners, partners };
    }

    const settings = await SettingModel.getAll().catch(() => ({}));
    let primaryIds = [];
    let regularIds = [];
    try {
      primaryIds = JSON.parse(settings.site_primary_partner_ids || '[]');
      regularIds = JSON.parse(settings.site_partner_ids || '[]');
    } catch {
      primaryIds = [];
      regularIds = [];
    }

    const primarySet = new Set((primaryIds || []).map(String));
    const regularSet = new Set((regularIds || []).map(String));
    const allIds = Array.from(new Set([...primarySet, ...regularSet]));

    if (!allIds.length) {
      return { primary_partners: [], partners: [] };
    }

    const placeholders = allIds.map(() => '?').join(',');
    const [partnerRows] = await pool.query(
      `SELECT * FROM partners WHERE id IN (${placeholders})`,
      allIds
    );

    const byId = new Map(partnerRows.map(p => [String(p.id), p]));
    const primary_partners = (primaryIds || []).map(id => byId.get(String(id))).filter(Boolean);
    const partners = (regularIds || []).map(id => byId.get(String(id))).filter(Boolean);
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

      await SettingModel.set('site_primary_partner_ids', JSON.stringify(primary));
      await SettingModel.set('site_partner_ids', JSON.stringify(regular));
    } catch (e) {
      await client.rollback();
      throw e;
    } finally {
      client.release();
    }

    return this.getSiteSelection();
  },
};
