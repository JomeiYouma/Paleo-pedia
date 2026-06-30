import { verifyToken } from '../lib/jwt.js';

/**
 * Modèle de permissions v33 (cf. migration_v33). Le req.user est dérivé du
 * payload JWT. Les capacités sont scopées au périmètre du compte
 * (home_subsite_id) ; le superadmin (can_manage_admin) et l'owner
 * (can_manage_team) disposent IMPLICITEMENT des 4 capacités dans leur
 * périmètre — c'est la logique des gardes ci-dessous, pas un flag stocké.
 *
 * Contrepartie assumée : les permissions sont lues dans le token (pas de
 * round-trip BDD par requête) → un changement de droits prend effet à la
 * prochaine connexion (durée de vie du token : JWT_EXPIRES_IN).
 */

/**
 * Normalise un payload JWT décodé vers la forme req.user (modèle v33).
 *
 * Shim de compatibilité : un token émis AVANT le déploiement v33 ne contient
 * pas les nouveaux claims. On les dérive alors des anciens (can_create_cartel,
 * can_publish_cartel, can_export_cartel) pour ne pas casser les sessions en
 * cours. Le `??` ne se déclenche que si le claim v33 est absent (null/undefined).
 */
function normalizePermissions(decoded) {
  return {
    id:                    decoded.id,
    email:                 decoded.email ?? null,
    role:                  decoded.role,
    can_manage_cartels:    decoded.can_manage_cartels    ?? !!(decoded.can_create_cartel || decoded.can_publish_cartel),
    can_export_cartels:    decoded.can_export_cartels    ?? !!decoded.can_export_cartel,
    can_export_translated: decoded.can_export_translated ?? !!decoded.can_export_cartel,
    can_manage_content:    decoded.can_manage_content    ?? false,
    can_manage_admin:      !!decoded.can_manage_admin,
    can_manage_team:       !!decoded.can_manage_team,
    home_subsite_id:       decoded.home_subsite_id ?? null,
  };
}

/** Vérifie le JWT et injecte req.user (échoue en 401 si token absent/invalide). */
export async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    req.user = normalizePermissions(verifyToken(auth.slice(7)));
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

/**
 * Auth optionnelle : tente de décoder le token s'il est présent. N'échoue
 * jamais — req.user reste null si token absent ou invalide. Pour les routes
 * publiques au comportement enrichi pour les comptes connectés.
 */
export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  req.user = null;
  if (auth?.startsWith('Bearer ')) {
    try {
      req.user = normalizePermissions(verifyToken(auth.slice(7)));
    } catch {
      req.user = null;
    }
  }
  next();
}

/** Garde générique : exige un flag de permission précis. */
export function require(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (!req.user[permission]) {
      return res.status(403).json({ error: `Permission refusée : ${permission}` });
    }
    next();
  };
}

/** Administration générale (superadmin) — comptes, réglages, sous-sites, modération, logs. */
export const requireAdmin = require('can_manage_admin');

/**
 * Garde de capacité : autorise le superadmin (tout), l'owner (toutes capacités
 * dans son périmètre) OU un compte possédant la capacité demandée. Le PÉRIMÈTRE
 * exact (quels cartels / contenus) est ensuite appliqué dans le contrôleur via
 * home_subsite_id — ce garde ne fait qu'ouvrir la porte de la capacité.
 */
function allowCapability(predicate, label) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (req.user.can_manage_admin || req.user.can_manage_team || predicate(req.user)) return next();
    return res.status(403).json({ error: `Permission refusée : ${label}` });
  };
}

/** Gérer les cartels (créer/éditer/publier/archiver) + auto-traduire l'autre langue. */
export const requireManageCartels = allowCapability(u => u.can_manage_cartels, 'can_manage_cartels');

/** Exporter une sélection (langues de la BDD). can_export_translated l'inclut. */
export const requireExport = allowCapability(u => u.can_export_cartels || u.can_export_translated, 'can_export_cartels');

/** Exporter une sélection traduite vers une langue cible (frise traduite). */
export const requireExportTranslated = allowCapability(u => u.can_export_translated, 'can_export_translated');

/** Traduction unitaire de champs (aide à la rédaction cartels OU contenus). */
export const requireTranslateFields = allowCapability(u => u.can_manage_cartels || u.can_manage_content, 'traduction de contenu');

/**
 * Gérer les contenus de NIVEAU PRINCIPAL (presse, missions, prestations,
 * boutique, partenaires du site, équipe « à propos » du principal).
 * Autorisé au superadmin OU à un compte RATTACHÉ AU PRINCIPAL (home_subsite_id
 * null) possédant can_manage_content. Un owner de sous-site n'y a pas accès :
 * son périmètre est son propre sous-site (cf. contrôleurs scopés).
 */
export const requireManageContentMain = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  if (req.user.can_manage_admin) return next();
  if (req.user.home_subsite_id == null && req.user.can_manage_content) return next();
  return res.status(403).json({ error: 'Permission refusée : gestion des contenus (site principal)' });
};
