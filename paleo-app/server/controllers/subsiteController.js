/**
 * subsiteController.js
 * CRUD sous-sites + gestion des partenaires associés.
 */
import { SubsiteModel } from '../models/Subsite.js';
import { dispatchEvent } from '../services/eventDispatcher.js';
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

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
      const { slug, name, category_id, primary_color, content_blocks, partner_ids, primary_partner_ids } = req.body;
      if (!slug || !name || !category_id) {
        return res.status(400).json({ error: 'slug, name et category_id sont requis' });
      }
      const subsite = await SubsiteModel.create({ slug, name, category_id, primary_color, content_blocks });
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
        payload: { slug: created.slug, category_id: created.category_id },
      });
      res.status(201).json(created);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce slug est déjà utilisé.' });
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const { partner_ids, primary_partner_ids, ...data } = req.body;
      const subsite = await SubsiteModel.findBySlug(req.params.slug);
      if (!subsite) return res.status(404).json({ error: 'Sous-site introuvable' });

      const updated = await SubsiteModel.update(req.params.slug, data);
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
