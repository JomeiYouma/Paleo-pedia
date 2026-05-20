-- ============================================================
-- v21 — Missions de la page publique /participer
-- ------------------------------------------------------------
-- Crée la table `missions` et sème les 11 missions historiques
-- de paleo-energetique.org/participer/.
--
-- Chaque mission est une carte dépliable sur la page publique.
-- Admin via /app/admin/missions (CRUD + réordonnancement).
--
-- À exécuter une fois en local et en prod.
-- ============================================================

CREATE TABLE IF NOT EXISTS `missions` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `theme`          VARCHAR(120)  NOT NULL,                       -- ex: "Recherche", "Intelligence collective", "Ingénierie"
  `name`           VARCHAR(255)  NOT NULL,                       -- ex: "À la recherche de femmes oubliées"
  `name_en`        VARCHAR(255)  NULL DEFAULT NULL,
  `text`           TEXT          NULL DEFAULT NULL,              -- HTML autorisé
  `text_en`        TEXT          NULL DEFAULT NULL,
  `link_url`       VARCHAR(500)  NULL DEFAULT NULL,              -- optionnel
  `link_label`     VARCHAR(255)  NULL DEFAULT NULL,
  `display_order`  INT           NOT NULL DEFAULT 0,
  `is_published`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_missions_publish` (`is_published`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed : 11 missions historiques ─────────────────────────────
-- Évite les doublons si on relance la migration sur une base déjà semée.
INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Intelligence collective' AS theme,
  'À la recherche de femmes oubliées' AS name,
  '<p><strong>Mission :</strong> Après toutes ces années de recherche nous nous sommes rendus compte que nous ne comptions qu''une seule femme dans notre frise ! Nous souhaitons aujourd''hui équilibrer les choses. Menez avec nous ce travail de recherche et aidez-nous à exhumer le travail de ces femmes encore invisibles mais forcément nombreuses. L''appel concerne toutes inventions ayant un lien avec l''énergie : un panneau solaire, une machine à laver, une lampe, un nouveau type de voiture, etc. Vous pouvez nous aider en cherchant des inventions mais aussi en diffusant l''appel dans votre entourage ou sur les réseaux.</p><p>N''hésitez pas à nous contacter pour toutes précisions concernant cette mission.</p><p><strong>Pour qui :</strong> Pour tout le monde !</p>' AS text,
  0 AS display_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'À la recherche de femmes oubliées');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Intelligence collective',
  'Partagez nos projets !',
  '<p><strong>Mission :</strong> Invitez vos ami·es sur les réseaux sociaux, partagez nos pages et nos posts. Pour ceux qui n''auraient pas accès à internet, pas de panique, vous pouvez aussi imprimer et afficher le poster « Appel à participation » dans votre quartier, votre lieu de travail, votre école, vos bureaux. Vous pouvez le télécharger sur cette page.</p><p><strong>Pour qui :</strong> Toute personne intéressée par la thématique des paléo-inventions.</p>',
  1
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Partagez nos projets !');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Projet de recherche collaboratif et citoyen',
  '<p><strong>Mission :</strong> Dans le cadre de Paléo-énergétique, notre projet de recherche collaboratif et citoyen dans le domaine de l''énergie, nous recherchons d''anciennes inventions, d''anciennes innovations sociales ou encore des imaginaires collectifs !</p><p><strong>Pour qui :</strong> Toute personne intéressée par la thématique. Il suffit de savoir faire des recherches sur internet et des recherches d''archives.</p>',
  2
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Projet de recherche collaboratif et citoyen');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Expertise énergétique',
  '<p><strong>Mission :</strong> Dans le cadre de cette mission nous avons besoin d''une expertise énergétique d''un projet datant de 1945. En effet, dans la région angevine, M. L. Hubault et M. G. Dubled ont mis au point un camion Saurer roulant à l''hydrogène. L''hydrogène était fabriquée grâce à une dynamo installée dans leur moulin à eau. Quelques années plus tard, Jean-Luc Perrier, professeur de physique à l''université catholique d''Angers, prototype un concentrateur solaire de 50 kW pouvant transformer l''énergie solaire en hydrogène par électrolyse de l''eau. Le concentrateur chauffait de l''eau en son foyer central et la vapeur sous pression produite faisait tourner une génératrice électrique nécessaire au processus. Un véhicule modifié selon le principe des équipements G.P.L. pouvait ainsi tourner en ne rejetant que de la vapeur d''eau. L''hydrogène pure en combustion directe dans les véhicules équipés de moteurs thermiques fonctionne donc bien, même si certains réglages ou adaptation de pièces sont nécessaires.</p><p>Considéré comme un vecteur énergétique intéressant au regard du stockage nécessaire des énergies renouvelables dû à leur intermittence, l''hydrogène redevient une technologie intéressante et en développement.</p><p>Dans les véhicules utilisant l''hydrogène, on pense systématiquement que ce sont les piles à combustible qui assurent la transformation en énergie mécanique. Or, ne peut-on pas utiliser directement l''hydrogène comme combustible ? Pourquoi l''écosystème industriel des moteurs à combustion / garages / SAV ainsi que tous les emplois et les compétences associés ne pourraient pas s''adapter à cette nouvelle donne énergétique et ainsi proposer des innovations de transition ?</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans les domaines de la physique-chimie, de l''énergétique et/ou de l''histoire des techniques en lien avec l''hydrogène.</p>',
  3
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Expertise énergétique');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Enquête sur le camion Saurer',
  '<p><strong>Mission :</strong> En 1945, M. L. Hubault et M. G. Dubled ont mis au point un camion Saurer roulant à l''hydrogène ! (descriptif de l''invention sur la frise paléo) Afin de nous aider dans nos recherches, vous pouvez contacter ou chercher directement des informations et des images aux archives d''Angers sur cette thématique.</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans le domaine de l''histoire, l''histoire des techniques.</p>',
  4
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Enquête sur le camion Saurer');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Ingénierie',
  'La révolution silencieuse de l''hydrogène',
  '<p><strong>Mission :</strong> Proposer des petites unités de stockage de l''hydrogène, pour le milieu urbain. L''hydrogène est en passe de devenir un vecteur énergétique au même titre que l''électricité ou la chaleur. Après une première phase de développement dédiée aux technologies tournées vers les transports, ce vecteur a petit à petit pris une place de plus en plus centrale dans un paysage où la capacité de stocker et transporter l''énergie devient prioritaire. À l''instar du vecteur électrique, son utilisation peut se décliner sur tous les usages, qu''ils soient stationnaires ou mobiles. Les technologies de production, de stockage et de conversion de l''hydrogène sont aujourd''hui (pour la plupart) maîtrisées. La compétitivité peut être au rendez-vous dans un avenir proche, surtout si la mise en place d''une véritable politique de promotion des énergies propres se met en place.</p><p>Dans ce contexte, quel est le rôle que peut jouer l''innovation collaborative citoyenne ? Proposer des petites unités de stockage de l''hydrogène, pour le milieu urbain.</p><p><em>Exemple :</em> l''hydrogène sera produit par catalyse de l''eau à basse température, le rendement énergétique est de 35 %. L''énergie nécessaire proviendrait de PV. Le principal avantage d''un tel système est de pallier à l''intermittence de cette énergie. Couplé à une pile à combustible, ce dispositif énergétique apporterait un appoint constant d''énergie pour par exemple remplacer les groupes électrogènes nécessaires à certains événements.</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans le domaine de l''ingénierie, de la physique, du marché de l''énergie ou de la production de dihydrogène.</p>',
  5
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'La révolution silencieuse de l''hydrogène');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Enquête sur un générateur disparu',
  '<p><strong>Mission :</strong> Alors qu''il était commercialisé, le régénérateur de Karl Kordesch a vu sa production arrêtée. Pourquoi le Régénérateur Renewal a-t-il disparu ? Problème de rentabilité ? Un des fournisseurs d''un des composants du boîtier a-t-il fait faillite ? Le mystère reste entier…</p><p><strong>Pour qui :</strong> Toute personne passionnée ou travaillant dans le domaine de l''électronique, du journalisme, de l''histoire des techniques ou de l''histoire en général.</p>',
  6
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Enquête sur un générateur disparu');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'La bactérie de Jean Laigret',
  '<p><strong>Mission :</strong> Depuis le début du XIX<sup>e</sup> siècle, deux théories sur l''origine du pétrole s''affrontent. La plus communément admise, la théorie biotique, stipule que le pétrole se forme par la lente transformation de détritus biologique. En 1947, Jean Laigret annonce pouvoir reproduire du pétrole à partir de déchets organiques. Dans son laboratoire de l''institut Pasteur de Tunis, il a identifié la bactérie qui transforme différents déchets organiques en pétrole. Dans le cadre de cette mission, recherchez des informations dans les archives afin de nous permettre de déterminer si un modèle industriel peut être mis en place, si le modèle est économiquement viable, et enfin quelle est la qualité du pétrole produit.</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans le domaine de la gestion, la biologie ou la biotechnologie.</p>',
  7
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'La bactérie de Jean Laigret');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Stockage d''énergie',
  '<p><strong>Mission :</strong> Dans le cadre d''un focus sur le stockage d''énergie, nous recherchons les innovations et les technologies, objets, méthodes, mécanismes sociaux… permettant le stockage et la répartition énergétique.</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans le domaine de l''ingénierie, la thermique, la sociologie, le design…</p>',
  8
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Stockage d''énergie');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Retrouvez dans les archives des photos d''expositions universelles',
  '<p><strong>Mission :</strong> Retrouvez les photos prises par l''un des écrivains les plus documentés du XIX<sup>e</sup> siècle. Nous savons de source sûre que l''un des principaux photographes des Expositions Universelles de 1900 à Paris est Émile Zola ! La mission consiste à aller consulter ces photos (elles sont conservées à la BNF…) et notamment à chercher des photos des inventions d''Abel Mouchot, et des autres inventeurs qui travaillaient à l''époque sur l''énergie solaire.</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans le domaine du design, de l''histoire et de la photographie ancienne.</p>',
  9
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Retrouvez dans les archives des photos d''expositions universelles');

INSERT INTO `missions` (`theme`, `name`, `text`, `display_order`)
SELECT * FROM (SELECT
  'Recherche',
  'Retrouvez dans les archives la correspondance d''Émile Zola',
  '<p><strong>Mission :</strong> Retrouvez dans les correspondances d''Émile Zola ses rapports avec des ingénieurs et des inventeurs de l''époque. Lors de l''écriture du <em>Travail</em> entre 1900 et 1901, Zola a nécessairement dû faire appel à de nombreux ingénieurs pour qu''ils lui expliquent le fonctionnement de leurs machines en vue de leur description dans le roman. Il doit sûrement exister des documents remarquables pour comprendre l''état d''esprit de ces inventeurs.</p><p><strong>Pour qui :</strong> Toute personne passionnée, travaillant ou ayant des connaissances dans le domaine de l''histoire ou des lettres. Un accès aux archives ou aux intégrales de la correspondance d''Émile Zola serait un plus pour faciliter les recherches.</p>',
  10
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `missions` WHERE name = 'Retrouvez dans les archives la correspondance d''Émile Zola');
