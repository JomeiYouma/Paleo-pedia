/**
 * missionController.js
 * CRUD des missions affichées sur la page publique /participer.
 * Lecture publique (filtrée à is_published=1 pour les non-admins,
 * tout visible pour les admins via optionalAuth).
 * Écriture : superadmin (requireAdmin dans les routes).
 */
import { MissionModel } from '../models/Mission.js';

export const MissionController = {

  async getAll(req, res) {
    try {
      const isAdmin = !!req.user?.can_manage_admin;
      const data = await MissionModel.findAll({ publishedOnly: !isAdmin });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const created = await MissionModel.create(req.body || {});
      res.status(201).json(created);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await MissionModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Mission introuvable' });
      const updated = await MissionModel.update(req.params.id, req.body || {});
      res.json(updated);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      const existing = await MissionModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Mission introuvable' });
      await MissionModel.delete(req.params.id);
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
