/**
 * ContactMessage.js — Modèle MySQL pour les messages soumis depuis
 * le formulaire public /contact. En lecture seule côté app (pas
 * d'édition possible), consultables via l'admin du journal d'events
 * ou un futur écran admin.
 */
import pool from '../lib/db.js';

export const ContactMessageModel = {

  async create({ name, email, subject = null, message, submitterIp = null }) {
    const id = crypto.randomUUID();
    const cleanName    = (name    || '').trim();
    const cleanEmail   = (email   || '').trim();
    const cleanMessage = (message || '').trim();
    if (!cleanName)    { const e = new Error('name est requis');    e.status = 400; throw e; }
    if (!cleanEmail)   { const e = new Error('email est requis');   e.status = 400; throw e; }
    if (!cleanMessage) { const e = new Error('message est requis'); e.status = 400; throw e; }

    await pool.query(
      `INSERT INTO contact_messages
        (id, name, email, subject, message, submitter_ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, cleanName, cleanEmail, subject?.trim() || null, cleanMessage, submitterIp]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    return row ?? null;
  },

  async findAll({ limit = 200 } = {}) {
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));
    const [rows] = await pool.query(
      `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ?`,
      [safeLimit]
    );
    return rows;
  },
};
