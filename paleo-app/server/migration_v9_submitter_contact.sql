-- ============================================================
-- paleo-energetique — migration v9 : submitter_contact
-- ============================================================
-- Ajoute la colonne `submitter_contact` à la table `cartels`.
-- Permet de récupérer un email/téléphone laissé par un visiteur
-- non-authentifié au moment de la soumission d'une proposition,
-- afin de pouvoir le recontacter (clarification, validation, etc.).
--
-- Idempotente : utilise INFORMATION_SCHEMA pour ne pas planter
-- si la colonne existe déjà.
-- ============================================================

SET NAMES utf8mb4;

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'cartels'
    AND COLUMN_NAME  = 'submitter_contact'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `cartels` ADD COLUMN `submitter_contact` VARCHAR(255) NULL DEFAULT NULL AFTER `submitter_ip`',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
