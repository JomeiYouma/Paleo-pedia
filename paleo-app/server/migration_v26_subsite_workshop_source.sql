-- ============================================================
-- v26 — Permet à un subsite d'être basé sur un atelier (workshop)
--       plutôt que sur une catégorie.
-- ------------------------------------------------------------
-- Avant : subsites.category_id NOT NULL FK → categories
-- Après : subsites a soit category_id (mode « catégorie »), soit
--         workshop_id (mode « atelier »), jamais les deux à la fois.
--
-- La contrainte XOR est validée au niveau applicatif (controller)
-- car MySQL 5.7 ne supporte pas CHECK avant la 8.0 ; sur o2switch
-- la version peut varier, donc on reste défensif.
--
-- Idempotent : les ALTER ne sont appliqués que si l'état diffère
-- (testé via INFORMATION_SCHEMA avant chaque opération).
-- ============================================================

-- ── 1. category_id devient nullable ──────────────────────────
-- Si la colonne est déjà NULL-able, ne rien faire.
SET @col_nullable := (
  SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsites'
    AND COLUMN_NAME = 'category_id'
);
SET @sql := IF(@col_nullable = 'NO',
  'ALTER TABLE `subsites` MODIFY COLUMN `category_id` VARCHAR(64) NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. Ajout colonne workshop_id si absente ───────────────────
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsites'
    AND COLUMN_NAME = 'workshop_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `subsites` ADD COLUMN `workshop_id` CHAR(36) NULL DEFAULT NULL AFTER `category_id`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 3. Index sur workshop_id si absent ────────────────────────
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsites'
    AND INDEX_NAME = 'idx_subsite_workshop'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `subsites` ADD KEY `idx_subsite_workshop` (`workshop_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 4. FK workshop_id → workshops.id si absente ───────────────
-- ON DELETE CASCADE pour cohérence avec fk_subsite_category :
-- supprimer l'atelier source supprime aussi le subsite associé.
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsites'
    AND CONSTRAINT_NAME = 'fk_subsite_workshop'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `subsites`
     ADD CONSTRAINT `fk_subsite_workshop`
       FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
