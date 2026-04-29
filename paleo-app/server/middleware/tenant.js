import { SubsiteModel } from '../models/Subsite.js';

/**
 * resolveTenant — à appliquer sur toute route /s/:slug/*
 *
 * Lit req.params.slug, charge le sous-site, et injecte req.tenant.
 * Si le slug est invalide → 404. Toute logique en aval peut supposer que
 * req.tenant existe et est un sous-site légitime.
 */
export async function resolveTenant(req, res, next) {
  const slug = req.params.slug;
  if (!slug) {
    return res.status(400).json({ error: 'Slug de sous-site manquant' });
  }
  try {
    const tenant = await SubsiteModel.findBySlug(slug);
    if (!tenant) {
      return res.status(404).json({ error: 'Sous-site introuvable' });
    }
    req.tenant = tenant;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * requireTenantAccess — à chaîner après authenticate + resolveTenant.
 *
 * Autorise uniquement :
 *   - le superadmin global (can_manage_admin === true)
 *   - ou un utilisateur rattaché à ce tenant (home_subsite_id === tenant.id)
 *
 * Usage typique : routes admin du sous-site, ex. PATCH /s/:slug/cartels/:id
 */
export function requireTenantAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  if (!req.tenant) return res.status(500).json({ error: 'Tenant non résolu' });

  const isSuperadmin = !!req.user.can_manage_admin;
  const belongsToTenant = req.user.home_subsite_id === req.tenant.id;

  if (!isSuperadmin && !belongsToTenant) {
    return res.status(403).json({ error: 'Accès au sous-site refusé' });
  }
  next();
}

/**
 * Construit le scope utilisé par les modèles Cartel/Partner pour filtrer
 * par sous-site. Centralisé ici pour éviter les divergences.
 *
 * Retourne :
 *   { type: 'subsite', id }  — sous-site explicite (route /s/:slug/*)
 *   { type: 'main' }         — site principal (subsite_id IS NULL)
 *   { type: 'home' }         — scope automatique sur le home_subsite_id de l'user
 *   { type: 'global' }       — pas de filtre (superadmin uniquement)
 */
export function buildSubsiteScope(req, { allowGlobal = false } = {}) {
  if (req.tenant) {
    return { type: 'subsite', id: req.tenant.id };
  }
  if (req.user?.can_manage_admin && allowGlobal) {
    return { type: 'global' };
  }
  if (req.user?.home_subsite_id) {
    return { type: 'subsite', id: req.user.home_subsite_id };
  }
  return { type: 'main' };
}
