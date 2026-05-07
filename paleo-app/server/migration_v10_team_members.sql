-- ============================================================
-- paleo-energetique — Migration v10 : team_members
-- Stocke les membres de l'équipe affichés sur la page À propos.
-- 3 catégories mutuellement exclusives :
--   'main'      → équipe principale (cards complètes avec photo)
--   'secondary' → équipe secondaire / contributeur·ices proches
--   'community' → communauté de chercheur·euses associé·es
-- À exécuter UNE SEULE FOIS sur la BDD via PhpMyAdmin.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `team_members` (
  `id`            CHAR(36)      NOT NULL DEFAULT (UUID()),
  `category`      VARCHAR(20)   NOT NULL DEFAULT 'main',
  `name`          VARCHAR(255)  NOT NULL,
  `role`          VARCHAR(255)  NULL DEFAULT NULL,
  `bio`           TEXT          NULL DEFAULT NULL,
  `photo_path`    VARCHAR(500)  NULL DEFAULT NULL,
  `url_linkedin`  VARCHAR(500)  NULL DEFAULT NULL,
  `url_website`   VARCHAR(500)  NULL DEFAULT NULL,
  `url_other`     VARCHAR(500)  NULL DEFAULT NULL,
  `display_order` INT           NOT NULL DEFAULT 0,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_team_category` (`category`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
