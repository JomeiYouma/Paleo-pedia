/**
 * teamController.js
 * Gestion d'équipe scopée à un sous-site (/api/s/:slug/users).
 *
 * Règles de sécurité :
 *   - Actions autorisées pour : superadmin (can_manage_admin) OU
 *     owner du sous-site (can_manage_team && home_subsite_id === req.tenant.id)
 *   - Un owner ne peut PAS créer ou promouvoir un superadmin (can_manage_admin)
 *   - Un owner ne peut PAS déplacer un utilisateur vers un autre sous-site
 *   - Un owner ne peut PAS modifier/supprimer un superadmin
 *   - Les utilisateurs gérés doivent avoir home_subsite_id === req.tenant.id
 */
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

const CreateSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});

const UpdateSchema = z.object({
  can_create_cartel:  z.boolean().optional(),
  can_publish_cartel: z.boolean().optional(),
  can_manage_team:    z.boolean().optional(),
  role:               z.enum(['contributor', 'editor', 'admin', 'superadmin']).optional(),
}).strict();

function isAllowed(req) {
  if (!req.user || !req.tenant) return false;
  if (req.user.can_manage_admin) return true;
  return !!req.user.can_manage_team && req.user.home_subsite_id === req.tenant.id;
}

export const TeamController = {

  async list(req, res) {
    try {
      if (!isAllowed(req)) return res.status(403).json({ error: 'Non autorisé' });
      const users = await UserModel.findBySubsite(req.tenant.id);
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      if (!isAllowed(req)) return res.status(403).json({ error: 'Non autorisé' });

      const parsed = CreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { email, password } = parsed.data;

      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

      // Permissions par défaut pour un nouveau membre d'équipe :
      // contributor pouvant créer des cartels. Le reste se configure ensuite via PATCH.
      // Un owner ne peut PAS créer un superadmin ; seul le superadmin peut promouvoir.
      const user = await UserModel.create({
        email,
        password,
        role:              'contributor',
        can_create_cartel: true,
        can_publish_cartel: false,
        can_manage_admin:  false,
        can_create_subsite: false,
        can_manage_team:   false,
        home_subsite_id:   req.tenant.id,
      });

      const { password_hash, ...safe } = user;
      dispatch({
        type: 'user.assigned_subsite', req,
        targetId: user.id, subsiteId: req.tenant.id,
        summary: user.email,
        payload: { home_subsite_id: req.tenant.id, slug: req.tenant.slug },
      });
      res.status(201).json(safe);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      if (!isAllowed(req)) return res.status(403).json({ error: 'Non autorisé' });

      const target = await UserModel.findById(req.params.id);
      if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });
      // Ne pas divulguer l'existence d'utilisateurs hors tenant
      if (target.home_subsite_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }
      // Un owner ne touche pas à un superadmin
      if (target.can_manage_admin && !req.user.can_manage_admin) {
        return res.status(403).json({ error: 'Non autorisé à modifier un superadmin' });
      }

      const parsed = UpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const updated = await UserModel.update(req.params.id, parsed.data);
      const { password_hash, ...safe } = updated;
      dispatch({
        type: 'user.updated', req,
        targetId: updated.id, subsiteId: req.tenant.id,
        summary: updated.email,
        payload: { changed: parsed.data },
      });
      res.json(safe);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      if (!isAllowed(req)) return res.status(403).json({ error: 'Non autorisé' });

      const target = await UserModel.findById(req.params.id);
      if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });
      if (target.home_subsite_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }
      if (target.can_manage_admin && !req.user.can_manage_admin) {
        return res.status(403).json({ error: 'Non autorisé à supprimer un superadmin' });
      }
      if (target.id === req.user.id) {
        return res.status(400).json({ error: 'Impossible de supprimer votre propre compte depuis cette interface' });
      }

      await UserModel.delete(req.params.id);
      dispatch({
        type: 'user.deleted', req,
        targetId: target.id, subsiteId: req.tenant.id,
        summary: target.email,
      });
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
