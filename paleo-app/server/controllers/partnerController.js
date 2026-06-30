/**
 * partnerController.js
 * CRUD global des partenaires avec isolation par sous-site :
 *   - Superadmin  : tout accès, peut créer des partenaires obligatoires
 *   - Tenant admin: voit le pool public + ses exclusifs, peut créer/modifier
 *                   uniquement ses exclusifs (owner_subsite_id = home_subsite_id)
 *   - Anonyme     : voit uniquement le pool public
 */
import { PartnerModel } from '../models/Partner.js';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

function resolvePartnerScope(req) {
  if (req.user?.can_manage_admin) return 'all';
  if (req.user?.home_subsite_id) return { id: req.user.home_subsite_id };
  return 'public_pool';
}

function canModifyPartner(req, partner) {
  if (req.user?.can_manage_admin) return true;
  // Un compte ne modifie que les partenaires de SON périmètre : owner_subsite_id
  // doit égaler son home_subsite_id (null = pool du site principal).
  return partner.owner_subsite_id === (req.user?.home_subsite_id ?? null);
}

/**
 * Peut créer/modifier des partenaires (modèle v33) :
 *   - superadmin
 *   - owner d'un sous-site (can_manage_team) → ses exclusifs
 *   - gestionnaire de contenu (can_manage_content) → son périmètre
 *     (compte principal → pool principal ; compte sous-site → ses exclusifs)
 * Le périmètre exact est ensuite vérifié par canModifyPartner.
 */
function canManagePartners(req) {
  if (req.user?.can_manage_admin) return true;
  if (req.user?.can_manage_content) return true;
  return !!req.user?.home_subsite_id && !!req.user?.can_manage_team;
}

export const PartnerController = {

  async getAll(req, res) {
    try {
      const subsiteFilter = resolvePartnerScope(req);
      res.json(await PartnerModel.findAll({ subsiteFilter }));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getSiteSelection(req, res) {
    try {
      res.json(await PartnerModel.getSiteSelection());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async setSiteSelection(req, res) {
    try {
      const primary_partner_ids = Array.isArray(req.body?.primary_partner_ids) ? req.body.primary_partner_ids : [];
      const partner_ids = Array.isArray(req.body?.partner_ids) ? req.body.partner_ids : [];
      const data = await PartnerModel.setSiteSelection({
        primaryPartnerIds: primary_partner_ids,
        partnerIds: partner_ids,
      });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      if (!canManagePartners(req)) {
        return res.status(403).json({ error: 'Non autorisé' });
      }
      const { name, logo_path, url } = req.body;
      if (!name) return res.status(400).json({ error: 'name est requis' });

      const isSuperadmin = !!req.user?.can_manage_admin;
      // Les flags sensibles sont ignorés depuis le body pour les non-superadmins
      const is_mandatory = isSuperadmin ? !!req.body.is_mandatory : false;
      const owner_subsite_id = isSuperadmin
        ? (req.body.owner_subsite_id ?? null)
        : (req.user?.home_subsite_id ?? null);

      const created = await PartnerModel.create({
        name, logo_path, url, is_mandatory, owner_subsite_id,
      });
      dispatch({
        type: 'partner.created', req,
        targetId: created.id, subsiteId: created.owner_subsite_id ?? null,
        summary: created.name,
      });
      res.status(201).json(created);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      if (!canManagePartners(req)) {
        return res.status(403).json({ error: 'Non autorisé' });
      }
      const p = await PartnerModel.findById(req.params.id);
      if (!p) return res.status(404).json({ error: 'Partenaire introuvable' });

      if (!canModifyPartner(req, p)) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      // Filtrer les champs sensibles pour les non-superadmins
      const isSuperadmin = !!req.user?.can_manage_admin;
      const data = { ...req.body };
      if (!isSuperadmin) {
        delete data.is_mandatory;
        delete data.owner_subsite_id;
      }

      const updated = await PartnerModel.update(req.params.id, data);
      dispatch({
        type: 'partner.updated', req,
        targetId: updated.id, subsiteId: updated.owner_subsite_id ?? null,
        summary: updated.name,
      });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      if (!canManagePartners(req)) {
        return res.status(403).json({ error: 'Non autorisé' });
      }
      const p = await PartnerModel.findById(req.params.id);
      if (!p) return res.status(404).json({ error: 'Partenaire introuvable' });

      if (!canModifyPartner(req, p)) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      await PartnerModel.delete(req.params.id);
      dispatch({
        type: 'partner.deleted', req,
        targetId: p.id, subsiteId: p.owner_subsite_id ?? null,
        summary: p.name,
      });
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
