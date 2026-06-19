-- ============================================================
-- v32 — Capacite « exporter les cartels » (compte exportateur).
--   Un compte lecture seule qui accede au gestionnaire de cartels
--   UNIQUEMENT pour voir les cartels publies + les exporter /
--   traduire (export PDF / images / archive / frise traduite via
--   la cle OpenAI). Aucune autre permission (ni edition, ni
--   publication, ni moderation, ni admin, ni sous-site, ni equipe).
--
-- Idempotent : l'ALTER n'est applique que si la colonne est absente
-- (teste via INFORMATION_SCHEMA, cf. v29 — MySQL 5.7 sur o2switch ne
-- supporte pas ADD COLUMN IF NOT EXISTS).
-- ============================================================
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'can_export_cartel'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `can_export_cartel` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_manage_team`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
