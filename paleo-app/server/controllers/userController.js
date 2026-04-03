import { UserModel } from '../models/User.js';

export const UserController = {

  async getAll(req, res) {
    try {
      const { limit, offset } = req.query;
      const users = await UserModel.findAll({
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const user = await UserModel.update(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      await UserModel.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};