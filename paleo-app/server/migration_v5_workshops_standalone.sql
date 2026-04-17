-- ============================================================
-- paleo-energetique — Migration v5 Workshops (Standalone)
-- Ajout du système de gestion des ateliers (workshops)
-- 
-- À exécuter UNE SEULE FOIS sur la BDD existante
-- SÛRE : Utilise CREATE TABLE IF NOT EXISTS (idempotente)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLE: WORKSHOPS
-- Représente un atelier d'organisation des cartels
-- ============================================================
CREATE TABLE IF NOT EXISTS `workshops` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `name`         VARCHAR(255)  NOT NULL,
  `is_immersive` TINYINT(1)    NOT NULL DEFAULT 0,
  `created_by`   CHAR(36)      NULL DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workshops_name` (`name`),
  CONSTRAINT `fk_workshops_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: WORKSHOP_CARTELS
-- Jointure N-N entre workshops et cartels
-- Un cartel peut appartenir à plusieurs ateliers
-- Un atelier peut contenir plusieurs cartels
-- ============================================================
CREATE TABLE IF NOT EXISTS `workshop_cartels` (
  `workshop_id` CHAR(36) NOT NULL,
  `cartel_id`   CHAR(36) NOT NULL,
  `added_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workshop_id`, `cartel_id`),
  KEY `idx_wc_cartel` (`cartel_id`),
  CONSTRAINT `fk_wc_workshop`
    FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_wc_cartel`
    FOREIGN KEY (`cartel_id`) REFERENCES `cartels` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INDICE(S) SUPPLÉMENTAIRE(S) POUR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS `idx_workshops_created_by` ON `workshops` (`created_by`);
CREATE INDEX IF NOT EXISTS `idx_workshop_cartels_workshop` ON `workshop_cartels` (`workshop_id`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- NOTES D'EXÉCUTION
-- ============================================================
-- 1. Cette migration est idempotente (sans risque si exécutée 2x)
-- 2. Les tables workflows et workshop_cartels sont créées si absentes
-- 3. Les clés étrangères garantissent l'intégrité des données
-- 4. Suppression en cascade (ON DELETE CASCADE) : 
--    - Supprimer un workshop → supprime ses associations cartels
--    - Supprimer un cartel → le retire de tous ses workshops
-- 5. UNIQUE sur workshops.name : évite les doublons d'ateliers
-- ============================================================
