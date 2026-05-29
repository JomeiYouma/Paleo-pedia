-- ============================================================
-- v27 — Équipe par subsite : ajoute team_members.subsite_id
-- ------------------------------------------------------------
-- Aujourd'hui la table team_members est globale (tous les membres
-- s'affichent sur la page « À propos » du site principal). Cette
-- migration ajoute une FK nullable :
--   - subsite_id = NULL → membre du site principal (comportement actuel)
--   - subsite_id renseigné → membre d'un sous-site précis
--
-- La page Présentation côté front filtre selon le contexte (route
-- /presentation vs /site/:slug/presentation) — fallback sur l'équipe
-- principale si le sous-site n'a aucun membre déclaré.
--
-- Idempotent : guards INFORMATION_SCHEMA avant chaque opération.
-- ============================================================

-- ── 1. Colonne subsite_id ─────────────────────────────────────
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'team_members'
    AND COLUMN_NAME = 'subsite_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `team_members` ADD COLUMN `subsite_id` CHAR(36) NULL DEFAULT NULL AFTER `category`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. Index ──────────────────────────────────────────────────
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'team_members'
    AND INDEX_NAME = 'idx_team_subsite'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `team_members` ADD KEY `idx_team_subsite` (`subsite_id`, `category`, `display_order`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 3. FK → subsites.id avec CASCADE ──────────────────────────
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'team_members'
    AND CONSTRAINT_NAME = 'fk_team_subsite'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `team_members`
     ADD CONSTRAINT `fk_team_subsite`
       FOREIGN KEY (`subsite_id`) REFERENCES `subsites` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
