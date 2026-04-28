/**
 * eventLogController.js
 * Routes admin :
 *   GET    /api/logs                  → liste paginée + filtrable
 *   GET    /api/logs/types            → types distincts présents (filtre UI)
 *   GET    /api/logs/email-config     → config email par type
 *   PATCH  /api/logs/email-config/:type → modifier la config d'un type
 *
 * Toutes les routes sont superadmin only (requireAdmin).
 */

import { EventLogModel }         from '../models/EventLog.js';
import { EventEmailConfigModel } from '../models/EventEmailConfig.js';

export const EventLogController = {
  async list(req, res) {
    try {
      const { type, types, actorId, subsiteId, q, since, limit, offset } = req.query;
      // Accepte type=foo OU types=foo,bar
      let typeList;
      if (type) typeList = [type];
      else if (types) typeList = String(types).split(',').map(s => s.trim()).filter(Boolean);

      const result = await EventLogModel.list({
        types: typeList,
        actorId,
        subsiteId,
        q,
        since,
        limit: limit ? parseInt(limit, 10) : 100,
        offset: offset ? parseInt(offset, 10) : 0,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async distinctTypes(req, res) {
    try {
      const types = await EventLogModel.distinctTypes();
      res.json({ types });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async listEmailConfig(req, res) {
    try {
      const items = await EventEmailConfigModel.getAll();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateEmailConfig(req, res) {
    try {
      const { type } = req.params;
      if (!type) return res.status(400).json({ error: 'Type requis.' });
      const updated = await EventEmailConfigModel.upsert(type, {
        enabled:        !!req.body.enabled,
        recipient:      req.body.recipient ?? '',
        mark_as_spam:   !!req.body.mark_as_spam,
        subject_prefix: req.body.subject_prefix ?? '[Paléo]',
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
