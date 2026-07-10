-- ============================================================
-- v35 — Clic sur lien de paiement + backfill d'exhaustivité du journal
-- ------------------------------------------------------------
-- 1) Nouveau type `shop_item.checkout_click` : journalise un clic visiteur
--    (anonyme) sur un lien de paiement Stripe depuis la page produit. Permet
--    à un superadmin de brancher un email de notification (Admin → Journal
--    d'événements → Configuration emails). Beacon public, cf.
--    ShopItemController.recordCheckoutClick.
--
-- 2) Backfill de deux types qui étaient DÉJÀ émis par le code mais jamais
--    seedés dans event_email_config — ils étaient donc journalisés sans
--    pouvoir apparaître dans l'onglet « Configuration emails » (impossible d'y
--    activer un mail). Audit d'exhaustivité émis-vs-seedés :
--      - `cartel.subsite_withdrawn`      (cartelController — retrait d'une
--                                          soumission sous-site → principal)
--      - `partner.site_selection_updated` (partnerController — sélection des
--                                          sites où un partenaire est affiché)
--
-- Seuls les TYPES sont seedés (enabled=0 par défaut) : aucune notification
-- n'est activée automatiquement. Un superadmin active au cas par cas.
--
-- Idempotent : INSERT IGNORE sur la clé primaire `type`. Relancer ne crée pas
-- de doublon et n'écrase aucune config existante.
--
-- À exécuter une fois en local et en prod.
-- ============================================================

INSERT IGNORE INTO `event_email_config` (`type`) VALUES
  -- Boutique : clic sur un lien de paiement (conversion)
  ('shop_item.checkout_click'),
  -- Backfill exhaustivité (types émis mais jamais seedés)
  ('cartel.subsite_withdrawn'),
  ('partner.site_selection_updated');
