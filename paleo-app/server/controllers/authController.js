import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { signToken } from '../lib/jwt.js';

// ── Schémas de validation ────────────────────────────────────
const RegisterSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});

const LoginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// ── Helper ───────────────────────────────────────────────────

/** Construit un payload JWT complet avec les permissions */
function buildToken(user) {
  return signToken({
    id:                 user.id,
    role:               user.role,
    can_create_cartel:  !!user.can_create_cartel,
    can_publish_cartel: !!user.can_publish_cartel,
    can_manage_admin:   !!user.can_manage_admin,
    can_create_subsite: !!user.can_create_subsite,
    can_manage_team:    !!user.can_manage_team,
    home_subsite_id:    user.home_subsite_id ?? null,
  });
}

// ── Contrôleur ───────────────────────────────────────────────
export const AuthController = {

  async register(req, res) {
    try {
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
      if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

      // 3. JWT avec les permissions actuelles (snapshot à la connexion)
      const token = buildToken(user);
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async me(req, res) {
    res.json(req.user);
  },
};