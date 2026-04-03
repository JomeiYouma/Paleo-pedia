import { verifyToken } from '../lib/jwt.js';
import { query } from '../lib/db.js';

/** Vérifie le JWT et injecte req.user */
export async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const decoded = verifyToken(auth.slice(7));
    const { rows } = await query(
      'select id, email, role, can_create_cartel, can_publish_cartel, can_manage_admin from users where id = $1',
      [decoded.id]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Utilisateur introuvable' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

/** Vérifie une permission spécifique */
export function require(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (!req.user[permission]) {
      return res.status(403).json({ error: `Permission refusée : ${permission}` });
    }
    next();
  };
}

/** Raccourcis */
export const requireCreate  = require('can_create_cartel');
export const requirePublish = require('can_publish_cartel');
export const requireAdmin   = require('can_manage_admin');