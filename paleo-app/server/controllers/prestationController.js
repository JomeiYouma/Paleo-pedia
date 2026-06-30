/**
 * prestationController.js
 * CRUD des cards de prestation affichées sur la page publique /prestations.
 * Lecture publique filtrée à is_published=1 pour les non-admins,
 * tout visible pour les admins via optionalAuth.
 */
import { PrestationModel } from '../models/Prestation.js';
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

export const PrestationController = {

  async getAll(req, res) {
    try {
      const isAdmin = !!req.user?.can_manage_admin || !!req.user?.can_manage_content;
      const data = await PrestationModel.findAll({ publishedOnly: !isAdmin });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const created = await PrestationModel.create(req.body || {});
      dispatch({ type: 'prestation.created', req, targetId: created.id, summary: created.title || created.name || '' });
      res.status(201).json(created);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await PrestationModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Prestation introuvable' });
      const updated = await PrestationModel.update(req.params.id, req.body || {});
      dispatch({ type: 'prestation.updated', req, targetId: req.params.id, summary: updated?.title || existing.title || '' });
      res.json(updated);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      const existing = await PrestationModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Prestation introuvable' });
      await PrestationModel.delete(req.params.id);
      dispatch({ type: 'prestation.deleted', req, targetId: req.params.id, summary: existing.title || '' });
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
