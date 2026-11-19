/**
 * arvrMusee.js — scènes AR et pages audio des pancartes imprimées.
 *
 * Les QR « cube » des pancartes visent /ARVR_musee/<scène>/ et
 * /ARVR_musee/audio/<nom>/ : ces URLs sont IMPRIMÉES, ne jamais renommer une clé.
 * Les fichiers lourds (.glb, .usdz, .mp3 ≈ 180 Mo) ne sont pas dans Git : ils
 * vivent sur le serveur dans ARVR_DIR (/srv/customer/ARVR_musee) et sont servis
 * tels quels par server.js sous /ARVR_musee/… (cf. HEBERGEMENT-INFOMANIAK.md).
 *
 * cartelId : fiche liée (titre/année lus en direct). null → bouton « frise ».
 * label    : libellé court (index, et titre de repli sans fiche).
 * Textes audio : repris à l'identique des pages d'origine (WordPress, 2021).
 */

export const ARVR_BASE = '/ARVR_musee';

export const AR_SCENES = {
    belier:    { model: 'Belier_AR',           cartelId: '1770733277290',                         label: { fr: 'Bélier hydraulique',           en: 'Hydraulic ram pump' } },
    fonderie:  { model: 'Fonderie_Solaire_AR', cartelId: null,                                    label: { fr: 'Fonderie solaire',             en: 'Solar foundry' } },
    maccready: { model: 'gossamer_AR',         cartelId: '6cfafcd5-ad6d-4c8f-baf0-9ce8229afd9c', label: { fr: 'Avion à pédales Gossamer',     en: 'Gossamer pedal-powered aircraft' } },
    mouchot:   { model: 'Mouchot_AR',          cartelId: 'c66b0845-cf53-41c5-8ea2-34e47556557a', label: { fr: 'Concentrateur solaire Mouchot', en: 'Mouchot solar concentrator' } },
    piggot:    { model: 'Piggot_AR_HUB',       cartelId: null,                                    label: { fr: 'Éolienne Piggott',             en: 'Piggott wind turbine' } },
    regenbox:  { model: 'Regenbox_AR',         cartelId: '1772528474851',                         label: { fr: 'Regenbox',                     en: 'Regenbox' } },
    telkes:    { model: 'telkes_AR',           cartelId: '1771861824327',                         label: { fr: 'Maison solaire de Maria Telkes', en: 'Maria Telkes solar house' } },
};

export const AUDIO_PAGES = {
    edison: {
        title: "LA BATTERIE AUTOMOBILE DE THOMAS EDISON",
        mp3: "edison.mp3",
        cartelId: "1771860808865",
        paragraphs: [
            "Thomas Edison (1847-1931), inventeur de l’ampoule électrique, est l’un des grands inventeurs du xixe siècle et, plus particulièrement, l’un des pionniers dans le domaine de l’électricité.",
            "L’une de ses inventions reste cependant dans l’ombre : il travaille en 1902 avec son collègue Waldemar Jungner sur une batterie pour automobile fonctionnant grâce au couple nickel-fer, les deux métaux étant immergés dans une solution alcaline. Cette batterie résiste bien au temps et aux décharges ; néanmoins elle peine à dégager une grande quantité d’énergie dans un temps restreint. Mais elle présente un avantage certain sur les batteries plomb-acide, courantes à cette époque : elle est moins coûteuse.",
            "En fervent promoteur des voitures électriques, Edison décide de prouver l’autonomie de sa batterie : en 1910, il participe à une course automobile d’endurance de 1 000 miles (environ 1 600 km) avec la Bailey Electric Phaeton. La Bailey ne parvient malheureusement pas à suivre le rythme des véhicules à essence. En 1915, le constructeur Bailey abandonne la voiture électrique, tandis qu’Edison se détourne lui aussi du projet.",
        ],
    },
    mouchot: {
        title: "L'IMPRIMANTE-PRESSE SOLAIRE D'AUGUSTIN MOUCHOT ET ABEL PIFRE",
        mp3: "mouchot.mp3",
        cartelId: "1776162187814",
        paragraphs: [
            "Extrait du journal le monde illustré, le 12 août 1882",
            "L’imprimerie solaire est une application originale de la chaleur solaire à l’industrie.",
            "L’invention de M. Augustin Mouchot a été depuis portée à un grand degré de perfection par M. Abel Pifre, qui multiplie depuis quelque temps les expériences publiques destinées à vulgariser cette grande idée. Dimanche, c’était le jardin des Tuileries, où fonctionnait une presse solaire, clou de cette grande kermesse.",
            "A côté de la presse solaire, qui a distribué toute la journée le soleil journal au public, qui ne s’en lassait point, nous avons remarqué d’autres isolateurs permettant d’appliquer la chaleur du soleil aux besoins domestiques.",
            "Il y avait foule aussi près des plus petits appareils, convertis pour la circonstance en allumoirs pour les fumeurs.",
            "L’idée de faire contribuer le soleil à la fête de la jeunesse française était une idée hardie, mais tout réussit aux audacieux.",
        ],
    },
    perrier: {
        title: "HYDROGÈNE DE JEAN-LUC PERRIER",
        mp3: "perrier.mp3",
        cartelId: "1771927506439",
        paragraphs: [
            "Jean Luc Perrier, professeur à l’université d’Angers, réalise en 1979 une première mondiale :il produit de l’hydrogène à l’aide d’un concentrateur solaire afin d’alimenter une voiture.",
            "\"Au-dessus du carburateur, nous trouvons trois tubes d'arrivée d'hydrogène. L'alimentation à pression régulière se fait grâce à un détendeur… à partir de la bouteille d'hydrogène qui se trouve dans le véhicule.\"",
            "\"De la vapeur d'eau tout simplement sort donc de ce tube d'échappement. D'où plus de pollution ! Autre avantage : autonomie multipliée par deux !.\" L’héliostat de Perrier est aujourd’hui stocké, démonté à l’IUT de Poitier, en attendant une nouvelle vie, peut-être dans l’hypothèse où verrait le jour un musée national des bonnes idées énergétiques d’intérêt general.",
            "“grâce à l'hydrogène que nous trouvons dans la nature de manière abondante (H2O), l'eau qui peut être séparée de l'oxygène, l'hydrogène est un combustible qui remplace le gaz naturel et qui peut être utilisé aussi bien pour le chauffage que pour la locomotion. Et lorsque l'hydrogène de la bouteille se combine avec l'oxygène de l'air, nous retrouvons l'énergie qui a été au départ nécessaire (H2O) pour séparer l'hydrogène de l'oxygène.\"",
        ],
    },
    tesla: {
        title: "Nikola Tesla",
        mp3: "Tesla.mp3",
        cartelId: "a81bf066-881c-4200-9ce4-e4cf6f69b8b0",
        paragraphs: [
            "Nikola Tesla (1856-1943) est un inventeur et ingénieur américain d'origine serbe, célèbre pour sa contribution au développement et à la diffusion du courant alternatif pour le transport et la distribution de l'électricité.",
            "L’une des plus grandes ambitions de Nikola Tesla est de réaliser un système de transmission de l’énergie sur de grandes distances, sans fil et sans perte, afin qu’elle soit accessible à tous. “Lorsque le sans-fil sera utilisé de manière parfaite […]. Nous serons capables de communiquer les uns avec les autres instantanément, quelle que soit la distance. Ce n’est pas tout : grâce à la télévision et au téléphone, nous pourrons nous voir et nous entendre aussi parfaitement que si nous étions face à face, même si nous sommes éloignés par des milliers de kilomètres ; et les machines qui nous permettront d’accomplir ceci seront incroyablement plus simples que le téléphone actuel. Un homme pourra en transporter une dans la poche de son veston».",
        ],
    },
    trouve: {
        title: "LE TRICYCLE ÉLECTRIQUE DE GUSTAVE TROUVÉ",
        mp3: "Trouve.mp3",
        cartelId: "2d486690-b98b-4e77-bca6-29c3a1f5d2f3",
        paragraphs: [
            "Scientifique originaire d’Indre et Loire, Gustave Trouvé fait partie des grands inventeurs français du 19eme siecle. Surnommé l’Edison Français, est un des pionniers de la mobilité électrique, de la miniaturisation et des systèmes de batteries.",
            "En 1881, il améliore un petit moteur électrique développé par Siemens avec un accumulateur Starley et l’installe sur un tricycle anglais : il vient ainsi d’inventer le premier véhicule électrique de l’histoire. On peut voir, le 19 avril 1881, dans la rue de Valois à Paris, le tricycle de Trouvé se déplacer avec succès. Gustave Trouvé décide ensuite de détourner son moteur électrique à accumulateur. En plaçant son moteur devenu amovible et déplaçable, sur un bateau, Gustave Trouvé invente ainsi le premier bateau électrique en même temps qu’il invente le moteur hors-bord.",
            "Les 26, 27 et 28 mai 1881, il réalise des essais sur la Seine avec son bateau, baptisé Téléphone, de 5 m de long ; les piles sont disposées au milieu, et le moteur à l’arrière sur le gouvernail. Il atteint une vitesse de 3,6 km/h vers l’amont et 9 km/h vers l’aval. Grâce au succès de ces expériences, le canot électrique de Trouvé est présenté à l’Exposition internationale d’électricité de 1881. L’inventeur reçoit peu de temps après la légion d’honneur pour l'ensemble de ses inventions (qui comprennent aussi le premier détecteur de métal et la première lampe frontale), Reconnu comme un inventeur exceptionnel par ses pairs, il sera pourtant rapidement oublié après sa mort.",
        ],
    },
    witkar: {
        title: "WITKAR : LA PREMIÈRE AUTOLIB",
        mp3: "witkar.mp3",
        cartelId: "1771926785152",
        paragraphs: [
            "Née en 1974, La Witkar est un véhicule électrique ultra léger alimenté par des batteries visant à réduire le trafic dans le centre d’Amsterdam. L’ordinateur est la clé pour enregistrer le voyage des 4000 membres de la coopérative Witkar. Les membres accèdent au service à l’aide de leur clé électronique personnelle. Ensuite, ils rentrent le numéro correspondant à la destination. L’ordinateur vérifie alors s’il y a de la place à cet endroit et confirme par un signal lumineux. Le conducteur ouvre la porte avec sa clé et c’est parti ! Cela ne pourrait pas être plus simple !",
            "La Witkar est de retour et donne tort aux pessimistes. Elle ne fera certes pas disparaître les bouchons à elle toute seule; faute de soutien municipal, ce projet de mobilité avant-gardiste prend fin au bout de 12 ans.",
            "Luud Schimmelpennink, son concepteur, n’en est pas moins un précurseur. Aujourd’hui, la capitale Hollandaise a décidé de lancer un projet similaire avec 120 stations d’échanges pour un millier de véhicules en autopartage.",
        ],
    },
};
