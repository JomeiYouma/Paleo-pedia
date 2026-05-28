-- ============================================================
-- v25 — Seed des membres de l'équipe (page publique « À propos »)
-- ------------------------------------------------------------
-- Importe les 68 membres repris du WordPress historique
-- paleo-energetique.org/team/ vers la table team_members :
--   - 7 membres « main » (équipe principale)
--   - 61 membres « secondary » (communauté de chercheur·euses,
--     avec photos compactes — la page d'origine ne distingue pas
--     visuellement de sous-groupes au sein de la communauté).
--
-- Idempotent : guard WHERE NOT EXISTS sur le nom, donc relancer cette
-- migration ne crée pas de doublons. Les éventuelles modifications faites
-- en admin entre temps ne sont PAS écrasées.
--
-- Pré-requis photos : copier le dossier upload_dev/team/*.jpg|*.jpeg|*.png
-- dans /home/madore/paleo-uploads/ (les fichiers y sont servis à plat via
-- /api/images/<filename> par express.static dans server.js).
--
-- 2 membres sont sans photo (Ariane ROZO, Frédéric Caille) : photo_path NULL.
--
-- À exécuter une fois en local et en prod.
-- ============================================================

-- ── Équipe principale ──────────────────────────────────────

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Cédric Carles' AS c_name, 'Designer / Chercheur' AS c_role, 'hello@paleo-energetique.org' AS c_bio, '/api/images/cedric-carles.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.facebook.com/solarsoundsystem3S' AS c_other, 10 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Cédric Carles');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Loïc Rogard' AS c_name, 'Chercheur et Animateur' AS c_role, 'Master recherche histoire des énergies, Paris Diderot
Master 2 Approche interdisciplinaire des énergies (LIED), Paris Diderot' AS c_bio, '/api/images/loic-rogard.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.facebook.com/Roogggg' AS c_other, 20 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Loïc Rogard');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Simona Iliycheva' AS c_name, 'Coordinatrice' AS c_role, NULL AS c_bio, '/api/images/simona-iliycheva.png' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 30 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Simona Iliycheva');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Simon Bouchaudy' AS c_name, 'Designer pédagogique' AS c_role, 'Master de création industrielle à l''ENSCI-les Ateliers.
La plupart de ses projets questionnent notre rapport à la production d’énergie et propose de nouveaux imaginaires autour des énergies renouvelables.' AS c_bio, '/api/images/simon-bouchaudy.jpg' AS c_photo, 'https://www.linkedin.com/in/simon-bouchaudy/' AS c_linkedin, 'https://simonbouchaudy.com/' AS c_website, NULL AS c_other, 40 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Simon Bouchaudy');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Anaïs Chazel' AS c_name, 'chercheuse et animatrice' AS c_role, NULL AS c_bio, '/api/images/anais-chazel.jpg' AS c_photo, 'https://www.linkedin.com/in/anas-chazel' AS c_linkedin, NULL AS c_website, NULL AS c_other, 50 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Anaïs Chazel');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Eric Dussert' AS c_name, 'Numérisation des imprimés, BNF, Ecrivain' AS c_role, NULL AS c_bio, '/api/images/eric-dussert.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://gonzai.com/eric-dussert-le-cercle-des-posterites-disparues/' AS c_other, 60 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Eric Dussert');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'main' AS c_category, 'Thomas Ortiz' AS c_name, 'Artiste / ingénieur' AS c_role, NULL AS c_bio, '/api/images/thomas-ortiz.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.facebook.com/valeriano.bortiz' AS c_other, 70 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Thomas Ortiz');

-- ── Communauté de chercheur·euses (catégorie « secondary ») ──

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Dominique Desjeux' AS c_name, 'Anthropologue et sociologue' AS c_role, 'Depuis 1969, Dominique Desjeux travaille sur les enjeux sociaux de la consommation et sur les processus de décision et les innovations technologiques et sociales en Europe, aux USA, en Chine et en Afrique. Il s''intéresse à la fois aux phénomènes interculturels, aux stratégies des consommateurs face aux techniques du marketing. Il écrit aussi sur les stratégies de développement des pays émergents.' AS c_bio, '/api/images/dominique-desjeux.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://fr.wikipedia.org/wiki/Dominique_Desjeux' AS c_other, 10 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Dominique Desjeux');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Kevin Desmond' AS c_name, 'Historien des techniques' AS c_role, 'Né en 1950 à Londres, Kevin Desmond effectue des recherches sur l''Histoire de la technologie depuis plus de 40 ans pour ses ouvrages et articles divers. Kevin a découvert Gustave Trouvé en 1978. Depuis ce jour, il n''a cessé de poursuivre et approfondir ses recherches sur les divers appareils et créations merveilleuses de cet inventeur méconnu.' AS c_bio, '/api/images/kevin-desmond.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://aquitaine.vivre-utile.fr/a-la-recherche-de-trouve-lhommage-a-un-inventeur-meconnu/' AS c_other, 20 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Kevin Desmond');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Alain Gras' AS c_name, 'Sociologue français et professeur des universités émérite' AS c_role, 'Il développe ses théories en écologie politique dans plusieurs ouvrages.
La thèse principale repose sur le fait que l’usage de l’énergie fossile était un piège longtemps évité mais dans lequel sont tombées les civilisations industrielles, lesquelles ont rompu l’équilibre entre l’usage énergétique des quatre éléments. Alain Gras estime que la société contemporaine n''est pas seulement industrielle et capitaliste, elle est "« thermo-industrielle »" depuis la fin du XIXe siècle, ce qui la conduit dans une impasse catastrophique : non seulement parce qu''elle affecte la planète par l''usage immodéré de l''énergie fossile mais aussi parce qu''elle propose comme solution une fuite en avant technologique à laquelle les citoyens ne peuvent qu''assister, impuissants. L''électricité sur laquelle se concentre maintenant sa recherche apparait non pas comme un remède mais au contraire comme en continuité, voire en renforcement de la civilisation thermo-industrielle car la Chine et les pays émergents provoquent le retour du roi charbon pour la production de cette fausse énergie. En outre, se renforce la domination politique par la technologie, grâce à une organisation tentaculaire des réseaux organisés en macro-systèmes techniques où l''électro-numérique joue un rôle essentiel..' AS c_bio, '/api/images/alain-gras.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://fr.wikipedia.org/wiki/Alain_Gras' AS c_other, 30 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Alain Gras');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Sylvain Roche' AS c_name, 'Enseignant-chercheur à Sciences Po Bordeaux' AS c_role, 'Docteur de l''Université de Bordeaux, j''ai soutenu en 2019 une thèse en économie intitulée « Réenchanter le maritime par la promesse énergétique : technologies, trajectoires, discours ».
Je suis aujourd''hui ingénieur de projets à la Chaire « Transitions Énergétiques Territoriales » (TRENT) et enseignement-chercheur associé à Sciences Po Bordeaux.
Mes travaux se concentrent sur la construction des politiques publiques d''innovation dans le secteur de la transition énergétique et territoriale.' AS c_bio, '/api/images/sylvain-roche.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/sylvain-roche-a5a7a7128/' AS c_other, 40 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Sylvain Roche');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Arnaud Passalacqua' AS c_name, 'Professeur en aménagement de l’espace et urbanisme' AS c_role, 'J’ai rejoint l''école d''urbanisme de Paris, après avoir été maître de conférences en histoire contemporaine à l’Université Paris Diderot entre 2010 et 2020. J’ai une formation double d’ingénieur (École polytechnique, École des Ponts et Chaussées) spécialisé en aménagement (master AMUR) et d’historien (licence, maîtrise, doctorat et HDR en histoire).
Depuis mon doctorat, réalisé en contrat Cifre à la RATP, je m’intéresse aux enjeux des mobilités dans notre société contemporaine en m’attachant aux systèmes qu’ils constituent, formés d’artefact matériels comme d’imaginaires et de savoirs, inscrits dans le temps long des usages et des matérialités. J’ai ainsi travaillé sur les transports urbains, le vélo ou le ferroviaire, avec une approche résolument démodalisée, dans différents contextes géographiques et à l’aide de concepts permettant d’interroger ces systèmes techniques : espace public, circulation transnationale, innovation... Parallèlement, je me suis aussi consacré aux enjeux énergétiques, en particulier dans mon activité pédagogique, par la création d’un master mention Énergie.' AS c_bio, '/api/images/arnaud-passalacqua.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 50 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Arnaud Passalacqua');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Wallenborn Grégoire' AS c_name, 'physicien et philosophe de formation' AS c_role, 'Chercheur au CEDD depuis 2001, il s’intéresse aux questions qui croisent environnement, technologie et vie quotidienne' AS c_bio, '/api/images/wallenborn-gregoire.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://igeat.ulb.ac.be/fr/unites-de-recherche/details/unit/centre-detudes-du-developpement-durable/' AS c_other, 60 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Wallenborn Grégoire');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Rubens Ben' AS c_name, 'Photo / Gif Digger / Webdesign' AS c_role, NULL AS c_bio, '/api/images/rubens-ben.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.facebook.com/RubensPhotos' AS c_other, 70 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Rubens Ben');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Laure Schwarz' AS c_name, 'Solar Sound System Zurich' AS c_role, NULL AS c_bio, '/api/images/laure-schwarz.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://ladybruce.com/' AS c_other, 80 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Laure Schwarz');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Salomon Thierry' AS c_name, 'ingénieur énergéticien' AS c_role, NULL AS c_bio, '/api/images/salomon-thierry.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.izuba.fr' AS c_other, 90 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Salomon Thierry');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Anne-Marie Leyendecker' AS c_name, 'design for transition enabler' AS c_role, 'Transition énergétique, La naissance /évolution/mort des villes; L''appropriation des technologies par les personnes; la recherche dans le passé et le présent de ces pistes d''innovation' AS c_bio, '/api/images/anne-marie-leyendecker.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 100 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Anne-Marie Leyendecker');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Moreux Jean-Philippe' AS c_name, 'Bibliothèque nationale de France Service Numérisation / Département de la Conservation' AS c_role, NULL AS c_bio, '/api/images/moreux-jean-philippe.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.bnf.fr' AS c_other, 110 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Moreux Jean-Philippe');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Hélène Subrémon' AS c_name, 'Sociologue de l''énergie' AS c_role, NULL AS c_bio, '/api/images/helene-subremon.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://fr.linkedin.com/pub/hélène-subrémon/72/805/8b0' AS c_other, 120 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Hélène Subrémon');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Raphaël Domjan' AS c_name, 'Eco-explorateur, Conférencier, Pilote et initiateur des projets PlanetSolar et Solarstratos' AS c_role, NULL AS c_bio, '/api/images/raphael-domjan.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.solarstratos.com' AS c_other, 130 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Raphaël Domjan');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Céline Brunner' AS c_name, 'communication en environnement / Graphiste / Dj' AS c_role, NULL AS c_bio, '/api/images/celine-brunner.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.facebook.com/celine.brunner.311' AS c_other, 140 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Céline Brunner');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Gaëtan Brisepierre' AS c_name, 'Sociologue' AS c_role, 'Quand la situation change, les innovations du passé ont une seconde chance' AS c_bio, '/api/images/gaetan-brisepierre.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 150 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Gaëtan Brisepierre');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Annick de La Moureyre' AS c_name, 'Passionnée par l''histoire' AS c_role, NULL AS c_bio, '/api/images/annick-de-la-moureyre.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 160 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Annick de La Moureyre');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Maire Maxime' AS c_name, NULL AS c_role, NULL AS c_bio, '/api/images/maire-maxime.png' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.facebook.com/maxime.maire' AS c_other, 170 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Maire Maxime');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Matthieu Muin' AS c_name, 'Designer scénographe' AS c_role, NULL AS c_bio, '/api/images/matthieu-muin.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 180 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Matthieu Muin');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Joel Tetard' AS c_name, 'Ingénieur Conseil Energie/Climat' AS c_role, NULL AS c_bio, '/api/images/joel-tetard.jpeg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 190 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Joel Tetard');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Bertrand Lapostolet' AS c_name, 'Responsable de Programme chez Fondation Abbé Pierre' AS c_role, NULL AS c_bio, '/api/images/bertrand-lapostolet.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/pub/bertrand-lapostolet/68/248/842' AS c_other, 200 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Bertrand Lapostolet');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Guillaume Attal' AS c_name, 'co-fondateur de Woma' AS c_role, NULL AS c_bio, '/api/images/guillaume-attal.png' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.woma.fr/fr' AS c_other, 210 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Guillaume Attal');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Eric Boros' AS c_name, 'musicien' AS c_role, NULL AS c_bio, '/api/images/eric-boros.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://freemusicarchive.org/music/Eric_Boros' AS c_other, 220 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Eric Boros');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Julien Emmanuel' AS c_name, 'président du directoire' AS c_role, NULL AS c_bio, '/api/images/julien-emmanuel.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.sergies.fr' AS c_other, 230 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Julien Emmanuel');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Thomas Macias' AS c_name, NULL AS c_role, 'Department of Sociology
University of Vermont' AS c_bio, '/api/images/thomas-macias.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.uvm.edu/~tmacias/' AS c_other, 240 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Thomas Macias');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Laurent Bossez' AS c_name, NULL AS c_role, NULL AS c_bio, '/api/images/laurent-bossez.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/laurent-rossez-2308a451' AS c_other, 250 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Laurent Bossez');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Ariane ROZO' AS c_name, 'Service Bâtiment - ADEME' AS c_role, 'Etude revue de la Science Fiction en énergie pilotée par Yves Moch' AS c_bio, NULL AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 260 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Ariane ROZO');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Léo Bénichou' AS c_name, 'ingénieur' AS c_role, NULL AS c_bio, '/api/images/leo-benichou.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/lo-benichou-b5670129' AS c_other, 270 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Léo Bénichou');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Jocelyn Banneville' AS c_name, 'ingénieur' AS c_role, NULL AS c_bio, '/api/images/jocelyn-banneville.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 280 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Jocelyn Banneville');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Guillaume Tixier' AS c_name, 'Journaliste / blogger' AS c_role, NULL AS c_bio, '/api/images/guillaume-tixier.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.faiteslepleindavenir.com' AS c_other, 290 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Guillaume Tixier');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Ali Turek' AS c_name, 'Chercheur en droit / Pigiste' AS c_role, NULL AS c_bio, '/api/images/ali-turek.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 300 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Ali Turek');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'David Trujillo' AS c_name, 'Énergie, Environnement et Écologie' AS c_role, NULL AS c_bio, '/api/images/david-trujillo.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 310 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'David Trujillo');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'André Rosselet' AS c_name, 'Retraité / électronicien' AS c_role, 'Membre actif de l''association ADER depuis de nombreuses années' AS c_bio, '/api/images/andre-rosselet.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.ader.ch' AS c_other, 320 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'André Rosselet');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Mary Jane Edward' AS c_name, 'Producer, Curator and Researcher' AS c_role, NULL AS c_bio, '/api/images/mary-jane-edward.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://twitter.com/maryjaneedwards' AS c_other, 330 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Mary Jane Edward');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Come Bastin' AS c_name, 'Journaliste "We Demain"' AS c_role, 'hello@paleo-energetique.org' AS c_bio, '/api/images/come-bastin.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://twitter.com/Come_Bastin' AS c_other, 340 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Come Bastin');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Sachiko Takimura' AS c_name, 'Artiste / Créatrice de bijoux' AS c_role, NULL AS c_bio, '/api/images/sachiko-takimura.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://sachikotakimura.wix.com/sachiko' AS c_other, 350 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Sachiko Takimura');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Gilles Gallo' AS c_name, 'CEO Sunited Group / IDCOOK' AS c_role, NULL AS c_bio, '/api/images/gilles-gallo.png' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.sunitedgroup.com' AS c_other, 360 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Gilles Gallo');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Alexandre Barre' AS c_name, 'Conseiller métier à l''UFE' AS c_role, NULL AS c_bio, '/api/images/alexandre-barre.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://ufe-electricite.fr' AS c_other, 370 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Alexandre Barre');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Mariko MARCEL HOSONO' AS c_name, 'Chercheur en Sciences du langage / Traductrice' AS c_role, '"La traduction part du sens et effectue toutes ses opérations de transferts à l''intérieur du domaine du sens" (G. MOUNIN)' AS c_bio, '/api/images/mariko-marcel-hosono.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 380 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Mariko MARCEL HOSONO');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Romain Crabos' AS c_name, 'Manager et gestion de projet : environnement' AS c_role, NULL AS c_bio, '/api/images/romain-crabos.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/romain-crabos-136557b7?authType=NAME_SEARCH&#038;authToken=HB0G&#038;locale=fr_FR&#038;trk=tyah&#038;trkInfo=clickedVerticalmynetworkclickedEntityId416411898authTypeNAME_SEARCHidx1-1-1tarId1470929563151tasromaincrabos' AS c_other, 390 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Romain Crabos');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Aurora Sorrentino' AS c_name, 'Etudiante en management des organisations culturelles' AS c_role, NULL AS c_bio, '/api/images/aurora-sorrentino.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 400 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Aurora Sorrentino');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Christiane Abele' AS c_name, 'historienne / responsable éditoriale' AS c_role, NULL AS c_bio, '/api/images/christiane-abele.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/christiane-abele-74980385?trk=hp-identity-name' AS c_other, 410 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Christiane Abele');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'André Ravachol' AS c_name, 'Fondateur de la marque Plasticana' AS c_role, NULL AS c_bio, '/api/images/andre-ravachol.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/ravachol-andre-561a1716' AS c_other, 420 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'André Ravachol');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Nicolas Duc' AS c_name, 'photographe' AS c_role, NULL AS c_bio, '/api/images/nicolas-duc.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.nicolasduc.com/portrait/' AS c_other, 430 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Nicolas Duc');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Paul Montarnal' AS c_name, 'Etudiant, philosophe' AS c_role, NULL AS c_bio, '/api/images/paul-montarnal.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 440 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Paul Montarnal');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Pierre Antoine Gombeaud' AS c_name, 'Service Civique engagé' AS c_role, NULL AS c_bio, '/api/images/pierre-antoine-gombeaud.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 450 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Pierre Antoine Gombeaud');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Sayat Topuzogullari' AS c_name, 'Membre du Hackerspace Lyonnais' AS c_role, NULL AS c_bio, '/api/images/sayat-topuzogullari.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://sayatnowa.com' AS c_other, 460 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Sayat Topuzogullari');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Yann Lemaistre' AS c_name, NULL AS c_role, NULL AS c_bio, '/api/images/yann-lemaistre.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 470 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Yann Lemaistre');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Hugo Frederich' AS c_name, 'Ingénieur Physicien' AS c_role, NULL AS c_bio, '/api/images/hugo-frederich.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 480 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Hugo Frederich');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Louis Palmer' AS c_name, 'conférencier, aventurier international environementaliste , et "Pionnier Solaire".' AS c_role, NULL AS c_bio, '/api/images/louis-palmer.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.louispalmer.ch/' AS c_other, 490 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Louis Palmer');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'François Jarrige' AS c_name, 'Historien, enseignant-chercheur à l''université de Bourgogne' AS c_role, NULL AS c_bio, '/api/images/francois-jarrige.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://tristan.u-bourgogne.fr/CGC/chercheurs/Jarrige/Francois_Jarrige.html' AS c_other, 500 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'François Jarrige');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Ximun Curutchet' AS c_name, 'ingénieur' AS c_role, NULL AS c_bio, '/api/images/ximun-curutchet.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 510 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Ximun Curutchet');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Cesar Bacon' AS c_name, 'Designer, chargé de mission RegenBox' AS c_role, NULL AS c_bio, '/api/images/cesar-bacon.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 520 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Cesar Bacon');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Karine Meyer' AS c_name, 'Chef d''entreprise / gestionnaire projet RegenBox' AS c_role, NULL AS c_bio, '/api/images/karine-meyer.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 530 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Karine Meyer');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Jérôme Libeskind' AS c_name, 'Collaborateur / expert en logistique urbaine et e-commerce - fondateur de Logicités' AS c_role, NULL AS c_bio, '/api/images/jerome-libeskind.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'http://www.logicites.fr/' AS c_other, 540 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Jérôme Libeskind');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Nicolas Touboul' AS c_name, 'Engagé Service Civique' AS c_role, NULL AS c_bio, '/api/images/nicolas-touboul.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 550 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Nicolas Touboul');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Viktorija Makarovaite' AS c_name, 'Doctorante à l''Université du Kent' AS c_role, NULL AS c_bio, '/api/images/viktorija-makarovaite.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.kentfungalgroup.com/' AS c_other, 560 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Viktorija Makarovaite');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Vincent Muller' AS c_name, 'Consul général de France à Dusseldorf' AS c_role, NULL AS c_bio, '/api/images/vincent-muller.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 570 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Vincent Muller');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Gilles Babinet' AS c_name, 'Digital champion de la France auprès de la Commission européenne' AS c_role, NULL AS c_bio, '/api/images/gilles-babinet.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/gillesbabinet/' AS c_other, 580 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Gilles Babinet');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Marie-sarah Adenis' AS c_name, 'Designer & Biologiste / Co-Founder and Creative Director at PILI' AS c_role, NULL AS c_bio, '/api/images/marie-sarah-adenis.jpg' AS c_photo, NULL AS c_linkedin, NULL AS c_website, 'https://www.linkedin.com/in/marie-sarah-adenis-851605b6/' AS c_other, 590 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Marie-sarah Adenis');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Clément Gaillard' AS c_name, 'Consultant, conception par le climat' AS c_role, NULL AS c_bio, '/api/images/clement-gaillard.jpg' AS c_photo, 'https://www.linkedin.com/in/clément-gaillard-423650a9/' AS c_linkedin, NULL AS c_website, NULL AS c_other, 600 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Clément Gaillard');

INSERT INTO team_members (`category`, `name`, `role`, `bio`, `photo_path`, `url_linkedin`, `url_website`, `url_other`, `display_order`)
SELECT * FROM (SELECT 'secondary' AS c_category, 'Frédéric Caille' AS c_name, NULL AS c_role, NULL AS c_bio, NULL AS c_photo, NULL AS c_linkedin, NULL AS c_website, NULL AS c_other, 610 AS c_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Frédéric Caille');
