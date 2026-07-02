# Manuel d'administration de la plateforme Paléo

> **À qui s'adresse ce document ?**
> Aux **administrateurs généraux** (superadmins) de l'écosystème Paléo et au **personnel commercial** qui présente, vend ou accompagne le projet. Il décrit **tout** le fonctionnement de l'application : les différents sites qui la composent, les pages publiques, l'espace d'administration complet, les comptes et les rôles, la modération, les langues, les emails, les exports, les modes de frise, et **tous les automatismes et particularités** — afin qu'**aucune question ne reste sans réponse** sur le comportement de l'app.
>
> Le document est **technique mais lisible par tout le monde** : chaque mécanisme « invisible » (un email qui part, une traduction qui s'enregistre, un cartel qui passe d'un site à l'autre, une limite d'envoi) est expliqué en clair. Les détails très techniques (limites chiffrées, stockage navigateur, sécurité) sont regroupés dans l'[Annexe technique](#24-annexe-technique-limites-stockage-sécurité). Quand un point relève de l'hébergement, il est signalé comme tel.
>
> 👉 Ce manuel **complète** le *Manuel d'utilisation d'un site dédié* (côté propriétaire de sous-site). Quand un sujet y est traité en détail, un renvoi vous y dirige.

> 🧭 **Par où commencer ?** Pressé(e) ? Filez aux **[recettes pas-à-pas](#26-modes-opératoires-pas-à-pas-recettes)** (chapitre 26) et à la **[FAQ](#27-faq)** (chapitre 27). Pour bien démarrer, lisez d'abord : l'**[architecture des « quatre faces »](#2-vue-densemble--larchitecture-de-la-plateforme)** (chapitre 2), les **[rôles et permissions](#3-les-rôles-et-les-permissions--qui-peut-faire-quoi)** (chapitre 3) et — le point le plus délicat de la plateforme — les **[deux files de modération](#13-les-deux-files-de-modération-à-ne-jamais-confondre)** (chapitre 13).

---

## Sommaire

1. [Vocabulaire essentiel](#1-vocabulaire-essentiel)
2. [Vue d'ensemble : l'architecture de la plateforme](#2-vue-densemble--larchitecture-de-la-plateforme)
3. [Les rôles et les permissions : qui peut faire quoi](#3-les-rôles-et-les-permissions--qui-peut-faire-quoi)
4. [Se connecter, la session, la sécurité des accès](#4-se-connecter-la-session-la-sécurité-des-accès)
5. [Le site principal public (Paléo-Énergétique)](#5-le-site-principal-public-paléo-énergétique)
6. [La vitrine Paléo-Pédia et l'écosystème](#6-la-vitrine-paléo-pédia-et-lécosystème)
7. [La frise publique : modes d'affichage, filtres, mode atelier & immersif](#7-la-frise-publique--modes-daffichage-filtres-mode-atelier--immersif)
8. [Les sous-sites thématiques : créer et piloter](#8-les-sous-sites-thématiques--créer-et-piloter)
9. [Langues & traductions (FR/EN et au-delà)](#9-langues--traductions-fren-et-au-delà)
10. [Les cartels : modèle, cycle de vie, formulaire](#10-les-cartels--modèle-cycle-de-vie-formulaire)
11. [La fiche détaillée et la page « En savoir plus »](#11-la-fiche-détaillée-et-la-page--en-savoir-plus-)
12. [Gérer les cartels (écran « Gestion »)](#12-gérer-les-cartels-écran--gestion-)
13. [Les DEUX files de modération (à ne jamais confondre)](#13-les-deux-files-de-modération-à-ne-jamais-confondre)
14. [Le hub d'administration (« Administration »)](#14-le-hub-dadministration--administration-)
15. [Gérer les comptes utilisateurs](#15-gérer-les-comptes-utilisateurs)
16. [Les pages de contenu éditorial](#16-les-pages-de-contenu-éditorial)
17. [Catégories & ateliers (taxonomie)](#17-catégories--ateliers-taxonomie)
18. [Partenaires (bibliothèque centralisée)](#18-partenaires-bibliothèque-centralisée)
19. [Notifications email & journal d'événements](#19-notifications-email--journal-dévénements)
20. [Les formulaires reçus du public (contact, candidatures)](#20-les-formulaires-reçus-du-public-contact-candidatures)
21. [Exports, imports, QR codes et impression](#21-exports-imports-qr-codes-et-impression)
22. [Statistiques](#22-statistiques)
23. [Paramètres système, clés API et hébergement](#23-paramètres-système-clés-api-et-hébergement)
24. [Annexe technique : limites, stockage, sécurité](#24-annexe-technique-limites-stockage-sécurité)
25. [Points d'attention et pièges à éviter](#25-points-dattention-et-pièges-à-éviter)
26. [Modes opératoires pas-à-pas (recettes)](#26-modes-opératoires-pas-à-pas-recettes)
27. [FAQ](#27-faq)
- [Glossaire](#glossaire)

---

## 1. Vocabulaire essentiel

- **Plateforme / écosystème Paléo** : l'ensemble du dispositif. Une seule application web sert **plusieurs sites** (voir [chapitre 2](#2-vue-densemble--larchitecture-de-la-plateforme)).
- **Cartel** : la fiche d'un objet / d'une invention (titre, année, lieu, image, description, catégories…). C'est l'unité de base affichée sur la frise.
- **Frise** : la collection des cartels publiés, présentée en chronologie. Trois modes publics : **Frise** (chronologie), **Carte** (géographique), **Arborescence** (par regroupements) — voir [chapitre 7](#7-la-frise-publique--modes-daffichage-filtres-mode-atelier--immersif).
- **Statut d'un cartel** : son état dans le cycle de vie — **Brouillon**, **En attente**, **Publié**, **Archivé** (voir [§10.2](#102-les-quatre-statuts-le-cycle-de-vie)).
- **Site principal** : le site Paléo-Énergétique (pages publiques + la frise globale). Ses cartels n'ont pas de sous-site rattaché.
- **Sous-site (site dédié)** : un mini-site thématique autonome (ex. Paléo-H₂O), avec sa propre page d'accueil, sa couleur, sa frise, son équipe et ses partenaires.
- **Paléo-Pédia** : la **vitrine** de l'écosystème (page `/pedia`) qui présente, sous forme de « système solaire » interactif, le site principal et les sous-sites.
- **Atelier** : un groupe de cartels, **invisible du public**, utilisé pour organiser et pour alimenter certains sous-sites. Un atelier peut être affiché en **mode immersif** (borne/expo).
- **Catégorie** : étiquette thématique **publique** d'un cartel (avec couleur).
- **Superadmin / Administrateur général** : la personne qui gère **toute** la plateforme. Techniquement, c'est la permission **« Gérer l'administration »**.
- **Owner / Propriétaire de sous-site** : la personne qui administre **un** sous-site précis. Techniquement, c'est la capacité **« Gérer l'équipe »** rattachée à un sous-site.
- **Soumettre au site principal** : proposer qu'un cartel publié sur un sous-site apparaisse **aussi** sur le site principal (après validation du superadmin).
- **Slug** : la partie « adresse » d'un sous-site dans l'URL (`paleo-h2o` dans `…/site/paleo-h2o`).

---

## 2. Vue d'ensemble : l'architecture de la plateforme

Une **seule application** (un seul code, une seule base de données) sert **quatre « faces »** différentes. Comprendre cette structure est la clé de tout le reste.

| Face | Adresse type | À quoi ça sert | Public visé |
|---|---|---|---|
| **Site principal** (Paléo-Énergétique) | `/` (ex. `paleo-energetique.org`) | Le site vitrine institutionnel : accueil, à propos, prestations, boutique, museum, presse, contact… + l'accès à la frise globale. | Grand public |
| **L'application** | `/app` | La **frise** (chronologie/carte/arborescence) de tous les cartels publiés **et** l'espace d'administration (`/app/admin/…`, `/app/manage/…`). | Public (frise) + administrateurs (gestion) |
| **Paléo-Pédia** (vitrine) | `/pedia` (ou `paleo-pedia.org`) | Présente l'écosystème entier en une vue interactive (le « système solaire » des sous-sites). **Connexion + accès administration désormais possibles** (voir [§6](#6-la-vitrine-paléo-pédia-et-lécosystème)). | Grand public + administrateurs |
| **Sous-sites** | `/site/:slug` (ou un domaine dédié, ex. `paleo-h2o.org`) | Des mini-sites thématiques autonomes, chacun avec sa frise, sa couleur, son équipe. | Grand public + propriétaire du sous-site |

> 💡 **Une seule base, plusieurs vitrines.** Un cartel vit à un seul endroit en base, mais peut être affiché sur son sous-site **et** sur le site principal (s'il a été validé). C'est tout l'objet du circuit de soumission ([chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre)).

> 💡 **Créer un sous-site se fait entièrement depuis l'admin** ([chapitre 8](#8-les-sous-sites-thématiques--créer-et-piloter)), sans aucune manipulation technique. Dès sa création, il est en ligne à l'adresse `…/site/<slug>`.
>
> ⚠️ **Si vous voulez en plus lui donner une adresse dédiée** (un nom de domaine à lui, par ex. `paleo-h2o.org` au lieu de `…/site/paleo-h2o`), là, **ça ne se règle pas dans l'admin** : il faut (1) la configuration DNS + serveur côté hébergement et (2) l'ajout de la correspondance « domaine → sous-site » dans le code de l'application. C'est donc une **petite intervention de développement**, à demander — pas une case à cocher. Aujourd'hui, deux sous-sites en bénéficient — `paleo-h2o.org` (→ `paleo-h2o`) et `aero.paleo-energetique.org` (→ `paleo-aerospace`) — et la vitrine **Paléo-Pédia** a le sien, `paleo-pedia.org`. *(Détail des domaines, redirections et SEO en [§23.4](#234-domaines-redirections-et-seo-multi-domaines).)*

> 📸 **[Capture A01]** — Schéma d'ensemble : le site principal au centre, les sous-sites en orbite, la vitrine Pédia.

---

## 3. Les rôles et les permissions : qui peut faire quoi

C'est le chapitre le plus important pour un administrateur : tout le contrôle d'accès en découle.

### 3.1 Le principe : des permissions, pas des « rôles »

Les droits d'un compte reposent sur des **capacités indépendantes** (des interrupteurs oui/non) que l'on combine. **Toutes sont bornées au périmètre du compte** — le **site principal**, ou **un sous-site précis** (voir le rattachement plus bas). Un même interrupteur ne donne jamais de pouvoir *hors* de ce périmètre.

| Capacité (interrupteur) | Ce qu'elle autorise (dans le périmètre du compte) | Défaut à la création |
|---|---|---|
| **Gérer les cartels** | Créer, éditer, mettre en brouillon / archive, **publier** les cartels, et **auto-traduire** l'autre langue. | ✅ Activée |
| **Exporter (langues du site)** | Accès **lecture seule** au gestionnaire : sélectionner et **exporter** les cartels (PDF, images, archive) **dans les langues déjà saisies** (FR / EN). Aucune autre action. | ❌ |
| **Exporter (autre langue)** | Comme ci-dessus, **plus** la **frise et le PDF traduits à la volée** vers une langue cible. **Inclut** l'export simple. | ❌ |
| **Gérer les contenus** | Contenus **hors cartels** : partenaires et équipe « À propos » ; **au niveau principal** seulement, aussi presse, missions, prestations, boutique. | ❌ |
| **Gérer l'équipe** | = **Propriétaire (owner)** : inviter et gérer les comptes de son périmètre, et **leur accorder des capacités**. | ❌ |

À cela s'ajoutent deux éléments qui ne figurent **pas** parmi les interrupteurs ci-dessus :

- **Administration générale** = **superadmin**. Ce n'est pas une case à cocher dans la liste ci-dessus : un superadmin porte un **badge « Superadmin »** et dispose de **toutes** les capacités **partout** (tous les sous-sites), plus ce qui n'appartient qu'à lui : **créer / supprimer des sous-sites**, **valider les soumissions**, régler la plateforme, gérer les comptes, les clés API, les emails, l'import.
- Le **site de rattachement** du compte. S'il est vide, le compte appartient au **site principal** ; sinon il appartient à **un sous-site précis**. C'est lui qui définit le **périmètre** de toutes les capacités ci-dessus.

> 💡 **Superadmin et owner ont implicitement toutes les capacités dans leur périmètre.** Inutile de leur cocher « Gérer les cartels » ou « Exporter » un par un : *Administration générale* (partout) et *Gérer l'équipe* (sur son sous-site) les incluent déjà. On ne coche les interrupteurs individuels que pour un compte **sans** ces deux statuts.

> ℹ️ **Le champ « rôle ».** La base contient un champ « rôle » historique (contributeur / éditeur / admin / superadmin) qui **n'a aucun effet** sur les droits et n'apparaît dans **aucun écran**. Seules **les capacités ci-dessus (plus le statut superadmin)** déterminent ce qu'un compte peut faire.

### 3.2 Les deux figures à retenir

- **Administrateur général (superadmin)** = l'interrupteur **« Gérer l'administration »** est activé. Il voit et gère **tout** : tous les sous-sites, tous les cartels, la file de validation, les réglages, les clés API, les comptes, les emails. Son site de rattachement est en général le **site principal**.
- **Propriétaire de sous-site (owner)** = l'interrupteur **« Gérer l'équipe »** est activé **et** il est rattaché à **un sous-site**. Son pouvoir est strictement **borné à son sous-site** : il gère ses cartels, sa page d'accueil, ses partenaires, son équipe et ses contenus. Il ne voit pas la file de validation et ne peut pas toucher aux autres sous-sites.
- **Compte exportateur** = une **capacité d'export** est activée — **« Exporter (langues du site) »** et/ou **« Exporter (autre langue) »** — souvent **seule**, sans aucun autre droit. C'est un accès **lecture seule** au gestionnaire, limité aux **cartels publiés**, qui ne permet **que** de les exporter (et, avec la seconde capacité, de les exporter traduits à la volée). Cas d'usage : un prestataire d'impression ou d'exposition qui doit récupérer les cartels **sans rien pouvoir modifier**. Voir [§12.6](#126-le-compte-exportateur-accès-lecture-seule).

> 💡 En une phrase : **« Administration générale » = pouvoir global ; « Gérer l'équipe » + un sous-site = pouvoir local sur ce sous-site ; une capacité « Exporter » seule = lecture seule pour l'export.**

Le **personnel commercial** n'a pas de rôle technique distinct : on lui crée un compte avec les permissions adaptées (souvent superadmin s'il doit tout montrer/gérer, ou un accès en lecture/création selon le besoin).

### 3.3 Tableau récapitulatif des droits

| Action | Visiteur | Membre simple | Propriétaire de sous-site | Administrateur général |
|---|:---:|:---:|:---:|:---:|
| Consulter les pages publiques | ✅ | ✅ | ✅ | ✅ |
| Proposer un cartel | ✅ *(en attente)* | ✅ *(selon droits)* | ✅ | ✅ |
| Créer / éditer / publier un cartel | ❌ | ✅ *(si « Gérer les cartels »)* | ✅ *(les siens)* | ✅ |
| Exporter des cartels publiés *(lecture seule)* | ❌ | ✅ *(si une capacité « Exporter »)* | ✅ | ✅ |
| Gérer les contenus hors cartels *(partenaires, équipe « À propos »…)* | ❌ | ✅ *(si « Gérer les contenus »)* | ✅ *(le sien)* | ✅ |
| Gérer la page d'accueil / l'équipe d'**un** sous-site | ❌ | ❌ | ✅ *(le sien)* | ✅ *(tous)* |
| Gérer **tous** les sous-sites, en créer | ❌ | ❌ | ❌ | ✅ |
| Valider les soumissions sous-site → site principal | ❌ | ❌ | ❌ | ✅ |
| Gérer le contenu éditorial du site principal (presse, prestations, boutique, missions, partenaires, équipe « À propos ») | ❌ | ❌ | ❌ | ✅ |
| Régler la plateforme, les clés API, les emails, voir le journal | ❌ | ❌ | ❌ | ✅ |
| Inviter / supprimer des comptes | ❌ | ❌ | ✅ *(son équipe)* | ✅ *(partout)* |

> ⚠️ **Un changement de droits ne s'applique qu'à la prochaine connexion.** Quand vous modifiez les permissions d'un compte, la personne concernée **conserve ses anciens droits jusqu'à ce qu'elle se reconnecte** (au plus tard sous 7 jours, voir [§4.2](#42-la-session-combien-de-temps-reste-t-on-connecté)). Si un changement doit être immédiat, demandez à la personne de se déconnecter puis reconnecter.

---

## 4. Se connecter, la session, la sécurité des accès

### 4.1 Se connecter

1. Sur n'importe quelle page du site (principal, sous-site **ou la vitrine Paléo-Pédia**), cliquez sur **« Connexion »** en haut à droite (icône cadenas). *(Sur la Pédia, le bouton s'intitule **« Se connecter »** et ouvre une petite fenêtre dédiée — voir [§6.1](#61-connexion-et-administration-depuis-la-pédia).)*
2. La fenêtre **« Connexion / Accès administrateur »** s'ouvre. Saisissez votre **e-mail** et votre **mot de passe**.
3. En cas de succès, vous êtes redirigé(e) vers l'espace d'administration (`/app/admin`). En cas d'échec, le message est volontairement neutre : **« Identifiants incorrects »** (il ne dit jamais si c'est l'email ou le mot de passe qui est faux — c'est une protection contre les tentatives de devinette).

> 📸 **[Capture A02]** — La fenêtre de connexion ouverte.

Une fois connecté(e), des boutons supplémentaires apparaissent. Si vous gérez un sous-site, une **pastille avec le nom du sous-site géré** s'affiche à côté de votre email. Les administrateurs voient un **point jaune** devant leur email.

### 4.2 La session : combien de temps reste-t-on connecté ?

- La connexion délivre un **jeton** stocké dans votre navigateur. Sa durée de vie par défaut est de **7 jours**. Au-delà, il faut se reconnecter.
- Si votre session expire pendant que vous travaillez (ou si elle est invalidée), un message global apparaît : **« Votre session a expiré. Reconnectez-vous pour continuer. »** L'app retombe alors automatiquement sur la vue publique.
- La déconnexion est **synchronisée entre les onglets** : si vous vous déconnectez (ou que la session expire) dans un onglet, les autres onglets le savent immédiatement.
- **Se déconnecter** efface le jeton de votre navigateur (il n'y a pas de « révocation » côté serveur : le jeton cesse simplement d'être utilisé).

### 4.3 Sécurité des accès — à dire aux utilisateurs

> 💡 **Mots de passe : réinitialisation et changement.** Un administrateur peut **réinitialiser** le mot de passe d'un membre depuis *Gestion d'équipe* (bouton **clé 🔑**), et chaque personne connectée peut **changer le sien** via le menu en haut à droite → **« Mot de passe »**. Il n'existe **pas** (encore) de « mot de passe oublié » par email : si quelqu'un ne peut plus se connecter du tout, un administrateur lui réinitialise son mot de passe. Conservez les accès en lieu sûr.

> ⚠️ **Accès strictement personnels.** Les identifiants sont personnels et réservés aux membres de la structure concernée. Les partager se fait sous la seule responsabilité de l'utilisateur, et il est interdit de les communiquer à l'extérieur (voir les mentions légales).

> ⚠️ **Compte initial.** Le premier compte superadmin est créé par le script d'installation à partir de variables d'environnement (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). **En production, un mot de passe fort est obligatoire** : le script refuse désormais de créer le compte `admin/admin` par défaut.

> 💡 **Mots de passe.** Ils sont stockés **chiffrés** (jamais en clair). Un nouveau mot de passe doit faire **au moins 8 caractères**.

---

## 5. Le site principal public (Paléo-Énergétique)

C'est la vitrine institutionnelle. Cette section liste **chaque page**, ce qu'elle affiche, et — point crucial pour un administrateur — **ce qui est modifiable et depuis où**.

### 5.1 La barre du haut (header) et le menu

Le menu de navigation du site principal (libellés exacts) : **Accueil · Frise · Museum · À propos · Prestations · Participer · Boutique · Presse · Contact**. À droite : le sélecteur de langue **FR / EN** et le bouton **Connexion**.

- Sur mobile (sous 900 px), le menu central laisse place à un **menu « burger »** qui reprend ces liens et ajoute, s'il existe des sous-sites, une section **Thématiques** listant chaque sous-site (avec un liseré à sa couleur ; lien vers le domaine dédié s'il existe, sinon `/site/<slug>`).
- Quand vous êtes dans l'application (`/app`), une **seconde barre** apparaît avec : Bibliothèque, **Cartels** (avec une **pastille comptant les cartels en attente**), Administration, Statistiques. La pastille affiche `99+` au-delà de 99.

### 5.2 Le pied de page (footer)

Présent sur **toutes** les pages (choix volontaire d'accessibilité). Il contient le nom **Paléo-Énergétique**, la signature *« Une autre histoire de l'énergie pour inspirer le futur. »*, une colonne de liens (La Frise Chronologique, Appel à participation, Presse, Partenaires, Nous contacter, Mentions légales, Politique de confidentialité) et **© {année} Atelier 21**. Le footer est **figé dans le code** (non modifiable depuis l'admin).

### 5.3 Les pages, une par une

| Page | Adresse | Ce qu'elle montre | Modifiable depuis l'admin ? |
|---|---|---|---|
| **Accueil** | `/` | **Hero** « Une autre histoire de l'énergie » (fond clair, illustrations des personnages **Mouchot** & **Maria** et de leurs inventions, liseré accent jaune en bas) + sous-titre *« Ressusciter les techniques disparues pour réinventer notre futur énergétique. »* + **2 boutons** : **« Explorer la Frise »** (→ la frise) et **« Proposer une invention »** (→ le formulaire de cartel, ouvert aux visiteurs). Puis **3 cartes** (La Démarche → `/presentation`, Rétrofutur Museum → `/museum`, Nos Prestations → `/prestations`). | **Non** pour les textes (figés). Les 3 cartes pointent vers des pages existantes. |
| **À propos** | `/presentation` | Histoire, mission, exemples, citation, **l'équipe**, **les partenaires**, liens « Pour aller plus loin ». | **Oui partiellement** : l'**équipe** via *Admin → Équipe (page À propos)* ([§16.2](#162-équipe-de-la-page--à-propos-)) ; les **partenaires** via *Admin → Partenaires* ([chapitre 18](#18-partenaires-bibliothèque-centralisée)). Le reste est figé. |
| **Prestations** | `/prestations` | Cartes de prestations (offres) avec plaquettes consultables en ligne. | **Oui**, entièrement : *Admin → Prestations* ([§16.4](#164-prestations)). |
| **Boutique** | `/boutique` | Vitrine de livres / jeux / autres, **avec liens vers la boutique externe** (PrestaShop). | **Oui** : *Admin → Boutique* ([§16.5](#165-boutique-liens-externes)). |
| **Museum** | `/museum` | Présentation du Rétrofutur Museum (adresse, expérience, expo itinérante…). | **Non** (page entièrement figée). |
| **Participer** | `/participer` | Appel à participation + **missions** dépliables + **formulaire de candidature** + « comment ça marche » + kit à télécharger. | **Oui** pour les **missions** : *Admin → Missions* ([§16.3](#163-missions-page-participer)). Le reste est figé. |
| **Presse** | `/presse` | Dossier de presse, kit média, contact presse + liste **« Ils parlent de nous »**. | **Oui** pour les **articles** : *Admin → Articles de presse* ([§16.6](#166-articles-de-presse)). Les fichiers du bandeau sont déposés manuellement. |
| **Contact** | `/contact` | **Formulaire de contact**. | **Non** (libellés figés). Les **messages reçus** : voir [chapitre 20](#20-les-formulaires-reçus-du-public-contact-candidatures). |
| **Mentions légales** | `/mentions-legales` | Éditeur, hébergement, propriété intellectuelle, accès aux sites dédiés, données. | **Non** (figé). La date « dernière mise à jour » affiche toujours la date du jour. |
| **Politique de confidentialité** | `/politique-confidentialite` | Données collectées, finalités, durées, cookies, droits RGPD, CNIL. | **Non** (figé). |

> 📸 **[Capture A03]** — Le hero de la page d'accueil (« Une autre histoire de l'énergie », personnages Mouchot & Maria, boutons « Explorer la Frise » et « Proposer une invention »).

### 5.4 Les deux formulaires que le public peut envoyer

Deux pages contiennent un formulaire que **n'importe quel visiteur** peut soumettre :

1. **Contact** (`/contact`) — **Nom et Prénom** (obligatoire), **Email** (obligatoire), **Sujet** (optionnel), **Message** (obligatoire).
2. **Candidature à une mission** (bas de `/participer`) — **Votre nom** (obligatoire), **Votre e-mail** (obligatoire), **Mission** (optionnel, à choisir dans la liste), **Vos connaissances / motivation** (optionnel). *(Cette section n'apparaît que si des missions existent.)*

Pour **les deux**, voici exactement ce qui se passe à l'envoi (détail au [chapitre 20](#20-les-formulaires-reçus-du-public-contact-candidatures)) :
- Le message/candidature est **enregistré en base** (avec l'adresse IP de l'expéditeur).
- L'événement est **journalisé** (consultable dans *Admin → Journal d'événements*).
- Un **email d'alerte est envoyé aux administrateurs uniquement si cette notification a été activée** (désactivée par défaut — voir [chapitre 19](#19-notifications-email--journal-dévénements)).
- Le visiteur voit un **message de remerciement** à l'écran. **Aucun email de confirmation ne lui est envoyé.**
- Un piège anti-robot (champ caché) bloque les soumissions automatiques.

> 💡 Le bouton **« Proposer une invention »** présent sur plusieurs pages renvoie vers le formulaire de cartel ([chapitre 10](#10-les-cartels--modèle-cycle-de-vie-formulaire)). C'est un flux différent.

### 5.5 Référencement (SEO) et particularités techniques des pages

À connaître pour ne pas avoir de mauvaise surprise côté visibilité :
- **Plan du site (sitemap) figé.** Le fichier `sitemap.xml` est **maintenu à la main** et ne liste que **les 10 pages principales** du site institutionnel. Il **n'inclut ni les sous-sites, ni les fiches de cartels**. Si vous ajoutez une nouvelle page principale importante, pensez à l'y ajouter (intervention technique).
- **Robots.** Les moteurs de recherche sont autorisés sur les pages publiques mais **bloqués sur `/app` et l'API** (logique : l'application et ses données ne sont pas du contenu à indexer).
- **Aperçus sociaux par contexte (Open Graph).** Les réseaux sociaux (LinkedIn, Facebook, WhatsApp…) n'exécutent **pas** le JavaScript de l'app : le serveur leur **injecte donc des balises d'aperçu adaptées au lien partagé**. Selon ce que l'on partage :
>   - un lien de **sous-site** (ex. `paleo-h2o.org/frise`) → l'**identité du sous-site** (son nom, sa description, son logo) ;
>   - un lien vers une **fiche de cartel** → le **titre, l'image et un extrait du cartel**, signés par son sous-site ;
>   - le **site principal** → l'aperçu par défaut « Paléo-Énergétique ».
>
>   *(C'est ce qui évite qu'un lien de sous-site affiche « Paléo-Énergétique » dans l'aperçu.)* En revanche, ces pages **ne sont pas dans le sitemap** : elles ne sont pas activement « poussées » au référencement individuel.
- **Anciens liens `#/…`.** L'app rattrape automatiquement les anciennes adresses au format `…/#/page` (anciens favoris, liens externes, **QR codes imprimés**) et les convertit vers la nouvelle forme propre. Ne cassez pas ce comportement : il fait que les QR codes déjà imprimés continuent de fonctionner.
- **Pas d'application installable (PWA).** Le site n'est pas une application installable sur téléphone ; c'est un site web classique.

---

## 6. La vitrine Paléo-Pédia et l'écosystème

La page **`/pedia`** (servie aussi à la racine de son domaine dédié `paleo-pedia.org`) est une vitrine à part, avec son propre habillage (marque « Paléo-Pédia », palette neutre).

Elle présente **l'écosystème entier** de façon visuelle :
- Une **vue 3D interactive** (un « système solaire ») si le navigateur du visiteur le permet : un **soleil central** = le site principal, et une **planète** par sous-site (avec un **type de planète** réglable, voir [§8.2](#82-créer-un-sous-site-la-fenêtre-déditeur)).
- Sinon, un **diagramme 2D accessible** équivalent (avec les mêmes liens), affiché automatiquement si la 3D n'est pas disponible ou si le visiteur a activé « réduire les animations ».
- Un bouton permet de basculer entre **Vue 3D** et **Vue simplifiée**.
- Cliquer une planète ouvre le sous-site correspondant (son domaine dédié s'il en a un, sinon `/site/<slug>`).
- Une section **méthodologie** complète la page.

**Ce qui est dynamique :** la liste des sous-sites, leurs noms, leurs couleurs et leur type de planète. **Ce qui est figé :** les textes propres de la vitrine.

> 💡 **Usage commercial :** Paléo-Pédia est la meilleure page pour **montrer la cohérence de l'écosystème** d'un coup d'œil.

> 📸 **[Capture A04]** — La vue 3D « système solaire » de Paléo-Pédia.

### 6.1 Connexion et administration depuis la Pédia

Contrairement à ce qui était le cas au lancement, la Pédia **expose désormais un accès à la connexion et à l'administration** : il est logique de pouvoir piloter l'écosystème depuis sa vitrine. Dans la barre du haut :

- Un lien **« Participer au projet »** (vers la page `…/participer-au-projet`, voir ci-dessous).
- Un bouton **« Se connecter »** qui ouvre une **petite fenêtre de connexion** (e-mail + mot de passe). En cas de succès, vous êtes redirigé vers l'espace d'administration (`/app/admin`).
- Une fois connecté, le bouton « Se connecter » laisse place à **« Admin »** (vers `/app/admin`) et **« Déconnexion »**.

> ⚠️ **La session est liée au domaine.** Se connecter sur `paleo-pedia.org` crée une session **propre à ce domaine** : elle n'est pas partagée avec `paleo-energetique.org`. Si vous administrez depuis les deux, vous vous connectez sur chacun.

**La page « Participer au projet ».** Auparavant rattachée au site principal, elle a été **déplacée sur la Pédia** (`…/participer-au-projet`). C'est un **formulaire** destiné aux enseignants, formateurs, collectivités et acteurs de la transition (démonstration, formation, frise thématique dédiée, plateforme dédiée). Les demandes aboutissent au **même endroit que les messages de contact** (enregistrées + journalisées, voir [chapitre 20](#20-les-formulaires-reçus-du-public-contact-candidatures)). *(À ne pas confondre avec la page **Participer** du site principal — `/participer` — qui porte les missions et les candidatures.)*

> 📸 **[Capture A17]** — La barre de la Pédia avec « Se connecter » (et, une fois connecté, « Admin » / « Déconnexion »).

---

## 7. La frise publique : modes d'affichage, filtres, mode atelier & immersif

La **frise** est la vitrine principale des cartels. Elle existe sur le site principal (`/app`), sur chaque sous-site (`/site/:slug/frise`), et en **mode atelier** (`/app/workshop/:id`). Trois modes d'affichage, plus un mode « Liste » réservé aux administrateurs.

### 7.1 Les trois modes publics

| Mode | Adresse | Ce qu'il montre |
|---|---|---|
| **Frise** (chronologie) | `/app` (ou `…/frise`) | Les cartels positionnés sur un **axe du temps**. Un **seul cartel** est affiché en grand au-dessus de l'axe ; on navigue de l'un à l'autre. |
| **Carte** | `/app/carte` | Les cartels **géolocalisés** sur une carte (fond clair, centrée sur la France par défaut). |
| **Arborescence** | `/app/arborescence` | Un **graphe** reliant les cartels à leurs catégories. |

**Particularités du mode Frise :**
- **Zoom à la molette** (jusqu'à 50×) et déplacement à la souris pour explorer le temps. **Flèches ← / → du clavier** pour passer d'un cartel à l'autre.
- Quand plusieurs cartels partagent la même année, ils sont **décalés en hauteur** pour rester lisibles.
- **Tri chronologique intelligent** : l'app comprend les années écrites en toutes lettres ou en chiffres romains (« XXe siècle », « 21st century »), les dates **avant J.-C.** (négatives), et les qualificatifs *début / milieu / fin*. Une année illisible est renvoyée **en fin de frise**.
- **Position partageable** : l'adresse mémorise le cartel affiché (paramètre `?at=…`). Partager le lien rouvre la frise **sur ce cartel précis**.

**Particularités du mode Carte :**
- Les cartels au **même point géographique** sont **regroupés** ; un badge indique leur nombre, et au survol une bulle affiche « N inventions ».
- Cliquer un point ouvre une **bulle** ; pour un groupe, on obtient une liste cliquable, puis le détail de chaque cartel avec un bouton **« Voir dans la chronologie → »**.
- Un encadré latéral **« Non localisés »** liste les cartels sans coordonnées. Pour un administrateur, chaque entrée propose **« Ajouter lieu »** (ouvre l'édition).

**Particularités du mode Arborescence :**
- Un **graphe de forces** : gros nœuds = catégories, petits nœuds = cartels (un cartel multi-catégories est relié à plusieurs). Nœuds déplaçables, zoom/pan.
- Un **panneau « Paramètres »** (engrenage) permet de : dimensionner les catégories selon leur nombre de cartels, masquer les titres, activer un **mode couleurs**, régler la distance des liens.
- Cliquer un cartel ouvre un **panneau latéral** avec son aperçu.

### 7.2 Le mode « Liste » (administrateurs)

Connecté en tant qu'administrateur, un **4ᵉ bouton « Liste »** apparaît. Il affiche les cartels en liste avec **cases à cocher**, boutons **Éditer / Supprimer** par ligne, **badges de statut** (brouillon / en attente / archivé), et des **actions de lot** (exporter, associer à un atelier, supprimer). C'est une vue augmentée pour l'administration courante, complémentaire de l'écran Gestion ([chapitre 12](#12-gérer-les-cartels-écran--gestion-)).

> 💡 **Repères visuels pour l'admin sur la frise :** un cartel non publié porte un **bandeau rouge « brouillon »** en diagonale ; le **crédit image** apparaît au survol ; une image cassée affiche un avertissement cliquable.

### 7.3 Recherche, filtres, états

- **Recherche** (titre, année, lieu) avec un **compteur de résultats**.
- **Filtres par catégorie** sous forme de chips (multi-sélection). Sur un sous-site, la catégorie du sous-site apparaît en chip **plein, non supprimable**.
- **Sur mobile**, les filtres sont **repliés** derrière un bouton **« Afficher les filtres / Masquer les filtres »** (avec un compteur des filtres actifs).
- **États** : « Chargement... » au démarrage, **« Aucun cartel à afficher. »** si rien ne correspond.
- **Pas de pagination** : tous les cartels filtrés sont affichés (les images se chargent à la demande).

### 7.4 Le mode atelier et le mode immersif (borne / exposition)

Un **atelier** (groupe de cartels, voir [chapitre 17](#17-catégories--ateliers-taxonomie)) possède **sa propre frise publique** à l'adresse **`/app/workshop/:id`**. C'est l'outil idéal pour une **borne d'exposition** ou un **focus thématique**.

**En « mode atelier » (non immersif) :**
- La frise est **filtrée aux seuls cartels de l'atelier** (brouillons inclus, pour pouvoir préparer une expo).
- Le **logo du site est remplacé par le nom de l'atelier**.
- Un **bandeau « ⚗️ Mode Atelier : <nom> »** s'affiche en haut, avec un bouton **« Quitter »**.
- Le bloc de connexion est masqué (on reste en contexte d'exposition).

**En « mode immersif » (case à cocher sur l'atelier) :**
- Le **bandeau et le bouton « Quitter » disparaissent** → immersion totale, le visiteur ne peut plus sortir facilement. **C'est le seul effet de l'option « Immersif ».**
- Pensé pour une **borne en libre accès** où l'on ne veut pas que le public revienne au site.

> 💡 **Comment obtenir le lien d'un atelier ?** Depuis l'écran de gestion d'un atelier, un bouton **« Voir Version Publique »** ouvre `/app/workshop/<id>`. **Il n'y a pas de QR code généré pour un atelier** : vous partagez/affichez cette adresse vous-même. *(Le seul QR généré par l'app est celui imprimé sur chaque cartel — voir [§21.3](#213-les-qr-codes).)*

> 📸 **[Capture A14]** — Une frise en mode atelier (bandeau « Mode Atelier ») et la même en mode immersif (sans bandeau).

---

## 8. Les sous-sites thématiques : créer et piloter

Les sous-sites sont décrits **en détail côté propriétaire** dans le *Manuel d'utilisation d'un site dédié*. Ce chapitre couvre ce qui relève de **l'administrateur général** : la création et le pilotage global.

### 8.1 Rappel : deux façons d'alimenter un sous-site

Le mode d'alimentation est **choisi à la création** et **ne change plus ensuite** :

| Source | Comment les cartels y arrivent |
|---|---|
| **Catégorie** | Les cartels y sont **rattachés un par un** par l'administration. Sélection manuelle. |
| **Atelier** | Les cartels sont **tous ceux d'un atelier donné**. La frise se met à jour **automatiquement** quand on ajoute/retire un cartel de l'atelier. |

### 8.2 Créer un sous-site (la fenêtre d'éditeur)

Depuis *Admin → Administration*, section **« Sous-sites thématiques »**, cliquez **« Nouveau sous-site »**. Une fenêtre s'ouvre.

> ⚠️ **Les modifications d'un sous-site sont publiées immédiatement** (pas de brouillon).

| Champ | Détail | Modifiable après création ? |
|---|---|---|
| **Nom du sous-site** | Ex. `Paléo-H₂O`. Obligatoire. | ✅ par le superadmin (pas par l'owner). |
| **Slug (URL)** | L'adresse `/site/<slug>`. **Généré automatiquement** depuis le nom, modifiable à la main. Obligatoire. | ✅ par le superadmin (pas par l'owner). |
| **Source des cartels** | **Catégorie** ou **Atelier** (voir §8.1). | ❌ **Figée définitivement.** Affichée ensuite « (non modifiable) ». |
| **Couleur primaire** | La couleur de signature, appliquée partout sur le sous-site. Défaut `#4A90D9`. | ✅ (superadmin et owner). |
| **Type de planète** | L'apparence dans l'écosystème 3D de Paléo-Pédia : *Automatique, Éoliennes, Forêt, Panneaux solaires, Minéral/rocheux, Glacé (avec anneau), Mixte*. | ✅ (superadmin et owner). |
| **Contenu de la page d'accueil** | Éditeur de blocs, bilingue (onglets **Français / English**). | ✅ (superadmin et owner). |
| **Compte propriétaire** *(optionnel)* | **E-mail + mot de passe** d'un compte **propriétaire (owner)** créé en même temps que le sous-site (permission « Gérer l'équipe » activée d'office). Vous pouvez laisser vide et créer l'owner plus tard via *Gestion d'équipe*. | — *(sert seulement à la création)*. |

> 💡 **Créer l'owner à la volée.** La fenêtre propose une section **« Compte propriétaire (optionnel) »** : renseignez-y un e-mail et un mot de passe (8+ caractères) pour créer **immédiatement** le compte qui gérera le sous-site, sans repasser par *Gestion d'équipe*. **Conseil :** utilisez une **adresse choisie par les personnes qui géreront ce sous-site** (pas une adresse générique) — elle servira à les recontacter (voir [§15.2](#152-inviter-un-membre)). Si le sous-site se crée mais que le compte échoue (e-mail déjà utilisé…), un message vous le signale : le sous-site **n'est pas recréé**, corrigez l'e-mail et revalidez, ou ajoutez l'owner plus tard.

> ⚠️ **Ce qui est figé à vie : la source (catégorie/atelier).** Le nom et le slug, eux, restent modifiables — mais **seulement par un superadmin**. Un propriétaire ne peut changer ni le nom, ni le slug, ni la source ; il gère la couleur, la planète et le contenu.

> 💡 **Les partenaires ne se règlent plus dans cette fenêtre.** La sélection des partenaires d'un sous-site se fait désormais sur une **page dédiée** (côté propriétaire), distincte de l'éditeur d'accueil. Détail dans le *Manuel d'utilisation d'un site dédié* ; côté bibliothèque centrale, voir [chapitre 18](#18-partenaires-bibliothèque-centralisée).

> ⚠️ **Domaine dédié.** Il **n'y a pas de champ « nom de domaine »** dans cette fenêtre. Brancher un domaine dédié demande une intervention technique (voir [§2](#2-vue-densemble--larchitecture-de-la-plateforme)).

### 8.3 Modifier ou supprimer un sous-site

Dans la même section : **Ouvrir**, **Modifier**, **Supprimer** (avec confirmation). À la suppression, les cartels **ne sont pas détruits** et les comptes rattachés retombent sur le site principal.

> ⚠️ **Que deviennent les cartels d'un sous-site supprimé ? (effet à connaître)** Ils ne sont pas effacés, mais leur rattachement au sous-site est retiré : ils **deviennent des cartels du site principal**. Conséquence directe : **tous ceux qui étaient publiés rejoignent immédiatement la frise principale**, **sans repasser par la file de validation** ([chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre)). Si ce n'est pas voulu, **archivez-les ou repassez-les en brouillon avant** de supprimer le sous-site.

> 💡 En tant que superadmin, vous pouvez tout faire sur n'importe quel sous-site (accueil, équipe, cartels) sans en être le propriétaire.

---

## 9. Langues & traductions (FR/EN et au-delà)

### 9.1 Bilingue par principe, avec repli sur le français

L'interface est **bilingue FR / EN** (le choix est **mémorisé dans le navigateur** du visiteur). Pour les **contenus**, la règle est universelle :

> 💡 **Règle de repli (fallback) :** si le visiteur est en anglais mais que la version anglaise d'un champ est **vide**, c'est le **texte français** qui s'affiche. **Aucune page ne reste jamais blanche** — mais un anglophone peut voir du français là où la traduction manque.

### 9.2 Ce qui se traduit, et comment c'est stocké

| Élément | Bilingue ? | Stockage |
|---|---|---|
| Interface (menus, boutons) | ✅ automatique | Fichiers de l'app |
| Cartels : **titre, description, lieu** | ✅ | Un champ FR + un champ EN |
| Équipe « À propos » : **rôle, bio** | ✅ | Champs EN dédiés (le nom n'est pas traduit) |
| Articles de presse : **titre, accroche** | ✅ | Champs EN dédiés |
| Missions : **nom, texte** | ✅ | Champs EN dédiés |
| Prestations : **titre, intro, description, puces, libellé PDF** | ✅ | Champs EN dédiés |
| Boutique : **titre, sous-titre, description** | ✅ | Champs EN dédiés |
| Catégories : **nom** | ✅ | Champ EN dédié |
| Blocs de la page d'accueil d'un sous-site | ✅ | Onglet **English** distinct (repli FR si vide) |
| Partenaires (nom/URL), Ateliers (nom) | ❌ | Un seul libellé |

### 9.3 La traduction automatique par IA

L'app peut **pré-remplir** la version anglaise (ou une autre langue) automatiquement. Deux moteurs, configurés par des **clés API** dans *Admin → Réglages* :

| Besoin | Moteur utilisé |
|---|---|
| **FR ↔ EN** (cartels, contenus éditoriaux) | **DeepL** si une clé DeepL est configurée (moins coûteux), sinon **OpenAI** en secours. |
| **Toute autre langue** (espagnol, allemand, japonais… pour le PDF traduit) | **OpenAI obligatoire.** DeepL n'est pas utilisé dans ce cas. |

> ⚠️ **Sans clé configurée, la traduction ne fonctionne pas** (message explicite invitant à renseigner une clé). **DeepL seul suffit pour le FR↔EN ; OpenAI est indispensable pour les autres langues** (et donc pour l'export « PDF traduit »).

**Où la traduction intervient :**
- **À la création d'un cartel** (par un administrateur) : si vous remplissez le français et laissez l'anglais vide, l'anglais est généré automatiquement (et inversement). *Uniquement à la création.*
- **Bouton « Retraduire »** (par cartel ou en lot) dans l'écran Gestion : (re)traduit FR↔EN à la demande.
- **Boutons « Traduire »** dans les éditeurs de contenu (équipe, presse, prestations, etc.).

> ⚠️ **Où la traduction est enregistrée :**
> - **Retraduction FR↔EN d'un cartel ou d'un contenu** → **enregistrée en base** (elle écrase l'existant, un avertissement vous le rappelle).
> - **Export « PDF traduit » dans une autre langue** → **NON enregistré.** La traduction sert uniquement à fabriquer le PDF, puis disparaît (idéal pour une expo ponctuelle — voir [§21.2](#212-le-pdf-traduit-dans-nimporte-quelle-langue)).

### 9.4 La détection de langue à la saisie

Quand un administrateur crée un cartel, l'app surveille les champs **Titre** et **Description** : si elle détecte que vous tapez visiblement dans la **mauvaise langue** (par ex. de l'anglais dans le champ français), une fenêtre **« Langue différente détectée »** propose de **basculer** automatiquement le texte vers les bons champs. C'est une aide, pas une obligation : vous pouvez ignorer.

> ⚠️ **Relisez toujours** une traduction automatique avant diffusion (surtout bios et descriptions). L'IA est un excellent point de départ, pas un traducteur infaillible. Un cartel sans version anglaise affiche un badge orange **« ⚠ Pas de traduction EN »** dans l'écran Gestion.

---

## 10. Les cartels : modèle, cycle de vie, formulaire

### 10.1 Ce qu'est un cartel (les champs)

Un cartel contient : **Titre**, **Année**, **Exhumé par** (crédit), **Localisation** (Ville, Pays), **Description**, **Image** + **Crédit image**, **Catégories**, et éventuellement un **lien QR Code**. Les champs **Titre / Description / Localisation** existent en **deux versions** (FR et EN). Réservés aux administrateurs : **Ateliers** (étiquettes internes invisibles du public), une **page « En savoir plus » interne** (voir [chapitre 11](#11-la-fiche-détaillée-et-la-page--en-savoir-plus-)), et des **notes internes** (jamais publiques).

### 10.2 Les quatre statuts (le cycle de vie)

| Statut | Affiché comme | Signification |
|---|---|---|
| **Brouillon** | `Brouillon` | Idée non publiée, invisible du public. |
| **En attente** | `⏳ En attente` | Proposition d'un visiteur, à modérer (voir [chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre)). |
| **Publié** | `Publié` | Visible du public. |
| **Archivé** | `🗄️ Archivé` | Conservé mais masqué du public (réversible). |

En plus du statut, un cartel porte trois informations qui gèrent son **rapport au site principal** : à quel **sous-site** il appartient (vide = site principal), s'il a été **soumis** au site principal, et s'il y est **validé/visible**. Ces trois éléments pilotent le circuit du [chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre).

### 10.3 Le formulaire de création / édition

On y accède par **« Proposer un cartel »** / **« Nouveau cartel »**, ou en éditant un cartel depuis l'écran Gestion.

**Champs (dans l'ordre) :**

| Champ | Obligatoire | Réservé admin | Détail |
|---|:---:|:---:|---|
| **Titre** | ✅ | | Détection de langue (voir [§9.4](#94-la-détection-de-langue-à-la-saisie)). |
| **Année** | ❌ | | Ex. `2024` ou `2024-01-15`. |
| **Exhumé par** | ❌ | | Crédite la personne qui a retrouvé l'objet. |
| **Localisation** | ❌ | | Géolocalisation automatique (voir ci-dessous). |
| **Description** | ❌ | | Compteur jusqu'à **1500 caractères** (limite indicative : le dépassement passe en rouge mais **ne bloque pas**). |
| **Image** + **Crédit** | ❌ | | Image **compressée automatiquement** à l'upload. |
| **Catégories** | ❌ | | Cliquez les catégories ; possibilité d'en créer. Au-delà de 12, elles se replient. |
| **Ateliers** | ❌ | ✅ | Étiquettes internes, invisibles du public. |
| **Lien QR Code** | ❌ | | Lien externe encodé dans le QR à l'impression. |
| **Page « En savoir plus » interne** | ❌ | ✅ | Éditeur de blocs (voir [chapitre 11](#11-la-fiche-détaillée-et-la-page--en-savoir-plus-)). |
| **Notes admin internes** | — | ✅ | Uniquement en édition ; jamais publiques. |
| **Contact** | ❌ | | Pour vous recontacter ; **jamais public**. |

**Comportements automatiques à connaître :**
- **Traduction auto à la création** (admin) : remplit la langue vide à partir de l'autre.
- **Géolocalisation** : en quittant le champ Localisation, l'app cherche les coordonnées via **OpenStreetMap / Nominatim** et affiche **« Localisé : lat, lng »** (✓ vert) ou **« Introuvable »** (✗ rouge). *(Service gratuit ; éviter la saisie en masse très rapide — voir [§24.4](#244-géocodage-openstreetmap).)*
- **Compression d'image** : faite dans votre navigateur avant l'envoi (« Optimisation… »). Réduction à **1600 px max**, qualité optimisée (voir [§24.3](#243-images--upload-et-compression)).
- **Brouillon anti-perte (autosave local)** : votre saisie est **sauvegardée dans le navigateur** au fil de la frappe. Si vous fermez par erreur, un bandeau **« Brouillon récupéré »** la restaure (bouton **« Repartir de zéro »** pour l'effacer). Ces brouillons locaux sont **purgés au bout de 30 jours**.
- **Garde anti-sortie** : si vous quittez la page avec des modifications non enregistrées, un message vous prévient (**« Vous avez des modifications non enregistrées. Quitter sans publier ? »**).
- **Encouragement contact (visiteurs)** : un visiteur anonyme qui envoie sans laisser d'email voit une fenêtre lui proposer (sans l'imposer) d'en laisser un.

**Boutons :**
- **Administrateur** : **« Enregistrer brouillon »** (statut Brouillon) et **« Publier »** (statut Publié). En édition, le second devient **« Enregistrer le cartel »**.
- **Visiteur non connecté** : un seul bouton **« Proposer »** → le cartel part **En attente** (la publication directe lui est interdite).

---

## 11. La fiche détaillée et la page « En savoir plus »

### 11.1 Une seule et même page

La **fiche détaillée** d'un cartel (adresse `…/cartel/<id>`) **est** la page « En savoir plus » interne. Elle affiche toujours : le **fil d'Ariane**, le **titre**, l'**image** (+ crédit), les **métadonnées** présentes (année, lieu, « exhumé par »), la **description**, puis le **contenu enrichi** (les blocs).

- Si l'administrateur a coché **« Utiliser une page En savoir plus interne »** sur le cartel : le bouton « En savoir plus » et le QR code pointent vers **cette page**.
- Sinon, le bouton « En savoir plus » ouvre le **lien externe** (champ « Lien QR Code »).
- Si la page interne n'a pas encore de contenu : message **« Pas encore de contenu détaillé. »**

### 11.2 Les types de blocs disponibles

La page interne (comme la page d'accueil d'un sous-site) se compose en empilant des **blocs**. Les **9 types** :

| Bloc | Usage | Options notables |
|---|---|---|
| **Titre** | Titre de section. | Niveau H1 / H2 / H3 (défaut H2). |
| **Texte** | Paragraphe. | Les retours à la ligne sont conservés. |
| **Image** | Image + légende. | URL **ou** bouton Upload. |
| **Vidéo** | Vidéo. | **YouTube et Vimeo** sont intégrés automatiquement ; un fichier `.mp4/.webm/.ogg` est lu directement ; tout autre lien devient un simple lien. |
| **Galerie** | Plusieurs images en grille. | Légende par image. |
| **Citation** | Citation mise en valeur. | Encadrée par des guillemets « … » + attribution optionnelle. |
| **Bouton** | Bouton d'action. | Style **Plein** ou **Contour** + URL. |
| **Séparateur** | Ligne de séparation. | Aucune. |
| **Embed** | Intégrer un contenu externe (PDF, Sketchfab, Google Maps…). | Hauteur réglable **entre 150 et 1200 px** (défaut 500). |

**Manipulation :** ajout par les boutons en bas, **réordonnancement par flèches ▲ / ▼ uniquement** (pas de glisser-déposer), suppression par la corbeille rouge (immédiate). **Pas d'aperçu en temps réel** : enregistrez puis vérifiez le rendu.

> 💡 La couleur du contexte (jaune sur le site principal, couleur du sous-site sinon) teinte automatiquement les titres, citations, boutons et séparateurs.

---

## 12. Gérer les cartels (écran « Gestion »)

On y accède par le menu, à `/app/manage`. C'est l'écran central de modération. **En tant qu'administrateur général, vous y voyez TOUS les cartels** (site principal + tous les sous-sites).

### 12.1 Les onglets

| Onglet | Contenu | Visible par |
|---|---|---|
| **Publiés** | Cartels visibles du public. | Tous |
| **Idées & Brouillons** | Cartels en cours de rédaction. | Tous |
| **En attente** | **Propositions reçues de visiteurs**, à modérer (= file n°1). | Tous |
| **Archives** | Cartels retirés du public mais conservés. | Tous |
| **Soumissions** | **Cartels de sous-sites en attente de validation pour le site principal** (= file n°2). | **Superadmin uniquement** |

> ⚠️ **Attention au double sens du mot « soumission ».** L'onglet **« En attente »** = soumissions de **visiteurs anonymes**. L'onglet **« Soumissions »** = demandes des **sous-sites** vers le site principal. Voir [chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre).

### 12.2 Les actions sur un cartel

Au survol d'une ligne, des boutons-icônes apparaissent (avec infobulle).

**Groupe « Modification » :** **Aperçu** (rendu impression A4) · **Aperçu web** (vue visiteur) · **Éditer** · **Retraduire** (dans l'autre langue, depuis la langue affichée) · **Ajouter une note** (interne, max 5000 caractères, admins seulement).

**Groupe « Statut » (selon l'état) :** **Publier** · **Repasser en brouillon** · **Archiver / Désarchiver** · **Supprimer** (confirmation) · **Workflow site principal** (sur un cartel de sous-site publié) : **Soumettre** (violet), **En attente** (horloge rose), **Visible** (globe vert) — voir [chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre).

> 💡 **Deux aperçus distincts :** « Aperçu » montre le rendu **imprimé A4** (tel qu'il sortira en PDF/JPEG) ; « Aperçu web » montre la **fiche telle que la voit un visiteur** en ligne.

### 12.3 Rechercher, filtrer, trier, colonnes

- **Recherche** : par titre (FR et EN) et lieu.
- **Filtres catégories / ateliers** : multi-sélection avec commutateur **ET / OU**.
- **Filtres complexes** : un constructeur permet de **combiner plusieurs conditions** (catégories / ateliers), chaque condition combinant ses valeurs en « OU », et les conditions entre elles en **ET ou OU** global. *(Quand les filtres complexes sont actifs, ils remplacent les filtres simples.)* Une bannière jaune le signale (Modifier / Désactiver).
- **Tri** : par Année / Titre / Lieu (clic sur l'en-tête).
- **Colonnes** : afficher/masquer Catégories, Ateliers, Lieu (**préférence mémorisée**).
- **Filtrer sur un sous-site** : un superadmin peut restreindre la vue à un sous-site ; une bannière le signale et permet de retirer le filtre. Il garde tous ses droits (il n'est pas « verrouillé » comme un propriétaire).
- **Mémorisation** : le tri et les filtres sont conservés dans l'adresse (URL) ; la sélection en cours et les colonnes masquées sont mémorisées d'une page à l'autre.

### 12.4 Actions groupées (sélection multiple)

Cochez plusieurs cartels (ou « Tout sélectionner ») : **Publier (N)**, **Retraduire (N)**, **Associer à un atelier (N)**, **Supprimer**, **Exporter** (4 formats — [chapitre 21](#21-exports-imports-qr-codes-et-impression)). Sans sélection : **« Exporter tout »**. En haut, deux boutons permanents : **Importer** (les cartels importés arrivent en **Brouillon**) et **Nouveau cartel**.

> 💡 **Particularités utiles :**
> - Le bouton **Publier (N)** n'apparaît **pas** dans l'onglet *Publiés*.
> - Les actions qui **modifient** (Publier, Retraduire, Associer, Supprimer) **ignorent automatiquement les cartels du site principal en lecture seule** (dans la vue d'un sous-site). L'**export, lui, les inclut**.

### 12.5 L'audit automatique des images

À l'ouverture de l'écran Gestion, l'app **vérifie automatiquement la santé des images**. Si des problèmes existent, une fenêtre **« Attention »** s'ouvre et classe les cas en **4 types** :
- **Fichier introuvable** — l'image référencée n'est plus présente sur le serveur.
- **Chemin legacy** — ancien format de chemin, qui peut casser sur certaines sous-pages.
- **Pas d'image** — le cartel n'a aucune image.
- **URL externe** — image hébergée ailleurs (non vérifiée).

Un bouton **« Voir les cartels problématiques »** filtre la liste sur ces cartels. C'est l'outil pour **nettoyer la base avant un export ou une impression**.

> 📸 **[Capture A05]** — L'écran Gestion : onglets, filtres, barre d'actions groupées, onglet « Soumissions » (superadmin), et la fenêtre d'audit des images.

### 12.6 Le compte exportateur (accès lecture seule)

Un compte dont seule une **capacité d'export** est activée — **« Exporter (langues du site) »** et/ou **« Exporter (autre langue) »** (voir [§3.1](#31-le-principe--des-permissions-pas-des--rôles-)) — ouvre l'écran Gestion dans une version **bridée, en lecture seule**. C'est l'accès idéal pour un **prestataire d'impression** ou un **partenaire d'exposition** qui doit récupérer les cartels sans pouvoir les modifier.

Concrètement, par rapport à un administrateur :
- **Un seul onglet visible : « Publiés ».** Les onglets *Idées & Brouillons*, *En attente*, *Archives* et *Soumissions* sont masqués.
- **Aucune action d'écriture** : pas de *Nouveau cartel*, pas d'*Importer*, pas d'*Éditer*, pas de *Publier / Archiver / Supprimer*, pas d'*Associer à un atelier*, **pas de *Retraduire*** (qui enregistre en base). Les boutons « Éditer » des fenêtres d'aperçu sont également retirés.
- **Ce qui reste disponible** : la **recherche**, les **filtres**, les **aperçus** (impression A4 et web) et l'**export** (les 4 formats — voir [chapitre 21](#21-exports-imports-qr-codes-et-impression)). Avec la capacité **« Exporter (autre langue) »**, l'export peut être **traduit à la volée** vers une langue cible — cette traduction sert uniquement au fichier exporté, elle **n'est pas enregistrée** en base.

> 💡 Un compte exportateur n'a **pas** besoin de « Gérer les cartels » ni de « Administration générale ». On lui crée généralement un compte avec **uniquement** une des capacités « Exporter » cochée (« langues du site » suffit si l'on n'exporte que du FR/EN déjà saisi ; « autre langue » si l'on veut aussi des exports traduits à la volée).

> 📸 **[Capture A15]** — Le gestionnaire vu par un compte exportateur (onglet « Publiés » seul, barre d'actions réduite à l'export et la traduction).

---

## 13. Les DEUX files de modération (à ne jamais confondre)

C'est le point le plus délicat de toute la plateforme. Il existe **deux circuits de validation totalement distincts.**

### 13.1 File n°1 — Les soumissions de visiteurs (propositions anonymes)

**Qui propose :** un **visiteur non connecté** qui remplit le formulaire « Proposer un cartel ».

**Ce qui se passe :**
1. Le cartel est créé avec le statut **En attente** (impossible pour un visiteur de publier directement).
2. Des garde-fous protègent l'app : ces propositions ne sont possibles que si les **soumissions anonymes sont autorisées** (réglable), avec des **quotas par adresse IP** (un total maximum, et un maximum sur une fenêtre de temps), plus le piège anti-robot. Valeurs par défaut et messages exacts en [§24.2](#242-quotas-de-soumission-et-denvoi).
3. Le cartel apparaît dans l'onglet **« En attente »** (avec l'IP du proposant et son contact éventuel).

**Comment l'administrateur traite :**
- **Accepter** → bouton **Publier** (le cartel devient public).
- **Refuser** → **Supprimer** le cartel, ou le repasser en **Brouillon**. *(Pas de bouton « rejeter » distinct dans cet onglet.)*

**Notification :** un email « nouvelle proposition » peut être envoyé **si la notification est activée** ([chapitre 19](#19-notifications-email--journal-dévénements)).

### 13.2 File n°2 — Les soumissions des sous-sites vers le site principal

**Qui propose :** un **propriétaire de sous-site** (ou le superadmin) qui veut qu'un cartel **déjà publié sur un sous-site** apparaisse **aussi** sur le site principal.

**Ce qui se passe :**
1. Quand un cartel de sous-site est publié, il est **automatiquement placé dans la file de validation** du site principal (sauf s'il y a déjà été traité). Le propriétaire n'a donc en général **rien à faire**.
2. Le cartel apparaît dans l'onglet **« Soumissions »** — **réservé au superadmin** — avec le **sous-site d'origine** et la date de soumission (le plus ancien en haut).

**Comment l'administrateur général traite (un encadré rose le rappelle) :**
- **Approuver** → le cartel **devient visible sur le flux du site principal**, tout en **restant** publié sur son sous-site.
- **Rejeter** → la soumission est retirée de la file. **Le cartel n'est pas supprimé** et **reste publié sur son sous-site**.

**Les trois états d'un cartel de sous-site (colonne Statut) :**

| Icône | État | Sens |
|---|---|---|
| **Envoyer** (violet) | Non soumis | Cliquer = soumettre au site principal. |
| **Horloge** (rose) | En attente | Soumis ; cliquer = retirer la soumission. |
| **Globe** (vert) | Validé | Visible sur le principal ; cliquer = retirer. |

**Notifications :** emails distincts pour une nouvelle soumission, une approbation ou un rejet — **si activés**.

> ⚠️ **Re-validation après modification (réglage).** Vous décidez de ce qui se passe quand un sous-site **modifie** un cartel déjà validé sur le principal (réglage *« Cartels de sous-site publiés sur le principal »*, [§14.2](#142-groupe-communauté--modération)) :
> - **Désactivé** (par défaut) : la modification passe directement.
> - **Stricte** : le cartel est **retiré du site principal** et remis en file jusqu'à nouvelle validation. *(Une variante « souple » est annoncée mais pas encore disponible.)*

> 💡 **Une validation acquise reste acquise.** Une fois un cartel de sous-site **validé** sur le principal, ce statut **ne se perd pas tout seul**. S'il est ensuite **dépublié ou archivé**, il disparaît de la frise principale (qui n'affiche que les cartels **publiés**) — mais s'il est **republié**, il **réapparaît directement sur le principal, sans repasser par la file**. Pour le retirer réellement du principal, utilisez le bouton de **retrait** (globe/horloge) ou, côté superadmin, **Rejeter** la soumission. *(Le mode « Stricte » ci-dessus est l'exception : une **modification de contenu** le renvoie, elle, en file.)*

### 13.3 Tableau comparatif

| | **File n°1 — Visiteurs** | **File n°2 — Sous-sites → principal** |
|---|---|---|
| Qui propose | Visiteur **anonyme** | **Propriétaire de sous-site** (ou superadmin) |
| Onglet | **En attente** (tout admin) | **Soumissions** (**superadmin only**) |
| État du cartel | Statut **En attente** | Reste **Publié** sur son sous-site |
| Accepter | **Publier** | **Approuver** |
| Refuser | **Supprimer** / brouillon | **Rejeter** (reste sur le sous-site) |
| Déclencheur | Le visiteur envoie le formulaire | Publication d'un cartel de sous-site (automatique) |

> 📸 **[Capture A06]** — Côte à côte : l'onglet « En attente » (file 1) et l'onglet « Soumissions » (file 2).

---

## 14. Le hub d'administration (« Administration »)

À `/app/admin` se trouve la page **« Administration »** (sous-titre *« Paramètres globaux de l'application »*), **réservée aux administrateurs**. C'est le **tableau de bord** des réglages et l'accès à toutes les pages de gestion. Un bouton **« Sauvegarder »** en haut enregistre les réglages directs (toast *« Paramètres enregistrés »*). Si vous quittez la page avec des **réglages non enregistrés**, une fenêtre vous propose **Annuler / Quitter sans sauvegarder / Enregistrer & quitter**.

### 14.1 Groupe « Contenus »

- **Sous-sites thématiques** — la liste + **Nouveau sous-site** / Ouvrir / Modifier / Supprimer ([chapitre 8](#8-les-sous-sites-thématiques--créer-et-piloter)).
- **Catégories & ateliers** — vers la page de taxonomie ([chapitre 17](#17-catégories--ateliers-taxonomie)).
- **Partenaires** — gérer la bibliothèque et **choisir lesquels s'affichent sur le site principal** (**★ Principaux** / **Standards**) ([chapitre 18](#18-partenaires-bibliothèque-centralisée)).

### 14.2 Groupe « Communauté & modération »

- **Soumissions de visiteurs** — réglages de la file n°1 :
  - **Autoriser les soumissions anonymes** (interrupteur). Si désactivé, seuls les comptes connectés peuvent proposer.
  - **Maximum de soumissions par adresse IP (total)** (1 à 500).
  - **Limite sur fenêtre glissante** : nombre par fenêtre (1 à 50) et durée (1 à 1440 min).
  - Un récapitulatif en clair résume la règle.
- **Cartels de sous-site publiés sur le principal** — politique de re-validation (Désactivé / Stricte), voir [§13.2](#132-file-n2--les-soumissions-des-sous-sites-vers-le-site-principal).
- Des **tuiles** vers : Équipe (page À propos), Articles de presse, Missions, Prestations, Boutique, **Gestion d'équipe (comptes)**, **Journal d'événements**.

### 14.3 Groupe « Système »

- **Clés API (traduction automatique)** — **Clé DeepL** (FR↔EN, optionnelle) et **Clé OpenAI** (requise pour les autres langues). Boutons Afficher/Masquer et Enregistrer.
- **Informations système** — récapitulatif en lecture seule : soumissions anonymes autorisées ou non, limites par IP, clés configurées ou non.

> 💡 **Réglages enregistrés par « Sauvegarder » :** soumissions anonymes (autorisation + quotas), politique de re-validation, clés DeepL et OpenAI. *(La sélection des partenaires du site principal a son propre bouton « Enregistrer la sélection ».)*

> 📸 **[Capture A07]** — Le hub « Administration » avec ses trois groupes.

---

## 15. Gérer les comptes utilisateurs

Page **« Gestion d'équipe (comptes) »** (`/app/admin/team`). C'est ici qu'on **crée et gère les comptes de connexion**.

> ⚠️ **À ne pas confondre avec « Équipe (page À propos) ».** Cette page-ci gère les **comptes qui permettent de se connecter**. L'autre ([§16.2](#162-équipe-de-la-page--à-propos-)) gère seulement **l'affichage public** des membres et **ne crée aucun accès**.

### 15.1 Le contexte (site principal ou sous-site)

En haut, des **chips** : un **superadmin** voit **[Site principal]** + **tous les sous-sites** ; un **propriétaire** ne voit que **son** sous-site.

### 15.2 Inviter un membre

Bloc **« Inviter un membre »** : un **Email** + un **Mot de passe (8+ caractères)** → **« Inviter »**. Le compte peut se connecter tout de suite. Par défaut, il peut **seulement créer des cartels**.

> 💡 **Quelle adresse e-mail choisir ?** Pour un compte destiné à un **propriétaire de sous-site**, utilisez de préférence une adresse **choisie par les personnes qui géreront réellement ce compte** (leur adresse d'équipe / de structure), plutôt qu'une adresse générique. C'est cette adresse qui permettra ensuite de **les recontacter** au sujet de leur sous-site.

> 👉 **Vous venez de créer un propriétaire de sous-site ?** Transmettez-lui le *Manuel d'utilisation d'un site dédié* : il y trouvera tout ce qu'il peut faire sur son sous-site (page d'accueil, partenaires, cartels, soumission au principal).

> 💡 **Réinitialiser ou changer un mot de passe.** Chaque carte membre porte un bouton **clé 🔑 « Réinitialiser le mot de passe »** : vous définissez un nouveau mot de passe (à transmettre par un canal sûr). De son côté, la personne peut **changer elle-même** son mot de passe via le menu utilisateur (en haut à droite) → **« Mot de passe »**. Choisissez un mot de passe initial que vous pourrez communiquer en sécurité.

### 15.3 Régler les permissions d'un membre

Chaque membre est une carte avec des interrupteurs : **Gérer les cartels**, **Exporter (langues du site)**, **Exporter (autre langue)** (lecture seule pour l'export — voir [§12.6](#126-le-compte-exportateur-accès-lecture-seule)), **Gérer les contenus**, **Gérer l'équipe** (= owner). Un bouton corbeille supprime (avec confirmation). *(La création / suppression de sous-sites et la validation des soumissions relèvent du superadmin, pas d'un interrupteur de cette carte.)*

> 💡 **Pas de sélecteur de « rôle »** : uniquement les interrupteurs ([§3.1](#31-le-principe--des-permissions-pas-des--rôles-)). Un superadmin affiche un badge **« Superadmin »**.

> ⚠️ **Garde-fous.** Un propriétaire ne gère que **son** équipe, ne peut ni créer ni modifier un superadmin, et ne peut pas se supprimer lui-même.

> 📸 **[Capture A08]** — La page « Gestion d'équipe (comptes) ».

---

## 16. Les pages de contenu éditorial

Ces pages alimentent les **pages publiques du site principal**. Toutes sont **réservées au superadmin** (sauf l'équipe « À propos » d'un sous-site, accessible à son propriétaire). Logique commune : encart d'aide, champs FR + bloc **« Version anglaise »** avec bouton **Traduire**, flèches ▲▼ pour l'ordre, case **publié/masqué** (œil), suppression confirmée.

### 16.1 Principe commun : publié ≠ supprimé

Un élément peut être **masqué sans être supprimé** (case « publié » / œil). Pratique pour retirer temporairement un contenu.

### 16.2 Équipe (de la page « À propos »)

Page **« Équipe (page À propos) »** (`/app/admin/team-content`). Gère **l'affichage public** des membres (pas les comptes). Fonctionne aussi **par sous-site**.
- **Trois catégories** : **Principaux** (grandes cartes), **Secondaires** (cartes compactes), **Communauté** (liste nom + rôle).
- **Champs** : **Nom** (obligatoire), **Rôle**, **Bio**, **Photo**, liens **LinkedIn / Site web / Autre lien**, et **Rôle (EN) / Bio (EN)** avec deux boutons de traduction (FR→EN et EN→FR).
- **Réordonner** (▲▼), **déplacer** vers une autre catégorie (menu), **éditer**, **supprimer**.

### 16.3 Missions (page Participer)

Page **« Missions (page Participer) »** (`/app/admin/missions`).
- **Champs** : **Thème** (obligatoire), **Nom** (obligatoire), **Texte** (HTML autorisé), **Lien** + **Libellé du lien**, **Nom (EN) / Texte (EN)**, case **publié**.

### 16.4 Prestations

Page **« Prestations »** (`/app/admin/prestations`).
- **Champs** : **Titre** (obligatoire), **Icône**, **Intro**, **Description**, **Liste à puces**, **Image illustrative**, **Bandeau logos partenaires** (« Ils nous ont fait confiance »), **Plaquette** (URL Calaméo ou PDF) + **Libellé**, versions EN, case **publié**.
> 💡 Une plaquette **Calaméo** s'affiche intégrée (bouton plein écran) ; sinon un bouton ouvre le PDF.

### 16.5 Boutique (liens externes)

Page **« Boutique (liens externes) »** (`/app/admin/shop`).
> ⚠️ **Aucun panier ni paiement sur le site.** Chaque produit est une **fiche-lien** vers la boutique externe **PrestaShop**.
- **Trois catégories** : **Livres**, **Jeux de cartes**, **Autres**.
- **Champs** : **Titre** (obligatoire), **Sous-titre / éditeur**, **Prix indicatif** (texte libre), **URL PrestaShop**, **Description**, **Visuel**, versions EN, case **publié**. Sans URL, la fiche s'affiche mais le bouton « Acheter » est masqué.

### 16.6 Articles de presse

Page **« Articles de presse »** (`/app/admin/press`).
- **Champs** : **Titre** (obligatoire), **Source / média**, **Date de publication**, **URL**, **Accroche / résumé**, **Vignette**, versions EN, case **publié**.
- **Tri automatique par date décroissante** (pas de réordonnancement manuel).

> 📸 **[Capture A09]** — Un éditeur de contenu type avec son bloc « Version anglaise » et le bouton Traduire.

---

## 17. Catégories & ateliers (taxonomie)

Page **« Catégories & ateliers »** (`/app/admin/taxonomies`).

### 17.1 Catégories (publiques)

Étiquettes thématiques colorées, visibles du public.
- **Créer** : **Nom (FR)** (obligatoire), **Name (EN)** (optionnel), **Couleur**. Le slug technique est **généré automatiquement**.
- **Éditer** : couleur, Nom (FR), Name (EN).
- **Supprimer** : *« Les cartels qui la portent la perdront. »* (les cartels ne sont pas supprimés).

### 17.2 Ateliers (internes)

Groupes de cartels **invisibles du public**, qui servent à organiser, à alimenter les sous-sites en mode « atelier », et à proposer des **frises immersives** (voir [§7.4](#74-le-mode-atelier-et-le-mode-immersif-borne--exposition)).

> 💡 **On ne crée pas un atelier ici.** Un atelier naît depuis l'écran Gestion (sélection de cartels → **« Associer à un atelier » → nouvel atelier**). Cette page sert à le **renommer**, le marquer **Immersif**, ou le **supprimer**.

- Chaque atelier affiche son **nombre de cartels** et le **créateur**.
- **Éditer** : Nom + case **Immersif** (effet expliqué en [§7.4](#74-le-mode-atelier-et-le-mode-immersif-borne--exposition)).
- Bouton **« Cartels »** → ouvre la gestion des cartels de cet atelier.
- **Supprimer** : les cartels associés ne sont pas supprimés, ils sont seulement **déliés**.

> 💡 Il n'existe **pas** de fusion (merge) d'ateliers ou de catégories.

---

## 18. Partenaires (bibliothèque centralisée)

Page **« Gestion des partenaires »** (`/app/admin/partners`). Bibliothèque **centralisée** en **trois catégories mutuellement exclusives** :

| Catégorie | Sens |
|---|---|
| **Obligatoires** | Apparaissent **sur tous les sous-sites**, automatiquement (réservé au superadmin). |
| **Pool public** | **Réservoir partagé** : chaque sous-site choisit ceux qu'il affiche. |
| **Exclusifs** | Rattachés à **un seul sous-site**. Un propriétaire peut gérer les exclusifs **de son** sous-site. |

- **Ajouter** : **Nom** (obligatoire), **URL**, **Sous-site propriétaire** (pour les exclusifs), **Logo**. *(Pas de version anglaise.)*
- **Basculer** Obligatoire / Optionnel (superadmin), **Supprimer**.

> 💡 **Affichage sur le site principal :** c'est dans *Admin → Administration → Partenaires* que vous choisissez les partenaires de la page « À propos », répartis en **★ Principaux** (mis en avant) et **Standards**.

> 👉 **Côté sous-site, la sélection se fait ailleurs.** Un propriétaire ne choisit **plus** ses partenaires depuis l'éditeur du sous-site (voir [§8.2](#82-créer-un-sous-site-la-fenêtre-déditeur)) : il dispose d'une **page dédiée** sur son sous-site (recherche dans le catalogue, rôle **Principal / Standard / —**, et ajout d'un partenaire **exclusif** à son sous-site). Cette bibliothèque centrale reste la source : les catégories *Obligatoires / Pool public / Exclusifs* y sont définies. Le détail de la page propriétaire figure dans le *Manuel d'utilisation d'un site dédié*.

> 📸 **[Capture A10]** — La bibliothèque de partenaires.

---

## 19. Notifications email & journal d'événements

Page **« Journal d'événements »** (`/app/admin/logs`), **réservée au superadmin**, deux onglets.

### 19.1 Le principe : tout est journalisé, l'email est optionnel

Chaque action importante passe par un point unique qui fait **deux choses** :
1. **Toujours** : l'événement est **enregistré dans le journal** (en base). Même sans email configuré, **tout reste tracé**.
2. **Si configuré** : un email est envoyé. Cet envoi est **non bloquant** — s'il échoue, l'action métier **réussit quand même**.

> 💡 **Par défaut, AUCUN email ne part.** Un email ne part **que si** : le type d'événement est **activé**, un **destinataire** est renseigné, **et** le serveur d'envoi (SMTP) est configuré.

### 19.2 Onglet « Journal » (audit)

Historique chronologique, **filtrable** par **Type**, **mots-clés** et **date (« Depuis »)**. Colonnes : Date, Type, Acteur, Résumé, Cible. Pagination par 100.

> 💡 **Aucune donnée sensible** dans le journal (pas de mots de passe). C'est l'outil pour « qui a fait quoi, et quand ».

### 19.3 Onglet « Configuration emails »

Le superadmin **active les notifications par type** et **fixe les destinataires** :
- **Email** (case) : active/désactive.
- **Destinataire** : l'adresse qui recevra l'alerte (vide = aucun envoi).
- **Sujet préfixe** : par défaut **`[Paléo]`**.
- **Spam** (case) : marque l'email pour le ranger automatiquement (types bavards).

Un raccourci **« Appliquer un destinataire à tous les types »** fixe une adresse unique pour l'ensemble en un clic. Enregistrement via le bandeau **« N modification(s) non sauvegardée(s) »**.

> 📸 **[Capture A11]** — L'onglet « Configuration emails ».

### 19.4 La liste des événements

Tous **désactivés par défaut**. Les principaux :

| Type | Se produit quand… |
|---|---|
| `cartel.submission_pending` | Un **visiteur anonyme** propose un cartel (file n°1). |
| `cartel.subsite_submitted` | Un **sous-site demande** la publication sur le principal (file n°2). |
| `cartel.subsite_approved` / `cartel.subsite_rejected` | Le superadmin **approuve / rejette** une soumission sous-site. |
| `cartel.published` / `cartel.subsite_published` | Un cartel est publié (principal / sous-site). |
| `cartel.created` / `draft_created` / `updated` / `deleted` | Cycle de vie d'un cartel (souvent bavard). |
| `mission_application.created` | Une **candidature** est reçue (`/participer`). |
| `contact_message.created` | Un **message de contact** est reçu (`/contact`). |
| `user.*` | Cycle de vie des **comptes**. |
| `subsite.*`, `partner.*`, `category.*`, `workshop.*` | Cycle de vie de la configuration. |

> 💡 **Recommandation :** activez au minimum `contact_message.created`, `mission_application.created`, `cartel.submission_pending` et `cartel.subsite_submitted` vers une adresse relevée — ce sont les événements qui demandent une **action humaine**.

### 19.5 La configuration du serveur d'envoi (SMTP)

L'envoi réel dépend de **paramètres techniques** (côté hébergement) : `MAIL_SMTP_HOST`, `MAIL_SMTP_PORT`, `MAIL_SMTP_USER`, `MAIL_SMTP_PASS`, `MAIL_FROM`.

> 💡 **Sans ces paramètres, rien ne plante** : l'app fonctionne, le journal reste rempli, mais **aucun email ne part**. Pour Gmail/Workspace, un **mot de passe d'application** est requis. *(Détails en [§24.5](#245-paramètres-dhébergement-fichier-de-configuration-serveur).)*

---

## 20. Les formulaires reçus du public (contact, candidatures)

Les deux formulaires publics ([§5.4](#54-les-deux-formulaires-que-le-public-peut-envoyer)) — **Contact** et **Candidature à une mission** — aboutissent au même endroit :

1. **Enregistrement en base** (avec l'IP de l'expéditeur).
2. **Journalisation** : visibles dans *Admin → Journal d'événements* (`contact_message.created` / `mission_application.created`).
3. **Email aux administrateurs** : **uniquement si la notification est activée** ([chapitre 19](#19-notifications-email--journal-dévénements)).

> ⚠️ **Pour ne rater aucune demande**, activez ces deux notifications vers une adresse relevée. Sinon, consultez le journal régulièrement.

> 💡 **Aucune confirmation n'est envoyée à l'expéditeur** : il voit seulement un remerciement à l'écran. Répondez-lui depuis votre boîte habituelle (son email figure dans la demande).

> ℹ️ **Consultation des demandes :** elles sont accessibles dans le journal. Il n'existe pas (encore) d'écran dédié de « boîte de réception » dans l'admin ; le journal et l'email tiennent ce rôle.

---

## 21. Exports, imports, QR codes et impression

Depuis l'écran Gestion (et la bibliothèque), on exporte des cartels — utile pour l'**impression d'exposition**, l'**archivage** et les **expos multilingues**.

### 21.1 Les quatre formats d'export

| Format | Contenu | Usage |
|---|---|---|
| **Cartels JPEG (ZIP)** | Une image par cartel, **A4 paysage** haute définition, en ZIP. | Signalétique, impressions. |
| **PDF impression** | Tous les cartels en A4 paysage, un par page. | Imprimer une frise. |
| **PDF traduit (autre langue)** | Le même PDF, **traduit** dans la langue choisie (voir §21.2). | Exposition internationale. |
| **Archive complète (JSON + Images)** | Sauvegarde réimportable : données + images. | Sauvegarde / migration. |

Le rendu imprimé est un **A4 paysage à 300 dpi** : image à gauche, bandeau rose (année, lieu, titre, description), QR code en bas, crédits et catégories. Les exports JPEG et PDF suivent la **langue affichée** (FR ou EN).

### 21.2 Le « PDF traduit » dans n'importe quelle langue

- Sélectionnez des cartels → **Exporter → « PDF traduit (autre langue)… »** → saisissez la **langue cible** (suggestions : Espagnol, Allemand, Italien, Portugais, Néerlandais, Japonais, Chinois, Arabe — ou texte libre).
- L'IA (**OpenAI**, indispensable ici) traduit les contenus **et** les libellés, puis le PDF est généré.
- ⚠️ **Cette traduction n'est pas enregistrée** : elle ne sert qu'à ce PDF. Régénérer relance (et refacture) une traduction.

### 21.3 Les QR codes

Chaque cartel imprimé peut porter un **QR code** :
- Si le cartel utilise une **page « En savoir plus » interne** → le QR pointe vers sa **fiche en ligne** (avec le bon domaine).
- Sinon, si un **lien QR Code** a été saisi → le QR encode ce lien externe.
- Si ni l'un ni l'autre → **pas de QR code**.

> 💡 Les QR des cartels du site principal et des sous-sites sans domaine dédié encodent une adresse au format `…/#/…` **volontairement** : c'est ce qui leur permet de continuer à fonctionner même après les évolutions techniques du site (voir [§5.5](#55-référencement-seo-et-particularités-techniques-des-pages)).

### 21.4 Importer une archive

Écran Gestion → **Importer** (fichier **ZIP** contenant `cartels.json` + images, **200 Mo max**) :
- **Tous les cartels importés arrivent en statut Brouillon** (jamais publiés directement).
- Les images sont restaurées (renommées de façon unique).
- ⚠️ **Aucune détection de doublon** : réimporter deux fois crée **deux jeux** de cartels.
- ⚠️ Les **catégories ne sont pas ré-associées** automatiquement.

> 📸 **[Capture A12]** — Le menu « Exporter » sur ses 4 formats + la fenêtre de langue du PDF traduit.

---

## 22. Statistiques

Page **« Statistiques »** (`/app/admin/stats`). Croise plusieurs dimensions. Les filtres en haut s'appliquent à tous les graphiques.

- **Filtres** : Sous-site (superadmin), période de création, époque de l'invention (année min/max), « Exhumé par », visibilité, catégories, statuts. Cliquez **« Appliquer »**.
- **Graphiques** : total de cartels, **par catégorie**, **par sous-site** (superadmin), **par statut**, **créations dans le temps** (par mois), **distribution par époque** (années regroupées en tranches automatiques), **top contributeurs**.

> 💡 **Usage commercial :** idéal pour illustrer la richesse de la base lors d'une présentation.

> ℹ️ **Pas d'export des statistiques.** Les graphiques ne sont **pas téléchargeables** (ni image ni tableau) : pour une présentation, faites une **capture d'écran**.

> 📸 **[Capture A13]** — La page Statistiques.

---

## 23. Paramètres système, clés API et hébergement

Les éléments **techniques** à connaître pour dialoguer avec l'hébergeur.

### 23.1 Clés API de traduction

Dans *Admin → Réglages*, **stockées en base** :
- **Clé DeepL** : pour le FR↔EN (optionnelle ; bascule sur l'API gratuite si la clé se termine par `:fx`).
- **Clé OpenAI** : indispensable pour les langues autres que FR/EN et le PDF traduit.

> 💡 Les clés sont **masquées** dans l'interface (boutons Afficher/Masquer) et ne sont jamais renvoyées en clair au navigateur (l'app sait seulement si une clé « est configurée » ou non).

### 23.2 Ce qui se règle dans l'interface vs sur le serveur

| Réglé **dans l'admin** (superadmin) | Réglé **sur le serveur** (hébergeur) |
|---|---|
| Soumissions anonymes (autorisation + quotas) | Envoi d'emails (SMTP) |
| Politique de re-validation sous-site→principal | Durée de session (par défaut 7 jours) |
| Clés DeepL / OpenAI | Domaines dédiés des sous-sites |
| Partenaires affichés sur le site principal | Base de données, dossier d'images |

### 23.3 Sécurité — à vérifier en production

- Le **compte initial** est créé via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` ; en production un mot de passe fort est **obligatoire** (le défaut `admin/admin` est refusé par le script).
- Les **clés API** ne doivent pas être divulguées.
- **Aucun cookie de mesure d'audience ni traceur tiers** (cf. politique de confidentialité) — seul un jeton de session est stocké dans le navigateur.

### 23.4 Domaines, redirections et SEO multi-domaines

Une **seule application** sert **plusieurs domaines** : le serveur aiguille selon le **nom d'hôte** (host) de la requête.

**Les domaines servis :**

| Domaine | Sert |
|---|---|
| `paleo-energetique.org` (+ `www`) | Le **site principal** (hub). |
| `paleo-pedia.org` (+ `www`) | La **vitrine Paléo-Pédia**, à la racine. |
| `paleo-h2o.org` | Le **sous-site** `paleo-h2o` (host dédié). |
| `aero.paleo-energetique.org` | Le **sous-site** `paleo-aerospace` (host dédié). |

**Les anciennes adresses (héritage du WordPress retiré) :**
- **Redirections permanentes (301)** vers `paleo-pedia.org` : `cyclo.paleo-energetique.org`, `paleo-pedia.com` (+ `www`). *(Elles préservent le référencement déjà acquis.)*
- **« 410 Gone »** (la page n'existe plus, définitivement) : `stockage.paleo-energetique.org` ainsi que toutes les **URLs de spam** injectées par l'ancien WordPress piraté (adresses se terminant par `-k-<chiffres>`).

**robots.txt et sitemap.xml par domaine.** Le site principal et la Pédia exposent des fichiers **distincts** : une requête sur un domaine Pédia reçoit `robots-pedia.txt` / `sitemap-pedia.xml`, les autres reçoivent les versions standard. *(Rappel [§5.5](#55-référencement-seo-et-particularités-techniques-des-pages) : ces sitemaps sont maintenus à la main et ne listent pas les fiches de cartels.)*

**Page 404 « brandée ».** Une adresse inconnue n'affiche pas une erreur brute : elle ouvre une **page « introuvable » habillée** (avec l'en-tête et le pied de page du site courant) qui invite à revenir à l'accueil ou à la frise.

> 📸 **[Capture A16]** — La page 404 brandée.

> ⚠️ **Tous ces branchements sont codés côté serveur** (correspondances domaine → sous-site, redirections 301/410, variantes robots/sitemap). Les modifier — ou ajouter un domaine — demande une **intervention de développement**, pas un réglage dans l'admin.

### 23.5 Hébergement

> 💡 **En production, la v2 est hébergée chez Infomaniak** : un site **Node.js** unique sert tous les domaines ci-dessus. Cet hébergement a **remplacé l'ancien o2switch**. Les détails (chemins, variables d'environnement, déploiement Git, liens d'uploads) relèvent de la documentation technique de déploiement (`HEBERGEMENT-INFOMANIAK.md`).

---

## 24. Annexe technique : limites, stockage, sécurité

Cette annexe regroupe les **valeurs chiffrées et comportements bas niveau** utiles à un référent technique. Un administrateur « métier » peut s'en tenir aux points marqués ⚠️.

### 24.1 Limites de longueur des champs d'un cartel

Au-delà, l'enregistrement est refusé avec un message *« Le champ "…" dépasse la longueur maximale (N caractères). »* :

| Champ | Limite |
|---|---|
| Titre (FR/EN) | 200 caractères |
| Année | 50 |
| Description (FR/EN) | **10 000** |
| Exhumé par | 200 |
| Localisation (FR/EN) | 300 |
| Crédit image | 300 |
| Lien QR / chemin image | 500 |
| Contact | 255 |
| Contenu de la page interne (« blocs ») | ~500 Ko de données |

> 💡 Le compteur « 1500 » affiché sous la Description est une **limite indicative d'ergonomie** (il devient rouge mais **ne bloque pas**). La vraie limite technique est de 10 000 caractères.

### 24.2 Quotas de soumission et d'envoi

**Soumission anonyme de cartels** (file n°1) — valeurs **par défaut** (modifiables dans l'admin) :
- Total par IP : **10**. Message si dépassé : *« Limite atteinte : maximum 10 soumissions par adresse IP. »*
- Par fenêtre glissante : **3 toutes les 60 minutes**. Message : *« Trop de soumissions : maximum 3 en 60 minutes par adresse IP. »*
- Si les soumissions anonymes sont coupées : *« Les soumissions anonymes sont désactivées. Veuillez vous connecter. »*

**Upload d'images par un visiteur anonyme** : **20 images par heure et par adresse IP**. Message : *« Limite atteinte : maximum 20 images par heure par adresse IP. »* *(Les utilisateurs connectés ne sont pas limités. Ce compteur est en mémoire : il se réinitialise si le serveur redémarre.)*

**Connexion** : **15 tentatives par 15 minutes et par adresse IP** sur la page de connexion (anti-force-brute). Au-delà : *« Trop de tentatives de connexion. Réessayez dans X minute(s). »* (Réglable côté serveur ; compteur en mémoire.)

> ⚠️ **Délai de prise en compte des réglages :** les réglages de quotas sont mis en cache **jusqu'à 1 minute**. Une modification peut donc mettre ~60 s à devenir effective.

> 💡 **Honeypot.** Les trois formulaires publics (proposer un cartel, contact, candidature) contiennent un champ piège caché. Un robot qui le remplit est rejeté (« Requête invalide. »).

### 24.3 Images : upload et compression

- **Taille max par image : 20 Mo.** Formats acceptés : **JPEG, PNG, WEBP, GIF, SVG** uniquement (message clair sinon).
- **Compression automatique** côté navigateur avant envoi : redimensionnement à **1600 × 1600 px max**, ré-encodage en **JPEG**. Une image déjà petite (< 1 Mo et dans les dimensions) est laissée telle quelle.
- Les images sont servies depuis le serveur à des adresses du type `/api/images/<fichier>`.

> 💡 **SVG neutralisé.** Le format SVG est accepté à l'upload, mais les fichiers servis portent un en-tête de sécurité (CSP « sandbox ») : un SVG ouvert directement **ne peut pas** exécuter de script. Le risque XSS est neutralisé.

### 24.4 Géocodage (OpenStreetMap)

- La localisation des cartels utilise **Nominatim / OpenStreetMap**, appelé **depuis le navigateur**, **manuellement** (bouton), à partir de 3 caractères saisis, en ne gardant que le 1er résultat.
- **Aucune clé, aucune donnée stockée chez OSM.** Mais la **politique d'usage d'OSM limite à ~1 requête/seconde** et interdit l'usage massif automatisé. ⚠️ En **saisie en masse** (atelier, import), un usage trop intensif pourrait entraîner un blocage temporaire de l'IP par OSM.

### 24.5 Paramètres d'hébergement (fichier de configuration serveur)

Réglés sur le serveur, hors interface :
- **Emails :** `MAIL_SMTP_HOST` (requis), `MAIL_SMTP_PORT` (587 ou 465), `MAIL_SMTP_USER` / `MAIL_SMTP_PASS` (requis), `MAIL_FROM`.
- **Session :** `JWT_EXPIRES_IN` (défaut `7d`), `JWT_SECRET`.
- **Base de données :** **MySQL** (`DATABASE_URL` ou `DB_HOST/PORT/NAME/USER/PASSWORD`).
- **Images :** `UPLOADS_DIR` (dossier de stockage).
- **Réseau :** `ALLOWED_ORIGIN` (CORS), `TRUST_PROXY` (défaut 1 — **indispensable** pour que les quotas par IP et le routage par domaine fonctionnent derrière le proxy de l'hébergeur, désormais Infomaniak).
- **Healthcheck :** une adresse `/health` renvoie l'état du serveur (utile à la supervision).

### 24.6 Limites diverses & particularités serveur

- **Liste des cartels** : jusqu'à **5000** renvoyés, du plus récent au plus ancien.
- **File de soumissions** : 50 par page, des plus anciennes aux plus récentes.
- **Export complet** (sans sélection) : plafonné à **5000** cartels publiés.
- **Corps des requêtes** limité à 10 Mo.
- **Redirection HTTP → HTTPS** active en production.
- **En-têtes de sécurité** posés sur toutes les réponses : `X-Content-Type-Options` (nosniff), `X-Frame-Options` (anti-clickjacking), `Referrer-Policy`, `Permissions-Policy`, et `Strict-Transport-Security` (HSTS) en production. Pas de CSP stricte **globale** — choix délibéré pour ne pas casser la 3D, les cartes et les embeds (YouTube, Calaméo, Sketchfab) ; une CSP « sandbox » cible toutefois les SVG servis.
- **Connexion protégée** contre la force brute (limite de tentatives par IP) ; **inscription publique désactivée** (les comptes se créent uniquement par invitation).
- **Routage multi-domaines** (voir [§23.4](#234-domaines-redirections-et-seo-multi-domaines)) : hosts dédiés `paleo-h2o.org` & `aero.paleo-energetique.org` (sous-sites) et `paleo-pedia.org` (vitrine) ; redirections **301** des anciens domaines WordPress (`cyclo.*`, `paleo-pedia.com`) vers `paleo-pedia.org` ; **410 Gone** pour `stockage.*` et les URLs de spam (`-k-<chiffres>`).
- **robots.txt / sitemap.xml servis par domaine** : variante Pédia (`robots-pedia.txt` / `sitemap-pedia.xml`) sur les hosts Pédia, variante standard ailleurs.
- **Route d'export ouverte aux comptes « exportateur »** : un compte avec une seule capacité *Exporter* peut exporter des cartels publiés (traduits à la volée avec « autre langue ») **sans** droits d'administration, et **strictement dans son périmètre** (les ids hors périmètre sont écartés). Voir [§12.6](#126-le-compte-exportateur-accès-lecture-seule).

### 24.7 Stockage dans le navigateur (vie privée)

L'app stocke quelques informations **localement dans le navigateur** (jamais de cookie tiers) :
- le **jeton de session** ;
- la **langue choisie** (FR/EN) ;
- vos **brouillons de cartels** en cours de saisie (purgés après 30 jours) ;
- vos **préférences d'affichage** de l'écran Gestion (colonnes, sélection, tri).

---

## 25. Points d'attention et pièges à éviter

- **Deux files de modération distinctes.** « En attente » = visiteurs ; « Soumissions » = sous-sites → principal ([chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre)).
- **Publier un cartel de sous-site = le proposer au principal** (automatique). Pour l'éviter, garder en brouillon ou retirer.
- **Permissions, pas rôles.** Des **capacités scopées** au périmètre du compte (Gérer les cartels · Exporter langues du site · Exporter autre langue · Gérer les contenus · Gérer l'équipe) + le statut **superadmin** ; le « rôle » historique ne sert à rien ([§3.1](#31-le-principe--des-permissions-pas-des--rôles-)).
- **Superadmin et owner incluent tout leur périmètre.** Pas besoin de leur cocher les capacités une à une.
- **Compte exportateur = lecture seule.** Une capacité *Exporter* seule donne accès au gestionnaire en lecture seule (cartels publiés, export ± traduit à la volée) — utile pour un prestataire, sans aucun pouvoir de modification ([§12.6](#126-le-compte-exportateur-accès-lecture-seule)).
- **Les changements de droits s'appliquent à la reconnexion** (jeton 7 jours).
- **Mots de passe :** réinitialisation par un admin (*Gestion d'équipe*, bouton clé) et changement en libre-service (menu utilisateur → « Mot de passe »). Pas de « mot de passe oublié » par email ([§4.3](#43-sécurité-des-accès--à-dire-aux-utilisateurs)).
- **Emails désactivés par défaut.** Activer les notifications utiles + configurer le SMTP, sinon **personne n'est prévenu** ([chapitre 19](#19-notifications-email--journal-dévénements)).
- **Source d'un sous-site figée à la création** ; nom/slug modifiables par le superadmin seulement.
- **Supprimer un sous-site fait basculer ses cartels sur le principal.** Les cartels publiés d'un sous-site supprimé rejoignent la **frise principale sans validation** ([§8.3](#83-modifier-ou-supprimer-un-sous-site)). Archivez-les avant si besoin.
- **Une validation au principal est persistante.** Dépublier puis republier un cartel déjà validé le **remet sur le principal sans repasser par la file** ([§13.2](#132-file-n2--les-soumissions-des-sous-sites-vers-le-site-principal)).
- **Domaine dédié = intervention technique** (codé en dur), pas un réglage dans l'admin. **Deux** sous-sites en ont un (`paleo-h2o.org`, `aero.paleo-energetique.org`) + la Pédia (`paleo-pedia.org`) ([§2](#2-vue-densemble--larchitecture-de-la-plateforme), [§23.4](#234-domaines-redirections-et-seo-multi-domaines)).
- **On peut administrer depuis la Pédia.** `paleo-pedia.org` expose la connexion + l'admin ; la session y est **propre au domaine** ([§6.1](#61-connexion-et-administration-depuis-la-pédia)).
- **« Équipe (page À propos) » ≠ « Gestion d'équipe (comptes) ».**
- **Boutique = liens externes**, pas de paiement sur le site.
- **PDF traduit non enregistré** ; retraduction FR↔EN enregistrée (écrase l'existant).
- **Import → tout en brouillon**, pas de dédoublonnage, catégories à ré-associer.
- **Mode immersif d'un atelier = pas de sortie** : ne l'utilisez que pour une borne dédiée.
- **Sitemap figé** (n'inclut ni sous-sites ni cartels) ; **SVG accepté à l'upload** (à surveiller).
- **Géocodage OSM** : éviter la saisie en masse trop rapide.
- **Traductions automatiques : toujours relire.**
- **Museum et pages légales sont figés** (modifiables seulement dans le code).

---

## 26. Modes opératoires pas-à-pas (recettes)

### Recette A — Créer un nouveau sous-site
1. *Admin → Administration → Sous-sites thématiques → « Nouveau sous-site »*.
2. Renseignez **Nom**, vérifiez le **Slug**, choisissez la **Source** (catégorie ou atelier — **figée ensuite**).
3. Réglez **couleur**, **type de planète**, composez la **page d'accueil** (FR puis English).
4. *(Optionnel mais pratique)* Dans la section **« Compte propriétaire »**, saisissez l'**e-mail + mot de passe** de l'owner pour le créer **en même temps** (voir [§8.2](#82-créer-un-sous-site-la-fenêtre-déditeur)). Validez.
5. *(Si vous ne l'avez pas fait à l'étape 4)* Créez son **propriétaire** : *Gestion d'équipe (comptes)* → sélectionner le sous-site → inviter, puis activer **« Gérer l'équipe »**.
6. *(Optionnel)* Les **partenaires** du sous-site se règlent ensuite sur leur **page dédiée**, côté propriétaire (voir le *Manuel d'utilisation d'un site dédié*).

### Recette B — Valider une soumission d'un sous-site vers le principal
1. *Gestion → onglet **Soumissions*** (superadmin).
2. Vérifiez (Aperçu / Aperçu web).
3. **Approuver** (apparaît sur le principal, reste sur le sous-site) ou **Rejeter** (reste sur le sous-site).

### Recette C — Modérer une proposition de visiteur
1. *Gestion → onglet **En attente***.
2. **Aperçu** / **Éditer** pour vérifier/corriger.
3. **Publier** pour accepter, **Supprimer** pour refuser.

### Recette D — Recevoir par email les demandes du public
1. Faites configurer le **SMTP** par l'hébergeur ([§24.5](#245-paramètres-dhébergement-fichier-de-configuration-serveur)).
2. *Admin → Journal d'événements → Configuration emails*.
3. Activez **Email** + **Destinataire** pour `contact_message.created`, `mission_application.created`, `cartel.submission_pending`, `cartel.subsite_submitted` (ou « Appliquer à tous »). **Enregistrer**.

### Recette E — Préparer une borne d'exposition (mode immersif)
1. *Gestion* → sélectionnez les cartels de l'expo → **Associer à un atelier** (nouvel atelier).
2. *Admin → Catégories & ateliers* → éditez l'atelier → cochez **Immersif**.
3. Récupérez l'URL publique (**« Voir Version Publique »** → `/app/workshop/<id>`) et ouvrez-la sur la borne en plein écran.

### Recette F — Mettre à jour une page publique
- **Équipe** → *Admin → Équipe (page À propos)* · **Partenaires** → *Admin → Partenaires* · **Prestations / Boutique / Presse / Missions** → la page correspondante ([chapitre 16](#16-les-pages-de-contenu-éditorial)). Remplissez la **version anglaise** et cochez **publié**.

### Recette G — Configurer la traduction automatique
1. *Admin → Réglages → Clés API*. Collez **DeepL** (FR↔EN) et/ou **OpenAI** (autres langues). **Enregistrer**.
2. Testez avec un cartel : bouton **Retraduire**.

### Recette H — Imprimer pour une exposition
1. *Gestion → Publiés*, sélectionnez → **Exporter → PDF impression** (ou JPEG ZIP). Chaque cartel porte un **QR code**.

### Recette I — Exposition à l'étranger (PDF dans une autre langue)
1. Vérifiez qu'une **clé OpenAI** est configurée.
2. Sélectionnez → **Exporter → « PDF traduit (autre langue)… »** → saisissez la langue → générez → **relisez** (non enregistré).

### Recette J — Sauvegarder / migrer les cartels
1. *Gestion* → **Exporter tout** → **Archive complète**.
2. Pour réimporter : **Importer** le ZIP → cartels en **Brouillon** → republier + ré-associer les catégories.

### Recette K — Nettoyer les images cassées
1. Ouvrez *Gestion* : la fenêtre d'audit s'affiche s'il y a des problèmes.
2. **« Voir les cartels problématiques »** → corrigez (rééditez l'image) les cas *Fichier introuvable* / *Chemin legacy*.

---

## 27. FAQ

**Quelle différence entre « En attente » et « Soumissions » ?**
« En attente » = cartels proposés par des **visiteurs**. « Soumissions » = cartels de **sous-sites** demandant à apparaître sur le **site principal** (superadmin uniquement). Voir [chapitre 13](#13-les-deux-files-de-modération-à-ne-jamais-confondre).

**Un cartel de sous-site publié apparaît-il tout de suite sur le site principal ?**
Non. Sa publication le **propose** automatiquement, mais il faut l'**approbation** du superadmin.

**Je n'ai pas reçu d'email pour un nouveau message de contact. Normal ?**
Oui si la notification n'est pas activée (désactivée par défaut). Le message est tout de même **enregistré et journalisé**. Voir [chapitre 19](#19-notifications-email--journal-dévénements).

**Comment réinitialiser le mot de passe d'un utilisateur ?**
Dans *Gestion d'équipe (comptes)*, cliquez le bouton **clé** sur la carte du membre et saisissez un nouveau mot de passe (à lui transmettre par un canal sûr). La personne peut ensuite le changer elle-même (menu utilisateur → « Mot de passe »). Voir [§4.3](#43-sécurité-des-accès--à-dire-aux-utilisateurs).

**Je viens de retirer un droit, mais la personne l'a toujours.**
Les droits sont rafraîchis **à la reconnexion** (jeton 7 jours). Faites-la se déconnecter/reconnecter.

**Comment ouvrir un sous-site sur son propre nom de domaine ?**
Cela demande une **intervention technique** (DNS + ajout du domaine dans le code) : ce n'est pas un réglage de l'admin. Aujourd'hui, deux sous-sites en ont un (`paleo-h2o.org`, `aero.paleo-energetique.org`). Voir [§2](#2-vue-densemble--larchitecture-de-la-plateforme) et [§23.4](#234-domaines-redirections-et-seo-multi-domaines).

**À quoi sert un compte « exportateur » ?**
À donner un accès **lecture seule** au gestionnaire (cartels publiés uniquement), limité à l'**export** et à la **(re)traduction**, sans aucun droit de modification, de publication ou de modération. Idéal pour un prestataire d'impression ou d'exposition. Voir [§12.6](#126-le-compte-exportateur-accès-lecture-seule).

**Peut-on administrer depuis la Pédia (`paleo-pedia.org`) ?**
Oui. La vitrine expose un bouton **« Se connecter »** puis, une fois connecté, un accès **« Admin »**. La session est **propre au domaine** : se connecter sur la Pédia ne connecte pas automatiquement sur `paleo-energetique.org`. Voir [§6.1](#61-connexion-et-administration-depuis-la-pédia).

**Puis-je changer la source (catégorie/atelier) d'un sous-site ?**
Non, elle est **figée à la création**. Le nom et le slug sont modifiables **par un superadmin**.

**À quoi sert le mode « Immersif » d'un atelier ?**
À transformer la frise d'un atelier en **borne d'exposition sans sortie** (le bandeau et le bouton « Quitter » disparaissent). Voir [§7.4](#74-le-mode-atelier-et-le-mode-immersif-borne--exposition).

**Différence entre « Équipe (page À propos) » et « Gestion d'équipe (comptes) » ?**
La première gère **l'affichage public** (photos, bios). La seconde gère les **comptes de connexion**. Voir [chapitre 15](#15-gérer-les-comptes-utilisateurs).

**Le site gère-t-il les paiements de la boutique ?**
Non. C'est une **vitrine de liens** vers PrestaShop.

**La traduction d'un PDF dans une autre langue est-elle conservée ?**
Non, **ponctuelle**. La **retraduction FR↔EN d'un cartel**, elle, est enregistrée.

**Pourquoi un texte reste-t-il en français pour un visiteur anglophone ?**
Parce que la version anglaise de ce champ est vide : l'app **retombe sur le français**. Complétez la version EN.

**Quelle est la taille maximale d'une image ?**
20 Mo, et elle est **compressée automatiquement** à l'upload. Formats : JPEG, PNG, WEBP, GIF, SVG. Voir [§24.3](#243-images--upload-et-compression).

---

## Glossaire

- **Cartel** — fiche d'un objet/invention affichée sur la frise.
- **Site principal** — le site Paléo-Énergétique (vitrine + frise globale).
- **Sous-site / site dédié** — mini-site thématique autonome.
- **Paléo-Pédia** — la vitrine `/pedia` présentant l'écosystème.
- **Superadmin / Administrateur général** — permission « Gérer l'administration » : pouvoir global.
- **Owner / Propriétaire** — capacité « Gérer l'équipe » + un sous-site : pouvoir local.
- **Capacité (permission)** — l'un des interrupteurs qui déterminent les droits (Gérer les cartels, Exporter langues du site, Exporter autre langue, Gérer les contenus, Gérer l'équipe). **Toujours bornée au périmètre** (site principal ou un sous-site) du compte.
- **Périmètre** — l'ensemble sur lequel portent les capacités d'un compte : le site principal (rattachement vide) ou un sous-site précis.
- **Compte exportateur** — compte en lecture seule (une capacité *Exporter* seule) limité à l'**export** des cartels publiés de son périmètre (traduit à la volée avec « autre langue »), sans pouvoir de modification.
- **Statut** — état d'un cartel : Brouillon, En attente, Publié, Archivé.
- **File n°1 (« En attente »)** — modération des propositions de visiteurs.
- **File n°2 (« Soumissions »)** — validation des cartels sous-site → site principal.
- **Catégorie** — étiquette thématique publique (avec couleur). **Atelier** — groupe de cartels interne, invisible du public (peut être immersif).
- **Mode immersif** — frise d'atelier en borne d'exposition, sans bandeau ni bouton « Quitter ».
- **Repli / fallback** — affichage du texte français quand la version anglaise est vide.
- **Journal d'événements** — l'audit de toutes les actions (toujours enregistré).
- **SMTP** — le serveur qui envoie réellement les emails (configuré côté hébergement).
- **QR code** — code imprimé sur un cartel renvoyant vers sa fiche ou un lien externe.
- **Slug** — la partie « adresse » d'un sous-site dans l'URL.
- **Host / domaine dédié** — nom de domaine propre servant directement un sous-site (`paleo-h2o.org`, `aero.paleo-energetique.org`) ou la vitrine (`paleo-pedia.org`), au lieu de passer par `…/site/<slug>` ou `/pedia`.
- **Redirection 301 / 410** — réponses serveur pour les anciennes adresses : **301** = déplacé définitivement (renvoi vers la nouvelle URL, ex. anciens domaines WordPress → `paleo-pedia.org`) ; **410** = supprimé définitivement (page de spam ou domaine abandonné).
- **Honeypot** — champ piège invisible qui bloque les robots dans les formulaires.

---

*Fin du manuel. Pour les opérations touchant l'hébergement (domaines dédiés, SMTP, base de données, clés serveur) ou toute intervention technique, adressez-vous à la personne en charge du déploiement. Ce manuel décrit l'application telle qu'elle se comporte pour l'administrateur général et le personnel commercial ; il complète le « Manuel d'utilisation d'un site dédié » destiné aux propriétaires de sous-sites.*
