/**
 * subsiteController.js
 * CRUD sous-sites + gestion des partenaires associés.
 *
 * Création/suppression : réservées au superadmin (requireAdmin sur la route).
 * Modification : superadmin OU owner du subsite (can_manage_team +
 *   home_subsite_id === subsite.id). L'owner ne peut éditer qu'un
 *   sous-ensemble de champs (content de la page d'accueil, couleur,
 *   partenaires) — la source (catégorie/atelier) et le slug restent
 *   verrouillés.
 */
import { SubsiteModel } from '../models/Subsite.js';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

const SUPERADMIN_EDITABLE = ['name', 'primary_color', 'content_blocks', 'content_blocks_en', 'slug'];
const OWNER_EDITABLE      = ['primary_color', 'content_blocks', 'content_blocks_en'];

export const SubsiteController = {

  async getAll(req, res) {
    try {
      const list = await SubsiteModel.findAll();
      res.json(list);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getOne(req, res) {
    try {
      const subsite = await SubsiteModel.findBySlug(req.params.slug);
      if (!subsite) return res.status(404).json({ error: 'Sous-site introuvable' });
      res.json(subsite);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async create(req, res) {
    try {
      const { slug, name, category_id, workshop_id, primary_color, content_blocks, content_blocks_en, partner_ids, primary_partner_ids } = req.body;
      if (!slug || !name) {
        return res.status(400).json({ error: 'slug et name sont requis' });
      }
      // Source = exactement un des deux. On rejette les deux cas dégénérés.
      const hasCategory = !!category_id;
      const hasWorkshop = !!workshop_id;
      if (hasCategory === hasWorkshop) {
        return res.status(400).json({
          error: 'Le subsite doit être basé sur une catégorie OU un atelier (exactement un des deux).',
        });
      }
      const subsite = await SubsiteModel.create({
        slug, name,
        category_id: hasCategory ? category_id : null,
        workshop_id: hasWorkshop ? workshop_id : null,
        primary_color, content_blocks, content_blocks_en,
      });
      if (partner_ids !== undefined || primary_partner_ids !== undefined) {
        await SubsiteModel.setPartners(subsite.id, {
          partnerIds: Array.isArray(partner_ids) ? partner_ids : [],
          primaryPartnerIds: Array.isArray(primary_partner_ids) ? primary_partner_ids : [],
        });
      }
      const created = await SubsiteModel.findBySlug(subsite.slug);
      dispatch({
        type: 'subsite.created', req,
        targetId: created.id, subsiteId: created.id,
        summary: `${created.name} (${created.slug})`,
        payload: { slug: created.slug, category_id: created.category_id, workshop_id: created.workshop_id },
      });
      res.status(201).json(created);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce slug est déjà utilisé.' });
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const subsite = await SubsiteModel.findBySlug(req.params.slug);
      if (!subsite) return res.status(404).json({ error: 'Sous-site introuvable' });

      // Permissions : superadmin = tout ; owner du subsite courant = sous-ensemble.
      const isSuperadmin = !!req.user?.can_manage_admin;
      const isOwnerOfThis = !!req.user?.can_manage_team
        && req.user?.home_subsite_id === subsite.id;
      if (!isSuperadmin && !isOwnerOfThis) {
        return res.status(403).json({ error: 'Permission refusée sur ce sous-site.' });
      }
      const allowed = isSuperadmin ? SUPERADMIN_EDITABLE : OWNER_EDITABLE;

      const { partner_ids, primary_partner_ids, ...data } = req.body;
      const updated = await SubsiteModel.update(req.params.slug, data, allowed);
      // Les partenaires sont éditables par superadmin ET owner (cohérent
      // avec « gérer le contenu de la page d'accueil »).
      if (partner_ids !== undefined || primary_partner_ids !== undefined) {
        await SubsiteModel.setPartners(subsite.id, {
          partnerIds: Array.isArray(partner_ids) ? partner_ids : [],
          primaryPartnerIds: Array.isArray(primary_partner_ids) ? primary_partner_ids : [],
        });
      }
      const fresh = await SubsiteModel.findBySlug(updated.slug);
      dispatch({
        type: 'subsite.updated', req,
        targetId: fresh.id, subsiteId: fresh.id,
        summary: `${fresh.name} (${fresh.slug})`,
      });
      res.json(fresh);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async remove(req, res) {
    try {
      const existing = await SubsiteModel.findBySlug(req.params.slug);
      if (!existing) return res.status(404).json({ error: 'Sous-site introuvable' });
      await SubsiteModel.delete(req.params.slug);
      dispatch({
        type: 'subsite.deleted', req,
        targetId: existing.id, subsiteId: existing.id,
        summary: `${existing.name} (${existing.slug})`,
      });
      res.sendStatus(204);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },
};
