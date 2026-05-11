/**
 * TeamMember.js — Modèle MySQL pour les membres de l'équipe affichés
 * sur la page publique « À propos ».
 * Les catégories valides sont 'main' | 'secondary' | 'community'.
 */
import pool from '../lib/db.js';

const ALLOWED_CATEGORIES = new Set(['main', 'secondary', 'community']);

const ALLOWED_FIELDS = [
  'category',
  'name',
  'role',
  'role_en',
  'bio',
  'bio_en',
  'photo_path',
  'url_linkedin',
  'url_website',
  'url_other',
  'display_order',
];

function normalizeCategory(value) {
  if (typeof value !== 'string') return 'main';
  const v = value.trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(v) ? v : 'main';
}

export const TeamMemberModel = {

  /**
   * Liste tous les membres triés par catégorie puis par display_order ASC,
   * puis par nom pour fallback déterministe.
   */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT * FROM team_members
      ORDER BY
        FIELD(category, 'main', 'secondary', 'community'),
        display_order ASC,
        name ASC
    `);
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM team_members WHERE id = ?', [id]);
    return row ?? null;
  },

  async create(data) {
    const id = crypto.randomUUID();
    const payload = {
      category:      normalizeCategory(data.category),
      name:          (data.name || '').trim(),
      role:          data.role          ?? null,
      role_en:       data.role_en       ?? null,
      bio:           data.bio           ?? null,
      bio_en:        data.bio_en        ?? null,
      photo_path:    data.photo_path    ?? null,
      url_linkedin:  data.url_linkedin  ?? null,
      url_website:   data.url_website   ?? null,
      url_other:     data.url_other     ?? null,
      display_order: Number.isFinite(+data.display_order) ? +data.display_order : 0,
    };
    if (!payload.name) {
      const err = new Error('name est requis');
      err.status = 400;
      throw err;
    }
    await pool.query(
      `INSERT INTO team_members
        (id, category, name, role, role_en, bio, bio_en, photo_path, url_linkedin, url_website, url_other, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.category,
        payload.name,
        payload.role,
        payload.role_en,
        payload.bio,
        payload.bio_en,
        payload.photo_path,
        payload.url_linkedin,
        payload.url_website,
        payload.url_other,
        payload.display_order,
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
        if (k === 'category')      v = normalizeCategory(v);
        if (k === 'display_order') v = Number.isFinite(+v) ? +v : 0;
        sets.push(`\`${k}\` = ?`);
        vals.push(v ?? null);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    await pool.query(`UPDATE team_members SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM team_members WHERE id = ?', [id]);
  },
};
