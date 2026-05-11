-- ============================================================
-- paleo-energetique — Migration v12 : prestations
-- Cards de prestation affichées sur la page publique /prestations
-- (challenges, ateliers, expo itinérante, conseil…). Chaque card a
-- titre, intro, description, liste optionnelle de bullets, icône
-- (clé Lucide), et plaquette PDF optionnelle.
-- À exécuter UNE SEULE FOIS sur la BDD via PhpMyAdmin.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `prestations` (
  `id`            CHAR(36)      NOT NULL DEFAULT (UUID()),
  `title`         VARCHAR(255)  NOT NULL,
  `intro`         TEXT          NULL DEFAULT NULL,
  `description`   TEXT          NULL DEFAULT NULL,
  `bullet_points` TEXT          NULL DEFAULT NULL,
  `icon_name`     VARCHAR(50)   NULL DEFAULT NULL,
  `pdf_path`      VARCHAR(500)  NULL DEFAULT NULL,
  `pdf_label`     VARCHAR(255)  NULL DEFAULT NULL,
  `display_order` INT           NOT NULL DEFAULT 0,
  `is_published`  TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prestations_publish` (`is_published`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
