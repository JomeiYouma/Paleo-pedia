import { CartelModel } from '../models/Cartel.js';

const VALID_STATUSES = ['draft', 'pending_review', 'published', 'archived'];

function sanitizeWorkshopFields(body, canManageAdmin) {
  if (canManageAdmin) return body;
  const cleaned = { ...body };
  delete cleaned.workshop_ids;
  delete cleaned.workshopIds;
  return cleaned;
}

export const CartelController = {

  async getAll(req, res) {
    try {
      // Lire le token si présent (auth optionnelle sur cette route)
      const isAdmin = req.user?.can_manage_admin;

      const { category, search, limit, offset } = req.query;

      let filters = {
        category, search,
        limit:  limit  ? parseInt(limit)  : 5000,
        offset: offset ? parseInt(offset) : 0,
      };

      // Visiteur anonyme ou non-admin → seulement le contenu publié
      if (!isAdmin) {
        filters.status  = 'published';
      }
      // Admin → tout (drafts, pending_review, published, archived)
      filters.includeWorkshops = !!isAdmin;

      const cartels = await CartelModel.findAll(filters);
      res.json(cartels);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const cartel = await CartelModel.findById(req.params.id, {
        includeWorkshops: !!req.user?.can_manage_admin,
      });
      if (!cartel) return res.status(404).json({ error: 'Cartel introuvable' });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const cartel = await CartelModel.create(
        sanitizeWorkshopFields(req.body, req.user?.can_manage_admin),
        req.user?.id ?? null,
        req.submitterIp ?? null
      );
      res.status(201).json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      // Un contributeur ne peut modifier que ses propres cartels non publiés
      const isOwner = existing.created_by === req.user.id;
      const isEditor = req.user.can_publish_cartel || req.user.can_manage_admin;
      if (!isOwner && !isEditor) return res.status(403).json({ error: 'Non autorisé' });

      const cartel = await CartelModel.update(
        req.params.id,
        sanitizeWorkshopFields(req.body, req.user?.can_manage_admin)
      );
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async setStatus(req, res) {
    try {
      const { status } = req.body;
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Statut invalide. Valeurs acceptées: ${VALID_STATUSES.join(', ')}` });
      }

      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      // Publier nécessite can_publish_cartel
      if (status === 'published' && !req.user.can_publish_cartel) {
        return res.status(403).json({ error: 'Permission can_publish_cartel requise' });
      }

      const cartel = await CartelModel.setStatus(req.params.id, status);
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      const isOwner = existing.created_by === req.user.id;
      const isAdmin = req.user.can_manage_admin;
      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' });

      await CartelModel.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};