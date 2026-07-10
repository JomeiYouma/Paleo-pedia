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

  /**
   * POST /api/shop-items/:id/checkout-click  (public, sans auth)
   * Journalise un clic visiteur sur un lien de paiement Stripe. Point d'intérêt
   * de conversion : on n'a AUCUNE autre trace côté plateforme (le visiteur part
   * vers buy.stripe.com), et un superadmin peut brancher un email sur ce type.
   *
   * Beacon fire-and-forget : on répond 204 immédiatement, sans bloquer la
   * navigation vers Stripe. On ne journalise que pour un article existant ET
   * publié (borne le flood de logs sur des IDs arbitraires). Un clic ≠ un
   * achat : la conversion réelle reste dans le tableau de bord Stripe.
   */
  async recordCheckoutClick(req, res) {
    try {
      const item = await ShopItemModel.findById(req.params.id);
      // Article inconnu ou non publié : on ignore silencieusement (204) plutôt
      // que 404, pour ne pas transformer l'endpoint en oracle d'existence.
      if (!item || !item.is_published) return res.sendStatus(204);

      const body = req.body || {};
      const variant = String(body.variant || '').trim().slice(0, 120);
      const option  = String(body.option  || '').trim().slice(0, 120);
      const price    = String(body.price   || '').trim().slice(0, 40);
      const url      = String(body.url     || '').trim().slice(0, 512);
      // IP du visiteur (fiable via trust proxy) : sert au récap quotidien
      // « telle IP a cliqué x fois ». Donnée personnelle → cf. note RGPD EMAILS.md.
      const ip = req.ip || null;
      // Résumé lisible dans le journal : « Titre — Papier / À domicile ».
      const choice = [variant, option].filter(Boolean).join(' / ');
      const summary = choice ? `${item.title} — ${choice}` : (item.title || '');

      dispatch({
        type: 'shop_item.checkout_click',
        // pas de req.user (visiteur anonyme) → actor null, c'est voulu
        targetId: item.id,
        summary,
        payload: { title: item.title, category: item.category, variant, option, price, url, ip },
      });
      res.sendStatus(204);
    } catch (e) {
      // Un souci de tracking ne doit jamais gêner l'achat : on avale.
      res.sendStatus(204);
    }
  },
};
