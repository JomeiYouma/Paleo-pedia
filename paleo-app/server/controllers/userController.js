import { UserModel } from '../models/User.js';
import { z } from 'zod';

const CreateSchema = z.object({
  email:               z.string().email('Email invalide'),
  password:            z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  role:                z.enum(['contributor', 'editor', 'admin', 'superadmin']).optional(),
  can_create_cartel:   z.boolean().optional(),
  can_publish_cartel:  z.boolean().optional(),
  can_manage_admin:    z.boolean().optional(),
  can_create_subsite:  z.boolean().optional(),
  can_manage_team:     z.boolean().optional(),
  home_subsite_id:     z.string().nullable().optional(),
}).strict();

export const UserController = {

  async create(req, res) {
    try {
      const parsed = CreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const existing = await UserModel.findByEmail(parsed.data.email);
      if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

      const user = await UserModel.create(parsed.data);
      const { password_hash, ...safe } = user;
      res.status(201).json(safe);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

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