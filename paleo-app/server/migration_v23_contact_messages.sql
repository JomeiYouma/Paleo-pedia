-- ============================================================
-- v23 — Messages du formulaire de contact
-- ------------------------------------------------------------
-- Stocke les messages soumis depuis le formulaire public /contact.
-- Couplée à l'event `contact_message.created` : si un superadmin
-- active la notif dans /app/admin/logs, chaque message envoie un
-- email au destinataire configuré (sinon, juste stockage BDD).
--
-- À exécuter une fois en local et en prod.
-- ============================================================

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `name`         VARCHAR(255)  NOT NULL,
  `email`        VARCHAR(255)  NOT NULL,
  `subject`      VARCHAR(500)  NULL DEFAULT NULL,
  `message`      TEXT          NOT NULL,
  `submitter_ip` VARCHAR(45)   NULL DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_messages_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Type d'événement pour la notification email (config gérée via /app/admin/logs).
INSERT IGNORE INTO `event_email_config` (`type`) VALUES
  ('contact_message.created');
