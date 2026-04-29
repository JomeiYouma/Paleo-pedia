import { query } from '../lib/db.js';

/**
 * EventLog
 * Une ligne par événement applicatif (création/modif/suppression de cartels,
 * users, subsites, etc.). Sert à la fois de journal d'audit et de
 * déclencheur d'emails (via event_email_config + eventDispatcher).
 */
export const EventLogModel = {
  /**
   * Insère une ligne. Renvoie l'id inséré.
   * Tous les champs sauf `type` sont optionnels.
   */
  async insert({ type, actorId = null, actorEmail = null, subsiteId = null, targetId = null, summary = '', payload = null }) {
    const { rows } = await query(
      `INSERT INTO event_logs
         (type, actor_id, actor_email, subsite_id, target_id, summary, payload)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
      [
        type,
        actorId,
        actorEmail,
        subsiteId,
        targetId ? String(targetId) : null,
        String(summary || '').slice(0, 512),
        payload ? JSON.stringify(payload) : null,
      ]
    );
    return rows.insertId;
  },

  /**
   * Liste paginée + filtrable.
   * @param {object} opts
   * @param {string[]} [opts.types]       - filtre OR sur type
   * @param {string}   [opts.actorId]
   * @param {string}   [opts.subsiteId]
   * @param {string}   [opts.q]           - recherche dans summary
   * @param {string}   [opts.since]       - ISO datetime
   * @param {number}   [opts.limit=100]
   * @param {number}   [opts.offset=0]
   */
  async list({ types, actorId, subsiteId, q, since, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (Array.isArray(types) && types.length) {
      where.push(`type IN (${types.map(() => '?').join(',')})`);
      params.push(...types);
    }
    if (actorId)   { where.push('actor_id = ?');    params.push(actorId); }
    if (subsiteId) { where.push('subsite_id = ?');  params.push(subsiteId); }
    if (q)         { where.push('summary LIKE ?');  params.push('%' + q + '%'); }
    if (since)     { where.push('created_at >= ?'); params.push(new Date(since)); }

    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    const sqlBase = `FROM event_logs ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const { rows } = await query(
      `SELECT id, type, actor_id, actor_email, subsite_id, target_id, summary, payload, created_at
       ${sqlBase}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, safeOffset]
    );
    const { rows: totalRows } = await query(`SELECT COUNT(*) AS n ${sqlBase}`, params);
    return {
      items: rows.map(r => ({
        ...r,
        // mysql2 peut renvoyer JSON soit comme objet (driver récent) soit comme string
        payload: typeof r.payload === 'string' ? safeJsonParse(r.payload) : r.payload,
      })),
      total: totalRows[0]?.n ?? 0,
    };
  },

  /** Liste distincte des types présents dans event_logs (utile pour le filtre UI). */
  async distinctTypes() {
    const { rows } = await query('SELECT DISTINCT type FROM event_logs ORDER BY type');
    return rows.map(r => r.type);
  },
};

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
