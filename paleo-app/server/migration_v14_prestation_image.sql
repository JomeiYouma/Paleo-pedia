-- ============================================================
-- paleo-energetique — Migration v14 : prestations.image_path
-- Ajoute une colonne image_path pour permettre d'afficher une photo
-- en illustration de chaque card de prestation.
-- À exécuter UNE SEULE FOIS sur la BDD via PhpMyAdmin.
-- ============================================================

SET NAMES utf8mb4;

ALTER TABLE `prestations`
  ADD COLUMN `image_path` VARCHAR(500) NULL DEFAULT NULL
  AFTER `bullet_points`;
