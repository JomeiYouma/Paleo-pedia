import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { signToken } from '../lib/jwt.js';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

// ── Schémas de validation ────────────────────────────────────
const RegisterSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});

const LoginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Mot de passe actuel requis'),
  new_password:     z.string().min(8, 'Nouveau mot de passe : 8 caractères minimum'),
});

// ── Helper ───────────────────────────────────────────────────

/** Construit un payload JWT complet avec les permissions */
function buildToken(user) {
  return signToken({
    id:                 user.id,
    email:              user.email,
    role:               user.role,
    can_create_cartel:  !!user.can_create_cartel,
    can_publish_cartel: !!user.can_publish_cartel,
    can_manage_admin:   !!user.can_manage_admin,
    can_create_subsite: !!user.can_create_subsite,
    can_manage_team:    !!user.can_manage_team,
    can_export_cartel:  !!user.can_export_cartel,
    home_subsite_id:    user.home_subsite_id ?? null,
  });
}

// ── Contrôleur ───────────────────────────────────────────────
export const AuthController = {

  async register(req, res) {
    try {
      // Durcissement : l'inscription publique est désactivée par défaut. Les
      // comptes se créent par invitation (page « Gestion d'équipe »). Cette
      // route reste réactivable via ALLOW_PUBLIC_REGISTRATION="true" si un
      // parcours d'inscription public devient un jour nécessaire.
      if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
        return res.status(403).json({ error: 'Inscription publique désactivée. Contactez un administrateur.' });
      }

      // 1. Valider le format
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      // 2. Unicité
      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

      // 3. Création — role et permissions forcés par défaut dans UserModel.
      //    Aucune permission de req.body n'est transmise → anti privilege escalation
      const user = await UserModel.create({ email, password });

      // 4. JWT avec les permissions réelles issues de la BDD (pas de req.body)
      const token = buildToken(user);
      const { password_hash, ...safeUser } = user;
      dispatch({ type: 'auth.register', req, actorId: user.id, actorEmail: user.email, targetId: user.id, summary: user.email });
      res.status(201).json({ token, user: safeUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      // 1. Valider le format
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      // 2. Vérification
      const user = await UserModel.findByEmail(email);
      if (!user) {
        dispatch({ type: 'auth.login_failed', req, actorEmail: email, summary: email, payload: { reason: 'unknown_email' } });
        return res.status(401).json({ error: 'Identifiants incorrects' });
      }

      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) {
        dispatch({ type: 'auth.login_failed', req, actorEmail: email, targetId: user.id, summary: email, payload: { reason: 'bad_password' } });
        return res.status(401).json({ error: 'Identifiants incorrects' });
      }

      // 3. JWT avec les permissions actuelles (snapshot à la connexion)
      const token = buildToken(user);
      const { password_hash, ...safeUser } = user;
      dispatch({ type: 'auth.login', req, actorId: user.id, actorEmail: user.email, targetId: user.id, summary: user.email });
      res.json({ token, user: safeUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async me(req, res) {
    res.json(req.user);
  },

  /** POST /api/auth/change-password — l'utilisateur connecté change SON propre mot de passe. */
  async changePassword(req, res) {
    try {
      const parsed = ChangePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { current_password, new_password } = parsed.data;

      // req.user vient du token (sans hash) → recharger le compte complet.
      const full = await UserModel.findByEmail(req.user.email);
      if (!full) return res.status(404).json({ error: 'Utilisateur introuvable' });

      const valid = await UserModel.verifyPassword(current_password, full.password_hash);
      if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

      await UserModel.updatePassword(full.id, new_password);
      dispatch({ type: 'user.password_changed', req, targetId: full.id, summary: full.email });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};