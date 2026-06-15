-- ============================================================
-- v29 — Type de planète choisi par sous-site (vitrine Paléo-Pédia).
--   NULL  = automatique (assignation variée par position d'orbite).
--   Sinon : wind | forest | solar | rocky | icy | lush
--
-- Idempotent : l'ALTER n'est appliqué que si la colonne est absente
-- (testé via INFORMATION_SCHEMA, cf. v26 — MySQL 5.7 sur o2switch ne
-- supporte pas ADD COLUMN IF NOT EXISTS).
-- ============================================================
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsites'
    AND COLUMN_NAME = 'planet_type'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `subsites` ADD COLUMN `planet_type` VARCHAR(16) NULL DEFAULT NULL AFTER `primary_color`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
