-- ============================================================
-- v22 — Candidatures aux missions (formulaire /participer)
-- ------------------------------------------------------------
-- Stocke les candidatures soumises depuis le formulaire public en
-- bas de /participer (« Postuler à une mission »).
--
-- Couplée à l'event `mission_application.created` (insert dans
-- event_email_config) : si un superadmin active la notif dans
-- l'admin du journal d'événements, chaque candidature envoie un
-- email au destinataire configuré.
--
-- À exécuter une fois en local et en prod.
-- ============================================================

CREATE TABLE IF NOT EXISTS `mission_applications` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `name`         VARCHAR(255)  NOT NULL,
  `email`        VARCHAR(255)  NOT NULL,
  `mission_id`   CHAR(36)      NULL DEFAULT NULL,           -- FK vers missions ; NULL si la mission a été supprimée
  `knowledge`    TEXT          NULL DEFAULT NULL,           -- « Vos connaissances » — texte libre
  `submitter_ip` VARCHAR(45)   NULL DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mission_applications_mission` (`mission_id`, `created_at`),
  CONSTRAINT `fk_mission_applications_mission`
    FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Type d'événement pour la notification email (config gérée via /app/admin/logs).
INSERT IGNORE INTO `event_email_config` (`type`) VALUES
  ('mission_application.created');
