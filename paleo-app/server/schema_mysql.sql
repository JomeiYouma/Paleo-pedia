-- ============================================================
-- paleo-energetique — schéma MySQL (PhpMyAdmin)
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
-- CARTELS
-- ============================================================
CREATE TABLE IF NOT EXISTS `cartels` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `created_by`     CHAR(36)      NULL DEFAULT NULL,

  -- Contenu bilingue
  `titre`          VARCHAR(512)  NOT NULL,
  `titre_en`       VARCHAR(512)  NOT NULL DEFAULT '',
  `annee`          VARCHAR(64)   NOT NULL DEFAULT '',
  `description`    LONGTEXT      NOT NULL,
  `description_en` LONGTEXT      NOT NULL,
  `exhume_par`     VARCHAR(255)  NOT NULL DEFAULT '',

  -- Localisation
  `location`       VARCHAR(255)  NOT NULL DEFAULT '',
  `location_en`    VARCHAR(255)  NOT NULL DEFAULT '',
  `lat`            DOUBLE        NULL DEFAULT NULL,
  `lng`            DOUBLE        NULL DEFAULT NULL,

  -- Médias
  `image_path`     VARCHAR(512)  NOT NULL DEFAULT '',
  `url_qr`         VARCHAR(512)  NOT NULL DEFAULT '',

  -- Dates
  `date`           DATE          NULL DEFAULT NULL,

  -- Publication
  `status`         ENUM('draft','pending_review','published','archived') NOT NULL DEFAULT 'draft',
  `visible`        TINYINT(1)    NOT NULL DEFAULT 0,
  `published_at`   DATETIME      NULL DEFAULT NULL,

  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_cartels_status`     (`status`),
  KEY `idx_cartels_created_by` (`created_by`),
  KEY `idx_cartels_visible`    (`visible`),
  FULLTEXT KEY `ft_cartels_search` (`titre`, `description`),

  CONSTRAINT `fk_cartels_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE DE JOINTURE cartel <-> categories (N-N)
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

SET FOREIGN_KEY_CHECKS = 1;
