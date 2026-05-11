-- ============================================================
-- paleo-energetique — Migration v13 : shop_items
-- Liens vers les pages produits du PrestaShop externe (livres,
-- jeux de cartes, autres). Le site lui-même ne gère pas de panier
-- ni de paiement : on stocke juste des liens enrichis (titre,
-- visuel, description, prix indicatif, URL).
-- À exécuter UNE SEULE FOIS sur la BDD via PhpMyAdmin.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `shop_items` (
  `id`            CHAR(36)      NOT NULL DEFAULT (UUID()),
  `category`      VARCHAR(20)   NOT NULL DEFAULT 'book',
  `title`         VARCHAR(255)  NOT NULL,
  `subtitle`      VARCHAR(255)  NULL DEFAULT NULL,
  `description`   TEXT          NULL DEFAULT NULL,
  `image_path`    VARCHAR(500)  NULL DEFAULT NULL,
  `external_url`  VARCHAR(500)  NULL DEFAULT NULL,
  `price_text`    VARCHAR(50)   NULL DEFAULT NULL,
  `display_order` INT           NOT NULL DEFAULT 0,
  `is_published`  TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shop_category_order` (`category`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
