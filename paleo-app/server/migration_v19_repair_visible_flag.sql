-- ============================================================
-- v19 — Réparation des cartels publiés invisibles
-- ------------------------------------------------------------
-- Symptôme : des cartels en `status='published'` n'apparaissent
-- pas chez les utilisateurs non-admin (ex. « Funiculaire de
-- Fribourg »).
--
-- Cause : la colonne legacy `visible` est censée suivre `status`
-- mais `Cartel.update()` ne la synchronise pas (seules `create()`
-- et `setStatus()` le font). Tout cartel passé en `published` via
-- un PUT classique reste avec `visible=0`. Library.jsx filtrait
-- les anonymes sur `c.status === 'published' && c.visible`, ce
-- qui masquait ces cartels.
--
-- Correctif code : le filtre frontend a été ramené à
-- `c.status === 'published'` (le serveur garantit déjà ce statut
-- pour les non-admins). Cette migration aligne les données pour
-- garder la colonne cohérente avec le statut, au cas où elle
-- serait encore consultée ailleurs.
--
-- À exécuter une fois en prod (et en local si besoin).
-- ============================================================

UPDATE `cartels`
   SET `visible` = 1
 WHERE `status` = 'published'
   AND `visible` = 0;

UPDATE `cartels`
   SET `visible` = 0
 WHERE `status` <> 'published'
   AND `visible` = 1;
