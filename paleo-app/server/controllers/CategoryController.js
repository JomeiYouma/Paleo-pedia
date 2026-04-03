import { CategoryModel } from '../models/Category.js';

export const CategoryController = {

  async getAll(req, res) {
    try {
      const usedOnly = req.query.used === 'true';
      res.json(await CategoryModel.findAll({ usedOnly }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const cat = await CategoryModel.findById(req.params.id);
      if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
      res.json(cat);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const cat = await CategoryModel.create(req.body);
      res.status(201).json(cat);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'ID déjà utilisé' });
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const cat = await CategoryModel.update(req.params.id, req.body);
      if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
      res.json(cat);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      await CategoryModel.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};