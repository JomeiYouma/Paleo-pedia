/**
 * partnerController.js
 * CRUD global des partenaires.
 */
import { PartnerModel } from '../models/Partner.js';

export const PartnerController = {

  async getAll(req, res) {
    try { res.json(await PartnerModel.findAll()); }
    catch (e) { res.status(500).json({ error: e.message }); }
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
      const { name, logo_path, url } = req.body;
      if (!name) return res.status(400).json({ error: 'name est requis' });
      res.status(201).json(await PartnerModel.create({ name, logo_path, url }));
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async update(req, res) {
    try {
      const p = await PartnerModel.findById(req.params.id);
      if (!p) return res.status(404).json({ error: 'Partenaire introuvable' });
      res.json(await PartnerModel.update(req.params.id, req.body));
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async remove(req, res) {
    try {
      await PartnerModel.delete(req.params.id);
      res.sendStatus(204);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },
};
