-- ============================================================
-- Migration v4 — Ajout du crédit image sur les cartels
-- À exécuter UNE SEULE FOIS via PhpMyAdmin
-- ============================================================

SET NAMES utf8mb4;

SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cartels'
    AND COLUMN_NAME = 'image_credit'
);

SET @sql := IF(
  @has_col = 0,
  'ALTER TABLE cartels ADD COLUMN image_credit TEXT NULL AFTER image_path',
  'SELECT "image_credit already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
