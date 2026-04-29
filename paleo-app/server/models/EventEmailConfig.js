import { query } from '../lib/db.js';

/**
 * EventEmailConfig
 * Une ligne par type d'événement. Contrôle si un email est envoyé,
 * vers qui, avec quel préfixe de sujet, et si l'en-tête X-Spam est ajouté.
 * Le seed initial est fait dans la migration v8 / schema_mysql.sql.
 */
export const EventEmailConfigModel = {
  async getAll() {
    const { rows } = await query(
      'SELECT type, enabled, recipient, mark_as_spam, subject_prefix FROM event_email_config ORDER BY type'
    );
    return rows;
  },

  async get(type) {
    const { rows } = await query(
      'SELECT type, enabled, recipient, mark_as_spam, subject_prefix FROM event_email_config WHERE type = ?',
      [type]
    );
    return rows[0] || null;
  },

  /**
   * Met à jour une config (par type). Crée la ligne si elle n'existe pas.
   * Champs autorisés : enabled, recipient, mark_as_spam, subject_prefix.
   */
  async upsert(type, { enabled, recipient, mark_as_spam, subject_prefix }) {
    await query(
      `INSERT INTO event_email_config (type, enabled, recipient, mark_as_spam, subject_prefix)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         enabled        = VALUES(enabled),
         recipient      = VALUES(recipient),
         mark_as_spam   = VALUES(mark_as_spam),
         subject_prefix = VALUES(subject_prefix)`,
      [
        type,
        enabled ? 1 : 0,
        String(recipient || '').slice(0, 255),
        mark_as_spam ? 1 : 0,
        String(subject_prefix || '[Paléo]').slice(0, 64),
      ]
    );
    return this.get(type);
  },

  /**
   * Met à jour le destinataire de TOUS les types en une seule requête.
   * Ne touche pas aux autres colonnes (enabled, mark_as_spam, subject_prefix
   * sont préservés). Utilisé par le formulaire "appliquer à tous".
   * @param {string} recipient
   * @returns {Promise<number>} nombre de lignes modifiées
   */
  async bulkSetRecipient(recipient) {
    const value = String(recipient || '').slice(0, 255);
    // query() retourne { rows: [okPacket] } pour un UPDATE
    // (cf. lib/db.js qui wrappe le résultat non-tableau dans [resultat]).
    const { rows } = await query(
      'UPDATE event_email_config SET recipient = ?',
      [value]
    );
    return rows[0]?.affectedRows ?? 0;
  },
};
