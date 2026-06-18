/**
 * pressArticleController.js
 * CRUD des articles de presse affichés sur la page publique /presse.
 * Lecture publique (filtrée à is_published=1 pour les non-admins,
 * tout visible pour les admins via optionalAuth).
 * Écriture : superadmin (requireAdmin dans les routes).
 */
import { PressArticleModel } from '../models/PressArticle.js';
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

export const PressArticleController = {

  async getAll(req, res) {
    try {
      const isAdmin = !!req.user?.can_manage_admin;
      const data = await PressArticleModel.findAll({ publishedOnly: !isAdmin });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const created = await PressArticleModel.create(req.body || {});
      dispatch({ type: 'press_article.created', req, targetId: created.id, summary: created.title || created.name || '' });
      res.status(201).json(created);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await PressArticleModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Article introuvable' });
      const updated = await PressArticleModel.update(req.params.id, req.body || {});
      dispatch({ type: 'press_article.updated', req, targetId: req.params.id, summary: updated?.title || existing.title || '' });
      res.json(updated);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      const existing = await PressArticleModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Article introuvable' });
      await PressArticleModel.delete(req.params.id);
      dispatch({ type: 'press_article.deleted', req, targetId: req.params.id, summary: existing.title || '' });
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
