-- ============================================================
-- v36 — Mémoriser le statut d'origine d'un cartel archivé
-- ------------------------------------------------------------
-- Le statut d'un cartel est un enum mutuellement exclusif
-- (draft / pending_review / published / archived). Archiver un
-- brouillon écrasait donc l'information « c'était un brouillon ».
--
-- On ajoute `archived_from` : au moment où un cartel passe en
-- `archived`, on y stocke le statut qu'il avait juste avant
-- (draft, pending_review ou published). Cela permet d'afficher
-- une pastille « Brouillon » / « En attente » dans l'onglet
-- Archivés (cf. ManageCartels) et de savoir dans quel état le
-- cartel se retrouvera si on le désarchive.
--
-- NULL = jamais archivé (ou archivé avant cette migration). La
-- colonne est remise à NULL dès qu'un cartel quitte l'état
-- archivé (cf. CartelModel.setStatus).
--
-- Idempotent : l'ALTER n'est appliqué que si la colonne est
-- absente (testé via INFORMATION_SCHEMA).
--
-- À exécuter une fois en local et en prod.
-- ============================================================

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cartels'
    AND COLUMN_NAME = 'archived_from'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `cartels`
     ADD COLUMN `archived_from`
       ENUM(''draft'',''pending_review'',''published'')
       NULL DEFAULT NULL AFTER `status`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
