-- ============================================================
-- paleo-energetique — Migration v2
-- À exécuter UNE SEULE FOIS sur la BDD existante via PhpMyAdmin
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. Ajout colonne submitter_ip sur cartels
--    (enregistre l'IP des soumissions anonymes)
-- ============================================================
ALTER TABLE `cartels`
  ADD COLUMN IF NOT EXISTS `submitter_ip` VARCHAR(45) NULL DEFAULT NULL
  AFTER `published_at`;

-- ============================================================
-- 2. TABLE SETTINGS
--    Paramètres configurables par l'admin
-- ============================================================
CREATE TABLE IF NOT EXISTS `settings` (
  `key_name`   VARCHAR(64)  NOT NULL,
  `value`      TEXT         NOT NULL,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valeurs par défaut
INSERT IGNORE INTO `settings` (`key_name`, `value`) VALUES
  ('allow_anonymous_submit',        'true'),
  ('max_submissions_per_ip_total',  '10'),
  ('max_submissions_per_ip_window', '3'),
  ('submission_window_minutes',     '60'),
  ('openai_key',                    '');

-- ============================================================
-- 3. TABLE WORKSHOPS
-- ============================================================
CREATE TABLE IF NOT EXISTS `workshops` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `name`         VARCHAR(255)  NOT NULL,
  `is_immersive` TINYINT(1)   NOT NULL DEFAULT 0,
  `created_by`   CHAR(36)     NULL DEFAULT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_workshops_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLE DE JOINTURE workshop <-> cartels (N-N)
-- ============================================================
CREATE TABLE IF NOT EXISTS `workshop_cartels` (
  `workshop_id` CHAR(36) NOT NULL,
  `cartel_id`   CHAR(36) NOT NULL,
  `added_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workshop_id`, `cartel_id`),
  CONSTRAINT `fk_wc_workshop`
    FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wc_cartel`
    FOREIGN KEY (`cartel_id`)   REFERENCES `cartels`   (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
