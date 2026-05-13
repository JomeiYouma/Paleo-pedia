-- ============================================================
-- v17 — Contact de soumission sur les cartels
-- ------------------------------------------------------------
-- Ajoute la colonne `submitter_contact` à la table `cartels`.
-- Email ou téléphone laissé par le soumissionnaire (visiteur
-- anonyme obligatoire, admin optionnel s'il saisit pour un tiers).
-- Le code applicatif référence déjà cette colonne, mais elle
-- n'avait jamais été créée hors de schema_mysql.sql.
--
-- À exécuter une fois en local et en prod.
-- ============================================================

ALTER TABLE `cartels`
  ADD COLUMN `submitter_contact` VARCHAR(255) NULL DEFAULT NULL AFTER `submitter_ip`;
