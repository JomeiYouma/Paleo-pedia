/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: cartel_categories
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cartel_categories` (
  `cartel_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`cartel_id`, `category_id`),
  KEY `fk_cc_category` (`category_id`),
  CONSTRAINT `fk_cc_cartel` FOREIGN KEY (`cartel_id`) REFERENCES `cartels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cc_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: cartels
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cartels` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titre` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titre_en` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `annee` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_en` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exhume_par` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `location_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `image_path` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `url_qr` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `date` date DEFAULT NULL,
  `status` enum('draft', 'pending_review', 'published', 'archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `visible` tinyint(1) NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `submitter_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cartels_status` (`status`),
  KEY `idx_cartels_created_by` (`created_by`),
  KEY `idx_cartels_visible` (`visible`),
  FULLTEXT KEY `ft_cartels_search` (`titre`, `description`),
  CONSTRAINT `fk_cartels_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: categories
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categories` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#888888',
  `icon` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: partners
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `partners` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_path` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: settings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `settings` (
  `key_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: subsite_partners
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `subsite_partners` (
  `subsite_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`subsite_id`, `partner_id`),
  KEY `fk_sp_partner` (`partner_id`),
  CONSTRAINT `fk_sp_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_subsite` FOREIGN KEY (`subsite_id`) REFERENCES `subsites` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: subsites
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `subsites` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `slug` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `primary_color` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#D65A5A',
  `logo_path` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_blocks` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subsites_slug` (`slug`),
  KEY `fk_subsite_category` (`category_id`),
  CONSTRAINT `fk_subsite_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('contributor', 'editor', 'admin', 'superadmin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contributor',
  `can_create_cartel` tinyint(1) NOT NULL DEFAULT '1',
  `can_publish_cartel` tinyint(1) NOT NULL DEFAULT '0',
  `can_manage_admin` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `can_create_subsite` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workshop_cartels
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workshop_cartels` (
  `workshop_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cartel_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workshop_id`, `cartel_id`),
  KEY `fk_wc_cartel` (`cartel_id`),
  CONSTRAINT `fk_wc_cartel` FOREIGN KEY (`cartel_id`) REFERENCES `cartels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wc_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workshops
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workshops` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_immersive` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_workshops_user` (`created_by`),
  CONSTRAINT `fk_workshops_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: cartel_categories
# ------------------------------------------------------------

INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730409943', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730512979', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730758337', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730830604', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730960989', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731173413', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731250077', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731336556', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731518215', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731577994', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732203380', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732303364', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732419681', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732724065', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732907689', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733013715', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733212020', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733391687', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733614056', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770734209046', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770735650535', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770735861232', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770893822475', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770893896065', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894203868', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894566342', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894683422', 'agriculture');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896982437', 'biomimetisme');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896734716', 'deplacement');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896826445', 'deplacement');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896982437', 'eclairage');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897082104', 'eclairage');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733678753', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894016574', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894366397', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896734716', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896826445', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897082104', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897255323', 'electricite');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730409943', 'eolien');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730646469', 'eolien');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733391687', 'eolien');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733532105', 'eolien');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770743857350', 'eolien');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897178577', 'eolien');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730512979', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730646469', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730758337', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730830604', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731173413', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731250077', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731336556', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731440080', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731518215', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731577994', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732203380', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733013715', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733137581', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733277290', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733614056', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733678753', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770734209046', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770735959605', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770828306711', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894366397', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894566342', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894683422', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896634074', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897178577', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770988001177', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770988261628', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770988552186', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770995246192', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1771240444443', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1771320250808', 'h2o');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894366397', 'hydrogene');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894016574', 'imaginaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894366397', 'imaginaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894485841', 'imaginaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770895210808', 'imaginaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897255323', 'imaginaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894485841', 'isolation-thermique');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770893822475', 'mecanique');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894127884', 'mecanique');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730646469', 'rafraichir');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733532105', 'rafraichir');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733787722', 'rafraichir');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770988001177', 'rafraichir');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770731727033', 'rechauffer');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770733137581', 'rechauffer');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894817463', 'rechauffer');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770988261628', 'rechauffer');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770730830604', 'sante');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896539288', 'sante');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732851344', 'solaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770732907689', 'solaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770828419501', 'solaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770894817463', 'solaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770895210808', 'solaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770896634074', 'solaire');
INSERT INTO
  `cartel_categories` (`cartel_id`, `category_id`)
VALUES
  ('1770897255323', 'solaire');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: cartels
# ------------------------------------------------------------

INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770720854050',
    NULL,
    'tests 333',
    '',
    '2025',
    '',
    '',
    '',
    '',
    '',
    NULL,
    NULL,
    '',
    '',
    '2026-02-10',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-10 10:54:14',
    '2026-02-10 10:54:14'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770730409943',
    NULL,
    'LES ÉOLIENNES IRANIENNES DE NASHTIFAN',
    'IRANIAN WIND TURBINES IN NASHTIFAN',
    '900 av JC',
    'Situé dans la région de Khorasan, au Nord-Est de l’IRAN, le petit village de Nashtifan est balayé par des vents très forts. Il y a plus de mille ans, les Perses locaux y ont utilisé les matériaux locaux comme l’argile, la paille et le bois pour construire un véritable village de moulins à vent à axes verticaux. \n\nMontés sur des bâtiments au design futuristes dignes des meilleurs planches du dessinateur Enki Bilal, ces éoliennes permettent de moudre le grain et de tirer de l’eau, d’exploiter la force mécanique des vents locaux. \n\nBien qu’ils aient été utilisés pendant des siècles, certains moulins éoliens certainement les plus low tech au monde sont encore en bon état et fonctionnent toujours. \nIl est possible de les voir en fonctionnement sur la vidéo BBC mise en ligne sur le site web paleo-energetique.org',
    'Located in the Khorasan region in northeastern Iran, the small village of Nashtifan is swept by very strong winds. Over a thousand years ago, the local Persians used local materials such as clay, straw, and wood to build a veritable village of vertical-axis windmills. \n\nMounted on futuristic buildings worthy of the best drawings by artist Enki Bilal, these wind turbines grind grain and draw water, harnessing the mechanical force of local winds. \n\nAlthough they have been in use for centuries, some of the world\'s most low-tech windmills are still in good condition and still working. You can see them in action in the BBC video posted on the paleo-energetique.org website.',
    'Yann Webb et Nicolas Duc',
    'Nashtifan',
    'Good morning',
    34.4337222,
    60.1777943,
    'images/IMG_3575.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:32:47',
    '2026-02-10 13:32:47'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770730512979',
    NULL,
    'JOHAD, SYSTÈME DE COLLECTE DES PLUIES',
    'JOHAD, RAINWATER HARVESTING SYSTEM',
    '1500 av JC',
    'Les johads sont de petits barrages en terre construits à travers des canaux saisonniers pour capter et stocker les eaux de pluie durant la mousson. L\'eau ainsi collectée s\'infiltre progressivement dans le sol, rechargeant les nappes phréatiques et assurant une disponibilité en eau pour les puits, l\'irrigation agricole et les besoins domestiques tout au long de l\'année. Ce système a été largement utilisé dans des régions arides telles que le Rajasthan, contribuant à la résilience des communautés face aux sécheresses.\n\nCes systèmes sont construits avec des matériaux locaux tels que la terre et la pierre, en utilisant des techniques accessibles aux communautés rurales. Ils renforcent les ressources en eau locales sans dépendre de technologies modernes ou d\'infrastructures coûteuses. En améliorant la recharge des nappes phréatiques, ces solutions soutiennent l’agriculture locale et contribuent à limiter l’exode rural en assurant la sécurité hydrique.',
    'Johads are small earthen dams built across seasonal channels to capture and store rainwater during the monsoon season. The water collected gradually seeps into the ground, recharging aquifers and ensuring water availability for wells, agricultural irrigation, and domestic needs throughout the year. This system has been widely used in arid regions such as Rajasthan, contributing to the resilience of communities in the face of droughts.\n\nThese systems are built with local materials such as earth and stone, using techniques accessible to rural communities. They strengthen local water resources without relying on modern technologies or costly infrastructure. By improving groundwater recharge, these solutions support local agriculture and help limit rural exodus by ensuring water security.',
    'Loic Rogard',
    'Rajasthan',
    'Rajasthan',
    26.8105777,
    73.7684549,
    'images/IMG_3510.jpg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:35:12',
    '2026-02-10 13:35:12'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770730646469',
    NULL,
    'BADGUIR TOUR DU VENT',
    'BADGUIR WIND TURBINE',
    'XIII av JC',
    'Le Badguir est une tour traditionnelle d\'architecture persane utilisée depuis des siècles pour créer une ventilation naturelle dans les bâtiments.\n\nOn pense que ce capteur de vent fonctionne grâce à la faible différence de pression entre la base et le sommet à l\'intérieur de la colonne. Ainsi, à chaque fois qu\'un faible souffle de vent passe au travers du sommet du badguir (on ne sent pas la différence à la base de la colonne), la différence de pression aide à remonter l\'air chaud vers le sommet et à amener de l\'air frais vers le bas de la colonne. L\'effet d\'accumulation sur une période de 24 heures est notable.\n',
    'The Badguir is a traditional Persian architectural tower that has been used for centuries to create natural ventilation in buildings. It is believed that this wind collector works thanks to the slight difference in pressure between the base and the top inside the column. Thus, whenever a slight breeze passes through the top of the badguir (the difference is not felt at the base of the column), the pressure difference helps to draw warm air up to the top and bring cool air down to the bottom of the column. The cumulative effect over a 24-hour period is significant. ',
    'Dehghan Kamaragi',
    'Empire Perse',
    'Empire Perse',
    29.6175265,
    52.519699,
    'images/IMG_3574.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:37:26',
    '2026-02-10 13:37:26'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770730758337',
    NULL,
    'LES QANATS',
    'The Wells',
    'XX Siecle av JC',
    'Les qanats sont des systèmes d’irrigation souterrains développés il y a plus de 2 000 ans en Iran, au Moyen-Orient et en Afrique du Nord. Ce procédé permet d’acheminer l’eau des nappes phréatiques vers les zones habitées et agricoles sans pompage ni perte excessive par évaporation.\n\nCe système repose sur un réseau de galeries souterraines inclinées, creusées à la main, qui collectent l’eau et la guident par gravité sur de longues distances. Il permet d’alimenter les villes et les cultures, même dans des régions arides, en minimisant les pertes et en évitant la surexploitation des ressources.\n\nAujourd’hui, certaines communautés utilisent encore les qanats, et leur principe inspire de nouvelles approches en gestion durable de l’eau. Des projets contemporains s’appuient sur cette technologie pour favoriser une distribution écologique et résiliente des ressources en eau, notamment dans les régions touchées par la sécheresse.',
    'Qanats are underground irrigation systems developed over 2,000 years ago in Iran, the Middle East, and North Africa. This process allows water from aquifers to be transported to inhabited and agricultural areas without pumping or excessive evaporation losses.\n\nThe system is based on a network of sloping underground tunnels, dug by hand, which collect water and guide it by gravity over long distances. It supplies cities and crops, even in arid regions, while minimizing losses and avoiding overexploitation of resources.\n\nToday, some communities still use qanats, and their principle inspires new approaches to sustainable water management. Contemporary projects rely on this technology to promote ecological and resilient distribution of water resources, particularly in regions affected by drought.',
    'Simona Iliycheva',
    'Iran',
    'I ran',
    32.6475314,
    54.5643516,
    'images/IMG_3511.jpeg',
    'https://whc.unesco.org/en/list/1506/',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:39:18',
    '2026-02-10 13:39:18'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770730830604',
    NULL,
    'L\'INGÉNIERIE HYDRAULIQUE ROMAINE',
    'ROMAN HYDRAULIC ENGINEERING',
    'IV Avant JC',
    'L’ingénierie hydraulique romaine constitue l’un des fondements techniques de l’expansion urbaine et agricole de l’Empire. Les Romains ont conçu un réseau complexe d’ouvrages permettant la captation, le transport, le stockage et la distribution de l’eau à grande échelle. \n\nParmi les dispositifs emblématiques figurent les aqueducs gravitaires (certains longs de plus de 100 km) acheminant l’eau depuis les sources jusqu’aux cités. Celles-ci étaient ensuite desservies par un maillage de canalisations, de réservoirs (castella), de fontaines, de thermes, mais aussi de systèmes d’irrigation. \nL’usage du béton romain (opus caementicium) et l’invention du specus voûté ont permis une grande durabilité des structures. L’expertise hydraulique s’étendait également aux égouts, aux barrages (comme celui de Subiaco) et aux roues hydrauliques.\n\nCette ingénierie, à la fois pragmatique et sophistiquée, reposait sur une compréhension fine des topographies et des écoulements. Elle a durablement influencé les infrastructures hydrauliques européennes jusqu’à l’époque moderne.\n',
    'Roman hydraulic engineering was one of the technical foundations of the Empire\'s urban and agricultural expansion. The Romans designed a complex network of structures for the collection, transport, storage, and distribution of water on a large scale. \n\nAmong the most iconic structures were gravity-fed aqueducts (some over 100 km long) that carried water from its sources to cities. These cities were then served by a network of pipes, reservoirs (castella), fountains, thermal baths, and irrigation systems. \nThe use of Roman concrete (opus caementicium) and the invention of vaulted specus ensured the durability of these structures. Hydraulic expertise also extended to sewers, dams (such as the one at Subiaco), and water wheels.\n\nThis engineering, both pragmatic and sophisticated, was based on a detailed understanding of topography and water flow. It had a lasting influence on European hydraulic infrastructure until modern times. ',
    'Cédric Carles',
    'Rome',
    'Rome',
    41.8933203,
    12.4829321,
    'images/IMG_3512.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:40:30',
    '2026-02-10 13:40:30'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770730960989',
    NULL,
    'LES PAILLIS',
    'THE STRAW',
    'XVIII siècle',
    'Le paillage, consistant à recouvrir le sol de matériaux organiques tels que paille, foin, les feuilles mortes ou autour de Paris au XVIIIeme siècle, de fumier de cheval.\n\nIl s’agit d’une technique agricole utilisée depuis des siècles offrant de multiples avantages : réduction de l’évaporation de l’eau, suppression des mauvaises herbes, régulation thermique du sol et amélioration de sa structure. En se décomposant, le paillis enrichit le sol en matière organique, favorisant ainsi la biodiversité microbienne et la fertilité. Dans les régions arides, notamment en Afrique, cette méthode traditionnelle s’avère particulièrement efficace pour conserver l’humidité et protéger les cultures des conditions climatiques extrêmes.\n\nAujourd’hui, le paillage est reconnu comme une pratique agroécologique essentielle, combinant savoirs ancestraux et innovations modernes pour une agriculture durable et résiliente.',
    'Mulching consists of covering the soil with organic materials such as straw, hay, dead leaves or, around Paris in the 18th century, horse manure.\n\nIt is an agricultural technique that has been used for centuries and offers many advantages: it reduces water evaporation, suppresses weeds, regulates soil temperature, and improves soil structure. As it decomposes, mulch enriches the soil with organic matter, promoting microbial biodiversity and fertility. In arid regions, particularly in Africa, this traditional method is particularly effective in conserving moisture and protecting crops from extreme weather conditions. Today, mulching is recognized as an essential agroecological practice, combining ancestral knowledge and modern innovations for sustainable and resilient agriculture.',
    'Raphaël Luciani-Galais',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3579.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:42:40',
    '2026-02-10 13:42:40'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731173413',
    NULL,
    'SYSTÈME D’IRRIGATION PAR JARRE : OLLA OU OYA',
    'JAR IRRIGATION SYSTEM: OLLA OR OYA',
    '2000 av JC',
    'Technique ancestrale, l’origine de ce système d’irrigation remonte à plusieurs milliers d’années. L\'agronome Fan Shengzhi fait mention de l\'irrigation par jarre il y a 2 000 ans en Chine. D’autres travaux de recherches évoquent l’utilisation de cette technique d’irrigation durant l’Empire romain. \nPar la suite, cette méthode ancestrale va se répandre dans plusieurs continents, dont l’Afrique et l’Asie où elle deviendra une technique traditionnelle d’arrosage des cultures. Elle est largement utilisée aujourd’hui en Amérique latine, où elle prend son appellation « Oya » qui signifie « pot » en français.\n\nCette technique repose sur l\'utilisation d\'un pot d\'argile cuit à basse température que l\'on enterre jusqu\'au col et rempli d\'eau pour irriguer les plantes placées autour. Les parois poreuses vont peu à peu laisser s\'échapper l\'eau qui sera absorbée par les racines des plantes. L\'irrigation par jarre est une technique d\'irrigation souterraine stable et économique, particulièrement adaptée dans les zones arides, elle permet de réduire de 60 % l’utilisation d’eau. Aujourd’hui, avec une augmentation des méthodes de création de permaculture et de jardin écologique, ce système attire de plus en plus les intérêts.\n',
    'An ancient technique, the origins of this irrigation system date back several thousand years. Agronomist Fan Shengzhi mentions jar irrigation in China 2,000 years ago. Other research refers to the use of this irrigation technique during the Roman Empire. \nThis ancient method subsequently spread to several continents, including Africa and Asia, where it became a traditional technique for watering crops. It is widely used today in Latin America, where it is known as \"Oya,\" which means \"pot\" in English.\n\nThis technique involves using a low-fired clay pot that is buried up to its neck and filled with water to irrigate the plants placed around it. The porous walls gradually allow the water to escape, which is then absorbed by the plant roots. Jar irrigation is a stable and economical underground irrigation technique, particularly suitable for arid areas, reducing water use by 60%. Today, with the rise of permaculture and ecological gardening methods, this system is attracting increasing interest. ',
    'Iswann Ali Benali',
    'Chine',
    'China',
    35.000074,
    104.999927,
    'images/IMG_3580.jpeg',
    'https://www.poterie-jamet.com/nos-produits/ollas-oyas-irrigation/les-oyas-ollas-comment-ca-marche/#:~:text=L\'irrigation%20par%20une%20poterie,irriguer%20les%20plantes%20plac%C3%A9es%20autour.',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:46:13',
    '2026-02-10 13:46:13'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731250077',
    NULL,
    'Moulins-Bateaux',
    'Mills-Boats',
    '508',
    'Qui, en France, se souvient que sur nos rivières ont existé des moulins flottants et que la plupart ont disparu au milieu du XIXème siècle ? \n\nLe premier document évoquant les moulins-bateaux remonte en l\'an 508, quand Clovis autorise la fondation de l\'abbaye de Saint-Mesmin de Micy à établir des moulins-bateaux sur les rivières de Loire et du Loiret.\n\nLe moulin-bateau a l\'apparence extérieure d\'un bateau, mais il fonctionne comme un moulin à eau fixé sur le bord de la rivière, avec sa roue à aubes et ses machines pour la mouture. L’avantage du moulin à deux nefs est sa stabilité. Ce type de moulin rendait possible l’existence de ventelles servant à réguler l\'arrivée d\'eau sur la roue à aubes mais aussi de mieux contrôler la vitesse du mécanisme du moulin.\n\nLes avantages du moulin-bateau, par rapport au moulin fixe installé sur le bord des rivières est sa capacité à être déplacé, il suit les fluctuations du niveau des eaux sans dommage pour le moulin-bateau alors que le moulin fixe subit les caprices des rivières, une forte crue peut causer d\'importants dégâts, voire emporter toute la cabane et son système de meunerie, ou se trouver inactif par une baisse des eaux. ',
    'Who in France remembers that there used to be floating mills on our rivers and that most of them disappeared in the mid-19th century? \n\nThe first document mentioning boat mills dates back to 508, when Clovis authorized the foundation of the Abbey of Saint-Mesmin de Micy to establish boat mills on the Loire and Loiret rivers.\n\nThe floating mill looks like a boat from the outside, but it functions like a water mill fixed to the riverbank, with its paddle wheel and grinding machinery. The advantage of the double-hulled mill is its stability. This type of mill made it possible to use sluice gates to regulate the flow of water to the water wheel and to better control the speed of the mill mechanism. The advantages of the boat mill, compared to the fixed mill installed on the banks of rivers, are its ability to be moved, it can follow fluctuations in water levels without damage to the boat mill, whereas fixed mills are subject to the whims of rivers; heavy flooding can cause significant damage, even sweeping away the entire cabin and its milling system, or rendering it inactive when the water level drops. ',
    'Les Bateliers des Vents d\'Galerne',
    'Loiret',
    'Loiret',
    47.9138725,
    2.3075036,
    'images/IMG_3513.jpeg',
    'https://www.bateliersdesventsdgalerne.fr/',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:47:30',
    '2026-02-10 13:47:30'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731336556',
    NULL,
    'LES ACEQUIAS',
    'THE IRRIGATION DITCHES',
    'VIII av JC',
    'Les acequias, anciens canaux d\'irrigation médiévaux en Espagne, sont restaurés pour lutter contre la sécheresse due aux changements climatiques.\n\nCreusées par les Maures entre le VIIIe et le Xe siècle, ces infrastructures permettent de ralentir l\'écoulement de l\'eau et de la stocker dans les nappes phréatiques, aidant ainsi à irriguer les cultures durant les périodes sèches.\n\nEn Andalousie, des bénévoles et des chercheurs travaillent à remettre en état ces systèmes, soulignant leur importance historique et écologique pour la région.',
    'Acequias, ancient medieval irrigation channels in Spain, are being restored to combat drought caused by climate change.\n\nDug by the Moors between the 8th and 10th centuries, these infrastructures slow down the flow of water and store it in aquifers, helping to irrigate crops during dry periods. In Andalusia, volunteers and researchers are working to restore these systems, highlighting their historical and ecological importance for the region.',
    'Raphael Luciani-Galais',
    'Espagne',
    'Spain',
    39.3260685,
    -4.8379791,
    'images/IMG_3514.jpeg',
    'https://patternenergy.com/fr/les-incroyables-acequias-dalbuquerque/',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:48:56',
    '2026-02-10 13:48:56'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731440080',
    NULL,
    'HYDRO POMPE DE SAQIYA DE ISMAIL AL-JAZARI',
    'ISMAIL AL-JAZARI\'S SAQIYA WATER PUMP',
    '1206',
    'Al-Jazari est un inventeur prolifique qui a conçu de nombreuses machines pour élever l\'eau, dont des moulins à eau et des roues à eau avec des cames sur leur essieu pour faire fonctionner des automates. \n\nOn lui attribue la première utilisation connue d\'un vilebrequin dans une pompe à chaîne. Ces mécanismes ont fourni de l’eau à Damas à partir du 13ème siècle jusqu\'à l\'époque moderne et étaient utilisés dans tout le monde islamique médiéval.',
    'Al-Jazari was a prolific inventor who designed numerous machines for raising water, including water mills and water wheels with cams on their axles to operate automata. \n\nHe is credited with the first known use of a crankshaft in a chain pump. These mechanisms supplied water to Damascus from the 13th century until modern times and were used throughout the medieval Islamic world.',
    'Cindy Fiorentino',
    'Damas',
    'Damas',
    33.5130695,
    36.3095814,
    'images/IMG_3515.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:50:40',
    '2026-02-10 13:50:40'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731518215',
    NULL,
    'CHINAMPA - LES JARDINS FLOTTANTS',
    'CHINAMPA - THE FLOATING GARDENS',
    'XIII siècle',
    'La technique du chinampa est d’origine précolombienne, utilisée par les Aztèques dès le XIIIe siècle jusqu’à la conquête (XIIIe–XVIe siècles).\n\nElle consiste à créer des îlots artificiels sur des plans d’eau via un réseau de canaux. La boue, riche en nutriments, extraite de ces canaux, était utilisée pour fertiliser les îlots, qui dépassaient d’un mètre la surface de l’eau. Les semis étaient préparés avec un mélange de boue et de feuillage, et des arbres plantés en bordure limitaient l’érosion.\n\nCe système, combinant sols naturellement enrichis et gestion optimale de l’eau, permettait des récoltes abondantes sur de petites surfaces.\n\nReposant sur des matériaux et processus naturels, sans équipements énergivores, le chinampa valorise efficacement des ressources locales. Aujourd’hui, face à l’urbanisation, il offre une solution low-tech pour aménager des espaces cultivables en ville et soutenir l’approvisionnement alimentaire.',
    'The chinampa technique is of pre-Columbian origin, used by the Aztecs from the 13th century until the conquest (13th–16th centuries).\n\nIt involves creating artificial islands on bodies of water via a network of canals. Nutrient-rich mud extracted from these canals was used to fertilize the islands, which rose one meter above the water\'s surface. Seedlings were prepared with a mixture of mud and foliage, and trees planted around the edges limited erosion.\n\nThis system, combining naturally enriched soils and optimal water management, allowed for abundant harvests on small areas. Based on natural materials and processes, without energy-intensive equipment, chinampa effectively makes use of local resources. Today, in the face of urbanization, it offers a low-tech solution for developing cultivable spaces in cities and supporting food supply.',
    'Loic Rogard',
    'Colombie',
    'Colombia',
    4.099917,
    -72.9088133,
    'images/IMG_3516.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:51:58',
    '2026-02-10 13:51:58'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731577994',
    NULL,
    'LES SUIKINKUTSU, BASSINS D’INFILTRATION JAPONAIS',
    'SUIKINKUTSU, JAPANESE INFILTRATION BASINS',
    'XVII siècle',
    'Les Suikinkutsu sont des bassins d’infiltration japonais développés au XVIIe siècle, combinant gestion de l’eau et esthétique sonore dans les jardins traditionnels. Ces systèmes, souvent dissimulés sous des fontaines ou près des lavabos rituels (chōzubachi), sont constitués d’une jarre enterrée contenant une petite ouverture à sa base.\n\nLorsque l’eau s’infiltre goutte à goutte dans cette cavité, elle produit un son délicat et cristallin, amplifié par la résonance de la jarre. Au-delà de leur aspect esthétique, les Suikinkutsu permettent une drainage naturel de l’eau, évitant l’accumulation stagnante et favorisant la régénération des sols.\n\nToujours présents dans certains jardins japonais, ces dispositifs sont aujourd’hui étudiés pour leur approche durable et biomimétique de la gestion de l’eau en milieu urbain, combinant efficacité hydraulique et bien-être sensoriel.',
    'Suikinkutsu are Japanese infiltration basins developed in the 17th century, combining water management and sound aesthetics in traditional gardens. These systems, often hidden under fountains or near ritual washbasins (chōzubachi), consist of an underground jar with a small opening at its base.\n\nWhen water drips into this cavity, it produces a delicate, crystalline sound, amplified by the resonance of the jar. Beyond their aesthetic appeal, Suikinkutsu allow for natural water drainage, preventing stagnant accumulation and promoting soil regeneration.\n\nStill found in some Japanese gardens, these devices are now being studied for their sustainable and biomimetic approach to water management in urban environments, combining hydraulic efficiency with sensory well-being.',
    'Simona Iliycheva',
    'Japon',
    'Japanese',
    36.5748441,
    139.2394179,
    'images/IMG_3517.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:52:57',
    '2026-02-10 13:52:57'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770731727033',
    NULL,
    'LE STOOF VOORWERP DANS LES ŒUVRES DE VERMEER',
    'THE STOOF VOORWERP IN THE WORKS OF VERMEER',
    'XVII siècle',
    'Le célèbre maître hollandais a vécu à Delft au XVIIe siècle. C’est une ville située au niveau de la mer avec un climat très humide et froid. Dans le célèbre tableau la laitière, est représenté en bas à droite un stoof voorwerp. C’est un poêle à pied : une boîte en bois ouverte d\'un côté, avec des trous ou une dalle en haut. On y place un bol en poterie ou en métal avec du charbon de bois brûlant. Les pieds sont placés sur le dessus du poêle pour se réchauffer. En plaçant une couverture ou un vêtement sur les pieds, on peut isoler la chaleur et chauffer le bas des jambes. A la mort de Vermeer, l’inventaire de ses biens nous apprend qu’il a possédé deux stoof voorwerp…',
    'The famous Dutch master lived in Delft in the 17th century. It is a city located at sea level with a very humid and cold climate. In the famous painting The Milkmaid, a stoof voorwerp is depicted in the lower right corner. It is a foot stove: a wooden box open on one side, with holes or a slab on top. A pottery or metal bowl with burning charcoal is placed inside. The feet are placed on top of the stove to warm up. By placing a blanket or garment over the feet, the heat can be insulated and the lower legs warmed. Upon Vermeer\'s death, the inventory of his possessions reveals that he owned two stoof voorwerp...',
    'Ludovic Duhem',
    'Pays-Bas',
    'Netherlands',
    52.2434979,
    5.6343227,
    'images/IMG_3583.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 13:55:27',
    '2026-02-10 13:55:27'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770732203380',
    NULL,
    'SYSTÈME KABATA DE GESTION DE L’EAU',
    'KABATA WATER MANAGEMENT SYSTEM',
    'XVII siècle',
    'Le système Kabata repose sur l’utilisation d’eau de source naturellement filtrée par le milieu géologique. À Harie, l’eau circule à travers les habitations via un réseau de canaux et de bassins intégrés. Ce procédé assure un approvisionnement constant en eau pure pour les usages domestiques, tout en créant un microclimat : sa température stable apporte fraîcheur en été et douceur en hiver.\n\nLe système valorise aussi l’écologie locale en régulant la qualité de l’eau grâce à des bassins peuplés de carpes filtrantes.\nIl fonctionne selon des principes naturels, sans technologies énergivores ni maintenance complexe.\n\nEn exploitant les ressources locales (eau de source) et la géothermie passive (température stable de l’eau), il réduit le besoin d’équipements modernes de chauffage ou de rafraîchissement.\n\nEn favorisant une gestion raisonnée de l’eau et en limitant le gaspillage, cette technique offre une solution inspirante pour la transition énergétique et la préservation des ressources naturelles.',
    'The Kabata system relies on the use of spring water that is naturally filtered by the geological environment. In Harie, water flows through homes via a network of integrated canals and basins. This process ensures a constant supply of pure water for domestic use, while creating a microclimate: its stable temperature provides coolness in summer and warmth in winter.\n\nThe system also promotes local ecology by regulating water quality through basins populated with filter-feeding carp. It operates according to natural principles, without energy-intensive technologies or complex maintenance.\n\nBy exploiting local resources (spring water) and passive geothermal energy (stable water temperature), it reduces the need for modern heating or cooling equipment. By promoting rational water management and limiting waste, this technique offers an inspiring solution for energy transition and the preservation of natural resources.',
    'Thomas Ortiz',
    'Japon',
    'Japanese',
    36.5748441,
    139.2394179,
    'images/IMG_3518.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:03:23',
    '2026-02-10 14:03:23'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770732303364',
    NULL,
    'LE POTAGER EN CARRÉS',
    'THE SQUARE VEGETABLE GARDEN',
    'XVII siécle',
    'Issu des traditions monastiques et des jardins de curés, le potager en carrés apparaît comme une méthode d’organisation rationnelle de l’espace de culture. \nChaque carré (souvent de 1,20 m de côté) est subdivisé en parcelles plus petites, facilitant la rotation des cultures, l’association bénéfique des plantes et une gestion précise de l’arrosage et du compost. \n\nCe modèle est utilisé dès le XVIIe siècle dans les jardins aristocratiques, comme à Versailles, pour allier ordre, productivité et esthétisme.\n\nRedécouvert et popularisé dans les années 1980 par l’Américain Mel Bartholomew, il devient une réponse efficace aux besoins contemporains : gain d’espace, faible consommation d’eau, accessibilité urbaine.\nLe potager en carrés s’impose aujourd’hui comme une solution low-tech, modulable et pédagogique, adaptée à la résilience alimentaire des foyers, des écoles ou des microfermes urbaines.\n',
    'Stemming from monastic traditions and parish gardens, the square foot garden is a rational method of organizing growing space. Each square (often 1.20 m on each side) is subdivided into smaller plots, facilitating crop rotation, beneficial plant combinations, and precise management of watering and compost. \n\nThis model has been used since the 17th century in aristocratic gardens, such as Versailles, to combine order, productivity, and aesthetics. Rediscovered and popularized in the 1980s by American Mel Bartholomew, it has become an effective response to contemporary needs: space savings, low water consumption, and urban accessibility.\nThe square foot garden is now establishing itself as a low-tech, modular, and educational solution, suited to the food resilience of households, schools, and urban microfarms. ',
    'Raphael Luciani-Galais ',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3587.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:05:03',
    '2026-02-10 14:05:03'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770732419681',
    NULL,
    'ORIGINES DU MARAÎCHAGE',
    'ORIGINS OF MARKET GARDENING',
    'XVIII siècle',
    'Le terme « maraîchage » apparaît au XVIIIe siècle pour désigner l’activité des jardiniers cultivant des potagers situés sur des terrains marécageux autour de Paris.\n\nCes zones humides, progressivement asséchées, ont permis l’implantation de cultures intensives destinées à approvisionner la capitale en légumes frais.\nLes maraîchers parisiens, organisés en communautés structurées, ont développé des techniques culturales avancées, telles que l’utilisation de châssis et de cloches en verre pour protéger les cultures, et l’amendement des sols avec du fumier provenant des voiries urbaines.\n\nCette profession, transmise de génération en génération, a joué un rôle essentiel dans l’alimentation des citadins et a contribué à l’essor de l’agriculture urbaine.',
    'The term \"maraîchage\" appeared in the 18th century to describe the activity of gardeners cultivating vegetable gardens located on marshy land around Paris. These wetlands, which were gradually drained, allowed for the establishment of intensive crops intended to supply the capital with fresh vegetables.\nParisian market gardeners, organized into structured communities, developed advanced cultivation techniques, such as the use of frames and glass cloches to protect crops, and soil improvement with manure from urban roads.\n\nThis profession, passed down from generation to generation, played an essential role in feeding city dwellers and contributed to the rise of urban agriculture.',
    'Raphael Luciani-Galais ',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3586.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:06:59',
    '2026-02-10 14:06:59'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770732724065',
    NULL,
    'LA COUCHE CHAUDE AU FUMIER',
    'THE HOT MANURE LAYER',
    'XVIII siècle',
    'Avant l’apparition des serres chauffées, les maraîchers utilisaient la fermentation du fumier pour chauffer le sol. \nCette technique, appelée « couche chaude », consiste à enfouir du fumier frais (souvent de cheval) sous une couche de terre, sur laquelle on sème ou repique des plants. \n\nLa décomposition du fumier produit une chaleur constante pendant plusieurs semaines, créant un microclimat propice à la germination et à la croissance des jeunes plantes, même en hiver. \nTrès répandue dans les ceintures maraîchères de Paris ou de Londres, cette méthode low-tech permettait des cultures hors saison sans recours à l’énergie fossile. Elle allie recyclage de déchets organiques, autonomie énergétique et maîtrise fine du vivant. \n\nRedécouverte aujourd’hui par les jardiniers bio et la permaculture, la couche chaude incarne une agriculture sobre, adaptée aux défis énergétiques contemporains.',
    'Before heated greenhouses were invented, market gardeners used manure fermentation to heat the soil. This technique, known as \"hot bedding,\" involves burying fresh manure (often horse manure) under a layer of soil, on which seeds are sown or seedlings are transplanted. \n\nThe decomposition of the manure produces constant heat for several weeks, creating a microclimate conducive to germination and the growth of young plants, even in winter. \nWidely used in the market gardens around Paris and London, this low-tech method allowed crops to be grown out of season without the use of fossil fuels. It combines organic waste recycling, energy self-sufficiency, and precise control of living organisms. Rediscovered today by organic gardeners and permaculture practitioners, hotbeds embody a simple form of agriculture that is well-suited to contemporary energy challenges.',
    'Raphael Luciani-Galais ',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3588.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:12:04',
    '2026-02-10 14:12:04'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770732851344',
    NULL,
    'LES CLOCHES DE JARDIN',
    'GARDEN BELLS',
    'XVIII',
    'Avant l’invention des serres modernes, les jardiniers utilisaient des cloches de jardin (des structures en verre épais, hémisphériques ou coniques) pour créer un microclimat favorable à la croissance des plantes. En captant la chaleur solaire et en la conservant durant la nuit, ces dispositifs passifs protégeaient semis et jeunes plants du froid, tout en accélérant leur développement. \n\nTrès répandues au XVIIIe et XIXe siècle en Europe, notamment dans les potagers royaux ou monastiques, elles permettaient une production maraîchère précoce, sans apport énergétique extérieur. \nFabriquées artisanalement, souvent soufflées à la bouche, les cloches représentaient une solution low-tech efficace pour prolonger la saison agricole, aujourd’hui réhabilitée dans des démarches de permaculture ou de sobriété énergétique. \n\nElles rappellent que la maîtrise fine des cycles naturels et des ressources locales a longtemps permis une agriculture résiliente face aux aléas climatiques.',
    'Before the invention of modern greenhouses, gardeners used garden cloches (thick glass structures, hemispherical or conical in shape) to create a microclimate conducive to plant growth. By capturing solar heat and retaining it during the night, these passive devices protected seedlings and young plants from the cold, while accelerating their development. \n\nWidely used in 18th- and 19th-century Europe, particularly in royal and monastic vegetable gardens, they enabled early vegetable production without the need for external energy sources. \nHandcrafted, often mouth-blown, the cloches were an effective low-tech solution for extending the agricultural season, now rehabilitated in permaculture and energy efficiency initiatives. They remind us that a detailed understanding of natural cycles and local resources has long enabled agriculture to remain resilient in the face of climatic hazards.',
    'Cédric Carles',
    'Europe',
    'Europe',
    51,
    10,
    'images/IMG_3589.jpeg',
    'https://potagersdantan.com/2021/09/11/les-cloches-de-jardin/',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:14:11',
    '2026-02-10 14:14:11'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770732907689',
    NULL,
    'CULTURE SOUS CHÂSSIS',
    'CULTIVATION UNDER FRAME',
    '1780',
    'Vers 1780, dans les environs de Paris, un maraîcher nommé Fournier introduit l’utilisation des châssis vitrés dans la culture maraîchère, marquant une avancée significative dans les techniques agricoles de l’époque. \nCes châssis, constitués de cadres en bois surmontés de vitres, permettent de créer un microclimat favorable à la croissance des plantes en captant la chaleur solaire et en protégeant les cultures des intempéries. \nCette innovation facilite la culture précoce de légumes tels que les laitues, les radis et les carottes, même en dehors des saisons habituelles.\n\nL’adoption des châssis vitrés se répand rapidement parmi les maraîchers parisiens, contribuant à l’essor d’une agriculture urbaine intensive et ingénieuse. \nCette méthode, détaillée dans le Manuel pratique de la culture maraîchère de Paris publié en 1845 par J.-G. Moreau et J.-J.  Daverne, illustre l’ingéniosité des jardiniers de l’époque qui, sans recours aux engrais chimiques, parviennent à approvisionner la capitale en légumes frais tout au long de l’année.',
    'Around 1780, in the Paris area, a market gardener named Fournier introduced the use of glass frames in market gardening, marking a significant advance in the agricultural techniques of the time. \nThese frames, made of wooden frames topped with glass panes, created a microclimate conducive to plant growth by capturing solar heat and protecting crops from the elements. This innovation facilitated the early cultivation of vegetables such as lettuce, radishes, and carrots, even outside the usual seasons.\n\nThe adoption of glass frames spread rapidly among Parisian market gardeners, contributing to the rise of intensive and ingenious urban agriculture. \nThis method, detailed in the Practical Manual of Market Gardening in Paris published in 1845 by J.-G. Moreau and J.-J. Daverne, illustrates the ingenuity of the gardeners of the time who, without the use of chemical fertilizers, managed to supply the capital with fresh vegetables throughout the year.',
    'Raphael Luciani-Galais ',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3590.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:15:07',
    '2026-02-10 14:15:07'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733013715',
    NULL,
    'RÉSEAU HYDRAULIQUE TRADITIONNEL DE JAIPUR',
    'JAIPUR\'S TRADITIONAL WATER NETWORK',
    '1727',
    'Conçu sous l’impulsion de Jai Singh II, ce système est le fruit d’un travail collectif entre architectes, ingénieurs et urbanistes de l’époque, combinant savoirs hydrauliques, architecturaux et environnementaux. Le réseau hydraulique de Jaipur repose sur une optimisation des ressources naturelles, prenant en compte les contraintes climatiques et les besoins de la population. Il s’articule autour de plusieurs dispositifs complémentaires :\n • Stockage des eaux de pluie : Un système de canaux et de réservoirs interconnectés capte et stocke l’eau des précipitations rares pour une utilisation tout au long de l’année.\n • Lacs artificiels et bassins urbains : Des ouvrages comme le lac Man Sagar, associé au Jal Mahal, permettent de réguler l’humidité locale et de servir de réserves d’eau en période sèche.\n • Baoris et stepwells : Ces puits à degrés (ex. Chand Baori) offrent un accès direct à l’eau, limitent l’évaporation et facilitent la gestion communautaire des ressources.\n • Réseaux souterrains et citernes : L’eau est acheminée via des conduits gravitaires et stockée dans des réservoirs souterrains, garantissant une distribution efficace sans perte importante.\n\nCe modèle a permis à Jaipur de développer une autonomie hydrique malgré des conditions climatiques extrêmes.',
    'Designed under the leadership of Jai Singh II, this system is the result of a collective effort between architects, engineers, and urban planners of the time, combining hydraulic, architectural, and environmental expertise. Jaipur\'s hydraulic network is based on the optimization of natural resources, taking into account climatic constraints and the needs of the population. It is structured around several complementary systems:\n • Rainwater storage: A system of interconnected canals and reservoirs captures and stores water from rare rainfall for use throughout the year. • Artificial lakes and urban basins: Structures such as Man Sagar Lake, associated with the Jal Mahal, regulate local humidity and serve as water reserves during dry periods.\n • Baoris and stepwells: These stepped wells (e.g., Chand Baori) provide direct access to water, limit evaporation, and facilitate community resource management. • Underground networks and cisterns: Water is conveyed via gravity pipes and stored in underground reservoirs, ensuring efficient distribution without significant loss.\n\nThis model has enabled Jaipur to develop water self-sufficiency despite extreme climatic conditions.',
    'Eric Dussert',
    'Jaipur',
    'Jaipur',
    26.9154576,
    75.8189817,
    'images/IMG_3519.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:16:53',
    '2026-02-10 14:16:53'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733137581',
    NULL,
    'SEMELLES CHAUFFANTES LAVOISIER',
    'LAVOISIER HEATED INSOLES',
    '1780',
    'Le père de la chimie moderne était-il déjà atteint à l\'époque par la précarité énergétique ?\n\nOui, si l’on en croit ces semelles chauffantes retrouvées dans le laboratoire de Lavoisier. A la manière d\'une bouillotte, les semelles peuvent se remplir d\'eau chaude et tenir des pieds au chaud sous un bureau. Cette invention nous rappelle qu’afin de se sentir chez soi, les individus mettent souvent en place des pratiques énergétiques diverses, celles-ci évoluant et changeant en fonction des personnes. \n\nLes semelles chauffantes sont visibles au deuxième étage du Musée des Arts et Métiers à Paris dans la reconstitution du laboratoire de Lavoisier. ',
    'Was the father of modern chemistry already affected by energy poverty at the time? Yes, if we are to believe these heated insoles found in Lavoisier\'s laboratory. Like a hot water bottle, the insoles can be filled with hot water and keep feet warm under a desk. This invention reminds us that in order to feel at home, people often implement various energy practices, which evolve and change depending on the individual. The heated insoles are on display on the second floor of the Musée des Arts et Métiers in Paris in the reconstruction of Lavoisier\'s laboratory. ',
    'Cédric Carles',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3520.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:18:57',
    '2026-02-10 14:18:57'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733212020',
    NULL,
    'LES DÉBUTS DU FORÇAGE MARAICHER',
    'THE BEGINNINGS OF FORCED CULTIVATION',
    '1792',
    'À la charnière des XVIIIe et XIXe siècles, plusieurs maraîchers parisiens initient des techniques de forçage innovantes, prolongeant la saison de culture des légumes en manipulant chaleur, lumière et microclimat. Vers 1792, Quentin force l’asperge blanche, suivi peu après par l’asperge verte en 1800 avec son beau-frère Marie. Le chou-fleur, quant à lui, est forcé pour la première fois par Besnard en 1811, alors que Dulac introduit la romaine précoce dès 1812.\n\nCes méthodes reposent sur l’usage de couches chaudes à base de fumier frais et de châssis vitrés, qui créent un environnement favorable au développement des plantes en dehors des saisons naturelles. Ces pratiques, précises et exigeantes, marquent l’entrée du maraîchage parisien dans l’agriculture climato-adaptative, sans recours à la chaleur fossile. Elles témoignent d’un savoir-faire empirique, transmis oralement, qui permettait à Paris d’être autonome en légumes frais une grande partie de l’année.',
    'At the turn of the 18th and 19th centuries, several Parisian market gardeners pioneered innovative forcing techniques, extending the vegetable growing season by manipulating heat, light, and microclimate. Around 1792, Quentin forced white asparagus, followed shortly thereafter by green asparagus in 1800 with his brother-in-law Marie. Cauliflower was forced for the first time by Besnard in 1811, while Dulac introduced early romaine lettuce in 1812. These methods relied on the use of hotbeds made from fresh manure and glass frames, which created an environment conducive to plant growth outside of the natural seasons. These precise and demanding practices marked the entry of Parisian market gardening into climate-adaptive agriculture, without the use of fossil fuels. They are evidence of empirical know-how, passed down orally, which enabled Paris to be self-sufficient in fresh vegetables for much of the year.',
    'Raphael Luciani-Galais',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3592.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:20:12',
    '2026-02-10 14:20:12'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733277290',
    NULL,
    'BÉLIER HYDRAULIQUE',
    'HYDRAULIC RAM',
    '1792',
    'Dans les années 1790, dix ans après les impressionnants premiers lancers de montgolfières, Joseph Montgolfier se tourne vers un autre projet. Il souhaite acheminer de l’eau à proximité de la papeterie familiale de Vidalon-lès-Annonay en Ardèche. Constatant la force du choix d’une interruption soudaine du flux d’un liquide, il décide d’utiliser celle-ci pour pomper l’eau et l’emmener vers le haut, sans autre énergie nécessaire que celle du courant de l’eau. Sa machine, le bélier hydraulique, permet donc de pousser de l’eau à partir d’une source basse située au niveau de la pompe et de l’acheminer au-dessus via un tuyau vertical. Les “coups de bélier” sont provoqués par l’augmentation de pression dans la chambre qui va décompresser dans le tuyaux vertical. La gestion de cette mécanique des fluides se fait grâce à des clapets, qui laissent cours ou interrompent successivement le débit de l’eau de façon automatique. Ce système est extrêmement robuste et a pu fonctionner sur des communes pendant des dizaines d’années avec très peu d’entretien. \n\nCette invention ne nécessite pas d’autre apport d’énergie que celle de l’eau que l’on souhaite pomper. Peu coûteuse, elle est particulièrement intéressante pour les régions où les cours d’eau sont nombreux. ',
    'In the 1790s, ten years after the impressive first hot air balloon launches, Joseph Montgolfier turned his attention to another project. He wanted to transport water to the family paper mill in Vidalon-lès-Annonay in Ardèche. Noticing the force generated when a liquid flow is suddenly interrupted, he decided to use this to pump water upwards, using only the energy of the water current. His machine, the hydraulic ram, allowed water to be pushed from a low source at the pump and transported upwards via a vertical pipe. The \"water hammer\" effect was caused by the increase in pressure in the chamber, which would then decompress in the vertical pipe. This fluid mechanics is managed by valves, which automatically allow the water flow to pass or interrupt it in succession. This system is extremely robust and has been able to operate in communities for decades with very little maintenance. \n\nThis invention requires no energy input other than that of the water to be pumped. Inexpensive, it is particularly attractive for regions with numerous waterways. ',
    'Joël Tetard',
    'Ardèche',
    'Ardèche',
    44.815194,
    4.3986525,
    'images/IMG_3521.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:21:17',
    '2026-02-10 14:21:17'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733391687',
    NULL,
    'BRISE-VENT MOBILES EN PAILLE DE SEIGLE',
    'MOBILE WINDSCREENS MADE OF RYE STRAW',
    'XIX',
    'Dans les marais non clos de murs, les maraîchers parisiens ont recours à une solution simple et efficace : des brise-vent mobiles en paille de seigle, hauts d’environ 1,50 mètre.\n\nFixés sur des cadres légers, ils sont déplacés selon les besoins pour protéger les semis, jeunes plants ou cultures sensibles des vents froids, desséchants ou violents. Leur usage permet aussi de créer des microclimats favorables à la croissance, en particulier pour les primeurs.\n\nMoins performants que les murs de pierre pour emmagasiner la chaleur, ces dispositifs présentent l’avantage d’être légers, peu coûteux et adaptables à toute parcelle. On en multiplie parfois les versions plus basses à l’intérieur même des jardins, pour optimiser l’exposition au soleil ou atténuer les effets de l’évaporation. Ces brise-vent témoignent d’une maîtrise fine de l’environnement et d’une conception modulaire de l’espace agricole bien avant l’ère du design climatique.',
    'In open marshes, Parisian market gardeners use a simple and effective solution: mobile windbreaks made of rye straw, approximately 1.50 meters high. Attached to lightweight frames, they can be moved as needed to protect seedlings, young plants, or sensitive crops from cold, drying, or strong winds. Their use also helps to create microclimates conducive to growth, particularly for early crops. Although less effective than stone walls at storing heat, these devices have the advantage of being lightweight, inexpensive, and adaptable to any plot of land. Lower versions are sometimes used within gardens to optimize sun exposure or mitigate the effects of evaporation. These windbreaks demonstrate a sophisticated understanding of the environment and a modular approach to agricultural space long before the era of climate design.',
    'Raphael Luciani-Galais ',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3593.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:23:11',
    '2026-02-10 14:23:11'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733532105',
    NULL,
    'LES VENTILATEURS',
    'FANS',
    'XIX',
    'Il existe une limite fondamentale à l\'effet de refroidissement des ventilateurs : ils ne peuvent fournir un refroidissement qu\'à des températures de l\'air inférieures à la température moyenne de la peau, qui est d\'environ 35 ° C. Ils ne peuvent pas refroidir les gens au-dessus de ce seuil, car l’air en mouvement ne peut pas réduire la température de la peau en dessous de la température ambiante - quelle que soit la vitesse de l’air. Malgré cette limite, les ventilateurs restent extrêmement utiles à des températures supérieures à 35 °C, car ils peuvent être utilisés en appoint de la climatisation. Lorsqu’ils sont utilisés en tandem, les économies d’énergie pendant les vagues de chaleur seraient d’environ 50% par rapport à l’utilisation de la climatisation.',
    'There is a fundamental limit to the cooling effect of fans: they can only provide cooling at air temperatures below the average skin temperature, which is around 35°C. They cannot cool people above this threshold because moving air cannot reduce skin temperature below ambient temperature—regardless of air speed. Despite this limitation, fans remain extremely useful at temperatures above 35°C, as they can be used to supplement air conditioning. When used in tandem, energy savings during heat waves would be around 50% compared to using air conditioning alone.',
    'Jean-Michel Durant',
    '',
    '',
    NULL,
    NULL,
    'images/IMG_3594.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:25:32',
    '2026-02-10 14:25:32'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733614056',
    NULL,
    'LES JARDINS OUVRIERS',
    'WORKERS\' GARDENS',
    'XIX',
    'Nés à la fin du XIXe siècle, les jardins ouvriers apparaissent dans un contexte d’urbanisation rapide, de précarité alimentaire et d’hygiène dégradée dans les banlieues industrielles. \nL’abbé Jules Lemire milite pour la création de ces espaces cultivables à destination des familles populaires, afin de leur offrir un complément alimentaire sain, un contact avec la nature, et une forme de stabilité sociale. \n\nDès 1896, la Ligue du coin de terre et du foyer favorise l’essaimage de ces parcelles individuelles, notamment en Seine-Saint-Denis. Aménagés en bordure des villes, parfois sur des friches ou des terrains en attente d’urbanisation, ces jardins deviennent des lieux d’autoproduction, de transmission horticole et de sociabilité.\n\nDurant les deux guerres mondiales, leur rôle nourricier est crucial. Aujourd’hui, ils constituent un héritage vivant de la résilience populaire, inspirant les démarches d’agriculture urbaine contemporaine.',
    'Created at the end of the 19th century, allotment gardens emerged in a context of rapid urbanization, food insecurity, and poor hygiene in industrial suburbs. Father Jules Lemire campaigned for the creation of these cultivable spaces for working-class families, in order to provide them with healthy food, contact with nature, and a form of social stability. \n\nFrom 1896 onwards, the Ligue du coin de terre et du foyer (League for Land and Home) promoted the spread of these individual plots, particularly in Seine-Saint-Denis. Located on the outskirts of towns, sometimes on wasteland or land awaiting urbanization, these gardens became places for self-production, horticultural knowledge transfer, and socializing.\n\nDuring the two world wars, their role in feeding the population was crucial. Today, they are a living legacy of popular resilience, inspiring contemporary urban agriculture initiatives.',
    'Raphaël Luciani-Galais',
    'Seine-Saint-Denis',
    'Seine-Saint-Denis',
    48.9098125,
    2.4528635,
    'images/IMG_3522.jpeg',
    'https://www.tourisme93.com/invention-jardins-ouvriers.html',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:26:54',
    '2026-02-10 14:26:54'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733678753',
    NULL,
    'LA GÉOTHERMIE DE FRANÇOIS LARDEREL ',
    'FRANÇOIS LARDEREL\'S GEOTHERMAL ENERGY ',
    '1818',
    'Qu’est-ce que la géothermie ? Elle désigne l’énergie issue de la Terre convertie en chaleur. La chaleur circule à travers un fluide (ici de l’eau) qui traverse les profondeurs de la Terre et remonte ainsi l’eau chargée de calories (ou énergie thermique). Cette énergie thermique est alors utilisée directement ou convertie en électricité.\n\nLa première utilisation de la géothermie a lieu en Italie. En 1818, l’industriel François Larderel a l’idée de recouvrir les étangs de Montecerboli d’une cloche en pierre afin d’extraire du bore. Les vapeurs s’en émanant sont captées vers des chaudières en cuivre créant la formation d’un dépôt d’acide borique extrait des boues.\n\nCette extraction fait la fortune du jeune entrepreneur qui utilise à cette occasion, pour la première fois, la géothermie à échelle industrielle.\n\nDe 1832 à 1842, François Larderel effectue des forages afin de récupérer directement les gaz surchauffés des sous-sols et ainsi augmenter le débit pour le chauffage des fours de son industrie, parvenant même à produire de l’électricité.\n\nEn 2012, la géothermie représente 16% de la consommation énergétique en Ile de France et l’année suivante cette énergie alimente l’équivalent de 187 000 logements, soit plus de 240 000 tonnes de CO2 évitées annuellement !',
    'What is geothermal energy? It refers to energy from the Earth converted into heat. Heat circulates through a fluid (in this case water) that travels through the depths of the Earth and brings back water loaded with calories (or thermal energy). This thermal energy is then used directly or converted into electricity.\n\nGeothermal energy was first used in Italy. In 1818, industrialist François Larderel had the idea of covering the Montecerboli ponds with a stone dome in order to extract boron. The vapors emanating from the ponds were captured in copper boilers, creating a deposit of boric acid extracted from the sludge.\n\nThis extraction made the young entrepreneur\'s fortune, as he was the first to use geothermal energy on an industrial scale. From 1832 to 1842, François Larderel carried out drilling operations to directly recover superheated gases from underground, thereby increasing the flow rate for heating his industry\'s furnaces and even managing to produce electricity.\n\nIn 2012, geothermal energy accounted for 16% of energy consumption in the Ile-de-France region, and the following year, this energy supplied the equivalent of 187,000 homes, avoiding more than 240,000 tons of CO2 annually!',
    'Frédéric Caille',
    'Italie',
    'Italy',
    42.6384261,
    12.674297,
    'images/IMG_3523.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:27:58',
    '2026-02-10 14:27:58'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770733787722',
    NULL,
    'LES ÎLOTS DE CHALEURS URBAINS (ICU)',
    'URBAN HEAT ISLANDS (UHI)',
    '1818',
    'Depuis l’Antiquité, les hommes de science s’intéressent aux relations entre le climat et la ville, pour l’implantation et la conception architecturale des cités ou, plus tard, en matière de pollution de l’air. Toutefois, la mise en évidence d’un climat spécifiquement urbain n’intervient que lorsque le pharmacien britannique Luke Howard publie entre 1818 et 1820 « Le climat de Londres ». À partir d’une série de relevés météorologiques recueillis durant neuf ans son ouvrage étudie : la température, les précipitations et le fameux « smog » de la capitale anglaise. Il note une différence des températures nocturnes de l’ordre de 3,70 °C entre le centre de Londres et sa campagne, ce que l’on nomme aujourd’hui « îlot de chaleur urbain » (ICU).\n\nCe climat local lié à l’urbanisation entraîne des problèmes en matière de santé et de bien-être, surtout en période de fortes chaleurs. De nombreuses villes ont pris conscience de la problématique de surchauffe urbaine et de ses enjeux. Elles s’interrogent sur la stratégie à mettre en œuvre pour atténuer ce phénomène. Les solutions qui existent pour faire face aux îlots de chaleur urbains doivent être adaptées au contexte et au climat local. Les principales recommandations pour lutter contre les îlots de chaleur urbains sont : de renforcer la présence de la nature et de l’eau au sein des projets d’aménagement, d’optimiser l’organisation spatiale et de favoriser une conception technique adaptée qui intègre les besoins, les usages et les pratiq',
    'Since ancient times, scientists have been interested in the relationship between climate and cities, both in terms of urban planning and architectural design and, later, in terms of air pollution. However, it was not until British pharmacist Luke Howard published \"The Climate of London\" between 1818 and 1820 that a specifically urban climate was identified. Based on a series of meteorological observations collected over nine years, his work studied temperature, precipitation, and the famous \"smog\" of the English capital. He noted a difference in nighttime temperatures of around 3.70°C between central London and the surrounding countryside, which is now known as the \"urban heat island\" (UHI). This local climate linked to urbanization causes health and well-being problems, especially during periods of high heat. Many cities have become aware of the issue of urban overheating and its challenges. They are considering strategies to mitigate this phenomenon. Existing solutions to urban heat islands must be adapted to the local context and climate. The main recommendations for combating urban heat islands are: to increase the presence of nature and water in development projects, to optimize spatial organization, and to promote appropriate technical design that integrates needs, uses, and practices.',
    'BNP Real Estate',
    'Londres',
    'London',
    51.5074456,
    -0.1277653,
    'images/IMG_3595.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:29:47',
    '2026-02-10 14:29:47'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770734209046',
    NULL,
    'CHÂSSIS CHAUFFÉS PAR THERMOSIPHON ',
    'THERMOSIPHON-HEATED CHASSIS ',
    '1836',
    'En 1836, le maraîcher parisien Gontier introduit pour la première fois l’usage du thermosiphon dans les cultures sous châssis.\n\nCe système repose sur la circulation naturelle de l’eau chauffée dans des tuyaux sans recours à une pompe : l’eau chaude monte, l’eau froide redescend, assurant ainsi une température stable et homogène dans les coffres de culture.\n\nCette innovation marque une rupture, elle réduit la dépendance au fumier animal, jusqu’alors utilisé pour chauffer les couches, et permet un meilleur contrôle des conditions thermiques. Le thermosiphon préfigure les technologies de chauffage passif et les serres à faible impact énergétique. Bien que coûteux à installer, ce dispositif illustre l’ingéniosité des maraîchers parisiens du XIXe siècle, capables d’intégrer des principes thermodynamiques simples à leur pratique quotidienne. Une agriculture urbaine déjà technique, sobre et tournée vers l’efficacité.',
    'In 1836, Parisian market gardener Gontier introduced the use of thermosiphons in greenhouse cultivation for the first time.\n\nThis system relies on the natural circulation of heated water in pipes without the use of a pump: hot water rises, cold water descends, ensuring a stable and consistent temperature in the growing boxes. This innovation marked a breakthrough, reducing dependence on animal manure, which had previously been used to heat the beds, and allowing for better control of thermal conditions. The thermosiphon foreshadowed passive heating technologies and low-energy greenhouses. Although costly to install, this device illustrates the ingenuity of 19th-century Parisian market gardeners, who were able to integrate simple thermodynamic principles into their daily practice. Urban agriculture was already technical, sober, and focused on efficiency.',
    'Raphael Luciani-Galais',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3596.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 14:36:49',
    '2026-02-10 14:36:49'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770735650535',
    NULL,
    'MANUEL DE LA french method du maraichage',
    'MANUAL OF THE FRENCH METHOD OF MARKET GARDENING',
    '1845',
    'Publié en 1845, le Manuel pratique de la culture maraîchère de Paris constitue le premier témoignage détaillé des pratiques horticoles intensives développées dans la capitale française au XIXe siècle. \nRédigé par deux jardiniers-maraîchers parisiens, J.-G. Moreau et Jean-Jacques Daverne, cet ouvrage répondait à un concours lancé par la Société royale et centrale d’agriculture de la Seine. Il décrit, en 13 chapitres, les techniques culturales, les outils employés et l’organisation sociale des maraîchers, dont le savoir-faire se transmettait de génération en génération.\n\nÀ l’époque, environ 1 800 jardins, couvrant 1 378 hectares, étaient exploités par près de 9 000 personnes, assurant l’approvisionnement en légumes frais d’une population parisienne d’un million d’habitants. Les méthodes décrites, telles que l’utilisation de châssis vitrés et de cloches en verre pour la culture forcée, reposaient sur des pratiques respectueuses de l’environnement, sans recours aux engrais chimiques ni aux pesticides, préfigurant ainsi les principes de l’agriculture biologique. Ce manuel demeure une référence historique précieuse pour comprendre l’évolution des techniques agricoles urbaines et leur impact sur l’alimentation des citadins. ',
    'Published in 1845, the Practical Manual of Market Gardening in Paris is the first detailed account of the intensive horticultural practices developed in the French capital in the 19th century. \nWritten by two Parisian market gardeners, J.-G. Moreau and Jean-Jacques Daverne, this work was submitted to a competition launched by the Royal and Central Society of Agriculture of the Seine. In 13 chapters, it describes the cultivation techniques, tools used, and social organization of market gardeners, whose expertise was passed down from generation to generation.\n\nAt the time, around 1,800 gardens, covering 1,378 hectares, were cultivated by nearly 9,000 people, supplying fresh vegetables to Paris\'s population of one million. The methods described, such as the use of glass frames and glass cloches for forced cultivation, were based on environmentally friendly practices, without the use of chemical fertilizers or pesticides, thus foreshadowing the principles of organic farming. This manual remains a valuable historical reference for understanding the evolution of urban agricultural techniques and their impact on the food supply of city dwellers. ',
    '',
    'Paris',
    'Paris',
    48.8588897,
    2.320041,
    'images/IMG_3597.jpeg',
    'https://www.fermes-locales.fr/wp-content/uploads/sites/5/2017/08/Jean-Guy-Moreau-Manuel-maraichage.pdf',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-10 15:00:03',
    '2026-02-10 15:00:03'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770735861232',
    NULL,
    'LES MURS À PÊCHES DE MONTREUIL',
    'THE PEACH WALLS OF MONTREUIL',
    '1850',
    'Les “murs à pêches” apparaissent au XVIIe siècle à Montreuil, près de Paris. Chaque parcelle, étroite et allongée, orientée nord-sud, est protégée par ces murs hauts de 2,70 mètres, faits de moellon, de terre et enduits de plâtre. Cette composition leur donne une bonne inertie thermique, permettant de conserver la chaleur. Ils protègent les cultures des intempéries et emmagasinent la chaleur du soleil le jour pour la restituer la nuit, rendant possible la culture de fruits comme les pêches, habituellement réservés à des climats plus doux.\n\nLes pêchers, plantés près des murs, sont taillés pour s’y plaquer et profiter de la chaleur. Le centre des parcelles est réservé à d’autres fruitiers, comme les pommiers, moins sensibles au froid.\n\nLes pêches de Montreuil deviennent célèbres et atteignent leur apogée au XIXe siècle, exportées jusqu’à Londres, Berlin ou la Russie. Près de 600 km de murs protègent alors 320 hectares, soit un tiers de la ville. De nombreuses variétés cultivées aujourd’hui y sont nées.\n',
    'The \"peach walls\" appeared in the 17th century in Montreuil, near Paris. Each narrow, elongated plot, oriented north-south, is protected by these 2.70-meter-high walls, made of rubble stone, earth, and plaster. This composition gives them good thermal inertia, allowing them to retain heat. They protect crops from bad weather and store the sun\'s heat during the day to release it at night, making it possible to grow fruits such as peaches, which are usually reserved for milder climates.\n\nThe peach trees, planted close to the walls, are pruned to grow flat against them and benefit from the heat. The center of the plots is reserved for other fruit trees, such as apple trees, which are less sensitive to the cold.\n\nMontreuil peaches became famous and reached their peak in the 19th century, exported as far afield as London, Berlin, and Russia. Nearly 600 km of walls protected 320 hectares, or one-third of the city. Many varieties grown today originated there. ',
    'Gilles Gallo',
    'Montreuil',
    'Montreuil',
    50.4638918,
    1.7631125,
    'images/IMG_3598.jpeg',
    'https://www.montreuil.fr/la-ville/histoire-de-la-ville/histoire-des-murs-a-peches',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-04-14 22:29:19',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770735959605',
    NULL,
    'DISTILLATION DE L’EAU DE MER POUR LA CUISINE',
    '',
    '1855',
    'Ce procédé de distillation de l’eau de mer, mis au point par M. Zambeaux et M. Gallé en 1855, marque une avancée cruciale pour l’approvisionnement en eau douce à bord des navires. Dans un contexte où les marins dépendaient de réserves limitées d’eau douce pour les longs voyages, cette invention permettait de transformer l’eau de mer en eau potable, répondant aux besoins quotidiens de l’équipage, notamment pour la cuisine.\n\nLe dispositif utilise la chaleur des chaudières du navire pour évaporer l’eau de mer. La vapeur d’eau ainsi produite est ensuite condensée, ce qui permet de récupérer de l’eau douce débarrassée de son sel et de ses impuretés. Ce procédé simple et efficace tire parti de l\'énergie thermique disponible, sans nécessiter de carburant supplémentaire.',
    '',
    'Eric Dussert',
    '',
    '',
    NULL,
    NULL,
    'images/IMG_3524.jpeg',
    '',
    '2026-02-10',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-10 15:05:59',
    '2026-02-10 15:05:59'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770743857350',
    NULL,
    'L’EFFET MAGNUS DE HEINRICH GUSTAV MAGNUS',
    'HEINRICH GUSTAV MAGNUS\' MAGNUS EFFECT',
    '1852',
    'En 1852, le physicien allemand Heinrich Gustav Magnus, fait la découverte d’un effet de pression de l’air sur des objets en rotation. Lorsqu’un objet est soumis à l’effet dit Magnus, sa rotation entraîne une augmentation de la vitesse de l’air (et une diminution de sa pression) d’un côté, et une diminution de cette vitesse (avec une augmentation de la pression) de l’autre côté de l’objet. Cette différenciation de pression dévie la trajectoire de l’objet, ce qui la rend utilisable dans les systèmes de propulsion, pour les transports. L’ingénieur allemand Anton Flettner est le premier à utiliser l’effet Magnus dans la propulsion du navire Buckau, rebaptisé Baden-Baden. Deux cylindres verticaux en rotation permettent de propulser le bateau vers l’avant en cas de vent fort.',
    'In 1852, German physicist Heinrich Gustav Magnus discovered an effect of air pressure on rotating objects. When an object is subjected to the Magnus effect, its rotation causes an increase in air speed (and a decrease in pressure) on one side, and a decrease in speed (with an increase in pressure) on the other side of the object. This pressure difference deflects the object\'s trajectory, making it useful in propulsion systems for transportation. German engineer Anton Flettner was the first to use the Magnus effect in the propulsion of the ship Buckau, renamed Baden-Baden. Two rotating vertical cylinders propel the boat forward in strong winds.',
    'Marcel Robert',
    'Allemagne',
    'Germany',
    51.1638175,
    10.4478313,
    'images/IMG_3599.jpeg',
    '',
    '2026-02-10',
    'published',
    1,
    NULL,
    NULL,
    '2026-04-14 22:29:19',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770828306711',
    NULL,
    'DISTILLATION DE L’EAU DE MER POUR LA CUISINE',
    'DISTILLATION OF SEA WATER FOR COOKING',
    '1855',
    'Ce procédé de distillation de l’eau de mer, mis au point par M. Zambeaux et M. Gallé en 1855, marque une avancée cruciale pour l’approvisionnement en eau douce à bord des navires. Dans un contexte où les marins dépendaient de réserves limitées d’eau douce pour les longs voyages, cette invention permettait de transformer l’eau de mer en eau potable, répondant aux besoins quotidiens de l’équipage, notamment pour la cuisine.\n\nLe dispositif utilise la chaleur des chaudières du navire pour évaporer l’eau de mer. La vapeur d’eau ainsi produite est ensuite condensée, ce qui permet de récupérer de l’eau douce débarrassée de son sel et de ses impuretés. Ce procédé simple et efficace tire parti de l\'énergie thermique disponible, sans nécessiter de carburant supplémentaire.',
    'This process of distilling seawater, developed by Mr. Zambeaux and Mr. Gallé in 1855, marked a crucial advance in the supply of fresh water on board ships. At a time when sailors depended on limited supplies of fresh water for long voyages, this invention made it possible to convert seawater into drinking water, meeting the daily needs of the crew, particularly for cooking.\n\nThe device used heat from the ship\'s boilers to evaporate seawater. The resulting steam was then condensed, producing fresh water free of salt and impurities. This simple and effective process made use of available thermal energy without requiring additional fuel.',
    'Eric Dussert',
    'Saint-Denis',
    'Saint-Denis',
    48.9383732,
    2.3627508,
    'images/IMG_3524.jpeg',
    '',
    '2026-02-11',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-11 16:45:06',
    '2026-02-11 16:45:06'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770828419501',
    NULL,
    'ENICE NEWTON FOOTE  DÉCOUVRE L’EFFET DE SERRE',
    'ENICE NEWTON FOOTE DISCOVERS THE GREENHOUSE EFFECT',
    '1856',
    'La découverte du réchauffement climatique s’inscrit dans un long processus de recherche scientifique qui s’étale sur plus de 200 ans. Mais pour ce qui est de la découverte des gaz à effet de serre, la primauté est bien souvent attribuée au physicien irlandais irlandais John Tyndall, considéré comme la première personne à avoir démontré, dès 1859, l\'absorption des rayonnements infrarouges par le CO2.\n\nPourtant, trois ans plus tôt, en 1856, une scientifique amatrice, Eunice Newton Foot, avait déjà dressé un constat similaire grâce à une simple expérience : à l’aide d’une pompe à air et de plusieurs thermomètres au mercure, elle avait placé successivement de l’air humide, du CO2 et de l’hydrogène dans deux cylindres de verre avant de les laisser exposés au soleil. Elle dresse la conclusion, dans un article publié en 1856 dans le American Journal of Science and Arts, que le dioxyde de carbone piégé dans le cylindre devient bien plus chaud et met bien plus de temps à refroidir que les autres gaz lorsqu’il cesse d’être exposé au soleil. \n\nEunice Newton Foot devient donc la première à statuer sur l\'importance du CO2 dans le cadre du réchauffement de l’atmosphère.',
    'The discovery of global warming is part of a long process of scientific research spanning more than 200 years. However, when it comes to the discovery of greenhouse gases, credit is often given to Irish physicist John Tyndall, who is considered to be the first person to have demonstrated, in 1859, the absorption of infrared radiation by CO2.\n\nHowever, three years earlier, in 1856, an amateur scientist, Eunice Newton Foot, had already made a similar observation through a simple experiment: using an air pump and several mercury thermometers, she placed humid air, CO2, and hydrogen in two glass cylinders before exposing them to the sun. In an article published in 1856 in the American Journal of Science and Arts, she concluded that the carbon dioxide trapped in the cylinder became much hotter and took much longer to cool down than the other gases when it was no longer exposed to the sun. \n\nEunice Newton Foot thus became the first person to determine the importance of CO2 in the warming of the atmosphere.',
    'Adrien Chaussinand',
    'États Unis',
    'United States',
    39.7837304,
    -100.445882,
    'images/IMG_3604.jpeg',
    '',
    '2026-02-11',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-11 16:46:59',
    '2026-02-11 16:46:59'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770893822475',
    NULL,
    'LA TRÉPIGNEUSE',
    'THE STOMPING MACHINE',
    '1859',
    'La trépigneuse est une invention du milieu du XIXe siècle, qu’on attribue à Emeric Lesix. C’est une machine qui permet d’actionner des dispositifs agricoles à partir de la force mécanique de chevaux de trait. Le cheval marche sur un plan incliné relié à une poulie via une roue dentée ; la puissance de l’animal entraîne les machines.\n\nBien que le travail soit épuisant pour l’animal et demande des séquences relativement courtes (20 à 30 minutes), cette technique connut un fort succès en France entre 1860 et 1910, avant de s’effacer progressivement sous le succès de la machine à vapeur. Aujourd’hui, la traction animale semble connaître un regain d’intérêt, du fait de son caractère non-polluant.',
    'The horse treadmill was invented in the mid-19th century, attributed to Emeric Lesix. It is a machine that uses the mechanical power of draft horses to drive agricultural equipment. The horse walks on an inclined plane connected to a pulley via a cogwheel; the animal\'s power drives the machines.\n\nAlthough the work was exhausting for the animal and required relatively short sequences (20 to 30 minutes), this technique was very successful in France between 1860 and 1910, before gradually fading away with the success of the steam engine. Today, animal traction seems to be enjoying a resurgence of interest due to its non-polluting nature.',
    'Marcel Robert',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3605.jpeg',
    'http://hippotese.free.fr/blog/index.php/post/2008/12/04/413-la-trepigneuse-un-concept-qui-a-plus-d-un-siecle',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 10:57:02',
    '2026-02-12 10:57:02'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770893896065',
    NULL,
    'LE GOÉMONIER',
    'THE SEAWEED HARVESTER',
    '1860',
    'Les goémoniers sont les récoltants d’algues, brunes, rouges ou vertes. En Bretagne, cette activité a longtemps été essentielle : les algues servaient d\'engrais, de combustible et de nourriture pour les animaux principalement.\n\nOn distingue trois types de goémon : épave (ramassé sur le rivage), de rive (coupé sur les rochers) et de fond (coupé en mer). L’industrie chimique s’en empare au XVIIIe siècle pour produire iode et soude. \nDans le Léon, la récolte bat son plein de mai à octobre, mobilisant familles et outils adaptés : râteaux, crocs, faucilles, puis guillotine ou skoubidou.\nUne fois ramassées, les algues doivent sécher au soleil – une étape cruciale mais fragile à cause de la pluie .\n\nLa soude produite grâce aux fours à goémon sur les côtes bretonnes a alimenté les usines situées près des villes. Les industries dépendaient donc de savoir-faire et de ressources extérieures que l’agriculture urbaine ne pouvait pas leur fournir.\n\nLe métier décline dans les années 1960 avec l’arrivée des engrais chimiques, mais rebondit grâce à la fabrication d’alginates, des additifs alimentaires et cosmétiques. La profession s’adapte alors en modernisant ses techniques et ses bateaux.',
    'Seaweed harvesters gather brown, red, and green seaweed. In Brittany, this activity has long been essential: seaweed was mainly used as fertilizer, fuel, and animal feed. There are three types of seaweed: wreckage (collected on the shore), shore (cut from rocks), and bottom (cut at sea). The chemical industry began using it in the 18th century to produce iodine and soda. In Léon, harvesting is in full swing from May to October, mobilizing families and specialized tools: rakes, hooks, sickles, then guillotines or skoubidous. Once collected, the seaweed must dry in the sun—a crucial but fragile step due to the rain.\n\nThe soda produced by seaweed kilns on the Brittany coast supplied factories located near towns. Industries therefore depended on expertise and external resources that urban agriculture could not provide.\n\nThe trade declined in the 1960s with the arrival of chemical fertilizers, but rebounded thanks to the manufacture of alginates, food additives, and cosmetics. The profession then adapted by modernizing its techniques and boats.',
    'Clara Loisel',
    'Bretagne',
    'Brittany',
    48.2640845,
    -2.9202408,
    'images/IMG_3606.jpeg',
    'https://fresques.ina.fr/ouest-en-memoire/fiche-media/Region00411/les-goemoniers.html',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 10:58:16',
    '2026-02-12 10:58:16'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894016574',
    NULL,
    'VINGT MILLE LIEUES SOUS LES MERS DE JULES VERNES',
    'TWENTY THOUSAND LEAGUES UNDER THE SEA BY JULES VERNES',
    '1869',
    'Vingt mille lieues sous les mers de Jules Verne est un roman d’aventure et une oeuvre d’anticipation sur la science et la technologie du domaine marin. \n\n“ Il est un agent puissant, obéissant, rapide, facile, qui se plie à tous les usages et qui règne en maître à mon bord. Tout se fait par lui. Il m\'éclaire, il m\'échauffe, il est l\'âme de mes appareils mécaniques. Cet agent, c\'est l\'électricité. \n\n[ … ] \n\nMais [ … ] j\'ai voulu ne demander qu\'à la mer elle-même les moyens de produire mon électricité. [ … ] Le sodium seul se consomme, et la mer me le fournit elle-même. Je vous dirai, en outre, que les piles au sodium doivent être considérées comme les plus énergiques, et que leur force électromotrice est double de celle des piles au zinc”.\n',
    'Jules Verne\'s Twenty Thousand Leagues Under the Sea is an adventure novel and a work of science fiction about marine science and technology. \n\n\"It is a powerful, obedient, fast, easy agent that adapts to all uses and reigns supreme on board my ship. Everything is done by it. It lights me, it heats me, it is the soul of my mechanical devices. This agent is electricity. \n\n[...] But [...] I wanted to ask only the sea itself for the means to produce my electricity. [...] Only sodium is consumed, and the sea itself provides it. I will also tell you that sodium batteries must be considered the most powerful, and that their electromotive force is twice that of zinc batteries.\" ',
    'Delphine Pouget',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3607.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:00:16',
    '2026-02-12 11:00:16'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894127884',
    NULL,
    'LE MANÈGE VÉLOCYPÉDIQUE',
    'THE VELOCYCLED CAROUSEL',
    '1869',
    'La fête foraine est aussi un lieu d’innovation énergétique. Avant d’être un élément indispensable pour nos vélos, le pédalier se démocratise au sein d’une attraction : le manège vélocypédique. En 1861, le jeune Ernest Michaux âgé de 19 ans effectue des réparations sur un vélocipède, une « machine à courir » en bois, sans pédales et sans freins, doté de deux roues. Il ne sait pas où mettre ses pieds durant son utilisation et trouve donc son maniement fatiguant. Sur les conseils de son père, Pierre Michaux, il ajoute une manivelle et fixe des pédales à la roue. Le pédalier est né, mais reste encore trop coûteux. Sa diffusion se fait lors d’une fête foraine en 1869 aux Etats-Unis. Une nouvelle attraction, le manège de vélocipèdes, invite les passants à s’installer en nombre sur un siège et à pédaler tous ensemble afin de faire prendre de la vitesse à la structure. En allant jusqu’à 60 km/h, il dépasse alors les moyens de locomotions de l’époque qui atteignent rarement plus de 20 km/h. Il ne reste plus que deux modèles de manège vélocypédique dont un se trouve au musée des Arts Forains à Paris. Il fut fabriqué en 1897 par Caillebaut et Decanck à Gand, en Belgique, à partir d’un brevet anglais de la firme Savage. Cette petite pièce de musée nous rappelle que l’électricité ou un moteur à gaz n’est pas nécessaire pour éprouver des sensations fortes : la force musculaire suffit !\n',
    'The fairground is also a place of energy innovation. Before becoming an essential part of our bicycles, the pedal mechanism became popular in an attraction: the velocipede carousel. In 1861, 19-year-old Ernest Michaux was repairing a velocipede, a wooden \"running machine\" with two wheels, no pedals, and no brakes. He didn\'t know where to put his feet while riding it and found it tiring to operate. On the advice of his father, Pierre Michaux, he added a crank and attached pedals to the wheel. The pedal system was born, but it was still too expensive. It was first introduced to the public at a fair in the United States in 1869. A new attraction, the velocipede carousel, invited passersby to sit on a seat and pedal together to make the structure go faster. Reaching speeds of up to 60 km/h, it surpassed the means of transportation of the time, which rarely exceeded 20 km/h. Only two models of the velocipede carousel remain, one of which is in the Musée des Arts Forains in Paris. It was manufactured in 1897 by Caillebaut and Decanck in Ghent, Belgium, based on an English patent from the Savage company. This small museum piece reminds us that electricity or a gas engine is not necessary to experience thrills: muscle power is enough! ',
    'Cédric Carles',
    'États unis',
    'United States',
    39.7837304,
    -100.445882,
    'images/IMG_3608.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:02:07',
    '2026-02-12 11:02:07'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894203868',
    NULL,
    'FERME MARAÎCHÈRE URBAINE À PARIS',
    'URBAN VEGETABLE FARM IN PARIS',
    '1870',
    'Dès les années 1870, Paris et sa proche banlieue développent un modèle unique de ferme maraîchère urbaine. Sur de petites parcelles souvent insérées dans les interstices du tissu bâti, des agriculteurs venus chercher du travail dans la capitale inventent un système agricole ultra-efficace.\n\nMalgré des sols peu fertiles, ils atteignent une productivité inégalée grâce à l’introduction d’outils novateurs, au recyclage du fumier des chevaux de la ville et à une maîtrise fine des rotations culturales.\n\nCe système inspirera durablement les pratiques maraîchères en Europe. Aujourd’hui, cet héritage ressurgit sous de nouvelles formes. À Paris, fermes sur les toits, foodlabs, brasseries, fromageries urbaines, jardins partagés ou fermes souterraines témoignent d’un renouveau agricole enraciné dans la ville dense.\n\nPorté par des start-ups, ONG et collectivités, ce mouvement s’intègre à une stratégie municipale d’alimentation durable. Il fait écho aux pratiques du passé tout en inventant des solutions locales pour demain.',
    'Starting in the 1870s, Paris and its inner suburbs developed a unique model of urban market gardening. On small plots of land often tucked away between buildings, farmers who had come to the capital in search of work invented a highly efficient agricultural system.\n\nDespite the poor soil, they achieved unparalleled productivity thanks to the introduction of innovative tools, the recycling of horse manure from the city, and a sophisticated understanding of crop rotation. This system would have a lasting influence on market gardening practices throughout Europe. Today, this heritage is reemerging in new forms. In Paris, rooftop farms, food labs, breweries, urban cheese dairies, shared gardens, and underground farms are evidence of an agricultural revival rooted in the dense city. Driven by start-ups, NGOs, and local authorities, this movement is part of a municipal strategy for sustainable food. It echoes the practices of the past while inventing local solutions for tomorrow.',
    'Raphaël Luciani-galais',
    'Paris',
    'Paris',
    48.8534951,
    2.3483915,
    'images/IMG_3609.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:03:23',
    '2026-02-12 11:03:23'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894366397',
    NULL,
    'L’ÎLE MYSTÉRIEUSE DE JULES VERNE',
    'JULES VERNE\'S MYSTERIOUS ISLAND',
    '1874',
    'L\'Île Mystérieuse de Jules Verne est une robinsonnade qui mêle science et fantastique. Le rapport à la nature, aux ressources et à leur exploitation est l’un des thèmes majeurs du roman.\n\nLes personnages parcourent toute l’histoire technologique de l’humanité, jusqu’à ce que la métallurgie, la chimie et même l’électricité soient maîtrisées !\n\n“ Oui, mes amis, je crois que l’eau sera un jour employée comme combustible, que l’hydrogène et l’oxygène, qui la constituent, utilisés isolément ou simultanément, fourniront une source de chaleur et de lumière inépuisables et d’une intensité que la houille ne saurait avoir.”',
    'Jules Verne\'s The Mysterious Island is a Robinsonade that blends science and fantasy. The relationship with nature, resources, and their exploitation is one of the novel\'s major themes. The characters journey through the entire technological history of humanity, until metallurgy, chemistry, and even electricity are mastered!\n\n\"Yes, my friends, I believe that water will one day be used as fuel, that hydrogen and oxygen, which constitute it, used separately or simultaneously, will provide an inexhaustible source of heat and light of an intensity that coal cannot match.\"',
    'Vincent Muller',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3610.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:06:06',
    '2026-02-12 11:06:06'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894485841',
    NULL,
    'LES 500 MILLIONS DE LA BÉGUM DE JULES VERNE',
    'THE 500 MILLION OF JULES VERNE\'S BEGUM',
    '1874',
    'Les œuvres d’art témoignent indirectement de leur époque. Dans Les Cinq Cent Millions de la Bégum (1879), Jules Verne met en scène deux héritiers fondant chacun une cité idéale selon des visions opposées : l’un privilégie une ville militarisée et industrielle, l’autre un projet social et environnemental novateur. Ce dernier imagine des maisons conçues pour l’isolation thermique grâce à des briques percées de conduits d’air, favorisant la circulation naturelle : « […] des briques légères […] transpercées […] de trous cylindriques […] permettant ainsi à l’air de circuler librement. » Il propose aussi de traiter la pollution domestique en filtrant les fumées par des « fourneaux spéciaux » communaux, qui les dépouillent du carbone avant leur rejet à haute altitude. Verne esquisse ainsi une utopie technologique aux préoccupations écologiques étonnamment modernes.',
    'Works of art indirectly reflect their era. In The Begum\'s Fortune (1879), Jules Verne depicts two heirs, each founding an ideal city based on opposing visions: one favors a militarized and industrial city, the other an innovative social and environmental project. The latter imagines houses designed for thermal insulation using bricks pierced with air ducts, promoting natural circulation: \"[...] lightweight bricks [...] pierced [...] with cylindrical holes [...] allowing air to circulate freely. \" He also proposed treating domestic pollution by filtering smoke through communal \"special furnaces,\" which would remove carbon before releasing it at high altitude. Verne thus sketched out a technological utopia with surprisingly modern ecological concerns.',
    'Nicolas Delaffon',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3611.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:08:05',
    '2026-02-12 11:08:05'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894566342',
    NULL,
    'DRAINAGE DU PLATEAU DE SACLAY',
    'DRAINAGE OF THE SACLAY PLATEAU',
    '1880',
    'À la fin du XIXe siècle, le plateau de Saclay est profondément transformé par un vaste réseau de rigoles d’irrigation et de drainage, mis en place vers 1880. Ce dispositif vise à évacuer l’eau excédentaire des sols argileux, longtemps marécageux et impropres à l’agriculture intensive. \n\nLe système repose sur un réseau de rigoles collectant les eaux de ruissellement, qui sont ensuite acheminées vers l’étang de Saclay, jouant un rôle de régulateur hydraulique. \nCette infrastructure prolonge un projet plus ancien : celui du XVIIe siècle orchestré par Vauban et La Quintinie pour acheminer l’eau jusqu’aux jardins des Tuileries et de Versailles via le plateau.\n\nLe réseau de rigoles, toujours visible aujourd’hui, témoigne d’une approche territoriale de l’hydraulique, mêlant aménagement agricole, gestion durable de l’eau et ingénierie gravitaire. \n\nIl a permis de rendre fertiles des terres autrefois inexploitables, soutenant la vocation agricole du plateau jusqu’à nos jours.\n',
    'At the end of the 19th century, the Saclay plateau underwent a profound transformation with the installation of a vast network of irrigation and drainage channels around 1880. This system was designed to remove excess water from the clay soils, which had long been marshy and unsuitable for intensive agriculture. \n\nThe system was based on a network of channels collecting runoff water, which was then conveyed to the Saclay pond, acting as a hydraulic regulator. This infrastructure was an extension of an older project: the 17th-century project orchestrated by Vauban and La Quintinie to convey water to the Tuileries and Versailles gardens via the plateau.\n\nThe network of channels, still visible today, is evidence of a territorial approach to hydraulics, combining agricultural development, sustainable water management, and gravity engineering. It has made formerly unusable land fertile, supporting the plateau\'s agricultural vocation to this day. ',
    'Raphaël Luciani-Galais',
    'Saclay',
    'Saclay',
    48.7305162,
    2.172576,
    'images/IMG_3525.jpeg',
    'https://www.saclay.fr/wp-content/uploads/2022/08/dossier-patrimoine-etangs-rigoles-plateau-saclay.pdf',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:09:26',
    '2026-02-12 11:09:26'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894683422',
    NULL,
    'POMPES-ÉOLIENNES EN CAMARGUE',
    'WIND PUMPS IN THE CAMARGUE REGION',
    '1880',
    '« Dieu créa le monde, à l’exception de la Hollande qui fut créée par les Hollandais »… avec l’aide du vent. Huit mille moulins, des digues sans fin bâties contre la mer, des canaux pour évacuer l’eau pompée des terres salines : ainsi les Hollandais ont agrandi leur pays sur la mer.\n\nAu début du XXe siècle, naît l’idée que la Camargue marécageuse et la Crau aride peuvent être rendues fertiles, l’une par assèchement, l’autre par irrigation. Et pourquoi pas avec des turbines éoliennes de pompage ? C’est le projet d’un Français, Louis Constantin, pionnier des éoliennes modernes.\n\nL’immense « polder » français est prêt : l’étang de Vaccarès (23 000 ha) peut être asséché aux 3/4, le reste servant de réceptacle aux eaux salées et douces. Pour la Crau, il s’agit de pomper les eaux souterraines de la Durance, à deux mètres de profondeur.\n\nMais en 1927, l’étang de Vaccarès est finalement protégé par la création de la Réserve zoologique et botanique de Camargue.',
    '\"God created the world, except for Holland, which was created by the Dutch\"... with the help of the wind. Eight thousand windmills, endless dykes built against the sea, canals to drain water pumped from saline lands: this is how the Dutch expanded their country over the sea.\n\nAt the beginning of the 20th century, the idea arose that the marshy Camargue and the arid Crau could be made fertile, one by drainage, the other by irrigation. And why not with wind turbine pumps? This was the project of a Frenchman, Louis Constantin, a pioneer of modern wind turbines.\n\nThe huge French \"polder\" was ready: three-quarters of the Vaccarès lake (23,000 hectares) could be drained, with the rest serving as a reservoir for salt and fresh water. For the Crau, the plan was to pump groundwater from the Durance river, two meters below the surface.\n\nBut in 1927, the Vaccarès lagoon was finally protected by the creation of the Camargue Zoological and Botanical Reserve.',
    'Raphaël Luciani-Galais',
    'Camargue',
    'Camargue',
    44.0495211,
    -0.0477299,
    'images/IMG_3526.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:11:23',
    '2026-02-12 11:11:23'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770894817463',
    NULL,
    'CHAUFFAGE ET VENTILATION SOLAIRE',
    'SOLAR HEATING AND VENTILATION',
    '1881',
    'Le naturaliste américain Edward S. Morse imagina en 1881 un système de chauffage et de ventilation alimenté par le soleil. L’invention consiste en l’emploi d’un boîtier fixé sur la paroi extérieure d’un bâtiment et muni d’une surface noircie en métal, en terre cuite, ou tout autre matériau approprié, présentant une surface plane ou ondulée protégée par une vitre, et agencé de façon à permettre aux rayons du soleil de donner aussi directement que possible sur ladite surface noircie. Derrière la surface noircie se trouve un espace d’air, soit fermé soit communicant par des ouvertures au niveau des extrémités supérieures et inférieures avec les ouvertures du logement. L’action des rayons du soleil sur la surface noircie chauffe l’air dans l’espace à l’arrière. En chauffant, l’air monte et peut être dirigé dans la pièce, de manière à la chauffer ou à occasionner une ventilation en attirant l’air à l’intérieur de la pièce. Repris entre 1950-1970 par le professeur Trombe et l’architecte Michel, le concept est ensuite remis au goût du jour par une équipe d’ingénieurs de Centrale Lille sous le nom ENAR en 2015.',
    'In 1881, American naturalist Edward S. Morse devised a solar-powered heating and ventilation system. The invention consists of a box attached to the exterior wall of a building and equipped with a blackened surface made of metal, terracotta, or any other suitable material, with a flat or corrugated surface protected by glass, and arranged so as to allow the sun\'s rays to shine as directly as possible on the blackened surface. Behind the blackened surface is an air space, either closed or communicating through openings at the upper and lower ends with the openings of the housing. The action of the sun\'s rays on the blackened surface heats the air in the space behind it. As it heats up, the air rises and can be directed into the room to heat it or to provide ventilation by drawing air into the room. Revived between 1950 and 1970 by Professor Trombe and architect Michel, the concept was then brought up to date by a team of engineers from Centrale Lille under the name ENAR in 2015.',
    'Jérôme Jacqmin',
    'Etats unis',
    'United States',
    39.7837304,
    -100.445882,
    'images/IMG_3612.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:13:37',
    '2026-02-12 11:13:37'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770895210808',
    NULL,
    'LE ROMAN D’UN RAYON DE SOLEIL',
    'THE NOVEL OF A RAY OF SUNSHINE',
    '1885',
    'Ce roman de Mallat de Bassilan, publié en 1885, suit Samuel, un jeune de dix-huit ans dont les errances parisiennes servent de prétexte à une méditation sur un protagoniste inattendu : le soleil. Fasciné par son rayonnement, Samuel devient le relais d’un discours à la fois poétique et scientifique sur les bienfaits et le potentiel énergétique de l’astre. Le savant M. Brion y prophétise l’usage futur de l’énergie solaire pour faire avancer voitures, navires ou produire de la lumière, anticipant une société post-charbon. Quarante-six ans après la découverte de l’effet photovoltaïque par Becquerel, Mallat de Bassilan imagine déjà les usages de cette énergie. Il faudra attendre 1990 pour voir le premier système photovoltaïque relié au réseau, et 2019 pour espérer une voiture 100 % solaire.',
    'This novel by Mallat de Bassilan, published in 1885, follows Samuel, an eighteen-year-old whose wanderings in Paris serve as a pretext for a meditation on an unexpected protagonist: the sun. Fascinated by its radiance, Samuel becomes the conduit for a discourse that is both poetic and scientific on the benefits and energy potential of the sun. The scientist Mr. Brion prophesies the future use of solar energy to power cars and ships and produce light, anticipating a post-coal society. Forty-six years after Becquerel\'s discovery of the photovoltaic effect, Mallat de Bassilan was already imagining the uses of this energy. It was not until 1990 that the first photovoltaic system connected to the grid was seen, and 2019 before we could hope for a 100% solar-powered car.',
    'Marianne Enckell',
    'Paris',
    'Paris',
    48.8534951,
    2.3483915,
    'images/IMG_3613.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:20:10',
    '2026-02-12 11:20:10'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770896539288',
    NULL,
    'LES TOILETTES SÈCHES DANS L’HISTOIRE',
    'DRY TOILETS THROUGH HISTORY',
    '1886',
    'A la fin du XIXe siècle au Canada et dans le Midwest américain on trouve les premières traces des toilettes sèches produites à une échelle industrielle. William Heap, un entrepreneur du Michigan dépose un brevet en 1886 pour une commode de chambre à coucher fournie avec un seau en acier galvanisé. L\'idée était de saupoudrer l’intérieur du seau de cendres ou de terre, pour absorber les odeurs, avant utilisation. Un récipient séparé en porcelaine sur la porte du placard recueillait l\'urine. \n\nPromue « parfaitement inodore » avec ses unités au prix de 8 $ à 13 $ et “25000 déjà en cours d\'utilisation” d’après une annonce placée dans la section « Nécessaires ménagers » de The Cosmopolitan, elle démontre un certain succès au Canada et dans le Midwest américain.',
    'At the end of the 19th century in Canada and the American Midwest, the first traces of dry toilets produced on an industrial scale were found. William Heap, an entrepreneur from Michigan, filed a patent in 1886 for a bedroom commode supplied with a galvanized steel bucket. The idea was to sprinkle the inside of the bucket with ashes or soil to absorb odors before use. A separate porcelain container on the closet door collected urine. \n\nPromoted as \"completely odorless\" with units priced from $8 to $13 and \"25,000 already in use\" according to an advertisement in the \"Household Necessities\" section of The Cosmopolitan, it proved somewhat successful in Canada and the American Midwest.',
    'Lucile Nivalet',
    'Canada',
    'Canada',
    61.0666922,
    -107.991707,
    'images/IMG_3614.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:42:19',
    '2026-02-12 11:42:19'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770896634074',
    NULL,
    'CLIMAX : EAU CHAUDE SOLAIRE DE CLARENCE KEMP',
    'CLIMAX: SOLAR HOT WATER BY CLARENCE KEMP',
    '1891',
    'Le premier chauffe-eau solaire à but commercial est breveté en 1891 par Clarence Kemp. Il permet d’accumuler de la chaleur grâce à des éléments métalliques disposés au soleil.\n\nL’eau est contenue dans plusieurs tubes de fer de section ellipsoïdale, afin de maximiser la surface irradiée par le soleil. Les tubes sont disposés en parallèle et sont reliés par des petits tuyaux. L’eau froide entre par un côté, et l’eau réchauffée ressort par un autre. L’intérêt de multiplier les tubes est d’accélérer l’échauffement et d’éviter que l’eau froide entre en contact avec l’eau chaude. Le système est recouvert d’une plaque de verre, afin de le protéger de l’eau de pluie et pour améliorer l’échauffement grâce à l’effet de serre.\n\nAyant baptisé ses chauffe-eaux “CLIMAX”, Kemp trouva beaucoup de clients en Californie, plus précisément à Pasadena où près d’un tiers des maisons en étaient équipées en 1897.\n\nMalheureusement, le système ne résistait pas aux gelées d’hiver. A partir du début du XXème siècle, plusieurs brevets furent déposés pour tenter d’améliorer les chauffe-eaux solaires. Le climax devient obsolète suite au brevet déposé par William J. Bailey en 1909.',
    'The first commercial solar water heater was patented in 1891 by Clarence Kemp. It allows heat to be stored using metal elements placed in the sun. The water is contained in several iron tubes with an ellipsoidal cross-section in order to maximize the surface area exposed to the sun. The tubes are arranged in parallel and connected by small pipes. Cold water entered on one side and heated water exited on the other. The advantage of using multiple tubes was that it accelerated heating and prevented cold water from coming into contact with hot water. The system was covered with a glass plate to protect it from rainwater and improve heating through the greenhouse effect.\n\nHaving named his water heaters \"CLIMAX,\" Kemp found many customers in California, specifically in Pasadena, where nearly a third of homes were equipped with them in 1897.\n\nUnfortunately, the system could not withstand winter frosts. From the beginning of the 20th century, several patents were filed in an attempt to improve solar water heaters. The Climax became obsolete following the patent filed by William J. Bailey in 1909.',
    'Cédric Carles',
    'Californie',
    'California',
    36.7014631,
    -118.755997,
    'images/IMG_3615.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:43:54',
    '2026-02-12 11:43:54'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770896734716',
    NULL,
    'LA PREMIÈRE PORSCHE ÉTAIT ÉLECTRIQUE',
    'THE FIRST PORSCHE WAS ELECTRIC',
    '1898',
    'En 1898, Ferdinand Porsche développe la première Porsche, la Egger-Lohner C.2, une voiture 100 % électrique. Le véhicule est doté de deux moteurs électriques placés directement sur les roues avant : Porsche invente ainsi le moteur-roue. L’engin ne pouvant parcourir que 80 km à faible vitesse, Porsche ajoute 2 autres moteurs sur les roues arrière. Il vient ainsi de créer le premier véhicule électrique à 4 roues motrices. Cependant, la machine (qui doit emporter avec elle 1800 kilos de batteries) ne parvient toujours pas à monter les fortes pentes. Au Salon de Paris, en 1901, Lohner et Porsche exposent une version améliorée de leur voiture où un petit moteur thermique a été ajouté (afin de recharger plus rapidement les très nombreuses batteries et aider le véhicule à monter les côtes). C’est ainsi que naît, au début de l’aventure automobile, le premier 4X4 hybride.',
    'In 1898, Ferdinand Porsche developed the first Porsche, the Egger-Lohner C.2, a 100% electric car. The vehicle was equipped with two electric motors placed directly on the front wheels: Porsche thus invented the wheel motor. As the vehicle could only travel 80 km at low speed, Porsche added two more motors to the rear wheels. He had thus created the first four-wheel drive electric vehicle. However, the machine (which had to carry 1,800 kg of batteries) was still unable to climb steep slopes. At the Paris Motor Show in 1901, Lohner and Porsche exhibited an improved version of their car, to which a small combustion engine had been added (to recharge the numerous batteries more quickly and help the vehicle climb hills). And so, at the dawn of the automotive adventure, the first hybrid 4x4 was born.',
    'Guillaume Attal',
    '',
    '',
    NULL,
    NULL,
    'images/IMG_3616.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:45:34',
    '2026-02-12 11:45:34'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770896826445',
    NULL,
    'UNE VOITURE ÉLECTRIQUE DÉPASSANT LES 100  KM/H',
    'AN ELECTRIC CAR EXCEEDING 100 KM/H',
    '1898',
    '“La Jamais contente”, de l’ingénieur belge Camille Jenatzy, dépasse pour la première fois les 100 km/h en atteignant 105,88 km/h, le 29 avril 1899.\n\nEn 1900, sur 4 192 véhicules fabriqués aux États-Unis, 1 575 sont électriques, 936 à essence, et 1 681 à vapeur. L’automobile à essence finit par supplanter la voiture électrique. Dans un article de 1955, John B. Rae propose une explication déterministe à l’échec de l’automobile électrique : celle-ci ne serait victime que de ses défauts intrinsèques en comparaison des avantages de la technologie des voitures à essence. Il explique que le développement de l’automobile électrique est « une excroissance parasite de l’industrie automobile, et que sa disparition ne fut regrettée que par ceux qui avaient eu la malencontreuse idée d’y investir leur argent ».\n\nDepuis 1955, la plupart des historiens ont accepté l’explication de Rae, à l’exception de Rudi Volti qui est le premier à remettre en question la thèse du déterminisme. Au début des années 2000, un ouvrage de David A. Kirsch défend une perspective plus nuancée soutenant que cette technologie aurait pu se développer dans des segments particuliers du marché automobile, si des facteurs contingents et sociaux ne s’y étaient pas opposés. D’autres auteurs expliquent que la voiture électrique a échoué à cause de problèmes culturels plutôt que techniques.\n',
    'On April 29, 1899, Belgian engineer Camille Jenatzy\'s \"La Jamais contente\" (The Never Satisfied) exceeded 100 km/h for the first time, reaching 105.88 km/h.\n\nIn 1900, of the 4,192 vehicles manufactured in the United States, 1,575 were electric, 936 were gasoline-powered, and 1,681 were steam-powered. Gasoline-powered cars eventually supplanted electric cars. In a 1955 article, John B. Rae offered a deterministic explanation for the failure of the electric car: it was simply a victim of its intrinsic flaws compared to the advantages of gasoline-powered car technology. He explained that the development of the electric car was \"a parasitic growth on the automotive industry, and its disappearance was regretted only by those who had had the unfortunate idea of investing their money in it.\"\n\nSince 1955, most historians have accepted Rae\'s explanation, with the exception of Rudi Volti, who was the first to question the determinism thesis. In the early 2000s, a book by David A. Kirsch defended a more nuanced perspective, arguing that this technology could have developed in specific segments of the automotive market if contingent and social factors had not prevented it. Other authors explain that the electric car failed because of cultural rather than technical problems. ',
    'Emmanuel Julien',
    '',
    '',
    NULL,
    NULL,
    'images/IMG_3617.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:47:06',
    '2026-02-12 11:47:06'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770896982437',
    NULL,
    'L’ÉCLAIRAGE BIOLUMINESCENT',
    'BIOLUMINESCENT LIGHTING',
    '1900',
    'Certains êtres vivants produisent de la lumière froide par bioluminescence, grâce à une réaction chimique où une enzyme, la luciférase, transforme l’énergie chimique en lumière. Aristote fut le premier à observer ce phénomène chez des poissons morts, suivi par Pline l’Ancien qui décrit des méduses et des pholades lumineux. Plus tard, des scientifiques comme Boyle, Scheele, Priestley ou Spallanzani constatent que des animalcules émettent de la lumière, sans pouvoir en expliquer le mécanisme.\n\nEn 1897, Raphaël Dubois identifie trois éléments clés : la luciférine (molécule organique), la luciférase (enzyme), et l’oxygène. Il cultive alors des photobactéries capables d’éclairer les sous-sols du palais de l’Optique lors de l’Exposition universelle de 1900.\n\nCette lumière naturelle inspire aujourd’hui la start-up française Glowee, qui cherche à remplacer l’éclairage nocturne par des bulles contenant ces bactéries. Mais ce projet se heurte encore à un obstacle majeur : la durée de vie limitée des organismes lumineux.',
    'Some living organisms produce cold light through bioluminescence, thanks to a chemical reaction in which an enzyme called luciferase converts chemical energy into light. Aristotle was the first to observe this phenomenon in dead fish, followed by Pliny the Elder, who described luminous jellyfish and pholadids. Later, scientists such as Boyle, Scheele, Priestley, and Spallanzani noted that tiny animals emitted light, but were unable to explain the mechanism behind it.\n\nIn 1897, Raphaël Dubois identified three key elements: luciferin (an organic molecule), luciferase (an enzyme), and oxygen. He then cultivated photobacteria capable of lighting up the basement of the Palais de l\'Optique during the 1900 World\'s Fair.\n\nThis natural light has inspired French start-up Glowee, which is seeking to replace night-time lighting with bubbles containing these bacteria. However, the project still faces a major obstacle: the limited lifespan of the luminous organisms.',
    'Sandra Rey',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3618.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:49:42',
    '2026-02-12 11:49:42'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770897082104',
    NULL,
    'L’AMPOULE CENTENAIRE D’ADOLPHE CHAILLET',
    'ADOLPHE CHAILLET\'S CENTENNIAL LIGHT BULB',
    '1901',
    'De nos jours, une ampoule a une durée de vie qui tourne autour de 1000 / 2000 heures, soit presque 42 / 50 jours. L’ampoule qui nous intéresse ici a, quant à elle, 117 ans !\n\nEn 1901, une petite ampoule est installée au plafond d’une caserne de pompier située à Livermore, en Californie. C’est une ampoule de 60 watts branchée sur le réseau électrique de l’époque qui était destinée à veiller sur les camions du service d’incendie nuit et jour et qui ne devait donc pas être régulièrement allumée puis éteinte. Cette première donnée peut expliquer sa longévité – car une ampoule se consomme plus rapidement à la suite d’un allumage et d’une extinction trop répétitive – mais qu’en partie. Une autre explication se trouve dans sa composition. Au lieu d’être composé d’un métal conducteur, en l’occurrence le tungstène, le filament porté à incandescence est en carbone. Or contrairement à un métal conducteur, le carbone conduit mieux l’électricité lorsqu’il se réchauffe. Par ailleurs le filament est huit fois plus épais que celui d’une ampoule contemporaine.\n\nCette ampoule, commercialisée par l’industriel français Adolphe Chaillet en 1896, va à l’encontre de toutes logiques commerciales et notamment celle de l’obsolescence programmée … Rappelons tout de même que l’obsolescence programmée est reconnue en France comme un délit depuis la loi sur la transition énergétique de 2015.',
    'Nowadays, a light bulb has a lifespan of around 1,000 to 2,000 hours, or almost 42 to 50 days. The light bulb we are interested in here is 117 years old!\n\nIn 1901, a small light bulb was installed in the ceiling of a fire station in Livermore, California. It was a 60-watt bulb connected to the electrical grid of the time, intended to watch over the fire department\'s trucks day and night and therefore not meant to be turned on and off regularly. This first piece of information may explain its longevity—because a light bulb wears out more quickly when it is turned on and off too often—but only in part. Another explanation lies in its composition. Instead of being made of a conductive metal, in this case tungsten, the filament that is heated to incandescence is made of carbon. Unlike a conductive metal, carbon conducts electricity better when it heats up. In addition, the filament is eight times thicker than that of a contemporary light bulb.\n\nThis bulb, marketed by French industrialist Adolphe Chaillet in 1896, goes against all commercial logic, particularly that of planned obsolescence... It should be noted that planned obsolescence has been recognized as a crime in France since the 2015 Energy Transition Act.',
    'Thomas Ortiz et Cédric Carles',
    'Livermore',
    'Livermore',
    37.6820583,
    -121.768053,
    'images/IMG_3619.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:51:22',
    '2026-02-12 11:51:22'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770897178577',
    NULL,
    'UN CHÂTEAU D’EAU-ÉOLIENNE',
    'A WIND-POWERED WATER TOWER',
    '1901',
    'Cette éolienne de bois fut construite dans une petite commune de l’Aube (France), Pargues. Construite au-dessus d’un château d’eau, elle servait à actionner une pompe pour récupérer l’eau de la nappe au-dessus de laquelle la construction était installée. L’objectif de Pargues était d’alimenter la ville en eau pure, pour approvisionner les fontaines et lavoirs notamment. Réalisé par l’architecte Ludovic Sot en 1902, c’est un dispositif unique, classé aujourd’hui au patrimoine des monuments historiques depuis 2011.',
    'This wooden windmill was built in Pargues, a small town in the Aube department of France. Built above a water tower, it was used to power a pump to draw water from the aquifer above which the structure was installed. The aim of Pargues was to supply the town with pure water, particularly for its fountains and wash houses. Designed by architect Ludovic Sot in 1902, it is a unique structure that has been listed as a historic monument since 2011.',
    'Thomas Ortiz',
    'Aude',
    'Dare',
    43.0542733,
    2.5124715,
    'images/IMG_3527.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:52:58',
    '2026-02-12 11:52:58'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770897255323',
    NULL,
    '“TRAVAIL” LE ROMAN D’EMILE ZOLA',
    '“WORK” THE NOVEL BY EMILE ZOLA',
    '1901',
    'En 1901, Émile Zola publie Travail, un roman d’anticipation inspiré des inventions d’Auguste Mouchot. Dès les années 1870, Zola s’intéresse aux innovations techniques, notamment lors de l’Exposition universelle de 1878, où il découvre les capteurs solaires de Mouchot. Dans Travail, le héros fonde une cité utopique où il rêve d’apporter l’électricité gratuitement : « le jour où il aurait donné à la Cité nouvelle l’électricité bienfaisante sans la mesurer ». S’il envisage d’abord les énergies fossiles, « l’épuisement possible du charbon » l’effraie. Il explore alors d’autres solutions, notamment l’énergie hydraulique, mais c’est le solaire qui s’impose comme l’unique voie d’émancipation humaine : « capter la chaleur solaire et la transformer […] en électricité ». Zola reprend ainsi l’utopie technique de Mouchot, voyant dans l’énergie solaire une source illimitée pour bâtir une société meilleure : « la Cité du bonheur et les hommes vivront […] sous le grand soleil bienfaisant, notre père à tous ». Une idée qui résonne aujourd’hui avec les projets de stockage thermique dans des châteaux d’eau.',
    'In 1901, Émile Zola published Travail, a science fiction novel inspired by the inventions of Auguste Mouchot. Zola had been interested in technical innovations since the 1870s, particularly after seeing Mouchot\'s solar collectors at the 1878 World\'s Fair. In Travail, the hero founds a utopian city where he dreams of providing free electricity: \"the day when he would give the new city beneficial electricity without measuring it.\" Although he initially considered fossil fuels, he was frightened by the \"possible depletion of coal.\" He then explored other solutions, notably hydraulic energy, but it was solar energy that emerged as the only path to human emancipation: \"capturing solar heat and transforming it [...] into electricity.\" Zola thus took up Mouchot\'s technical utopia, seeing solar energy as an unlimited source for building a better society: \"the City of Happiness, and men will live [...] under the great benevolent sun, our father to us all.\" This idea resonates today with thermal storage projects in water towers.',
    'Marcel Robert',
    'France',
    'France',
    46.603354,
    1.8883335,
    'images/IMG_3621.jpeg',
    '',
    '2026-02-12',
    'published',
    1,
    NULL,
    NULL,
    '2026-02-12 11:54:15',
    '2026-02-12 11:54:15'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770988001177',
    NULL,
    'Première cours \"oasis\" de Seine-Saint-Denis au collège Langevin-Wallon',
    '',
    '2020',
    'Ce projet, porté par le département Seine Saint-Denis, a pour objectif de créer des îlots de fraîcheur dans les cours des établissements scolaires. Pour ce faire sont installés des grands arbres, des fontaines ou encore des jeux d’e\tau. La première est inaugurée en 2020 au collège Langevin-Wallon de Rosny-sous-Bois. L’objectif est aussi de sensibiliser les élèves à l’environnement, dans le cas du collège de Rosny-sous-Bois, avec la présence d’une mare et d’un potager. Enfin, le sol perméable et drainant permet également à la cour oasis de retenir les eaux pluviales et de limiter leur apport dans les réseaux d’assainissement. Ce dispositif cours oasis a ensuite été déployé dans une quinzaine d’autres établissements scolaires du département entre 2020 et 2024 comme au collège Oum-Kalthoum de Montreuil, le collège Evariste-Galois de Sevran ou encore au collège Victor-Hugo de Noisy-le-Grand.  \n',
    '',
    'Atelier étudiants Paris 1',
    'Rosny-sous-Bois',
    '',
    48.8716626,
    2.4875193,
    '',
    'https://www.leparisien.fr/seine-saint-denis-93/des-cours-oasis-pour-eviter-les-coups-de-chaud-dans-les-colleges-de-seine-saint-denis-07-02-2020-8255130.php',
    '2026-02-13',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-13 13:06:41',
    '2026-02-13 13:06:41'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770988261628',
    NULL,
    'Lancement d’une étude pour étudier le potentiel de récupération de chaleur provenant des eaux usées en Seine-Saint-Denis',
    '',
    '2013',
    'Les eaux usées ont une température stable pendant l\'année, ce qui permet d’envisager de récupérer une partie de cette chaleur pour chauffer ou climatiser des bâtiments. Cette technologie est déjà utilisée en Suisse (ex: maison de retraite Hofmatt près de Bâle) et en Allemagne notamment.  Pour que cette technologie soit économiquement viable, le débit des eaux usées ne doit pas être inférieur à 10 à 12 l/s. Ce débit est souvent atteint proche des stations d’épuration, dans des zones éloignées des agglomérations. La chaleur est donc transmise à un échangeur de chaleur avant d’être réutilisée par des pompes à chaleur classiques. Une étude pour déterminer le potentiel de récupération de chaleur en Seine Saint-Denis a été réalisée en 2013, suivie d’une seconde étude en 2018. En 2019, une cartographie des réseaux où de la récupération de chaleur est envisageable a été réalisée. \n',
    '',
    'Groupama',
    'Seine-Saint-Denis',
    '',
    48.9098125,
    2.4528635,
    '',
    'https://astee-tsm.fr/articles/tsm-1-2-2020-petrucci/',
    '2026-02-13',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-13 13:11:01',
    '2026-02-13 13:11:01'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770988552186',
    NULL,
    'Programme TVGEP « Conception des Toitures Végétalisées pour la Gestion des Eaux Pluviales urbaines »',
    '',
    '2010',
    'L’agglomération parisienne est l’espace avec la plus grande proportion de sols artificialisés de France. Cela a pour effet de renforcer les dynamiques de ruissellements et d’augmenter le risque d’inondation. La végétalisation des toitures est un moyen de limiter ces ruissellements. En effet, lors des épisodes de précipitations, une partie de l’eau est évapotranspirée, une autre s’écoule et une autre reste dans l’horizon végétale et sera évapotranspirée ou écoulée ultérieurement. La présence d’une toiture végétalisée réduit donc la quantité d’eau ruisselée.  Le programme TVGEP “Conception des toitures Végétalisées pour la Gestion des Eaux Pluviales urbaines” encourage la mise en place de ce genre de toitures. Un exemple intéressant est la toiture de la Direction de l’Eau et de l’Assainissement du conseil général de la Seine-Saint-Denis à Rosny-sous-Bois qui est recouvert de 20cm de terre végétale et des graminés. Cette toiture permet de retenir 70% des précipitations annuelles. ',
    '',
    'Anastasia Guéguen',
    'France',
    '',
    46.603354,
    1.8883335,
    '',
    'https://www.cerema.fr/system/files/documents/2023/11/guide_des_toitures_terrasses_vegetalisees_et_gestion_des_eaux_pluviales_-_2017.pdf',
    '2026-02-13',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-13 13:15:52',
    '2026-02-13 13:15:52'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1770995246192',
    NULL,
    'Le moulin à marée à roue horizontale de Landounic',
    '',
    '585-588',
    'A Saint-Pol-de-Léon, dans le Finistère, ont été découverts les restes du plus ancien moulin à marée à roue horizontale d’Europe de l’ouest, celui de Landounic. Avant cette découverte, c\'était le moulin de Nemdrum en Irlande du Nord qui détenait ce titre avec une construction en 619. \nLe site de Landounic a été découvert fortuitement en 2002 puis des fouilles ont été réalisées en 2013. Des pièces en bois et en quartz formant autrefois un moulin, ainsi que les restes d’une digue ont été identifiés. Les pièces de bois ont été datées par dendrochronologie : la date la plus ancienne de mise en service du moulin a été estimée entre 585 et 588. De plus, d’autres datations ont permis de démontrer que le moulin avait suivi une restauration au début du VIIIe siècle, sa durée de fonctionnement a donc été de plus d’un siècle. \nLe moulin de Landounic était situé dans l’estuaire de la Penzé et recevait donc à la fois de l’eau douce et de l’eau de mer. Les moulins à marée sont présents dans toute l’Europe de l’Ouest depuis au moins le Moyen-Age. Ils fonctionnent avec un système de digues qui forment une retenue d’eau. A marée montante, la mer remplit le bassin. A marée descendante, l’eau est retenue dans le bassin par un système de vannes. C’est seulement lorsque la différence de niveau entre le bassin et la mer est assez importante que les vannes sont ouvertes et actionnent alors la roue du moulin, qui sert alors à moudre des céréales. \n',
    '',
    'Marc Guéguen',
    'Saint-Pol-de-Léon',
    '',
    48.6849601,
    -3.9868641,
    '',
    'https://hal.science/hal-03433688/document',
    '2026-02-13',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-13 15:07:26',
    '2026-02-13 15:07:26'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1771240444443',
    NULL,
    'Lancement de la collection BERGVATTNET par IKEA',
    '',
    '2025',
    'En 2025, l’enseigne suédoise IKEA lance la collection BERGVATTNET, centrée sur l’économie d’eau dans nos salles de bain. Dans cette gamme, on retrouve par exemple un saut de 8 litres, proposé par la designer Hanna-Kaarina Heikkilä et destiné à recueillir l’eau non-utilisée lorsqu’on attend que notre douche chauffe. Cette eau peut ensuite être réemployée, pour arroser des plantes par exemple. On retrouve également un compteur de douche indiquant, par le designer Marcus Arvonen, indiquant la consommation d’eau ainsi que la température. L’objectif est d’inviter les utilisateurs à prendre des douches plus courtes. ',
    '',
    'Loïc Rogard',
    'Suède',
    '',
    59.6749712,
    14.5208584,
    '',
    'https://www.ikea.com/fr/fr/new/collection-bergvattnet-pub373fc620/',
    '2026-02-16',
    'draft',
    1,
    NULL,
    NULL,
    '2026-02-16 11:14:04',
    '2026-02-16 11:14:04'
  );
INSERT INTO
  `cartels` (
    `id`,
    `created_by`,
    `titre`,
    `titre_en`,
    `annee`,
    `description`,
    `description_en`,
    `exhume_par`,
    `location`,
    `location_en`,
    `lat`,
    `lng`,
    `image_path`,
    `url_qr`,
    `date`,
    `status`,
    `visible`,
    `published_at`,
    `submitter_ip`,
    `created_at`,
    `updated_at`
  )
VALUES
  (
    '1771320250808',
    NULL,
    'Le projet de réaménagement du canal Saint-Denis. Noues et jardin d’eau.',
    'The Saint-Denis Canal redevelopment project. Floodplains and water gardens.',
    '2024',
    'A l’occasion des Jeux olympiques de Paris 2024, un projet de réaménagement du canal Saint-Denis est né. Il visait à ouvrir l’accès aux berges, à renforcer l’attractivité du territoire et faire de l’espace un lieu dédié à la mobilité douce. Les rives droite et gauche ont été aménagées et deux passerelles ont été installées tout en favorisant l’accès des personnes à mobilité réduite et la cohabitation de différents types de mobilités douces. Le bilan carbone a été limité par l’utilisation de matériaux biosourcés. Un jardin d’eau et des noues (fossés végétalisés permettant de récolter l’eau de ruissellement) permettent de maintenir le rôle du canal Saint-Denis dans la trame bleue de Plaine Commune, de renforcer l’effet d\'îlot de fraîcheur, de limiter le ruissellement et de favoriser la biodiversité. La gestion à ciel ouvert de l’eau permet de la rendre plus visible, et donc plus acceptable, pour les habitants. \n',
    'A redevelopment project for the Saint-Denis Canal was launched in preparation for the 2024 Paris Olympic Games. The aim was to open up access to the banks, enhance the area\'s appeal, and turn it into a space dedicated to soft mobility. The right and left banks were landscaped and two footbridges were installed, while promoting access for people with reduced mobility and the coexistence of different types of soft mobility. The carbon footprint was limited by the use of bio-based materials. A water garden and swales (vegetated ditches for collecting runoff water) help maintain the role of the Saint-Denis Canal in the Plaine Commune blue network, enhance the cooling effect, limit runoff, and promote biodiversity. Open water management makes it more visible and therefore more acceptable to residents. ',
    'Anastasia Guéguen',
    'Aubervilliers et Saint-Denis',
    'Aubervilliers and Saint-Denis',
    48.9117116,
    2.3822612,
    'images/2048px-Passerelle_Lucie_Brard_-_Saint-Denis_FR93_-_2024-07-18_-_1.jpg',
    ' https://www.ouvrages-olympiques.fr/canal-saint-denis',
    '2026-02-17',
    'published',
    1,
    NULL,
    NULL,
    '2026-04-14 22:29:19',
    '2026-04-14 22:29:19'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: categories
# ------------------------------------------------------------

INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'agriculture',
    'Agriculture',
    'Agriculture',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'biomimetisme',
    'Biomimétisme',
    'Biomimicry',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'deplacement',
    'Déplacement',
    'Travel',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'eclairage',
    'Éclairage',
    'Lighting',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'electricite',
    'Électricité',
    'Electricity',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'eolien',
    'Éolien',
    'Wind power',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'h2o',
    'H2O',
    'Water',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'hydrogene',
    'Hydrogène',
    'Hydrogen',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'imaginaire',
    'Imaginaire',
    'Imaginary',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'isolation-thermique',
    'Isolation thermique',
    'Thermal insulation',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'mecanique',
    'Mécanique',
    'Mechanics',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'rafraichir',
    'Rafraîchir',
    'Refresh',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'rechauffer',
    'Réchauffer',
    'Reheat',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'sante',
    'Santé',
    'Health',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );
INSERT INTO
  `categories` (
    `id`,
    `name`,
    `name_en`,
    `description`,
    `color`,
    `icon`,
    `created_at`
  )
VALUES
  (
    'solaire',
    'Solaire',
    'Solar',
    '',
    '#888888',
    '',
    '2026-04-14 22:29:19'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: partners
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: settings
# ------------------------------------------------------------

INSERT INTO
  `settings` (`key_name`, `value`, `updated_at`)
VALUES
  (
    'allow_anonymous_submit',
    'true',
    '2026-04-14 22:28:51'
  );
INSERT INTO
  `settings` (`key_name`, `value`, `updated_at`)
VALUES
  (
    'max_submissions_per_ip_total',
    '10',
    '2026-04-14 22:28:51'
  );
INSERT INTO
  `settings` (`key_name`, `value`, `updated_at`)
VALUES
  (
    'max_submissions_per_ip_window',
    '3',
    '2026-04-14 22:28:51'
  );
INSERT INTO
  `settings` (`key_name`, `value`, `updated_at`)
VALUES
  ('openai_key', '', '2026-04-14 22:28:51');
INSERT INTO
  `settings` (`key_name`, `value`, `updated_at`)
VALUES
  (
    'submission_window_minutes',
    '60',
    '2026-04-14 22:28:51'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: subsite_partners
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: subsites
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workshop_cartels
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workshops
# ------------------------------------------------------------


/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
