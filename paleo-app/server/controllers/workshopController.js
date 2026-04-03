import { WorkshopModel } from '../models/Workshop.js';

export const WorkshopController = {

  async getAll(req, res) {
    try {
      const workshops = await WorkshopModel.findAll();
      res.json(workshops);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const workshop = await WorkshopModel.findById(req.params.id);
      if (!workshop) return res.status(404).json({ error: 'Atelier introuvable' });
      res.json(workshop);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, is_immersive, cartelIds } = req.body;
      if (!name) return res.status(400).json({ error: 'Le nom est requis' });
      const workshop = await WorkshopModel.create(
        { name, is_immersive, cartelIds: cartelIds || [] },
        req.user?.id ?? null
      );
      res.status(201).json(workshop);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await WorkshopModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Atelier introuvable' });
      const workshop = await WorkshopModel.update(req.params.id, req.body);
      res.json(workshop);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async addCartels(req, res) {
    try {
      const { cartelIds } = req.body;
      if (!Array.isArray(cartelIds) || cartelIds.length === 0) {
        return res.status(400).json({ error: 'cartelIds requis (tableau)' });
      }
      const workshop = await WorkshopModel.addCartels(req.params.id, cartelIds);
      res.json(workshop);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async removeCartel(req, res) {
    try {
      await WorkshopModel.removeCartel(req.params.id, req.params.cartelId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const existing = await WorkshopModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Atelier introuvable' });
      await WorkshopModel.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
