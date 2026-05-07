/**
 * teamMemberController.js
 * CRUD des membres de l'équipe affichés sur la page publique « À propos ».
 * Lecture publique (pas d'auth), écriture réservée au superadmin (requireAdmin
 * dans la route). Pas de scoping par sous-site : un seul jeu de membres pour
 * le site principal.
 *
 * Note : nommé "teamMember" et pas "team" pour éviter la collision avec
 * teamController.js (qui gère les comptes utilisateurs des sous-sites).
 */
import { TeamMemberModel } from '../models/TeamMember.js';

export const TeamMemberController = {

  async getAll(req, res) {
    try {
      res.json(await TeamMemberModel.findAll());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const created = await TeamMemberModel.create(req.body || {});
      res.status(201).json(created);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await TeamMemberModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Membre introuvable' });
      const updated = await TeamMemberModel.update(req.params.id, req.body || {});
      res.json(updated);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      const existing = await TeamMemberModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Membre introuvable' });
      await TeamMemberModel.delete(req.params.id);
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
