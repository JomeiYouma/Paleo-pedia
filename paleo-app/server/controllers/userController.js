import { UserModel } from '../models/User.js';
import { z } from 'zod';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

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
      dispatch({
        type: 'user.created', req,
        targetId: user.id,
        summary: user.email,
        payload: { role: user.role, home_subsite_id: user.home_subsite_id ?? null },
      });
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
      // On capture les permissions modifiées pour faciliter l'audit
      const trackedFields = ['role', 'can_create_cartel', 'can_publish_cartel', 'can_manage_admin', 'can_create_subsite', 'can_manage_team', 'home_subsite_id'];
      const changed = Object.fromEntries(
        Object.entries(req.body || {}).filter(([k]) => trackedFields.includes(k))
      );
      dispatch({
        type: 'user.updated', req,
        targetId: user.id,
        summary: user.email,
        payload: { changed },
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const target = await UserModel.findById(req.params.id);
      await UserModel.delete(req.params.id);
      dispatch({
        type: 'user.deleted', req,
        targetId: req.params.id,
        summary: target?.email || req.params.id,
      });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};