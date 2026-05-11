-- ============================================================
-- paleo-energetique — Migration v15 : champs bilingues FR/EN
-- Ajoute des colonnes _en sur toutes les tables de contenu pour
-- permettre l'affichage selon la langue de l'utilisateur (i18next)
-- et l'auto-traduction via le gestionnaire admin (DeepL/OpenAI).
-- À exécuter UNE SEULE FOIS sur la BDD via PhpMyAdmin.
-- ============================================================

SET NAMES utf8mb4;

-- ── team_members : role + bio traduits ───────────────────────
ALTER TABLE `team_members`
  ADD COLUMN `role_en` VARCHAR(255) NULL DEFAULT NULL AFTER `role`,
  ADD COLUMN `bio_en`  TEXT         NULL DEFAULT NULL AFTER `bio`;

-- ── press_articles : title + excerpt traduits ────────────────
-- (la `source` reste non-traduite : c'est un nom propre de média)
ALTER TABLE `press_articles`
  ADD COLUMN `title_en`   VARCHAR(500) NULL DEFAULT NULL AFTER `title`,
  ADD COLUMN `excerpt_en` TEXT         NULL DEFAULT NULL AFTER `excerpt`;

-- ── prestations : title + intro + description + bullet + pdf_label
ALTER TABLE `prestations`
  ADD COLUMN `title_en`         VARCHAR(255) NULL DEFAULT NULL AFTER `title`,
  ADD COLUMN `intro_en`         TEXT         NULL DEFAULT NULL AFTER `intro`,
  ADD COLUMN `description_en`   TEXT         NULL DEFAULT NULL AFTER `description`,
  ADD COLUMN `bullet_points_en` TEXT         NULL DEFAULT NULL AFTER `bullet_points`,
  ADD COLUMN `pdf_label_en`     VARCHAR(255) NULL DEFAULT NULL AFTER `pdf_label`;

-- ── shop_items : title + subtitle + description traduits ─────
ALTER TABLE `shop_items`
  ADD COLUMN `title_en`       VARCHAR(255) NULL DEFAULT NULL AFTER `title`,
  ADD COLUMN `subtitle_en`    VARCHAR(255) NULL DEFAULT NULL AFTER `subtitle`,
  ADD COLUMN `description_en` TEXT         NULL DEFAULT NULL AFTER `description`;
