-- ============================================================
-- v28 — Page d'accueil bilingue des sous-sites
-- ------------------------------------------------------------
-- Ajoute la colonne `content_blocks_en` à la table `subsites`.
-- Version anglaise (optionnelle) des blocs de la page d'accueil.
-- Si NULL/vide, le rendu retombe sur `content_blocks` (FR).
-- Idempotent-ish : à n'exécuter qu'une fois (ADD COLUMN échoue si déjà présent).
-- ============================================================

ALTER TABLE `subsites`
  ADD COLUMN `content_blocks_en` LONGTEXT NULL DEFAULT NULL AFTER `content_blocks`;
