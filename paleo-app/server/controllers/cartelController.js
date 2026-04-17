import { CartelModel } from '../models/Cartel.js';

const VALID_STATUSES = ['draft', 'pending_review', 'published', 'archived'];

function sanitizeWorkshopFields(body, canManageAdmin) {
  if (canManageAdmin) return body;
  const cleaned = { ...body };
  delete cleaned.workshop_ids;
  delete cleaned.workshopIds;
  return cleaned;
}

/**
 * Calcule le filtre de scope à partir de la requête. Règles :
 *   - Route /s/:slug/*                        → scope = ce sous-site précis
 *   - Superadmin global sur /cartels          → 'none' (voit tout)
 *   - Utilisateur rattaché à un sous-site     → son home_subsite_id
 *   - Anonyme sur /cartels (lecture)          → 'main_feed' (main + submissions validées)
 *   - Anonyme sur /cartels (écriture)         → 'main' (submission au site principal)
 */
function resolveSubsiteFilter(req, { anonymousIsMainFeed = true } = {}) {
  if (req.tenant) return { id: req.tenant.id };
  if (req.user?.can_manage_admin) return 'none';
  if (req.user?.home_subsite_id) return { id: req.user.home_subsite_id };
  return anonymousIsMainFeed ? 'main_feed' : 'main';
}

/** Vérifie qu'un cartel chargé en BDD tombe bien dans le scope autorisé */
function cartelInScope(cartel, filter) {
  if (filter === 'none') return true;
  if (filter === 'main')      return cartel.subsite_id === null;
  if (filter === 'main_feed') return cartel.subsite_id === null || !!cartel.visible_on_main;
  if (filter && typeof filter === 'object') return cartel.subsite_id === filter.id;
  return false;
}

/** Résout le subsite_id à stocker pour un cartel créé via cette requête */
function resolveTargetSubsiteId(req) {
  if (req.tenant) return req.tenant.id;
  // Sur /cartels, un admin rattaché à un sous-site crée dans son sous-site.
  // Un superadmin non rattaché crée sur le site principal (subsite_id = NULL).
  if (req.user?.home_subsite_id && !req.user?.can_manage_admin) return req.user.home_subsite_id;
  return null;
}

export const CartelController = {

  async getAll(req, res) {
    try {
      const isAdmin = req.user?.can_manage_admin || !!req.user?.home_subsite_id;
      const { category, search, limit, offset } = req.query;

      const filters = {
        category, search,
        limit:  limit  ? parseInt(limit)  : 5000,
        offset: offset ? parseInt(offset) : 0,
        subsiteFilter: resolveSubsiteFilter(req),
      };

      if (!isAdmin) filters.status = 'published';
      filters.includeWorkshops = !!isAdmin;

      const cartels = await CartelModel.findAll(filters);
      res.json(cartels);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const cartel = await CartelModel.findById(req.params.id, {
        includeWorkshops: !!req.user?.can_manage_admin,
      });
      if (!cartel) return res.status(404).json({ error: 'Cartel introuvable' });

      const filter = resolveSubsiteFilter(req);
      if (!cartelInScope(cartel, filter)) {
        // Ne pas divulguer l'existence du cartel hors scope
        return res.status(404).json({ error: 'Cartel introuvable' });
      }
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const cartel = await CartelModel.create(
        sanitizeWorkshopFields(req.body, req.user?.can_manage_admin),
        req.user?.id ?? null,
        req.submitterIp ?? null,
        resolveTargetSubsiteId(req),
      );
      res.status(201).json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      if (!cartelInScope(existing, filter)) {
        return res.status(404).json({ error: 'Cartel introuvable' });
      }

      const isOwner = existing.created_by === req.user.id;
      const isEditor = req.user.can_publish_cartel || req.user.can_manage_admin;
      if (!isOwner && !isEditor) return res.status(403).json({ error: 'Non autorisé' });

      const cartel = await CartelModel.update(
        req.params.id,
        sanitizeWorkshopFields(req.body, req.user?.can_manage_admin)
      );
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async setStatus(req, res) {
    try {
      const { status } = req.body;
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Statut invalide. Valeurs acceptées: ${VALID_STATUSES.join(', ')}` });
      }

      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      if (!cartelInScope(existing, filter)) {
        return res.status(404).json({ error: 'Cartel introuvable' });
      }

      if (status === 'published' && !req.user.can_publish_cartel) {
        return res.status(403).json({ error: 'Permission can_publish_cartel requise' });
      }

      const cartel = await CartelModel.setStatus(req.params.id, status);
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      if (!cartelInScope(existing, filter)) {
        return res.status(404).json({ error: 'Cartel introuvable' });
      }

      const isOwner = existing.created_by === req.user.id;
      const isAdmin = req.user.can_manage_admin;
      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' });

      await CartelModel.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
