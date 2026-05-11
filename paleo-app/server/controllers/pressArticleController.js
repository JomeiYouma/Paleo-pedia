/**
 * pressArticleController.js
 * CRUD des articles de presse affichés sur la page publique /presse.
 * Lecture publique (filtrée à is_published=1 pour les non-admins,
 * tout visible pour les admins via optionalAuth).
 * Écriture : superadmin (requireAdmin dans les routes).
 */
import { PressArticleModel } from '../models/PressArticle.js';

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
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
