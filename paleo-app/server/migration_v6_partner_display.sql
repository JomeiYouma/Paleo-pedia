-- ============================================================
-- Migration v6 — Gestion partenaires principaux / standards
-- À exécuter UNE SEULE FOIS via PhpMyAdmin
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1) Étendre subsite_partners avec un niveau d'affichage ──
SET @has_partner_tier := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsite_partners'
    AND COLUMN_NAME = 'partner_tier'
);

SET @sql := IF(
  @has_partner_tier = 0,
  'ALTER TABLE subsite_partners ADD COLUMN partner_tier ENUM(''primary'',''regular'') NOT NULL DEFAULT ''regular'' AFTER partner_id',
  'SELECT "partner_tier already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mise en cohérence (sécurité)
UPDATE subsite_partners
SET partner_tier = 'regular'
WHERE partner_tier IS NULL OR partner_tier NOT IN ('primary', 'regular');

-- Index optionnel pour tri/filtrage
SET @has_idx_subsite_tier := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsite_partners'
    AND INDEX_NAME = 'idx_subsite_partner_tier'
);

SET @sql := IF(
  @has_idx_subsite_tier = 0,
  'CREATE INDEX idx_subsite_partner_tier ON subsite_partners (subsite_id, partner_tier, sort_order)',
  'SELECT "idx_subsite_partner_tier already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 2) Table site_partners pour le site principal ───────────
CREATE TABLE IF NOT EXISTS `site_partners` (
  `partner_id`    CHAR(36) NOT NULL,
  `partner_tier`  ENUM('primary','regular') NOT NULL DEFAULT 'regular',
  `sort_order`    INT NOT NULL DEFAULT 0,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`partner_id`),
  KEY `idx_site_partners_tier` (`partner_tier`, `sort_order`),
  CONSTRAINT `fk_site_partners_partner`
    FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
