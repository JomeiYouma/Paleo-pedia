/**
 * MissionApplication.js — Modèle MySQL pour les candidatures soumises
 * depuis le formulaire public en bas de /participer.
 *
 * Une candidature est juste un message en lecture seule du point de vue
 * de l'app (pas d'édition possible). L'admin la consulte via le journal
 * d'événements ou via une future page admin.
 */
import pool from '../lib/db.js';

export const MissionApplicationModel = {

  async create({ name, email, missionId = null, knowledge = null, submitterIp = null }) {
    const id = crypto.randomUUID();
    const cleanName  = (name  || '').trim();
    const cleanEmail = (email || '').trim();
    if (!cleanName)  { const e = new Error('name est requis');  e.status = 400; throw e; }
    if (!cleanEmail) { const e = new Error('email est requis'); e.status = 400; throw e; }

    await pool.query(
      `INSERT INTO mission_applications
        (id, name, email, mission_id, knowledge, submitter_ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, cleanName, cleanEmail, missionId, knowledge, submitterIp]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM mission_applications WHERE id = ?', [id]);
    return row ?? null;
  },

  async findAll({ limit = 200 } = {}) {
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));
    const [rows] = await pool.query(
      `SELECT a.*, m.name AS mission_name, m.theme AS mission_theme
         FROM mission_applications a
         LEFT JOIN missions m ON m.id = a.mission_id
        ORDER BY a.created_at DESC
        LIMIT ?`,
      [safeLimit]
    );
    return rows;
  },
};
