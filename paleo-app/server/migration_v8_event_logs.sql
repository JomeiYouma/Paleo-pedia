-- ============================================================
-- paleo-energetique — migration v8 : event logs + email config
-- ============================================================
-- Ajoute :
--   * event_logs           : journal d'audit des événements applicatifs
--   * event_email_config   : par type d'événement, configure l'envoi mail
--                            (destinataire, on/off, marquage spam)
--
-- Idempotente : peut être rejouée sans casse (CREATE TABLE IF NOT EXISTS).
-- ============================================================

SET NAMES utf8mb4;

-- ────────────────────────────────────────────────────────────
-- EVENT_LOGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `event_logs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`         VARCHAR(64)     NOT NULL,            -- ex: cartel.published, user.created
  `actor_id`     CHAR(36)        NULL DEFAULT NULL,   -- user authentifié, NULL si anonyme/système
  `actor_email`  VARCHAR(255)    NULL DEFAULT NULL,   -- snapshot pour ne pas perdre l'info si user supprimé
  `subsite_id`  CHAR(36)         NULL DEFAULT NULL,
  `target_id`    VARCHAR(64)     NULL DEFAULT NULL,   -- id de l'entité concernée (cartel, user, etc.)
  `summary`      VARCHAR(512)    NOT NULL DEFAULT '', -- résumé lisible (titre cartel, email user...)
  `payload`      JSON            NULL,                -- détails structurés
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_logs_type`      (`type`),
  KEY `idx_event_logs_created_at` (`created_at`),
  KEY `idx_event_logs_actor`     (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- EVENT_EMAIL_CONFIG
-- ────────────────────────────────────────────────────────────
-- Une ligne par type d'événement. Les types absents = pas de mail
-- (l'event est tout de même journalisé dans event_logs).
CREATE TABLE IF NOT EXISTS `event_email_config` (
  `type`           VARCHAR(64)  NOT NULL,
  `enabled`        TINYINT(1)   NOT NULL DEFAULT 0,
  `recipient`      VARCHAR(255) NOT NULL DEFAULT '',
  `mark_as_spam`   TINYINT(1)   NOT NULL DEFAULT 0,    -- ajoute un en-tête X-Spam pour faciliter le tri
  `subject_prefix` VARCHAR(64)  NOT NULL DEFAULT '[Paléo]',
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed des types connus (désactivés par défaut, l'admin active ce qu'il veut).
-- INSERT IGNORE pour ne pas écraser une config déjà personnalisée.
INSERT IGNORE INTO `event_email_config` (`type`) VALUES
  -- Cartels
  ('cartel.created'),
  ('cartel.updated'),
  ('cartel.deleted'),
  ('cartel.published'),
  ('cartel.draft_created'),
  ('cartel.submission_pending'),       -- soumission anonyme via formulaire public
  ('cartel.submission_approved'),
  ('cartel.submission_rejected'),
  ('cartel.subsite_submitted'),        -- sous-site demande publication site principal
  ('cartel.subsite_approved'),
  ('cartel.subsite_rejected'),
  ('cartel.subsite_published'),        -- publié directement par le sous-site

  -- Sous-sites
  ('subsite.created'),
  ('subsite.updated'),
  ('subsite.deleted'),

  -- Utilisateurs
  ('user.created'),
  ('user.updated'),
  ('user.deleted'),
  ('user.assigned_subsite'),

  -- Partenaires
  ('partner.created'),
  ('partner.updated'),
  ('partner.deleted'),

  -- Catégories
  ('category.created'),
  ('category.updated'),
  ('category.deleted'),

  -- Ateliers
  ('workshop.created'),
  ('workshop.updated'),
  ('workshop.deleted');
