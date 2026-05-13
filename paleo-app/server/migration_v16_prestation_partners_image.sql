-- ============================================================
-- v16 — Bandeau logos partenaires sur les prestations
-- ------------------------------------------------------------
-- Ajoute une seconde image optionnelle par prestation, destinée
-- à afficher les logos « Ils nous ont fait confiance » à droite
-- du texte sur la page publique /prestations.
--
-- À exécuter une fois en prod, puis à fusionner dans
-- schema_mysql.sql (déjà fait côté repo).
-- ============================================================

ALTER TABLE `prestations`
  ADD COLUMN `partners_image_path` VARCHAR(500) NULL DEFAULT NULL AFTER `image_path`;
