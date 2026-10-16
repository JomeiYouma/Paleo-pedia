-- ============================================================
-- v37 — Visibilité d'un sous-site
-- ------------------------------------------------------------
-- Nouvelle colonne `subsites.visibility`, choisie à la création ou à
-- l'édition d'un sous-site (superadmin) :
--   - 'listed'   : public et listé (vitrine paleo-pedia, menu
--                  « Thématiques » du site principal) — comportement
--                  historique, d'où la valeur par défaut ;
--   - 'unlisted' : public mais listé nulle part (accès par le lien seul) ;
--   - 'admin'    : réservé aux superadmins et aux comptes rattachés au
--                  sous-site ; « introuvable » pour tout autre visiteur.
--
-- Les cartels d'un sous-site 'admin' déjà acceptés sur la frise
-- principale y restent visibles (cf. lib/subsiteVisibility.js).
--
-- Idempotent : l'ALTER n'est appliqué que si la colonne est absente
-- (testé via INFORMATION_SCHEMA).
--
-- À exécuter une fois en local et en prod, AVANT de démarrer le back.
-- ============================================================

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subsites'
    AND COLUMN_NAME = 'visibility'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `subsites`
     ADD COLUMN `visibility`
       ENUM(''listed'',''unlisted'',''admin'')
       NOT NULL DEFAULT ''listed'' AFTER `planet_type`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
