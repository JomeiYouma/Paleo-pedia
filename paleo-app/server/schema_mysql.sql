-- ============================================================
-- paleo-energetique — schéma MySQL canonique (PhpMyAdmin)
-- ------------------------------------------------------------
-- Source de vérité unique du schéma BDD (toutes migrations
-- v2 → v15 fusionnées, déjà appliquées en prod). Utilisable
-- tel quel pour bootstrapper une nouvelle base.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  `email`               VARCHAR(255)  NOT NULL,
  `password_hash`       VARCHAR(255)  NOT NULL,
  `role`                ENUM('contributor','editor','admin','superadmin') NOT NULL DEFAULT 'contributor',
  `can_create_cartel`   TINYINT(1)    NOT NULL DEFAULT 1,
  `can_publish_cartel`  TINYINT(1)    NOT NULL DEFAULT 0,
  `can_manage_admin`    TINYINT(1)    NOT NULL DEFAULT 0,
  `can_create_subsite`  TINYINT(1)    NOT NULL DEFAULT 0,
  `can_manage_team`     TINYINT(1)    NOT NULL DEFAULT 0,
  `home_subsite_id`     CHAR(36)      NULL DEFAULT NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id`          VARCHAR(64)   NOT NULL,        -- ex: "eolien", "hydraulique"
  `name`        VARCHAR(255)  NOT NULL,
  `name_en`     VARCHAR(255)  NOT NULL DEFAULT '',
  `description` TEXT          NOT NULL,
  `color`       VARCHAR(16)   NOT NULL DEFAULT '#888888',
  `icon`        VARCHAR(64)   NOT NULL DEFAULT '',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed catégories initiales
INSERT IGNORE INTO `categories` (`id`, `name`, `name_en`, `description`, `color`, `icon`) VALUES
  ('biomasse',    'Biomasse',            'Biomass',          'Bois, charbon, biocarburants',   '#8B4513', 'Flame'),
  ('eolien',      'Énergie Éolienne',    'Wind power',       'Moulins à vent et turbines',     '#87CEEB', 'Wind'),
  ('geothermie',  'Géothermie',          'Geothermal',       'Chaleur souterraine',            '#DC143C', 'ThermometerSun'),
  ('hydraulique', 'Énergie Hydraulique', 'Hydraulic energy', 'Moulins à eau, barrages',        '#4169E1', 'Waves'),
  ('solaire',     'Énergie Solaire',     'Solar energy',     'Innovations solaires',           '#FFD700', 'Sun'),
  ('agriculture', 'Agriculture',         'Agriculture',      'Techniques agricoles anciennes', '#6B8E23', 'Sprout'),
  ('mecanique',   'Mécanique',           'Mechanics',        'Machines et engrenages',         '#8B7355', 'Settings'),
  ('thermique',   'Thermique',           'Thermal energy',   'Chaleur et combustion',          '#FF6347', 'Flame2');

-- ============================================================
-- SUBSITES (multi-tenant)
-- ============================================================
-- Un subsite est lié à UNE source (XOR appliqué côté applicatif) :
--   - category_id (mode catégorie) → cartels curés via cartels.subsite_id
--   - workshop_id (mode atelier)   → cartels = membres de l'atelier (vue live)
-- Note : la FK workshop_id est ajoutée plus bas (après la déclaration de
-- la table workshops) car celle-ci est créée après subsites.
CREATE TABLE IF NOT EXISTS `subsites` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `slug`           VARCHAR(64)   NOT NULL,
  `name`           VARCHAR(255)  NOT NULL,
  `category_id`    VARCHAR(64)   NULL DEFAULT NULL,
  `workshop_id`    CHAR(36)      NULL DEFAULT NULL,
  `primary_color`  VARCHAR(16)   NOT NULL DEFAULT '#D65A5A',
  `planet_type`    VARCHAR(16)   NULL DEFAULT NULL,        -- vitrine pedia : wind|forest|solar|rocky|icy|lush (NULL = auto)
  `logo_path`      VARCHAR(512)  NULL DEFAULT NULL,
  `content_blocks` LONGTEXT      NULL DEFAULT NULL,      -- JSON array de blocs (FR)
  `content_blocks_en` LONGTEXT   NULL DEFAULT NULL,      -- JSON array de blocs (EN, optionnel — fallback FR)
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subsites_slug` (`slug`),
  KEY `idx_subsite_workshop` (`workshop_id`),
  CONSTRAINT `fk_subsite_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK users.home_subsite_id → subsites.id (déclarée ici car subsites doit exister)
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_subsite`
    FOREIGN KEY (`home_subsite_id`) REFERENCES `subsites` (`id`) ON DELETE SET NULL;

-- ============================================================
-- CARTELS
-- ============================================================
CREATE TABLE IF NOT EXISTS `cartels` (
  `id`                   CHAR(36)      NOT NULL DEFAULT (UUID()),
  `subsite_id`           CHAR(36)      NULL DEFAULT NULL,        -- NULL = site principal
  `created_by`           CHAR(36)      NULL DEFAULT NULL,

  -- Contenu bilingue
  `titre`                VARCHAR(512)  NOT NULL,
  `titre_en`             VARCHAR(512)  NOT NULL DEFAULT '',
  `annee`                VARCHAR(64)   NOT NULL DEFAULT '',
  `description`          LONGTEXT      NOT NULL,
  `description_en`       LONGTEXT      NOT NULL,
  `exhume_par`           VARCHAR(255)  NOT NULL DEFAULT '',

  -- Localisation
  `location`             VARCHAR(255)  NOT NULL DEFAULT '',
  `location_en`          VARCHAR(255)  NOT NULL DEFAULT '',
  `lat`                  DOUBLE        NULL DEFAULT NULL,
  `lng`                  DOUBLE        NULL DEFAULT NULL,

  -- Médias
  `image_path`           VARCHAR(512)  NOT NULL DEFAULT '',
  `image_credit`         TEXT          NULL,
  `url_qr`               VARCHAR(512)  NOT NULL DEFAULT '',

  -- Page "En savoir plus" éditable par blocs (JSON)
  `details_blocks`       LONGTEXT      NULL DEFAULT NULL,
  `use_internal_details` TINYINT(1)    NOT NULL DEFAULT 0,        -- bouton/QR → /cartel/:id

  -- Dates
  `date`                 DATE          NULL DEFAULT NULL,

  -- Publication
  `status`               ENUM('draft','pending_review','published','archived') NOT NULL DEFAULT 'draft',
  `visible`              TINYINT(1)    NOT NULL DEFAULT 0,
  `visible_on_main`      TINYINT(1)    NOT NULL DEFAULT 0,       -- validé par superadmin
  `submitted_to_main_at` DATETIME      NULL DEFAULT NULL,        -- file d'attente sous-site → principal
  `published_at`         DATETIME      NULL DEFAULT NULL,

  -- Soumissions anonymes
  `submitter_ip`         VARCHAR(45)   NULL DEFAULT NULL,
  `submitter_contact`    VARCHAR(255)  NULL DEFAULT NULL,        -- email/tel laissé par visiteur

  `created_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_cartels_status`     (`status`),
  KEY `idx_cartels_created_by` (`created_by`),
  KEY `idx_cartels_visible`    (`visible`),
  KEY `idx_cartels_subsite`    (`subsite_id`),
  KEY `idx_cartels_main_feed`  (`visible_on_main`, `status`, `submitted_to_main_at`),
  FULLTEXT KEY `ft_cartels_search` (`titre`, `description`),

  CONSTRAINT `fk_cartels_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_cartels_subsite`
    FOREIGN KEY (`subsite_id`) REFERENCES `subsites` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CARTEL_NOTES — notes admin internes (datées, signées)
-- ============================================================
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

-- ============================================================
-- JOINTURE cartel <-> categories (N-N)
-- ============================================================
CREATE TABLE IF NOT EXISTS `cartel_categories` (
  `cartel_id`   CHAR(36)    NOT NULL,
  `category_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`cartel_id`, `category_id`),
  CONSTRAINT `fk_cc_cartel`
    FOREIGN KEY (`cartel_id`)   REFERENCES `cartels`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cc_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WORKSHOPS (regroupement de cartels)
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
  KEY `idx_workshops_created_by` (`created_by`),
  CONSTRAINT `fk_workshops_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK subsites.workshop_id → workshops.id (déclarée ici car workshops doit exister)
ALTER TABLE `subsites`
  ADD CONSTRAINT `fk_subsite_workshop`
    FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS `workshop_cartels` (
  `workshop_id` CHAR(36) NOT NULL,
  `cartel_id`   CHAR(36) NOT NULL,
  `added_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workshop_id`, `cartel_id`),
  KEY `idx_wc_cartel`            (`cartel_id`),
  KEY `idx_workshop_cartels_workshop` (`workshop_id`),
  CONSTRAINT `fk_wc_workshop`
    FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wc_cartel`
    FOREIGN KEY (`cartel_id`)   REFERENCES `cartels`   (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PARTNERS (bibliothèque globale)
-- ============================================================
CREATE TABLE IF NOT EXISTS `partners` (
  `id`               CHAR(36)     NOT NULL DEFAULT (UUID()),
  `name`             VARCHAR(255) NOT NULL,
  `logo_path`        VARCHAR(512) NULL DEFAULT NULL,
  `url`              VARCHAR(512) NULL DEFAULT NULL,
  `is_mandatory`     TINYINT(1)   NOT NULL DEFAULT 0,        -- imposé sur tous les sous-sites
  `owner_subsite_id` CHAR(36)     NULL DEFAULT NULL,         -- exclusif à un sous-site
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_partners_owner` (`owner_subsite_id`, `is_mandatory`),
  CONSTRAINT `fk_partners_owner_subsite`
    FOREIGN KEY (`owner_subsite_id`) REFERENCES `subsites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Affichage des partenaires sur les sous-sites
CREATE TABLE IF NOT EXISTS `subsite_partners` (
  `subsite_id`   CHAR(36) NOT NULL,
  `partner_id`   CHAR(36) NOT NULL,
  `partner_tier` ENUM('primary','regular') NOT NULL DEFAULT 'regular',
  `sort_order`   INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`subsite_id`, `partner_id`),
  KEY `idx_subsite_partner_tier` (`subsite_id`, `partner_tier`, `sort_order`),
  CONSTRAINT `fk_sp_subsite` FOREIGN KEY (`subsite_id`) REFERENCES `subsites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Affichage des partenaires sur le site principal
CREATE TABLE IF NOT EXISTS `site_partners` (
  `partner_id`   CHAR(36) NOT NULL,
  `partner_tier` ENUM('primary','regular') NOT NULL DEFAULT 'regular',
  `sort_order`   INT      NOT NULL DEFAULT 0,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`partner_id`),
  KEY `idx_site_partners_tier` (`partner_tier`, `sort_order`),
  CONSTRAINT `fk_site_partners_partner`
    FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SETTINGS (paramètres admin globaux)
-- ============================================================
CREATE TABLE IF NOT EXISTS `settings` (
  `key_name`   VARCHAR(64)  NOT NULL,
  `value`      TEXT         NOT NULL,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `settings` (`key_name`, `value`) VALUES
  ('allow_anonymous_submit',        'true'),
  ('max_submissions_per_ip_total',  '10'),
  ('max_submissions_per_ip_window', '3'),
  ('submission_window_minutes',     '60'),
  ('openai_key',                    ''),
  ('deepl_key',                     '');

-- ============================================================
-- EVENT_LOGS — journal d'audit + déclencheur d'emails
-- ============================================================
CREATE TABLE IF NOT EXISTS `event_logs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`         VARCHAR(64)     NOT NULL,
  `actor_id`     CHAR(36)        NULL DEFAULT NULL,
  `actor_email`  VARCHAR(255)    NULL DEFAULT NULL,
  `subsite_id`   CHAR(36)        NULL DEFAULT NULL,
  `target_id`    VARCHAR(64)     NULL DEFAULT NULL,
  `summary`      VARCHAR(512)    NOT NULL DEFAULT '',
  `payload`      JSON            NULL,
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_logs_type`       (`type`),
  KEY `idx_event_logs_created_at` (`created_at`),
  KEY `idx_event_logs_actor`      (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_email_config` (
  `type`           VARCHAR(64)  NOT NULL,
  `enabled`        TINYINT(1)   NOT NULL DEFAULT 0,
  `recipient`      VARCHAR(255) NOT NULL DEFAULT '',
  `mark_as_spam`   TINYINT(1)   NOT NULL DEFAULT 0,
  `subject_prefix` VARCHAR(64)  NOT NULL DEFAULT '[Paléo]',
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `event_email_config` (`type`) VALUES
  ('cartel.created'), ('cartel.updated'), ('cartel.deleted'), ('cartel.published'),
  ('cartel.draft_created'),
  ('cartel.submission_pending'), ('cartel.submission_approved'), ('cartel.submission_rejected'),
  ('cartel.subsite_submitted'), ('cartel.subsite_approved'), ('cartel.subsite_rejected'),
  ('cartel.subsite_published'),
  ('subsite.created'), ('subsite.updated'), ('subsite.deleted'),
  ('user.created'),    ('user.updated'),   ('user.deleted'), ('user.assigned_subsite'),
  ('partner.created'), ('partner.updated'),('partner.deleted'),
  ('category.created'),('category.updated'),('category.deleted'),
  ('workshop.created'),('workshop.updated'),('workshop.deleted'),
  ('mission_application.created'),
  ('contact_message.created'),
  -- v30 — audit complet du journal : actions auth/sécurité, réglages, import,
  -- et CRUD de contenu (presse, missions, prestations, boutique, équipe, notes)
  -- jusque-là non journalisés. (password_changed/password_reset : émis depuis le
  -- durcissement sécurité mais jamais seedés auparavant.)
  ('auth.login'), ('auth.login_failed'), ('auth.locked_out'), ('auth.register'),
  ('user.password_changed'), ('user.password_reset'),
  ('setting.updated'), ('cartel.imported'), ('event_email_config.updated'),
  ('mission.created'), ('mission.updated'), ('mission.deleted'),
  ('press_article.created'), ('press_article.updated'), ('press_article.deleted'),
  ('prestation.created'), ('prestation.updated'), ('prestation.deleted'),
  ('shop_item.created'), ('shop_item.updated'), ('shop_item.deleted'),
  ('team_member.created'), ('team_member.updated'), ('team_member.deleted'),
  ('cartel_note.created'), ('cartel_note.deleted');

-- Notifications email activées par défaut pour les messages publics (formulaire
-- /contact + « Participer au projet »). Destinataire modifiable dans l'admin
-- (Système → Journal d'événements → notifications email). Cf. migration v31.
UPDATE `event_email_config`
   SET `enabled` = 1, `recipient` = 'hello@atelier21.org'
 WHERE `type` = 'contact_message.created' AND (`recipient` = '' OR `recipient` IS NULL);

-- ============================================================
-- TEAM_MEMBERS (page À propos)
-- ============================================================
-- subsite_id : NULL = équipe du site principal, sinon équipe propre au subsite.
CREATE TABLE IF NOT EXISTS `team_members` (
  `id`            CHAR(36)      NOT NULL DEFAULT (UUID()),
  `category`      VARCHAR(20)   NOT NULL DEFAULT 'main',     -- 'main' | 'secondary' | 'community'
  `subsite_id`    CHAR(36)      NULL DEFAULT NULL,
  `name`          VARCHAR(255)  NOT NULL,
  `role`          VARCHAR(255)  NULL DEFAULT NULL,
  `role_en`       VARCHAR(255)  NULL DEFAULT NULL,
  `bio`           TEXT          NULL DEFAULT NULL,
  `bio_en`        TEXT          NULL DEFAULT NULL,
  `photo_path`    VARCHAR(500)  NULL DEFAULT NULL,
  `url_linkedin`  VARCHAR(500)  NULL DEFAULT NULL,
  `url_website`   VARCHAR(500)  NULL DEFAULT NULL,
  `url_other`     VARCHAR(500)  NULL DEFAULT NULL,
  `display_order` INT           NOT NULL DEFAULT 0,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_team_category` (`category`, `display_order`),
  KEY `idx_team_subsite`  (`subsite_id`, `category`, `display_order`),
  CONSTRAINT `fk_team_subsite`
    FOREIGN KEY (`subsite_id`) REFERENCES `subsites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRESS_ARTICLES (page /presse)
-- ============================================================
CREATE TABLE IF NOT EXISTS `press_articles` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `title`          VARCHAR(500)  NOT NULL,
  `title_en`       VARCHAR(500)  NULL DEFAULT NULL,
  `source`         VARCHAR(255)  NULL DEFAULT NULL,            -- nom propre, non traduit
  `published_date` DATE          NULL DEFAULT NULL,
  `url`            VARCHAR(500)  NULL DEFAULT NULL,
  `thumbnail_path` VARCHAR(500)  NULL DEFAULT NULL,
  `excerpt`        TEXT          NULL DEFAULT NULL,
  `excerpt_en`     TEXT          NULL DEFAULT NULL,
  `display_order`  INT           NOT NULL DEFAULT 0,
  `is_published`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_press_publish` (`is_published`, `published_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MISSIONS (page /participer — appels à participation thématiques)
-- ============================================================
CREATE TABLE IF NOT EXISTS `missions` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `theme`          VARCHAR(120)  NOT NULL,
  `name`           VARCHAR(255)  NOT NULL,
  `name_en`        VARCHAR(255)  NULL DEFAULT NULL,
  `text`           TEXT          NULL DEFAULT NULL,
  `text_en`        TEXT          NULL DEFAULT NULL,
  `link_url`       VARCHAR(500)  NULL DEFAULT NULL,
  `link_label`     VARCHAR(255)  NULL DEFAULT NULL,
  `display_order`  INT           NOT NULL DEFAULT 0,
  `is_published`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_missions_publish` (`is_published`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MISSION_APPLICATIONS (candidatures soumises depuis /participer)
-- ============================================================
CREATE TABLE IF NOT EXISTS `mission_applications` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `name`         VARCHAR(255)  NOT NULL,
  `email`        VARCHAR(255)  NOT NULL,
  `mission_id`   CHAR(36)      NULL DEFAULT NULL,
  `knowledge`    TEXT          NULL DEFAULT NULL,
  `submitter_ip` VARCHAR(45)   NULL DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mission_applications_mission` (`mission_id`, `created_at`),
  CONSTRAINT `fk_mission_applications_mission`
    FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONTACT_MESSAGES (messages du formulaire /contact)
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

-- ============================================================
-- PRESTATIONS (page /prestations)
-- ============================================================
CREATE TABLE IF NOT EXISTS `prestations` (
  `id`               CHAR(36)      NOT NULL DEFAULT (UUID()),
  `title`            VARCHAR(255)  NOT NULL,
  `title_en`         VARCHAR(255)  NULL DEFAULT NULL,
  `intro`            TEXT          NULL DEFAULT NULL,
  `intro_en`         TEXT          NULL DEFAULT NULL,
  `description`      TEXT          NULL DEFAULT NULL,
  `description_en`   TEXT          NULL DEFAULT NULL,
  `bullet_points`    TEXT          NULL DEFAULT NULL,
  `bullet_points_en` TEXT          NULL DEFAULT NULL,
  `image_path`       VARCHAR(500)  NULL DEFAULT NULL,
  `partners_image_path` VARCHAR(500) NULL DEFAULT NULL,          -- bandeau logos partenaires (optionnel)
  `icon_name`        VARCHAR(50)   NULL DEFAULT NULL,            -- clé Lucide
  `pdf_path`         VARCHAR(500)  NULL DEFAULT NULL,
  `pdf_label`        VARCHAR(255)  NULL DEFAULT NULL,
  `pdf_label_en`     VARCHAR(255)  NULL DEFAULT NULL,
  `display_order`    INT           NOT NULL DEFAULT 0,
  `is_published`     TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prestations_publish` (`is_published`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SHOP_ITEMS (liens vers PrestaShop externe — page /ouvrages)
-- ============================================================
CREATE TABLE IF NOT EXISTS `shop_items` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `category`       VARCHAR(20)   NOT NULL DEFAULT 'book',
  `title`          VARCHAR(255)  NOT NULL,
  `title_en`       VARCHAR(255)  NULL DEFAULT NULL,
  `subtitle`       VARCHAR(255)  NULL DEFAULT NULL,
  `subtitle_en`    VARCHAR(255)  NULL DEFAULT NULL,
  `description`    TEXT          NULL DEFAULT NULL,
  `description_en` TEXT          NULL DEFAULT NULL,
  `image_path`     VARCHAR(500)  NULL DEFAULT NULL,
  `external_url`   VARCHAR(500)  NULL DEFAULT NULL,
  `price_text`     VARCHAR(50)   NULL DEFAULT NULL,
  `display_order`  INT           NOT NULL DEFAULT 0,
  `is_published`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shop_category_order` (`category`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
