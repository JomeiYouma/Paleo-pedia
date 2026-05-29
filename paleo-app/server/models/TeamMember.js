/**
 * TeamMember.js — Modèle MySQL pour les membres de l'équipe affichés
 * sur la page publique « À propos ».
 * Les catégories valides sont 'main' | 'secondary' | 'community'.
 *
 * Scoping par sous-site (v27) : la colonne subsite_id permet d'avoir
 * une équipe propre à chaque subsite. NULL = membre de l'équipe du
 * site principal (comportement historique).
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
   * Liste les membres dans le scope demandé.
   *   - `subsiteId === null` (défaut) : équipe du site principal
   *     (team_members.subsite_id IS NULL).
   *   - `subsiteId === 'all'` : tout (superadmin global).
   *   - `subsiteId === '<uuid>'` : équipe d'un subsite précis. Si le subsite
   *     n'a aucun membre déclaré et `fallbackToMain` est vrai, on retourne
   *     l'équipe du site principal en remplacement — ergonomie pour les
   *     subsites qui ne customisent pas leur À propos.
   *
   * Tri : catégorie (main > secondary > community) puis display_order puis nom.
   */
  async findAll({ subsiteId = null, fallbackToMain = true } = {}) {
    const baseOrder = `
      ORDER BY
        FIELD(category, 'main', 'secondary', 'community'),
        display_order ASC,
        name ASC
    `;
    if (subsiteId === 'all') {
      const [rows] = await pool.query(`SELECT * FROM team_members ${baseOrder}`);
      return rows;
    }
    if (subsiteId === null) {
      const [rows] = await pool.query(`SELECT * FROM team_members WHERE subsite_id IS NULL ${baseOrder}`);
      return rows;
    }
    const [rows] = await pool.query(`SELECT * FROM team_members WHERE subsite_id = ? ${baseOrder}`, [subsiteId]);
    if (rows.length === 0 && fallbackToMain) {
      const [mainRows] = await pool.query(`SELECT * FROM team_members WHERE subsite_id IS NULL ${baseOrder}`);
      return mainRows;
    }
    return rows;
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM team_members WHERE id = ?', [id]);
    return row ?? null;
  },

  async create(data, { subsiteId = null } = {}) {
    const id = crypto.randomUUID();
    const payload = {
      category:      normalizeCategory(data.category),
      subsite_id:    subsiteId ?? null,
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
        (id, category, subsite_id, name, role, role_en, bio, bio_en, photo_path, url_linkedin, url_website, url_other, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.category,
        payload.subsite_id,
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
