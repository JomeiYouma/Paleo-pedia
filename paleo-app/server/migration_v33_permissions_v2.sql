-- ============================================================
-- v33 — Refonte du modele de permissions.
--
-- Remplace les anciens flags par 4 capacites scopees au perimetre
-- du compte (home_subsite_id) :
--   can_manage_cartels    : creer/editer/brouillon/archive/PUBLIER
--                           + auto-traduire l'autre langue (fusion de
--                           can_create_cartel + can_publish_cartel).
--   can_export_cartels    : exporter une selection telle quelle (langues BDD).
--   can_export_translated : exporter une selection traduite vers une
--                           langue cible (inclut l'export simple).
--   can_manage_content    : gerer les contenus hors cartels (presse,
--                           missions, prestations, boutique, partenaires,
--                           equipe « a propos »).
--
-- Inchangees : can_manage_admin (administration generale = superadmin),
-- can_manage_team (owner / admin de sous-site), home_subsite_id (perimetre).
-- Superadmin et owner disposent IMPLICITEMENT des 4 capacites dans leur
-- perimetre (logique des gardes), donc pas de backfill pour eux.
--
-- Colonnes DEPRECIEES (laissees en place, ignorees par le code v2, a
-- supprimer via v34 une fois la v2 validee en prod = rollback safe) :
--   can_create_cartel, can_publish_cartel, can_create_subsite, can_export_cartel.
--
-- Idempotent : ALTER conditionne par INFORMATION_SCHEMA (cf. v32) ;
-- le backfill, derive de colonnes stables, est rejouable sans effet de bord.
-- ============================================================

-- 1. Ajout des colonnes (uniquement si absentes) -------------------------------
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_manage_cartels');
SET @sql := IF(@c = 0,
  'ALTER TABLE `users` ADD COLUMN `can_manage_cartels` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_export_cartels');
SET @sql := IF(@c = 0,
  'ALTER TABLE `users` ADD COLUMN `can_export_cartels` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_manage_cartels`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_export_translated');
SET @sql := IF(@c = 0,
  'ALTER TABLE `users` ADD COLUMN `can_export_translated` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_export_cartels`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_manage_content');
SET @sql := IF(@c = 0,
  'ALTER TABLE `users` ADD COLUMN `can_manage_content` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_export_translated`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2. Backfill depuis les anciens flags ----------------------------------------
--    Seuls les comptes "capacite pure" sont migres ; superadmins/owners
--    heritent des capacites via la logique des gardes (perimetre).
UPDATE `users`
   SET `can_manage_cartels` = 1
 WHERE (`can_create_cartel` = 1 OR `can_publish_cartel` = 1);

UPDATE `users`
   SET `can_export_cartels` = 1, `can_export_translated` = 1
 WHERE `can_export_cartel` = 1;
