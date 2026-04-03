import { UserModel } from '../models/User.js';
import { signToken } from '../lib/jwt.js';

export const AuthController = {

  async register(req, res) {
    try {
      const { email, password, role, can_create_cartel, can_publish_cartel, can_manage_admin } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

      const user = await UserModel.create({ email, password, role, can_create_cartel, can_publish_cartel, can_manage_admin });
      const token = signToken({ id: user.id, role: user.role });
      res.status(201).json({ token, user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

      const token = signToken({ id: user.id, role: user.role });
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