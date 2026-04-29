import { WorkshopModel } from '../models/Workshop.js';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

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
      dispatch({
        type: 'workshop.created', req,
        targetId: workshop.id, summary: workshop.name,
        payload: { is_immersive: !!workshop.is_immersive, cartels: (cartelIds || []).length },
      });
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
      dispatch({
        type: 'workshop.updated', req,
        targetId: workshop.id, summary: workshop.name,
      });
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
      dispatch({
        type: 'workshop.updated', req,
        targetId: workshop.id, summary: workshop.name,
        payload: { addedCartels: cartelIds.length },
      });
      res.json(workshop);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async removeCartel(req, res) {
    try {
      await WorkshopModel.removeCartel(req.params.id, req.params.cartelId);
      dispatch({
        type: 'workshop.updated', req,
        targetId: req.params.id,
        payload: { removedCartel: req.params.cartelId },
      });
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
      dispatch({
        type: 'workshop.deleted', req,
        targetId: existing.id, summary: existing.name,
      });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
