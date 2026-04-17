-- ============================================================
-- Migration v7 — Multi-tenant (isolation par subsite)
-- À exécuter UNE SEULE FOIS via PhpMyAdmin
--
-- Ajoute :
--   • cartels.subsite_id        (NULL = site principal, FK subsites)
--   • cartels.visible_on_main   (validé par superadmin pour le site principal)
--   • cartels.submitted_to_main_at (file d'attente de validation)
--   • users.home_subsite_id     (sous-site natif de l'utilisateur)
--   • users.can_manage_team     (owner : gère admins de son sous-site)
--   • partners.is_mandatory     (partenaire imposé sur tous les sous-sites)
--   • partners.owner_subsite_id (partenaire exclusif à un sous-site)
--
-- Sécurité : tous les `ADD COLUMN` sont conditionnels (idempotent).
-- Rétrocompat : les cartels existants restent en subsite_id = NULL
-- et sont donc considérés comme appartenant au site principal.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1) cartels.subsite_id ───────────────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cartels' AND COLUMN_NAME = 'subsite_id'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE cartels ADD COLUMN subsite_id CHAR(36) NULL DEFAULT NULL AFTER id',
  'SELECT "cartels.subsite_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2) cartels.visible_on_main ──────────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cartels' AND COLUMN_NAME = 'visible_on_main'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE cartels ADD COLUMN visible_on_main TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT "cartels.visible_on_main already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Les cartels existants (subsite_id NULL = site principal) restent visibles sur le principal
UPDATE cartels SET visible_on_main = 1
WHERE subsite_id IS NULL AND status = 'published' AND visible_on_main = 0;

-- ── 3) cartels.submitted_to_main_at ─────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cartels' AND COLUMN_NAME = 'submitted_to_main_at'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE cartels ADD COLUMN submitted_to_main_at DATETIME NULL DEFAULT NULL',
  'SELECT "cartels.submitted_to_main_at already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 4) Index + FK sur cartels.subsite_id ────────────────────
SET @has_idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cartels' AND INDEX_NAME = 'idx_cartels_subsite'
);
SET @sql := IF(@has_idx = 0,
  'CREATE INDEX idx_cartels_subsite ON cartels (subsite_id)',
  'SELECT "idx_cartels_subsite already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cartels' AND CONSTRAINT_NAME = 'fk_cartels_subsite'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE cartels ADD CONSTRAINT fk_cartels_subsite FOREIGN KEY (subsite_id) REFERENCES subsites(id) ON DELETE SET NULL',
  'SELECT "fk_cartels_subsite already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index combiné pour les requêtes "cartels publiés du site principal"
SET @has_idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cartels' AND INDEX_NAME = 'idx_cartels_main_feed'
);
SET @sql := IF(@has_idx = 0,
  'CREATE INDEX idx_cartels_main_feed ON cartels (visible_on_main, status, submitted_to_main_at)',
  'SELECT "idx_cartels_main_feed already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 5) users.home_subsite_id ────────────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'home_subsite_id'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE users ADD COLUMN home_subsite_id CHAR(36) NULL DEFAULT NULL',
  'SELECT "users.home_subsite_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_subsite'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_subsite FOREIGN KEY (home_subsite_id) REFERENCES subsites(id) ON DELETE SET NULL',
  'SELECT "fk_users_subsite already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 6) users.can_manage_team ────────────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_manage_team'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE users ADD COLUMN can_manage_team TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT "users.can_manage_team already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 7) partners.is_mandatory ────────────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partners' AND COLUMN_NAME = 'is_mandatory'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE partners ADD COLUMN is_mandatory TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT "partners.is_mandatory already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 8) partners.owner_subsite_id ────────────────────────────
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partners' AND COLUMN_NAME = 'owner_subsite_id'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE partners ADD COLUMN owner_subsite_id CHAR(36) NULL DEFAULT NULL',
  'SELECT "partners.owner_subsite_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partners' AND CONSTRAINT_NAME = 'fk_partners_owner_subsite'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE partners ADD CONSTRAINT fk_partners_owner_subsite FOREIGN KEY (owner_subsite_id) REFERENCES subsites(id) ON DELETE CASCADE',
  'SELECT "fk_partners_owner_subsite already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partners' AND INDEX_NAME = 'idx_partners_owner'
);
SET @sql := IF(@has_idx = 0,
  'CREATE INDEX idx_partners_owner ON partners (owner_subsite_id, is_mandatory)',
  'SELECT "idx_partners_owner already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
