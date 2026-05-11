-- ============================================================
-- paleo-energetique — Migration v11 : press_articles
-- Articles de presse affichés sur la page publique /presse.
-- À exécuter UNE SEULE FOIS sur la BDD via PhpMyAdmin.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `press_articles` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `title`          VARCHAR(500)  NOT NULL,
  `source`         VARCHAR(255)  NULL DEFAULT NULL,
  `published_date` DATE          NULL DEFAULT NULL,
  `url`            VARCHAR(500)  NULL DEFAULT NULL,
  `thumbnail_path` VARCHAR(500)  NULL DEFAULT NULL,
  `excerpt`        TEXT          NULL DEFAULT NULL,
  `display_order`  INT           NOT NULL DEFAULT 0,
  `is_published`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_press_publish` (`is_published`, `published_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
