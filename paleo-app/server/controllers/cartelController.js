import { CartelModel } from '../models/Cartel.js';

const VALID_STATUSES = ['draft', 'pending_review', 'published', 'archived'];

export const CartelController = {

  async getAll(req, res) {
    try {
      const { status, visible, category, search, limit, offset } = req.query;
      const cartels = await CartelModel.findAll({
        status, visible: visible === 'true' ? true : visible === 'false' ? false : undefined,
        category, search,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json(cartels);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const cartel = await CartelModel.findById(req.params.id);
      if (!cartel) return res.status(404).json({ error: 'Cartel introuvable' });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const cartel = await CartelModel.create(req.body, req.user.id);
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

      const cartel = await CartelModel.update(req.params.id, req.body);
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