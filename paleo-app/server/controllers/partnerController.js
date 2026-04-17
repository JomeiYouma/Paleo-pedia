/**
 * partnerController.js
 * CRUD global des partenaires avec isolation par sous-site :
 *   - Superadmin  : tout accès, peut créer des partenaires obligatoires
 *   - Tenant admin: voit le pool public + ses exclusifs, peut créer/modifier
 *                   uniquement ses exclusifs (owner_subsite_id = home_subsite_id)
 *   - Anonyme     : voit uniquement le pool public
 */
import { PartnerModel } from '../models/Partner.js';

function resolvePartnerScope(req) {
  if (req.user?.can_manage_admin) return 'all';
  if (req.user?.home_subsite_id) return { id: req.user.home_subsite_id };
  return 'public_pool';
}

function canModifyPartner(req, partner) {
  if (req.user?.can_manage_admin) return true;
  if (!req.user?.home_subsite_id) return false;
  return partner.owner_subsite_id === req.user.home_subsite_id;
}

/** Un utilisateur doit être superadmin OU owner d'un sous-site pour créer/modifier des partenaires */
function canManagePartners(req) {
  return !!req.user?.can_manage_admin || (!!req.user?.home_subsite_id && !!req.user?.can_manage_team);
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

      res.status(201).json(await PartnerModel.create({
        name, logo_path, url, is_mandatory, owner_subsite_id,
      }));
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

      res.json(await PartnerModel.update(req.params.id, data));
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
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
