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
import { dispatchEvent }         from '../services/eventDispatcher.js';
import { getDigestConfig, setDigestConfig } from '../services/clickDigest.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

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
      dispatch({ type: 'event_email_config.updated', req, summary: type, payload: { enabled: !!req.body.enabled, recipient: req.body.recipient ?? '', mark_as_spam: !!req.body.mark_as_spam } });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PATCH /api/logs/email-config
   * Body: { recipient: string }
   * Met à jour le destinataire pour TOUS les types en un seul UPDATE.
   * Les autres colonnes (enabled, mark_as_spam, subject_prefix) sont préservées.
   */
  async bulkUpdateRecipient(req, res) {
    try {
      const recipient = String(req.body?.recipient ?? '').trim();
      // Pas de validation stricte d'email côté serveur : on autorise vide
      // (= retirer le destinataire partout) et on laisse le mailer gérer.
      const affected = await EventEmailConfigModel.bulkSetRecipient(recipient);
      dispatch({ type: 'event_email_config.updated', req, summary: 'destinataire global', payload: { recipient, affected } });
      const items = await EventEmailConfigModel.getAll();
      res.json({ affected, items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /api/logs/click-digest
   * Config du récap quotidien des clics boutique (settings, pas un type d'event).
   */
  async getClickDigest(req, res) {
    try {
      const cfg = await getDigestConfig();
      res.json({ enabled: cfg.enabled, recipient: cfg.recipient, lastSent: cfg.lastSent });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PATCH /api/logs/click-digest  Body: { enabled?:boolean, recipient?:string }
   */
  async updateClickDigest(req, res) {
    try {
      const patch = {};
      if ('enabled' in req.body)   patch.enabled = !!req.body.enabled;
      if ('recipient' in req.body) patch.recipient = String(req.body.recipient ?? '').trim();
      const cfg = await setDigestConfig(patch);
      dispatch({ type: 'setting.updated', req, summary: 'récap quotidien clics boutique', payload: { enabled: cfg.enabled, recipient: cfg.recipient } });
      res.json({ enabled: cfg.enabled, recipient: cfg.recipient, lastSent: cfg.lastSent });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
