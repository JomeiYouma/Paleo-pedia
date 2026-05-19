-- ============================================================
-- v20 — Normalisation des graphies dans `cartels.exhume_par`
-- ------------------------------------------------------------
-- Le champ `exhume_par` est saisi librement et contient plusieurs
-- variantes du même nom (accents oubliés, majuscules erratiques).
-- La page Stats fusionne désormais les variantes côté JS (cf.
-- Cartel.js#getStats, normalisation accent-insensitive), mais on
-- aligne aussi les données brutes pour que l'admin/les exports
-- voient la graphie canonique.
--
-- REPLACE() de MySQL est byte-safe (donc case- et accent-sensitive),
-- on peut remplacer chaque variante sans toucher les autres. Le
-- WHERE LIKE n'est là que pour limiter le scan ; il est large
-- (case-insensitive selon la collation) mais inoffensif puisque
-- REPLACE ne modifie que les sous-chaînes exactement identiques.
--
-- À exécuter une fois en prod (et en local si besoin). Idempotent :
-- relancer la migration ne change plus rien.
-- ============================================================

-- 1. Cédric Carles
UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Cedric Carles', 'Cédric Carles')
 WHERE `exhume_par` LIKE '%Cedric Carles%';

UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Cédric CARLES', 'Cédric Carles')
 WHERE `exhume_par` LIKE '%Cédric CARLES%';

-- 2. Raphaël Luciani-Galais
UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Raphael Luciani-Galais', 'Raphaël Luciani-Galais')
 WHERE `exhume_par` LIKE '%Raphael Luciani-Galais%';

UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Raphaël Luciani-galais', 'Raphaël Luciani-Galais')
 WHERE `exhume_par` LIKE '%Raphaël Luciani-galais%';

-- 3. Loïc Rogard
UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Loic Rogard', 'Loïc Rogard')
 WHERE `exhume_par` LIKE '%Loic Rogard%';

-- 4. Raphaël Madoré
UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Raphaël MADORÉ', 'Raphaël Madoré')
 WHERE `exhume_par` LIKE '%Raphaël MADORÉ%';

-- 5. Marie-Haude Caraës
UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Marie-Haude Caraes', 'Marie-Haude Caraës')
 WHERE `exhume_par` LIKE '%Marie-Haude Caraes%';

-- 6. Vincent Offio
UPDATE `cartels`
   SET `exhume_par` = REPLACE(`exhume_par`, 'Vincent OFFIO', 'Vincent Offio')
 WHERE `exhume_par` LIKE '%Vincent OFFIO%';
