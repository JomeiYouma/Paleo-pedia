-- ============================================================
-- v18 — Notes admin et page "En savoir plus" éditable par cartel
-- ------------------------------------------------------------
-- 1. Nouvelle table `cartel_notes` : liste de notes datées et
--    signées (auteur, timestamp) visible uniquement par les admins.
-- 2. Colonnes `details_blocks` et `use_internal_details` sur
--    `cartels` : page détail éditable par blocs JSON (même format
--    que `subsites.content_blocks`). Quand `use_internal_details=1`,
--    le bouton "En savoir plus" et le QR pointent vers `/cartel/:id`
--    au lieu de `url_qr`.
--
-- À exécuter une fois en local et en prod.
-- ============================================================

ALTER TABLE `cartels`
  ADD COLUMN `details_blocks`       LONGTEXT   NULL DEFAULT NULL AFTER `url_qr`,
  ADD COLUMN `use_internal_details` TINYINT(1) NOT NULL DEFAULT 0 AFTER `details_blocks`;

CREATE TABLE IF NOT EXISTS `cartel_notes` (
  `id`            CHAR(36)     NOT NULL DEFAULT (UUID()),
  `cartel_id`     CHAR(36)     NOT NULL,
  `author_id`     CHAR(36)     NULL DEFAULT NULL,
  `author_email`  VARCHAR(255) NOT NULL DEFAULT '',
  `body`          LONGTEXT     NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cartel_notes_cartel` (`cartel_id`, `created_at`),
  CONSTRAINT `fk_cartel_notes_cartel`
    FOREIGN KEY (`cartel_id`) REFERENCES `cartels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cartel_notes_author`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
