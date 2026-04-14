-- ============================================================
-- Migration v3 — Système de sous-sites
-- À exécuter UNE SEULE FOIS via PhpMyAdmin
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. TABLE subsites ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `subsites` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `slug`           VARCHAR(64)   NOT NULL,
  `name`           VARCHAR(255)  NOT NULL,
  `category_id`    VARCHAR(64)   NOT NULL,
  `primary_color`  VARCHAR(16)   NOT NULL DEFAULT '#D65A5A',
  `logo_path`      VARCHAR(512)  NULL DEFAULT NULL,      -- réservé pour plus tard
  `content_blocks` LONGTEXT      NULL DEFAULT NULL,      -- JSON Array de blocs
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subsites_slug` (`slug`),
  CONSTRAINT `fk_subsite_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. TABLE partners (bibliothèque globale) ───────────────
CREATE TABLE IF NOT EXISTS `partners` (
  `id`         CHAR(36)     NOT NULL DEFAULT (UUID()),
  `name`       VARCHAR(255) NOT NULL,
  `logo_path`  VARCHAR(512) NULL DEFAULT NULL,
  `url`        VARCHAR(512) NULL DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. TABLE subsite_partners (M-M avec ordre) ────────────
CREATE TABLE IF NOT EXISTS `subsite_partners` (
  `subsite_id` CHAR(36) NOT NULL,
  `partner_id` CHAR(36) NOT NULL,
  `sort_order` INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`subsite_id`, `partner_id`),
  CONSTRAINT `fk_sp_subsite` FOREIGN KEY (`subsite_id`) REFERENCES `subsites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
