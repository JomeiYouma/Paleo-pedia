-- ============================================================
-- v34 — Versions multiples par article de boutique (liens Stripe).
--   Un article peut proposer plusieurs versions (ex. Papier / E-book),
--   chacune avec son propre nom (FR + EN optionnel), prix et lien de
--   paiement Stripe. Stocke un tableau JSON :
--     [{ "label": "Papier", "label_en": "Paperback",
--        "price": "28 €", "url": "https://buy.stripe.com/…" }, …]
--   dans une colonne LONGTEXT (compat MySQL 5.7 / MariaDB — on
--   sérialise/parse côté app, pas de type JSON natif requis).
--
--   Les anciennes colonnes `external_url` / `price_text` sont
--   conservées : elles servent de repli pour les articles pas encore
--   migrés et restent tenues à jour (miroir de la 1re version).
--
-- Idempotent : l'ALTER n'est appliqué que si la colonne est absente
-- (testé via INFORMATION_SCHEMA, cf. v32).
-- ============================================================
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'shop_items'
    AND COLUMN_NAME = 'versions'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `shop_items` ADD COLUMN `versions` LONGTEXT NULL DEFAULT NULL AFTER `price_text`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
