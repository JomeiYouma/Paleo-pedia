-- ============================================================
-- Fix BDD cartels: ajoute image_credit + réinjecte les sources
-- Généré automatiquement depuis db_cartels.json + db_drafts.json
-- ============================================================
SET NAMES utf8mb4;
START TRANSACTION;

-- 1) Ajout de colonne si absente
SET @has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cartels'
    AND COLUMN_NAME = 'image_credit'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE cartels ADD COLUMN image_credit TEXT NULL AFTER image_path',
  'SELECT ''image_credit already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Réinjection des crédits image
UPDATE cartels
SET image_credit = CASE id
  WHEN '1770896734716' THEN 'Porshe Egger-Lohner C.2, https://www.toutvert.fr/premiere-voiture-electrique/'
  WHEN '1770896826445' THEN 'La "Jamais contente", Brown Middle School, Newton, Massachusetts, https://commons.wikimedia.org/wiki/File:Jamais_contente.jpg'
  WHEN '1771320250808' THEN 'Passerelle Lucie Bréard, Saint-Denis, 18/07/24, Chabe01, Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Passerelle_Lucie_Br%C3%A9ard_-_Saint-Denis_(FR93)_-_2024-07-18_-_1.jpg'
  WHEN '1771335675398' THEN 'Stains, 15/08/22. Chabe01, Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Mail_Trois_Rivi%C3%A8res_-_Stains_(FR93)_-_2022-08-15_-_1.jpg'
  WHEN '1771335694442' THEN 'Montreuil, 24/10/19, Chabe01. https://commons.wikimedia.org/wiki/File: Ch%C3%A2teau_Eau_Bel_Air_Montreuil_Seine_St_Denis_4.jpg'
  WHEN '1771335712259' THEN 'Montreuil, 23/10/20. Chabe01. Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Rue_Jardins_Dufour_-_Montreuil_(FR93)_-_2020-10-23_-_2.jpg'
  WHEN '1771335977201' THEN 'Plan de travaux à Saint-Denis, 1883. Wikimedia commons'
  WHEN '1771335985310' THEN 'Río Atrato, 14/04/15, Almajior, Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Meandros_Del_R%C3%ADo_Atrato.jpg'
  WHEN '1771343808427' THEN 'Chambers''s Encyclopædia, 1860'
  WHEN '1771518840487' THEN 'Humus 44,https://www.bioetbienetre.fr/association-humus-44/s25520.html'
  WHEN '1771839426764' THEN 'Rosny-sous-Bois, 06/02/25. Le Parisien. https://www.leparisien.fr/seine-saint-denis-93/des-cours-oasis-pour-eviter-les-coups-de-chaud-dans-les-colleges-de-seine-saint-denis-07-02-2020-8255130.php'
  WHEN '1771839456986' THEN 'Scierie hydraulique, 1650, Library of Congress. https://www.loc.gov/pictures/item/2004671869/'
  WHEN '1771860414715' THEN 'https://journals.openedition.org/adlfi/docannexe/image/137859/img-1.jpg'
  WHEN '1772189723023' THEN 'Confluence de la Vieille Mer (au niveau du pont jaune), du canal Saint-Denis et de la Seine, 25/11/06, Claude Shoshany, Wikimedia Commons. https://commons. wikimedia.org/wiki/File:Confluence_du_Croult,_du_Canal_St_ Denis_et _de_la_Seine.JPG'
  WHEN '1772531924119' THEN 'Logiciel Parapluie, Métropole de Lyon, https://parapluie-hydro.com/grandlyon/'
  WHEN '1772532016489' THEN 'Agence Ter - Vue future de l’avenue du président Robert Schuman, aux Lilas.'
  WHEN '1772532138229' THEN 'Square des acrobates, 19/10/18, Rc1959, Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Saint-Denis.Square_des_Acrobates.jpg'
  WHEN '1772532229005' THEN 'Carte de Cassini. https://commons.wikimedia.org/wiki/File:Carte_de_Cassini.Ile-Saint-Denis.Maison_de_Seine.Fort_de_la_Briche.jpg'
  WHEN '1772532334174' THEN 'Panneau 1 de l''exposition “les futurs de l’eau en Seine-Saint-Denis : comment composer avec le passé ?”. Paris 1 Panthéon-Sorbonne et Département Seine-Saint-Denis. https://reseau.doc.seinesaintdenis.fr/index.php?lvl=notice_display&id=105528'
  WHEN '1772532502316' THEN 'Manifeste "La Seine-Saint-Denis territoire d''eau", département Seine-Saint-Denis, https://reseau.doc.seinesaintdenis.fr/index.php?lvl=notice_display&id=105248'
  WHEN '1772532742222' THEN 'Fontaine miraculeuse de Notre-Dame-des-Anges à Clichy-sous-Bois, vers 1900-1910'
  WHEN '1772538547187' THEN 'Lac de Pannecière, 08/08, Benchaum, Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Lac_Panneci%C3%A8re_et_barrage.JPG'
  WHEN '1772722621286' THEN 'La Seine depuis l''île Saint-Louis, Paris, 17/07/22, DiscoA340, Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Panorama_of_the_Seine_from_the_%C3%8Ele_Saint-Louis_2.jpg'
  WHEN '1772722831526' THEN 'Pierre sculptées par Minealithe, Marie-Line Waroude, https://www.lagazettefrance.fr/article/minealithe-fabrique-des-pierres-par-voie-liquide.'
  WHEN '1772722878460' THEN 'Mesures GPS sur le ruisseau des Avenelles dans la cadre d''un programme PIREN-Seine, 2025. '
  WHEN '1772723299485' THEN 'Water calling, https://www.leclubdesjuristes.com/opinion/loctroi-de-la-personnalite-juridique-a-la-seine-utile-ou-pas-11200/'
  WHEN '1772790229542' THEN 'Maison de la famille Bel, Elisabeth Gardet, Le Parisien, https://www.leparisien.fr/yvelines-78/meulan-depuis-dix-ans-ils-vivent-dans-une-maison-ecolo-faite-maison-10-07-2018-7814631.php'
  WHEN '1773130713309' THEN 'N°03 de la ga(r)zette, Mission Val de Loire, https://valdeloire.org/lagarzette'
  WHEN '1773130765101' THEN 'Bâtiment 2226 de l''agence BAUMSCHLAGER EBERLE'
  WHEN '1773130852305' THEN 'Champ de niébé au Burkina Faso, 19/04/22, Fasouagadougou, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Image_6_-_R%C3%A9colte_du_ni%C3%A9b%C3%A9_dans_le_champs_scolaire_OBDAGA.jpg'
  WHEN '1773134866777' THEN 'Usine FrieslandCampina à Aalter, 25/06/12, Spotter2, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:FrieslandCampina_in_Aalter_in_2012-02.jpg'
  WHEN '1773154227590' THEN 'Betterave sucrière, 14/10/17, Pieter Deliccat, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Kalkar_Zuckerr%C3%BCben_PM171014_06.jpg'
  WHEN '1773154258552' THEN 'arrosage au goutte-à-goutte dans le Loir-et-Cher, 25/07/2024, Daniel Jolivet, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Th%C3%A9s%C3%A9e-la-Romaine_(Loir-et-Cher)_(53893037993).jpg'
  WHEN '1773409108315' THEN 'Panier filtrant, https://lacentrale-eco.com/conseils/recuperer-eau-de-pluie/tout-savoir-filtres-recuperation-eau-pluie.html'
  WHEN '1773409138404' THEN 'Eco-trône, https://www.habibois.com/itw/ecotrone-toilettes-seches-carton.php'
  WHEN '1773409166572' THEN 'eliodomestico, eau-nature.fr, https://www.eau-nature.fr/leliodomestico-un-dessalinisateur-solaire-a-fabriquer-soi-meme/'
  WHEN '1773409195482' THEN 'Urinoirs du club de rugby de La Réole, Toopi Organics, https://www.20minutes.fr/bordeaux/2966667-20210201-gironde-urinoirs-eau-installes-stade-transformer-urine-engrais'
  WHEN '1773410021162' THEN 'Douche Ilya, https://bigmedia.bpifrance.fr/nos-actualites/la-douche-cyclique-dilya-economise-eau-et-electricite'
  WHEN '1773412023412' THEN 'Jeremy Nussbaumer utilisant DrinkPure, https://www.consoglobe.com/drinkpure-eau-potable-cg/2'
  WHEN '1773412035351' THEN 'eliodomestico, eau-nature.fr, https://www.eau-nature.fr/leliodomestico-un-dessalinisateur-solaire-a-fabriquer-soi-meme/'
  WHEN '1773412047609' THEN 'Solvatten, 27/06/14, Tmrl84, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Solvatten_unit.jpg'
  WHEN '1773412063145' THEN 'Toilette à séparation, Wostman Ecology, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Urine-diversion_dehydration_toilet_(UDDT)_Model_EcoDry_top_view_(3330209129).jpg'
  WHEN '1773412074047' THEN 'Eco-trône, https://www.habibois.com/itw/ecotrone-toilettes-seches-carton.php'
  WHEN '1773412085638' THEN 'Jardin de Dominique et Didier Prudon, 2019, La Depeche, https://www.ladepeche.fr/2019/06/07/le-verger-galadriel-ouvre-ses-portes-demain,8243396.php'
  WHEN '1773412106268' THEN 'Filtre de descente de gouttière, https://www.celesto.fr/filtres-avant-cuve/23-filtre-descente-de-gouttiere-gep-500-microns.html'
  WHEN '1773412118709' THEN 'Collecteur d''eau à clapet en zinc, https://www.gouttiere-expert.fr/collecteur-a-clapet-zinc-tuyau.html'
  WHEN '1773418738947' THEN 'Phytoépuration au Pérou, Heike Hoffmann, 04/05/09, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Constructed_wetland_(5547195530).jpg'
  WHEN '1773752009745' THEN 'https://earthshotprize.org/winners-finalists/vinisha-umashankar/'
  WHEN '1773934305800' THEN 'Interface du site solaire du low tech magazine, https://solar.lowtechmagazine.com/fr/about/the-solar-website/'
  WHEN '1773936395104' THEN 'Fairphone 3, 07/10/19, Wikimedia Commons, https://www.lemonde.fr/economie/article/2019/08/27/fairphone-mise-sur-ses-smartphones-durables-pour-se-demarquer_5503386_3234.html'
  WHEN '1774516147537' THEN 'citerne verte, https://maison.com/brico-travaux/plomberie/citerne-verte-coffre-fort-tresor-naturel-pluie-8530/'
  WHEN '1775051113956' THEN 'Gravure de Giovanni Branca 1629, réimprimée en 1977, Wikimedia Commons, https://ca.wikipedia.org/wiki/Fitxer:BRANCA_TROMBA.jpg'
  WHEN '1775051140321' THEN 'Toilettes Ecodomeo, https://commons.wikimedia.org/wiki/File:ECODOMEO_-_Zircone_(9067594784).jpg'
  WHEN '1775051151339' THEN 'https://commons.wikimedia.org/wiki/File:Virginia_Tech_-_data_center.jpg'
  WHEN '1775051163499' THEN 'Lycée Marie Durand, 02/04/16, Midi Libre, https://www.midilibre.fr/2016/03/30/rodilhan-journee-portes-ouvertes-au-lycee-agricole-et-au-cfa,1308832.php'
  WHEN '1775051175298' THEN 'Hotel de ville de Romilly-sur-Seine, 19/09/16, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:H%C3%B4tel_de_ville_de_Romilly-sur-Seine.jpg'
  WHEN '1775051188462' THEN 'Chemisage de canalisations sans tranchée, 14/10/14, Rachkay333, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Trenchless_sewer_relining_repairmen.jpg'
  WHEN '1775051199221' THEN 'Nettoyage de bacs avec les Eugènes, LBP/A. C., https://www.bienpublic.com/economie/2023/05/22/les-eugene-les-nettoyeurs-qui-partent-a-la-conquete-des-bacs-a-biodechets'
  WHEN '1775051216849' THEN 'Jean Painlevé près d''un microscope, 12/01/1926, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:M._Jean_Painlev%C3%A9_pr%C3%A8s_d%27un_microscope_-_btv1b90250205.jpg'
  WHEN '1775051231398' THEN 'Distributeur Eau de Paris, 16e arrondissement, 13/08/23, Romainbehard, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Paris_16e_-_All%C3%A9e_Pil%C3%A2tre_de_Rozier_-_Distributeur_Eau_de_Paris.jpg'
  WHEN '1775051247495' THEN 'Institut d''études géologique des Etas-Unis, The World''s Water'
  WHEN '1775051258845' THEN 'Evolution de la température de l''eau au fil de l''année avec le projet de pile thermique, https://www.lemoniteur.fr/article/un-vieux-chateau-d-eau-pourrait-se-transformer-en-pile-thermique.1961924'
  WHEN '1775051273151' THEN 'Ganoderma lucidum, 31/07/20, Tatiana, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Ganoderma_lucidum_87540961.jpg'
  WHEN '1775051287012' THEN 'champ à Waru Waru dans l''altiplano péruvien, https://www.wmf.org/monuments/waru-waru-agricultural-fields-peru'
  WHEN '1775051300678' THEN 'Méthode SODIS utilisée en Indonésie, SODIS Eawag, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Indonesia-sodis-gross.jpg'
  WHEN '1775051317011' THEN 'Fabrice Desjours dans sa forêt gourmande, 2025, Xavier Ducordeaux, https://www.bourgognefranchecomte.fr/index.php/quand-la-foret-devient-gourmande'
  WHEN '1775051327641' THEN 'yakhtchal de la province de Yazd en Iran, 25/09/08, Pastaitaken, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Yakhchal_of_Yazd_province.jpg'
  WHEN '1775051341769' THEN 'Parking Saint-Roch, Montpellier, 26/03/16, Fred Romero, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Montpellier_-_Parking_Saint-Roch_(29247787924).jpg'
  WHEN '1775051355697' THEN 'Vignobles à Lanzarote, 16/03/22, Holger Uwe Schmitt, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:%2B_Besuch_der_Bodega_La_Geria._01.jpg'
  WHEN '1775051373180' THEN 'Campo San Boldo, Venise, 30/05/16, Didier Descouens, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Campo_San_Boldo_(Venice).jpg'
  WHEN '1775140024087' THEN '"Ojo" d''un des puquios de Cantalloc, Nasca, Pérou, 29/0715, Diego Delso, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Acueductos_subterr%C3%A1neos_de_Cantalloc,_Nazca,_Per%C3%BA,_2015-07-29,_DD_09.JPG'
  WHEN '1775141095090' THEN 'Jaquette de chauffe-eau THERMECO, https://www.enertech.fr/lancement-du-kit-de-renovation-pour-cumulus-electrique-thermeco/'
  WHEN '1775211484796' THEN 'Cédric François, fondateur d''Equium et l''une de ses pompes à chaleur, 2024, DR, Ouest France, https://www.ouest-france.fr/economie/entreprises/lentreprise-nantaise-equium-invente-la-pompe-a-chaleur-acoustique-qui-carbure-au-son-adac136a-c4ff-11ee-9c4f-9be0695f50c2'
  WHEN '1775211929841' THEN 'Etudiants de HIAL (Himalayan Institute of Alternatives, Ladakh) devant leur projet de stupa de glace, 19/10/21, Crb43, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Ice-Stupaa.jpg'
  WHEN '1775654182495' THEN 'Terminal Node Controller 2400, 27/12/05, Denis Apel, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Tnc2400-stardado.JPG'
  WHEN '1775731098880' THEN 'L''arbre de l''isle de fer, Allain Manesson Mallet, Description de l''Univers, t. 3, Paris, Denys Thierry, 1683 https://commons.wikimedia.org/wiki/File:Arbre_de_l%27Isle_de_Fer_(Description_de_l%27Univers,_t._3,_pl._82).jpg'
  WHEN '1775731174510' THEN 'Fonctionnement du serveur e-mail Horus, https://www.horus.ch/comment-ca-fonctionne/'
  WHEN '1775746321439' THEN 'Château du Fey, 21/04/17, François Goglins, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_du_Fey-FR-89-ch%C3%A2teau-01.jpg'
  WHEN '1775815624560' THEN 'Jerrys au FacLab de Gennevilliers, 06/04/14, Vallade, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Un_%22Mignon%22_Jerry-can..JPG'
  WHEN '1775815636487' THEN 'Paul Benoit, fondateur de Qarnot computing, https://greenfilmshooting.net/blog/en/2016/02/26/heating-with-the-hot-spot/'
  WHEN '1775824223761' THEN 'Liseuse qui fonctionne avec de l''encre électronique, 31/01/21, 117PXL, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Ereader.jpg'
  WHEN '1776074843404' THEN '24/11/25, Ilustratori, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:I-Ilustrim_i_stilizuar_i_ADN-s%C3%AB.png'
  WHEN '1776077885106' THEN 'Prototype OLPC XO-1, 10/12/06, Mike McGregor, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:XO-Beta1-mikemcgregor-2.jpg'
  WHEN '1776080247749' THEN 'Framework Laptop DIY 13 AMD, 13/02/24, Thcipriani, Wikimedia Commons, https://commons.wikimedia. org/wiki/File:Framework_laptop_AMD_13_DIY_setup.jpg'
  WHEN '1776085350404' THEN 'Réseau de neurones humains, 19/03/16, Else If Then, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:R%C3%A9seau_de_neurones.jpg'
  WHEN '1776087661300' THEN 'Diagrame représentant l''apprentissage fédéré centralisé, 11/02/23, MarcT0K, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Centralized _federated_learning_protocol.png'
  WHEN '1776090168899' THEN 'Liaisons liées à la septoriose sur du blé, 06/05/19, Lucky K. Mehra, Urmila Adhikari, Christina Cowger et Peter S. Ojiambo, Wikimedia Commons, https://commons.wikimedia.org/ wiki/File:Septoria_nodorum_blotch_on_wheat_glumes.png'
  WHEN '1776092589818' THEN 'Gros plan sur un écran OLED, 03/12/23, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Close_UP_photo_of_lg_c1_oled.jpg'
  WHEN '1776155644383' THEN '07/05/13, Alejandro Escamilla, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Man_with_smartphone_and_laptop_(Unsplash).jpg'
  WHEN '1776156063415' THEN 'Signe à un restaurant qui autorise M-Pesa comme moyen de paiement, 30/06/12, Raidarmax, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:An_M-Pesa_Payment_Till.JPG'
  WHEN '1776159289113' THEN 'Femme lisant sous un panka, 1863, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:A_woman_reading_under_a_punkah,_1863_-_BL_WD_2904.jpg'
  WHEN '1776160064412' THEN 'Célébration de la fête de Yalda autour d''un korsi'
  WHEN '1776162187814' THEN 'Concentrateur solaire d''Augustin Mouchot, 19/10/1878, Jules Férat, Le Monde illustré, https://commons.wikimedia.org/wiki/File:Mouchot1878x.jpg'
  WHEN '1776164550312' THEN 'Marmite norvégienne, 24/09/10, Huhu Uet, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:G%C3%B6pelschauermuseum_Seesterm%C3%BChe_09_(cropped).jpg'
  WHEN '1776165326062' THEN 'Briques I.S.A., https://www.chartier-dalix.com/fr/ressources/isa-briques-terre-cuite-imprimees-3d-parois-vivantes'
  WHEN '1776244083385' THEN 'Loi REEN, https://www.appyuser.com/guide/loi-reen-impact-numerique/'
  WHEN '1776244096073' THEN 'Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Hands-woman-laptop-notebook_(24217008462).jpg'
  WHEN '1776244894070' THEN 'https://spotintelligence.com/2023/10/03/continual-learning/'
  WHEN '1776245761863' THEN 'Unité de méthanisation à Mayrac (Lot), 24/09/17, GrandBout, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Unit%C3%A9_de_m%C3%A9thanisation_au_Garrit_Haut.jpg'
  WHEN '1776247891506' THEN 'Réseau maillé, 24/01/26, Superspritz, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:802.11s_Meshed_Network_Architecture.svg'
  ELSE image_credit
END
WHERE id IN ('1770896734716', '1770896826445', '1771320250808', '1771335675398', '1771335694442', '1771335712259', '1771335977201', '1771335985310', '1771343808427', '1771518840487', '1771839426764', '1771839456986', '1771860414715', '1772189723023', '1772531924119', '1772532016489', '1772532138229', '1772532229005', '1772532334174', '1772532502316', '1772532742222', '1772538547187', '1772722621286', '1772722831526', '1772722878460', '1772723299485', '1772790229542', '1773130713309', '1773130765101', '1773130852305', '1773134866777', '1773154227590', '1773154258552', '1773409108315', '1773409138404', '1773409166572', '1773409195482', '1773410021162', '1773412023412', '1773412035351', '1773412047609', '1773412063145', '1773412074047', '1773412085638', '1773412106268', '1773412118709', '1773418738947', '1773752009745', '1773934305800', '1773936395104', '1774516147537', '1775051113956', '1775051140321', '1775051151339', '1775051163499', '1775051175298', '1775051188462', '1775051199221', '1775051216849', '1775051231398', '1775051247495', '1775051258845', '1775051273151', '1775051287012', '1775051300678', '1775051317011', '1775051327641', '1775051341769', '1775051355697', '1775051373180', '1775140024087', '1775141095090', '1775211484796', '1775211929841', '1775654182495', '1775731098880', '1775731174510', '1775746321439', '1775815624560', '1775815636487', '1775824223761', '1776074843404', '1776077885106', '1776080247749', '1776085350404', '1776087661300', '1776090168899', '1776092589818', '1776155644383', '1776156063415', '1776159289113', '1776160064412', '1776162187814', '1776164550312', '1776165326062', '1776244083385', '1776244096073', '1776244894070', '1776245761863', '1776247891506');

-- 3) Vérification rapide
SELECT COUNT(*) AS cartels_with_image_credit
FROM cartels
WHERE image_credit IS NOT NULL AND TRIM(image_credit) <> '';

COMMIT;
