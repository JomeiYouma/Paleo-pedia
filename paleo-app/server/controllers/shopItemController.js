/**
 * shopItemController.js
 * CRUD des liens vers la boutique externe (livres, jeux, autres) affichés
 * sur la page publique /ouvrages.
 * Lecture publique filtrée à is_published=1 pour les non-admins,
 * tout visible pour les admins via optionalAuth.
 */
import { ShopItemModel } from '../models/ShopItem.js';

export const ShopItemController = {

  async getAll(req, res) {
    try {
      const isAdmin = !!req.user?.can_manage_admin;
      const data = await ShopItemModel.findAll({ publishedOnly: !isAdmin });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const created = await ShopItemModel.create(req.body || {});
      res.status(201).json(created);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const existing = await ShopItemModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Item introuvable' });
      const updated = await ShopItemModel.update(req.params.id, req.body || {});
      res.json(updated);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      const existing = await ShopItemModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Item introuvable' });
      await ShopItemModel.delete(req.params.id);
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
