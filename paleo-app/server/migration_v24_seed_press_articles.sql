-- ============================================================
-- v24 — Seed des articles de presse (page publique /presse)
-- ------------------------------------------------------------
-- Importe les 31 articles repris du WordPress historique
-- paleo-energetique.org/presse/ vers la table press_articles.
--
-- Idempotent : guard WHERE NOT EXISTS sur le titre, donc relancer cette
-- migration ne crée pas de doublons. Les éventuelles modifications de
-- contenu faites en admin entre temps ne sont PAS écrasées.
--
-- Les vignettes (thumbnail_path) restent NULL : à uploader via l'admin
-- /app/admin/press après le seed, ou à compléter avec un seed séparé
-- (cf. seed-content/press/thumbnails/).
--
-- À exécuter une fois en local et en prod.
-- ============================================================

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Retro Tech: When the past inspires innovation for a sustainable future' AS c_title, 'Paris&Co' AS c_source, '2021-03-01' AS c_pubdate, 'https://www.parisandco.com/News/Monitoring-Innovation/Retro-Tech-When-the-past-inspires-innovation-for-a-sustainable-future' AS c_url, NULL AS c_excerpt, 10 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Retro Tech: When the past inspires innovation for a sustainable future');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Léonard : Paléo-inspiration — réussir la transition énergétique grâce aux innovations d''hier' AS c_title, 'Léonard / Vinci' AS c_source, '2020-09-11' AS c_pubdate, 'https://leonard.vinci.com/paleo-inspiration-reussir-la-transition-energetique-grace-aux-innovations-dhier/' AS c_url, NULL AS c_excerpt, 20 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Léonard : Paléo-inspiration — réussir la transition énergétique grâce aux innovations d''hier');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Drôles de machines' AS c_title, 'Le Monde diplomatique' AS c_source, '2019-08-01' AS c_pubdate, 'https://www.monde-diplomatique.fr/2019/08/MONTJOYE/60140' AS c_url, NULL AS c_excerpt, 30 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Drôles de machines');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Cédric Carles, le designer fédérateur d''énergies' AS c_title, 'Le Monde' AS c_source, '2019-06-29' AS c_pubdate, 'https://www.lemonde.fr/sciences/article/2019/06/29/cedric-carles-le-designer-federateur-d-energies_5483243_1650684.html' AS c_url, NULL AS c_excerpt, 40 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Cédric Carles, le designer fédérateur d''énergies');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Cédric Carles de retour à l''école' AS c_title, 'La Nouvelle République' AS c_source, '2020-03-26' AS c_pubdate, 'https://www.lanouvellerepublique.fr/indre-et-loire/commune/cinq-mars-la-pile/cedric-carles-de-retour-a-l-ecole' AS c_url, NULL AS c_excerpt, 50 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Cédric Carles de retour à l''école');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Cédric Carles : « Transition P2 Retrofutur »' AS c_title, 'RTBF — La Première' AS c_source, '2020-02-15' AS c_pubdate, 'https://www.rtbf.be/auvio/detail_tendances-premiere?id=2460708' AS c_url, NULL AS c_excerpt, 60 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Cédric Carles : « Transition P2 Retrofutur »');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Comment répondre à la crise énergétique ?' AS c_title, 'RTS — Radio Suisse Romande' AS c_source, '2020-02-04' AS c_pubdate, 'https://www.rts.ch/play/radio/versus-lire-et-penser/audio/comment-repondre-a-la-crise-energetique?id=10154548' AS c_url, NULL AS c_excerpt, 70 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Comment répondre à la crise énergétique ?');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Paleo-energy, a counter-history of energy' AS c_title, 'We Make Money Not Art' AS c_source, '2020-01-02' AS c_pubdate, NULL AS c_url, NULL AS c_excerpt, 80 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Paleo-energy, a counter-history of energy');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Le passé révèle son lot d''innovations inspirantes' AS c_title, '24 heures (Suisse)' AS c_source, '2019-12-29' AS c_pubdate, 'https://www.24heures.ch/culture/livres/revele-lot-innovations-inspirantes/story/14174454' AS c_url, NULL AS c_excerpt, 90 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Le passé révèle son lot d''innovations inspirantes');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Huit inventions d''hier incroyablement modernes' AS c_title, 'Ouest France' AS c_source, '2019-12-28' AS c_pubdate, 'https://www.ouest-france.fr/leditiondusoir/data/39977/reader/reader.html' AS c_url, NULL AS c_excerpt, 100 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Huit inventions d''hier incroyablement modernes');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Chronique du livre Rétrofutur' AS c_title, 'Le Temps' AS c_source, '2018-12-01' AS c_pubdate, 'https://assets.letemps.ch/sites/default/files/20181201-le_temps_we.pdf' AS c_url, NULL AS c_excerpt, 110 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Chronique du livre Rétrofutur');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Les leçons du passé technologique' AS c_title, 'Le Monde — Sciences' AS c_source, '2018-10-24' AS c_pubdate, 'https://www.lemonde.fr/sciences/article/2018/10/24/les-lecons-du-passe-technologique_5373669_1650684.html' AS c_url, 'Le collectif Paléo-énergétique écrit une histoire alternative de l''énergie en revisitant des innovations oubliées.' AS c_excerpt, 120 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Les leçons du passé technologique');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Pourquoi une contre-histoire des innovations énergétiques ?' AS c_title, 'RFI' AS c_source, '2018-09-24' AS c_pubdate, 'http://www.rfi.fr/emission/20180924-pourquoi-contre-histoire-innovations-energetiques' AS c_url, NULL AS c_excerpt, 130 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Pourquoi une contre-histoire des innovations énergétiques ?');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Les nouvelles technologies vous fatiguent ? Penchez-vous sur les vieilles !' AS c_title, 'L''Obs' AS c_source, '2018-09-23' AS c_pubdate, 'https://www.nouvelobs.com/planete/20180918.OBS2518/les-nouvelles-technologies-vous-fatiguent-penchez-vous-sur-les-vieilles.html' AS c_url, NULL AS c_excerpt, 140 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Les nouvelles technologies vous fatiguent ? Penchez-vous sur les vieilles !');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Regen Box ou la régénération des piles alcalines' AS c_title, 'Intel IQ' AS c_source, '2016-11-05' AS c_pubdate, 'https://iq.intel.fr/regen-box-ou-la-regeneration-des-piles-alcalines/' AS c_url, 'Et si les piles alcalines n''étaient pas à usage unique ?' AS c_excerpt, 150 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Regen Box ou la régénération des piles alcalines');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Le secret industriel bien gardé des piles alcalines : elles sont rechargeables !' AS c_title, 'Mr Mondialisation' AS c_source, '2016-11-01' AS c_pubdate, 'http://mrmondialisation.org/le-secret-industriel-bien-garde-des-piles-alcalines' AS c_url, NULL AS c_excerpt, 160 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Le secret industriel bien gardé des piles alcalines : elles sont rechargeables !');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'C''est pas du vent — Interview RegenBox / Paléo-Énergétique' AS c_title, 'RFI — C''est pas du vent' AS c_source, '2016-10-18' AS c_pubdate, 'https://paleo-energetique.org/wp-content/uploads/2016/10/rfi-cest-pas-du-vent-regenbox-paleo-energetique.mp3' AS c_url, NULL AS c_excerpt, 170 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'C''est pas du vent — Interview RegenBox / Paléo-Énergétique');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Recharger les piles « jetables » ? C''est possible avec Regen Box !' AS c_title, 'Conso Collaborative' AS c_source, '2016-09-26' AS c_pubdate, 'http://consocollaborative.com/article/reutiliser-les-piles-jetables-jusqua-20-fois-ils-croient-que-cest-possible/' AS c_url, NULL AS c_excerpt, 180 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Recharger les piles « jetables » ? C''est possible avec Regen Box !');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'RegenBox dans Les Grosses Têtes' AS c_title, 'RTL — Les Grosses Têtes' AS c_source, '2016-09-20' AS c_pubdate, 'https://paleo-energetique.org/wp-content/uploads/2016/09/interview-les-grosses-tetes.mp3' AS c_url, 'Regen Box est quand-même une invention de dingue.' AS c_excerpt, 190 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'RegenBox dans Les Grosses Têtes');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'La Regen Box redonne vie aux piles non rechargeables' AS c_title, 'Mega-piles.com' AS c_source, '2016-09-20' AS c_pubdate, 'http://www.mega-piles.com/news/regen-box-recharge-piles-alcalines-749' AS c_url, NULL AS c_excerpt, 200 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'La Regen Box redonne vie aux piles non rechargeables');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Piles… n''en jetez plus !' AS c_title, 'Le Parisien Magazine' AS c_source, '2016-09-16' AS c_pubdate, 'http://www.leparisien.fr/magazine/grand-angle/le-parisien-magazine-piles-n-en-jetez-plus-16-09-2016-6120213.php' AS c_url, 'Les batteries alcalines jetables peuvent en réalité servir de cinq à dix fois.' AS c_excerpt, 210 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Piles… n''en jetez plus !');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Esprit d''initiative — Et si les bonnes idées se trouvaient dans les inventions oubliées ?' AS c_title, 'France Inter — Esprit d''initiative' AS c_source, '2016-09-13' AS c_pubdate, 'https://paleo-energetique.org/wp-content/uploads/2016/09/france-inter-paleoenergie.mp3' AS c_url, NULL AS c_excerpt, 220 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Esprit d''initiative — Et si les bonnes idées se trouvaient dans les inventions oubliées ?');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Cédric Carles : « On a toujours innové en période de crise »' AS c_title, 'Le Monde' AS c_source, '2016-08-05' AS c_pubdate, 'http://www.lemonde.fr/tant-de-temps/article/2016/08/05/cedric-carles-on-a-toujours-innove-en-periode-de-crise_4978663_4598196.html' AS c_url, NULL AS c_excerpt, 230 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Cédric Carles : « On a toujours innové en période de crise »');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'La méthodologie Paléo dans « Jouer avec les futurs »' AS c_title, 'Jouer avec les futurs' AS c_source, '2016-07-15' AS c_pubdate, NULL AS c_url, NULL AS c_excerpt, 240 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'La méthodologie Paléo dans « Jouer avec les futurs »');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Paléo-Énergétique : et si les solutions étaient dans le passé ?' AS c_title, 'Consoglobe' AS c_source, '2016-06-22' AS c_pubdate, 'http://www.consoglobe.com/paleo-energetique-cg' AS c_url, 'Et si des solutions énergétiques d''avenir pouvaient se trouver dans le passé ?' AS c_excerpt, 250 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Paléo-Énergétique : et si les solutions étaient dans le passé ?');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Enquête sur l''histoire de l''innovation énergétique' AS c_title, 'AXA — News to Protect' AS c_source, '2016-03-02' AS c_pubdate, 'https://www.newstoprotect.axa/recherche-innovation/enquete-histoire-innovation-energetique' AS c_url, NULL AS c_excerpt, 260 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Enquête sur l''histoire de l''innovation énergétique');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Publication d''un e-book Paléo-Énergétique avec Éric Dussert et Le Livroscope' AS c_title, 'Le Livroscope / L''Œil d''or' AS c_source, '2016-01-21' AS c_pubdate, NULL AS c_url, 'E-book gratuit publié à l''ouverture de la COP21.' AS c_excerpt, 270 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Publication d''un e-book Paléo-Énergétique avec Éric Dussert et Le Livroscope');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Paléo-Énergétique dans Enerpress Magazine' AS c_title, 'Enerpress Magazine' AS c_source, '2015-08-10' AS c_pubdate, NULL AS c_url, NULL AS c_excerpt, 280 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Paléo-Énergétique dans Enerpress Magazine');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Paléo-Énergétique sur Radio Nova avec Côme Bastin' AS c_title, 'Radio Nova' AS c_source, '2015-06-23' AS c_pubdate, NULL AS c_url, NULL AS c_excerpt, 290 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Paléo-Énergétique sur Radio Nova avec Côme Bastin');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Paléo-Énergétique sur Ushuaïa TV — Le Mag' AS c_title, 'Ushuaïa TV — Le Mag' AS c_source, '2015-06-13' AS c_pubdate, NULL AS c_url, NULL AS c_excerpt, 300 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Paléo-Énergétique sur Ushuaïa TV — Le Mag');

INSERT INTO press_articles (`title`, `source`, `published_date`, `url`, `excerpt`, `display_order`, `is_published`)
SELECT * FROM (SELECT 'Les pionniers oubliés de l''énergie' AS c_title, 'We Demain n°9' AS c_source, '2015-02-23' AS c_pubdate, NULL AS c_url, NULL AS c_excerpt, 310 AS c_order, 1 AS c_published) AS t
WHERE NOT EXISTS (SELECT 1 FROM press_articles WHERE title = 'Les pionniers oubliés de l''énergie');
