import { verifyToken } from '../lib/jwt.js';

/**
 * Vérifie le JWT et injecte req.user directement depuis le payload.
 * Les permissions (can_create_cartel, etc.) sont lues dans le token,
 * ce qui évite un appel BDD à chaque requête authentifiée.
 *
 * Contrepartie assumée : si les droits d'un utilisateur sont modifiés
 * via PATCH /users/:id, les changements ne prendront effet qu'à sa
 * prochaine connexion (durée de vie du token : JWT_EXPIRES_IN).
 */
export async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const decoded = verifyToken(auth.slice(7));
    // Le payload contient déjà id, role, et les 3 permissions
    req.user = {
      id:                 decoded.id,
      role:               decoded.role,
      can_create_cartel:  !!decoded.can_create_cartel,
      can_publish_cartel: !!decoded.can_publish_cartel,
      can_manage_admin:   !!decoded.can_manage_admin,
      can_create_subsite: !!decoded.can_create_subsite,
    };
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