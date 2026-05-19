/**
 * CartelNote.js — Notes admin internes attachées à un cartel.
 *
 * Append-only en pratique : la suppression est autorisée (entre admins de
 * confiance) mais il n'y a pas d'édition. `author_email` est un snapshot
 * conservé même si l'utilisateur est supprimé (FK SET NULL sur author_id).
 */
import { query } from '../lib/db.js';
import { randomUUID } from 'crypto';

export const CartelNoteModel = {

  async findByCartel(cartelId) {
    const { rows } = await query(
      `SELECT id, cartel_id, author_id, author_email, body, created_at
         FROM cartel_notes
        WHERE cartel_id = ?
        ORDER BY created_at DESC`,
      [cartelId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT id, cartel_id, author_id, author_email, body, created_at
         FROM cartel_notes WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ cartelId, authorId, authorEmail, body }) {
    const id = randomUUID();
    await query(
      `INSERT INTO cartel_notes (id, cartel_id, author_id, author_email, body)
       VALUES (?, ?, ?, ?, ?)`,
      [id, cartelId, authorId ?? null, authorEmail ?? '', body]
    );
    return this.findById(id);
  },

  async delete(id) {
    await query('DELETE FROM cartel_notes WHERE id = ?', [id]);
  },
};
