/**
 * shopItemController.js
 * CRUD des liens vers la boutique externe (livres, jeux, autres) affichés
 * sur la page publique /ouvrages.
 * Lecture publique filtrée à is_published=1 pour les non-admins,
 * tout visible pour les admins via optionalAuth.
 */
import { ShopItemModel } from '../models/ShopItem.js';
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

export const ShopItemController = {

  async getAll(req, res) {
    try {
      const isAdmin = !!req.user?.can_manage_admin || !!req.user?.can_manage_content;
      const data = await ShopItemModel.findAll({ publishedOnly: !isAdmin });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const created = await ShopItemModel.create(req.body || {});
      dispatch({ type: 'shop_item.created', req, targetId: created.id, summary: created.title || created.name || '' });
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
      dispatch({ type: 'shop_item.updated', req, targetId: req.params.id, summary: updated?.title || existing.title || '' });
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
      dispatch({ type: 'shop_item.deleted', req, targetId: req.params.id, summary: existing.title || '' });
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
