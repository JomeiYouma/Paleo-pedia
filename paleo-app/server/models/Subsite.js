/**
 * Subsite.js — Modèle MySQL pour les sous-sites
 */
import pool from '../lib/db.js';

const parseBlocks = (raw) => {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
};

export const SubsiteModel = {

  /** Tous les sous-sites (avec nom de la catégorie) */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT s.*, c.name AS category_name, c.color AS category_color
      FROM subsites s
      JOIN categories c ON c.id = s.category_id
      ORDER BY s.name ASC
    `);
    return rows.map(r => ({ ...r, content_blocks: parseBlocks(r.content_blocks) }));
  },

  /** Un sous-site par slug, avec ses partenaires */
  async findBySlug(slug) {
    const [[row]] = await pool.query(`
      SELECT s.*, c.name AS category_name, c.color AS category_color
      FROM subsites s
      JOIN categories c ON c.id = s.category_id
      WHERE s.slug = ?
    `, [slug]);
    if (!row) return null;

    const [partners] = await pool.query(`
      SELECT p.*, sp.sort_order
      FROM partners p
      JOIN subsite_partners sp ON sp.partner_id = p.id
      WHERE sp.subsite_id = ?
      ORDER BY sp.sort_order ASC, p.name ASC
    `, [row.id]);

    return { ...row, content_blocks: parseBlocks(row.content_blocks), partners };
  },

  /** Créer un sous-site */
  async create({ slug, name, category_id, primary_color = '#D65A5A', content_blocks = [] }) {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO subsites (id, slug, name, category_id, primary_color, content_blocks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, slug, name, category_id, primary_color, JSON.stringify(content_blocks)]
    );
    return this.findBySlug(slug);
  },

  /** Mettre à jour un sous-site */
  async update(slug, data) {
    const allowed = ['name', 'primary_color', 'content_blocks', 'slug'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (k in data) {
        sets.push(`\`${k}\` = ?`);
        vals.push(k === 'content_blocks' ? JSON.stringify(data[k]) : data[k]);
      }
    }
    if (!sets.length) return this.findBySlug(slug);
    vals.push(slug);
    await pool.query(`UPDATE subsites SET ${sets.join(', ')} WHERE slug = ?`, vals);
    return this.findBySlug(data.slug ?? slug);
  },

  /** Associer des partenaires à un sous-site (remplace tout) */
  async setPartners(subsiteId, partnerIds = []) {
    await pool.query('DELETE FROM subsite_partners WHERE subsite_id = ?', [subsiteId]);
    if (!partnerIds.length) return;
    const rows = partnerIds.map((pid, i) => [subsiteId, pid, i]);
    await pool.query(
      'INSERT INTO subsite_partners (subsite_id, partner_id, sort_order) VALUES ?',
      [rows]
    );
  },

  /** Supprimer un sous-site */
  async delete(slug) {
    await pool.query('DELETE FROM subsites WHERE slug = ?', [slug]);
  },
};
