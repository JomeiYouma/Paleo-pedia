# Manuel d'utilisation d'un site dédié Paléo

> **À qui s'adresse ce document ?**
> Aux propriétaires (« owners ») d'un site dédié thématique de l'écosystème Paléo, ainsi qu'aux personnes qui les accompagnent. Il décrit **tout** ce qu'on peut voir et faire sur un site dédié : les pages publiques, l'espace d'administration, les options, les automatismes, et les modes opératoires pas-à-pas pour les tâches courantes.
>
> Vous n'avez besoin d'aucune compétence technique. Tout se fait depuis le site, dans votre navigateur.

---

## Sommaire

1. [Vocabulaire essentiel](#1-vocabulaire-essentiel)
2. [Comprendre ce qu'est un site dédié](#2-comprendre-ce-quest-un-site-dédié)
3. [Les rôles : qui peut faire quoi](#3-les-rôles--qui-peut-faire-quoi)
4. [Se connecter et se repérer](#4-se-connecter-et-se-repérer)
5. [Les pages publiques (côté visiteur)](#5-les-pages-publiques-côté-visiteur)
6. [Langues & traductions (FR/EN)](#6-langues--traductions-fren)
7. [Proposer un cartel (visiteurs et admins)](#7-proposer-un-cartel-visiteurs-et-admins)
8. [Éditer la page d'accueil de votre site dédié](#8-éditer-la-page-daccueil-de-votre-site-dédié)
9. [Gérer les partenaires de votre site dédié](#9-gérer-les-partenaires-de-votre-site-dédié)
10. [Gérer les cartels (modération)](#10-gérer-les-cartels-modération)
11. [Le circuit « soumettre au site principal »](#11-le-circuit--soumettre-au-site-principal-)
12. [Modes opératoires pas-à-pas (recettes)](#12-modes-opératoires-pas-à-pas-recettes)
13. [Points d'attention et pièges à éviter](#13-points-dattention-et-pièges-à-éviter)
14. [FAQ](#14-faq)
- [Glossaire](#glossaire)

---

## 1. Vocabulaire essentiel

- **Site dédié (ou « sous-site »)** : votre mini-site thématique au sein de l'écosystème Paléo. Le *manuel d'administration* le nomme « **sous-site** » : c'est exactement la même chose.
- **Cartel** : la fiche d'un objet / d'une invention (titre, année, lieu, image, description, catégories…). C'est l'unité de base affichée sur la frise.
- **Frise** : la collection des cartels publiés de votre site dédié, présentée sous forme de chronologie. Trois modes d'affichage existent : **Frise** (chronologie), **Carte** (géographique) et **Arborescence**.
- **Statut d'un cartel** : son état dans le cycle de vie.
  - **Brouillon** (idée non publiée, invisible du public)
  - **En attente** (proposition d'un visiteur, à modérer)
  - **Publié** (visible du public)
  - **Archivé** (conservé mais masqué du public, réversible)
- **Slug** : la partie « adresse » d'un site dédié (ex. `paleo-h2o` dans `…/site/paleo-h2o`).
- **Owner / Propriétaire** : la personne autorisée à administrer *un* site dédié précis (le vôtre).
- **Superadmin / Administrateur général** : la personne qui gère l'ensemble de la plateforme et tous les sites dédiés.
- **Soumettre au site principal** : proposer qu'un cartel publié sur votre site dédié apparaisse **aussi** sur le site principal (après validation de l'administrateur général).

---

## 2. Comprendre ce qu'est un site dédié

Un **site dédié** est un mini-site thématique autonome, en orbite autour du site principal (Paléo-Énergétique). Il possède :

- sa propre **page d'accueil** personnalisable,
- sa propre **couleur** de signature (appliquée partout : menu, boutons, liserés…),
- sa propre **frise** de cartels (la collection d'inventions/objets que vous présentez),
- sa propre page **Partenaires**,
- éventuellement son **propre nom de domaine** (par ex. `paleo-h2o.org`).

Un site dédié reste connecté au site principal : certains de vos cartels peuvent, si vous le souhaitez, être **proposés pour apparaître aussi sur le site principal** (voir [chapitre 11](#11-le-circuit--soumettre-au-site-principal-)).

**Deux façons d'alimenter la frise d'un site dédié** (choix fait à la création, par l'administrateur général) :

| Type de source | Comment les cartels arrivent dans le site dédié |
|---|---|
| **Source « Catégorie »** | Les cartels sont ceux **explicitement rattachés** au site dédié. Concrètement, **chaque cartel que vous créez et publiez sur votre site dédié y est rattaché automatiquement** (voir la [recette A](#12-modes-opératoires-pas-à-pas-recettes)) : c'est ainsi que vous composez la sélection, il n'y a pas d'étape séparée de « rattachement ». |
| **Source « Atelier »** | Les cartels sont **tous ceux rattachés à un même atelier** (un atelier est un groupe de cartels). La liste se met à jour **toute seule** : ajouter ou retirer un cartel de l'atelier l'ajoute ou le retire aussitôt du site dédié. |

> 📸 **[Capture S01]** — Vue d'ensemble d'un site dédié (page d'accueil affichée dans le navigateur, avec l'URL visible dans la barre d'adresse).

> ⚠️ **À retenir :** le **type de source** (catégorie ou atelier), le **nom** et le **slug** (l'adresse) du site dédié sont définis à sa création par l'administrateur général et **ne sont plus modifiables ensuite**. En tant que propriétaire, vous gérez le contenu, pas l'identité technique.

---

## 3. Les rôles : qui peut faire quoi

| Action | Visiteur (non connecté) | **Propriétaire (vous)** | Administrateur général |
|---|:---:|:---:|:---:|
| Consulter les pages publiques | ✅ | ✅ | ✅ |
| Proposer un cartel | ✅ *(passe « en attente »)* | ✅ *(publie directement)* | ✅ |
| Modifier la page d'accueil (couleur, contenu) | ❌ | ✅ | ✅ |
| Modifier le **nom**, le **slug**, la **source** du site dédié | ❌ | ❌ | ✅ |
| Gérer les **partenaires** du site dédié | ❌ | ✅ | ✅ |
| Créer / éditer / publier / archiver / supprimer les cartels du site dédié | ❌ | ✅ | ✅ |
| Soumettre un cartel au site principal | ❌ | ✅ *(ses cartels publiés)* | ✅ |
| **Approuver / rejeter** les soumissions vers le site principal | ❌ | ❌ | ✅ |
| Voir/modifier les cartels d'un *autre* site dédié | ❌ | ❌ | ✅ |
| Modifier les cartels du site principal | ❌ | ❌ *(consultation seule)* | ✅ |

> 💡 Les comptes utilisateurs (création d'un nouvel owner, mot de passe…) sont gérés par l'**administrateur général**. Si vous avez besoin d'un accès pour un collaborateur, demandez-lui.

> ⚠️ **Partage des accès — important.** Vos identifiants de connexion sont **strictement personnels** et réservés aux membres de **votre structure**. Les partager se fait **à vos seuls risques et périls**, et il est **formellement interdit** de les communiquer à toute personne **extérieure à votre structure** (voir les mentions légales).

> 👉 **Ce qui n'est PAS de votre ressort** (→ administrateur général) : le **nom**, le **slug** et la **source** de votre site dédié ; la **création de comptes** ; le **branchement d'un nom de domaine** dédié ; et la **validation** des cartels que vous soumettez au site principal. Pour ces points, adressez-vous à l'administrateur général de la plateforme.

---

## 4. Se connecter et se repérer

### 4.1 Se connecter

1. Sur n'importe quelle page de votre site dédié, cliquez sur **« Se connecter »** en haut à droite.
2. Saisissez votre **e-mail** et votre **mot de passe**.
3. Cliquez sur **« Se connecter »**.

> 📸 **[Capture S02]** — La fenêtre de connexion ouverte.

Une fois connecté(e), des boutons supplémentaires apparaissent dans la barre du haut.

### 4.2 La barre du haut (header)

De gauche à droite :

- **Nom du site dédié** (cliquable → retour à l'accueil).
- **Menu de navigation** : *Accueil · Frise · Présentation · Partenaires*.
- **Sélecteur de langue** (Français / Anglais) — voir [chapitre 6](#6-langues--traductions-fren).
- **« Proposer un cartel »** — visible par **tout le monde**.
- **« Administration »** — *(connecté en tant que propriétaire)* un **menu compact** qui regroupe vos outils d'admin : **Page d'accueil** (éditer le contenu et la couleur), **Partenaires** (voir [chapitre 9](#9-gérer-les-partenaires-de-votre-site-dédié)) et **Gérer** (les cartels, voir [chapitre 10](#10-gérer-les-cartels-modération)).
- **Icône de déconnexion**.

> 💡 **Barre adaptative.** Si la largeur de l'écran ne suffit pas, la navigation et le menu se replient automatiquement dans un **menu « burger »** (icône ☰) qui reprend les mêmes entrées.

> 📸 **[Capture S03]** — La barre du haut **vue connecté en propriétaire**, avec le bouton « Proposer un cartel » et le **menu « Administration » déroulé** (Page d'accueil · Partenaires · Gérer).

> 💡 **Repère visuel :** un fil d'Ariane (chemin de navigation) s'affiche en haut des pages profondes pour savoir où vous êtes et revenir en arrière.

---

## 5. Les pages publiques (côté visiteur)

C'est ce que voit n'importe quel visiteur. Familiarisez-vous avec ces pages : ce sont elles que votre contenu alimente.

### 5.1 Accueil

- Une **bannière** (hero) avec le nom du site dédié, la thématique, et un bouton **« Explorer la frise »**.
- En dessous, vos **blocs de contenu** libres (textes, images, citations, boutons…), que vous composez vous-même (voir [chapitre 8](#8-éditer-la-page-daccueil-de-votre-site-dédié)).

> 📸 **[Capture S04]** — Page d'accueil complète d'un site dédié (bannière + quelques blocs de contenu).

### 5.2 Frise / Carte / Arborescence

La même collection de cartels, sous trois angles :

- **Frise** : chronologie (par année).
- **Carte** : répartition géographique (selon les lieux renseignés dans les cartels).
- **Arborescence** : vue structurée par regroupements.

Le visiteur peut filtrer, rechercher, et cliquer un cartel pour ouvrir sa fiche détaillée.

> 📸 **[Capture S05]** — La frise d'un site dédié avec plusieurs cartels.
> 📸 **[Capture S06]** — Le même contenu en mode **Carte**.

### 5.3 Présentation (la démarche du projet)

Le lien **« Présentation »** du menu ouvre une page qui expose la **démarche / méthodologie du projet Paléo** — la même que celle présentée sur la vitrine Paléo-Pédia : recenser, documenter et remettre en lumière les techniques énergétiques anciennes ou méconnues. Le titre de la page reprend le nom de votre site dédié (« *<Nom du site> — Démarche* »). C'est une page **commune à l'écosystème** : son contenu n'est pas spécifique à votre site dédié et ne se modifie pas depuis votre espace.

> 💡 Le pied de page propose aussi **Mentions légales**, **Politique de confidentialité** et **Contact** : ces pages sont **communes à tout l'écosystème** (site principal). Elles s'ouvrent correctement, y compris depuis un site dédié sur son propre nom de domaine.

### 5.4 Partenaires

Liste des partenaires associés à votre site dédié, séparés en **Partenaires principaux** (mis en premier) et **Partenaires**. Chaque partenaire affiche son logo (ou son initiale) et un lien vers son site si renseigné. *(Vous choisissez ces partenaires depuis leur page dédiée — voir [chapitre 9](#9-gérer-les-partenaires-de-votre-site-dédié).)*

> 📸 **[Capture S07]** — Page Partenaires d'un site dédié.

### 5.5 Fiche détaillée d'un cartel

En cliquant un cartel, le visiteur ouvre sa fiche complète : image, description, lieu, année, crédits, et éventuellement un bouton **« En savoir plus »** (vers un lien externe ou une page interne enrichie). Un **QR code** pointant vers cette fiche peut être généré à l'impression.

> 📸 **[Capture S08]** — Fiche détaillée d'un cartel.

---

## 6. Langues & traductions (FR/EN)

Le site est **bilingue français / anglais**. Comprendre comment les langues et la traduction fonctionnent vous évitera des surprises.

### 6.1 Le sélecteur de langue (visiteurs)

En haut à droite, deux boutons **FR / EN**. Le choix est **mémorisé dans le navigateur** du visiteur (il le retrouve à sa prochaine visite). Changer de langue bascule à la fois **l'interface** (menus, boutons, libellés) et **le contenu des cartels** dans la langue choisie.

> 📸 **[Capture S19]** — Le sélecteur FR / EN dans la barre du haut.

### 6.2 Comment le contenu bilingue est stocké

Chaque **cartel** possède deux versions de ses textes clés : **titre, description et lieu**, en français et en anglais.

> 💡 **Règle de repli (fallback) :** si un visiteur est en anglais mais que la version EN d'un champ est vide, c'est le **texte français qui s'affiche** (jamais de blanc). Rien ne « casse » donc si une traduction manque — mais le visiteur anglophone voit alors du français à cet endroit.

### 6.3 Ce qui se traduit… et ce qui ne se traduit pas

| Élément | Traduit FR/EN ? |
|---|---|
| Interface (menus, boutons, libellés) | ✅ Oui, automatiquement |
| Cartels : **titre, description, lieu** | ✅ Oui (un champ FR + un champ EN) |
| **Blocs de la page d'accueil** (titres, textes, citations…) | ✅ Oui (onglet **Français / English** dans l'éditeur — repli FR si l'EN est vide) |
| **Nom / thématique** du site dédié | ❌ Non |

> 💡 **La page d'accueil est bilingue.** Dans l'éditeur de la page d'accueil, un sélecteur **Français / English** vous laisse composer une version anglaise distincte des blocs (voir [§8.2](#82-le-contenu--léditeur-de-blocs)). Si vous laissez la version anglaise vide, les visiteurs anglophones voient automatiquement la version française.

### 6.4 La traduction automatique (réservée aux administrateurs)

Plusieurs outils d'IA vous aident à remplir la version anglaise. **Un visiteur non connecté n'y a jamais accès.**

- **À la création d'un cartel** : si vous remplissez le français et laissez l'anglais vide, l'anglais est **généré automatiquement** (et inversement). *(Uniquement à la création, pas à chaque modification.)*
- **Bouton « Retraduire » par cartel** (écran « Gérer ») : (re)traduit un cartel dans l'autre langue à la demande.
- **Retraduire en lot** : sélectionnez plusieurs cartels → tout est retraduit d'un coup.

> 💡 Une **détection de langue** à la saisie vous alerte si vous tapez de l'anglais dans le champ français (ou l'inverse) et propose de basculer.

### 6.5 Repérer les cartels sans version anglaise

Dans l'écran **« Gérer »**, un cartel dépourvu de traduction anglaise affiche un petit badge orange **« Pas de traduction EN »**. Utilisez le bouton **Retraduire** pour combler le manque.

### 6.6 Exporter un PDF traduit (dans n'importe quelle langue)

Dans **Gérer → Exporter → « PDF traduit (autre langue) »**, vous pouvez générer un PDF des cartels dans **une langue de votre choix** — pas seulement l'anglais : espagnol, allemand, italien, japonais, etc.

- Vous saisissez la **langue cible** (champ libre, avec des suggestions courantes).
- L'IA traduit les contenus **depuis la langue actuellement affichée** (FR ou EN) puis génère le PDF.
- ⚠️ C'est un **export ponctuel** : la traduction sert uniquement au PDF, elle **n'est pas enregistrée** dans la base. Idéal pour une exposition multilingue.

> ⚠️ **Relisez toujours** les traductions automatiques avant diffusion (surtout les descriptions). L'IA est un excellent point de départ, pas un traducteur infaillible.

---

## 7. Proposer un cartel (visiteurs et admins)

Le bouton **« Proposer un cartel »** ouvre le formulaire de création. **Le comportement dépend de qui vous êtes.**

### 7.1 Les champs du formulaire (dans l'ordre)

| Champ | Obligatoire | Détail |
|---|:---:|---|
| **Titre** | ✅ | Le nom de l'objet / invention. Une détection de langue vous alerte si vous saisissez dans la « mauvaise » langue. |
| **Année de l'invention** | ❌ | Ex. `2024` ou `2024-01-15`. |
| **Exhumé par** | ❌ | Crédite la personne qui a retrouvé/identifié l'objet. |
| **Localisation (Ville, Pays)** | ❌ | Ex. `Paris, France`. Un bouton 📍 géolocalise automatiquement (point sur la carte). ✓ vert si trouvé, ✗ rouge si introuvable. |
| **Description** | ❌ | Jusqu'à **1500 caractères** (espaces comprises). Boutons **Gras** / **Italique**. Un compteur affiche `n / 1500`. |
| **Image** | ❌ | Compressée automatiquement, à partir de n'importe quel format d'image, et prévisualisée immédiatement. |
| **Crédit image** | ❌ | Ex. `Wikimedia Commons, Auteur inconnu…`. |
| **Catégories** | ❌ | Cliquez les catégories qui s'appliquent ; possibilité d'en créer une nouvelle. |
| **Ateliers** | ❌ *(admins)* | Tags internes, **invisibles** sur la frise et à l'impression. |
| **Lien pour QR Code** | ❌ | Lien externe affiché par le bouton « En savoir plus » et encodé dans le QR code. |
| **Page « En savoir plus » interne** | ❌ *(admins)* | Si coché, ouvre un éditeur de blocs pour bâtir une page interne riche au lieu d'un lien externe. |
| **Notes admin internes** | — *(admins, en édition)* | Échanges internes entre administrateurs, jamais publics. |
| **Contact** | ❌ | E-mail ou téléphone, **stocké en base** pour vous recontacter au sujet du cartel (précisions, sources). **Jamais affiché publiquement.** Connecté(e) : laissez vide si vous êtes l'auteur·rice — on retrouve alors l'**e-mail de votre compte** ; renseignez-le si vous saisissez le cartel pour quelqu'un d'autre. |

> 📸 **[Capture S09]** — Formulaire « Proposer un cartel » rempli, vu **en tant que propriétaire** (champs Ateliers et page interne visibles).
> 📸 **[Capture S10]** — Le même formulaire **vu par un visiteur non connecté** (champs admin absents).

### 7.2 Différences selon le rôle

- **Visiteur non connecté :** un seul bouton **« Envoyer la proposition »**. Le cartel part **« en attente »** : il n'est pas publié tant qu'un administrateur ne l'a pas validé. Une fenêtre suggère (sans l'imposer) de laisser un e-mail de contact. *(Pas de traduction automatique pour les visiteurs.)*
- **Propriétaire / admin :** deux boutons — **« Sauvegarder brouillon »** (statut *Brouillon*, invisible) et **« Publier »** (statut *Publié*, visible immédiatement). À la création, une **traduction automatique** vers l'autre langue est tentée pour les champs laissés vides (voir [§6.4](#64-la-traduction-automatique-réservée-aux-administrateurs)).

> ⚠️ **Garde-fou :** si vous quittez la page avec des modifications non enregistrées, un message de confirmation vous prévient (« Quitter sans publier ? »).

### 7.3 Création vs édition

- **Création** : formulaire vierge, titre « Nouveau cartel ».
- **Édition** : formulaire pré-rempli, titre « Modifier le cartel ». Les **notes internes** n'apparaissent qu'en édition. On édite un cartel depuis l'écran **« Gérer »** (voir [chapitre 10](#10-gérer-les-cartels-modération)).

---

## 8. Éditer la page d'accueil de votre site dédié

Cliquez **« Page d'accueil »** dans la barre du haut. Une fenêtre d'édition s'ouvre.

> ⚠️ **Les modifications sont publiées immédiatement** dès que vous enregistrez (pas de brouillon pour la page d'accueil).

En tant que propriétaire, vous pouvez modifier **deux choses** : la **couleur** et le **contenu** (blocs). *(Le nom, le slug et la source ne sont modifiables que par l'administrateur général et n'apparaissent donc pas ici. Les **partenaires** se gèrent désormais sur leur **propre page** — voir [chapitre 9](#9-gérer-les-partenaires-de-votre-site-dédié).)*

> 📸 **[Capture S11]** — La fenêtre d'édition de la page d'accueil, ouverte (vue propriétaire : sections Couleur et Contenu).

### 8.1 La couleur

Choisissez la couleur de signature avec le sélecteur, ou saisissez son code (ex. `#4A90D9`). Elle s'applique partout sur le site dédié (menu actif, boutons, liserés, titres des blocs…).

### 8.2 Le contenu : l'éditeur de blocs

La page d'accueil se compose en empilant des **blocs**. En bas de la section, cliquez le bouton du type de bloc voulu pour l'ajouter à la fin. Voici les **9 types** disponibles :

| Bloc | À quoi il sert | Options |
|---|---|---|
| **Titre** | Un titre de section. | Niveau H1 / H2 / H3 + texte. |
| **Texte** | Un paragraphe. | Zone de texte multi-lignes (les retours à la ligne sont conservés). |
| **Image** | Une image avec légende. | URL **ou** bouton *Upload* + légende optionnelle. |
| **Vidéo** | Une vidéo. | URL YouTube / Vimeo / fichier `.mp4` + légende. |
| **Galerie** | Plusieurs images en grille. | Ajout par *URL* ou *Upload*, légende par image, suppression par image. |
| **Citation** | Une citation mise en valeur. | Texte + attribution optionnelle. |
| **Bouton** | Un bouton d'action (CTA). | Libellé + style **Plein** ou **Contour** + URL de destination. |
| **Séparateur** | Une ligne de séparation. | Aucune option. |
| **Embed** | Intégrer un contenu externe (PDF, Sketchfab, Google Maps…). | URL d'iframe + légende + hauteur en pixels (150–1200). |

**Manipuler les blocs :**
- **Ajouter** : cliquez le bouton du type souhaité (en bas).
- **Réordonner** : flèches **▲ / ▼** à gauche de chaque bloc. *(Pas de glisser-déposer.)*
- **Supprimer** : icône **corbeille rouge** à droite du bloc (suppression immédiate, mais rien n'est enregistré tant que vous n'avez pas validé la fenêtre).
- **Version anglaise** : en haut de la section, un sélecteur **Français / English** (le nombre de blocs de chaque langue est indiqué entre parenthèses). Composez les blocs FR sous l'onglet *Français* et, si vous le souhaitez, une version anglaise distincte sous l'onglet *English*. Les visiteurs anglophones voient la version anglaise ; **si elle est vide, ils voient automatiquement la version française** (aucun risque de page blanche).

> 📸 **[Capture S12]** — L'éditeur de blocs avec quelques blocs (un Titre, un Texte, une Image), montrant les flèches ▲▼ et la corbeille.
> 📸 **[Capture S13]** — La rangée des 9 boutons d'ajout de blocs.

> 💡 La couleur de votre site dédié teinte automatiquement les titres, citations, boutons et séparateurs. **Il n'y a pas d'aperçu en temps réel** dans l'éditeur : enregistrez puis vérifiez le rendu sur la page d'accueil.

> 💡 Les blocs n'ont **pas** de traduction automatique par IA : la version anglaise se saisit à la main sous l'onglet *English* (voir [§6.3](#63-ce-qui-se-traduit-et-ce-qui-ne-se-traduit-pas)).

### 8.3 Upload d'images dans les blocs

Pour les blocs **Image** et **Galerie**, le bouton *Upload* ouvre votre explorateur de fichiers ; l'image est envoyée puis son lien est inséré automatiquement. Pendant l'envoi, le bouton affiche « … ».

### 8.4 Enregistrer

Cliquez le bouton de validation en bas de la fenêtre. Les changements sont **publiés immédiatement**.

---

## 9. Gérer les partenaires de votre site dédié

Les partenaires de votre site dédié se gèrent sur une **page dédiée** (auparavant, c'était une section de l'éditeur d'accueil). Ouvrez-la depuis le menu **« Administration » → « Partenaires »** de la barre du haut (adresse `…/admin/partners`).

> 💡 **Où s'affichent-ils ?** Sur la **page Partenaires publique** de votre site dédié (voir [§5.4](#54-partenaires)), répartis en *Partenaires principaux* (mis en avant) et *Partenaires*.

### 9.1 Choisir le rôle de chaque partenaire

La page liste le **catalogue de partenaires** disponibles. Pour chacun (logo ou initiale + nom), trois boutons de **rôle** :

| Rôle | Effet |
|---|---|
| **Principal** | Le partenaire est **mis en avant** (affiché en premier sur la page Partenaires). |
| **Standard** | Le partenaire est affiché dans le groupe standard. |
| **—** | Le partenaire **n'est pas affiché** sur votre site dédié. |

- Un champ **« Rechercher un partenaire… »** filtre la liste (pratique quand le catalogue est long).
- Cliquez **« Enregistrer »** (bouton à la couleur de votre site) pour valider : un **« Enregistré ✓ »** confirme la sauvegarde.

> 📸 **[Capture S20]** — La page Partenaires du site dédié : la recherche et la liste, avec les boutons de rôle **Principal / Standard / —** par partenaire.

### 9.2 Ajouter un partenaire propre à votre site dédié

Si un partenaire ne figure pas dans le catalogue, ajoutez-le avec le bouton **« + Nouveau »** :
- **Nom du partenaire** *(obligatoire)*.
- **URL** du site du partenaire *(optionnel)*.
- **Logo** *(optionnel, image à téléverser)*.

Validez avec **« Ajouter »**. Le partenaire est créé **exclusivement pour votre site dédié** (il n'apparaît pas chez les autres) et reçoit aussitôt le rôle **Standard** — vous pourrez le passer en *Principal* si besoin. N'oubliez pas **« Enregistrer »** ensuite.

> 📸 **[Capture S21]** — Le formulaire d'ajout d'un partenaire (Nom, URL, Logo).

> 💡 **Catalogue partagé vs partenaire exclusif.** Le **catalogue** (partenaires communs, réservoir partagé) est géré au niveau de la plateforme par l'administrateur général : vous n'y touchez pas. En revanche, un partenaire que **vous** ajoutez via « + Nouveau » est **rattaché à votre seul site dédié**.

---

## 10. Gérer les cartels (modération)

Cliquez **« Gérer »** dans la barre du haut. Vous arrivez sur l'écran d'administration des cartels, **verrouillé sur votre site dédié** (vous ne voyez que vos cartels, plus les cartels du site principal de votre thématique en consultation seule).

> 📸 **[Capture S15]** — L'écran « Gérer » avec le bandeau d'introduction et la liste des cartels.

Un **bandeau d'introduction** rappelle les règles : vos cartels sont modifiables ; les cartels du site principal de votre catégorie sont en lecture seule ; vos suppressions n'affectent que votre site dédié.

### 10.1 Les onglets

| Onglet | Contenu |
|---|---|
| **Publiés** | Cartels visibles du public. C'est d'ici qu'on soumet au site principal. |
| **Idées & Brouillons** | Cartels en cours de rédaction, non visibles. |
| **En attente** | Propositions reçues de visiteurs, à modérer. |
| **Archives** | Cartels retirés du public mais conservés (réversible). |

> 💡 L'onglet **« Soumissions »** (file de validation vers le site principal) est réservé à l'administrateur général : il n'apparaît pas dans votre vue.

### 10.2 Les actions sur un cartel

Au survol d'une ligne, des **boutons-icônes** apparaissent (une infobulle s'affiche au survol). Les boutons disponibles dépendent de **l'origine du cartel** :

- **(A) Cartels venant du site principal (Paléo-Énergétique)** — affichés chez vous **pour information** (badge « Site principal · consultation »). Ils sont **non modifiables** : seuls **Aperçu** et **Aperçu web** sont proposés.
- **(B) Cartels de votre site dédié** — **tous** les boutons sont disponibles (légende numérotée ci-dessous).

> 📸 **[Capture S16]** — Gros plan sur les deux rangées d'actions : **(A)** un cartel du site principal (2 boutons seulement) et **(B)** un cartel du site dédié (boutons 1 à 9 annotés).

**Groupe « Édition » (consulter / modifier le contenu)**

1. **Aperçu** — aperçu du cartel au **format impression A4**, tel qu'il sera imprimé.
2. **Aperçu web** — le cartel **tel que le voient les visiteurs** en ligne (badge « Brouillon » s'il n'est pas encore publié).
3. **Éditer** — ouvre le **formulaire** du cartel (titre, image, description, etc.).
4. **Retraduire** — lance une **traduction automatique**. Elle part de la **langue actuellement affichée sur le site** et remplit l'autre langue : site en **français** → traduit **FR → EN** ; site en **anglais** → traduit **EN → FR**. *(Pour traduire dans l'autre sens, changez d'abord la langue du site via le sélecteur FR/EN, puis relancez.)*
5. **Ajouter une note** — **note interne** rattachée au cartel, visible des administrateurs uniquement — **jamais publique** (suivi de modération).

**Groupe « Statut » (faire évoluer le cycle de vie)** — les boutons affichés dépendent de l'état du cartel.

6. **Repasser en brouillon** — retire le cartel du public (retour à l'état *Brouillon*). *(Pour un cartel encore en brouillon ou en attente, c'est un **✓ Publier** vert qui s'affiche ici à la place, pour le rendre public.)*
7. **Archiver** — **masque le cartel du public** tout en le conservant (réversible). *(Sur un cartel déjà archivé, le bouton devient **Désarchiver**.)*
8. **Soumettre / retirer du site principal** — gère l'affichage **sur le site principal**. L'icône reflète l'état : **Envoyer** (violet = non soumis), **Horloge** (rose = en attente de validation), **Globe** (vert = validé, visible sur le principal). Détail au [chapitre 11](#11-le-circuit--soumettre-au-site-principal-).
9. **Supprimer** — supprime le cartel. **N'affecte que votre site dédié**, jamais le site principal.

> ⚠️ Les cartels du **site principal** (rangée A) ne peuvent être ni édités, ni changés de statut, ni supprimés. Chaque action sensible (publier, archiver, supprimer, soumettre…) demande une **confirmation**.

### 10.3 Rechercher, filtrer, trier (barre du haut)

| Contrôle | Ce qu'il fait |
|---|---|
| **Rechercher…** (champ texte) | Filtre la liste par **titre** (français et anglais) et par **lieu**. |
| **Toutes catégories** (menu déroulant) | Filtre par une ou plusieurs **catégories**. Un commutateur **ET / OU** choisit si le cartel doit appartenir à *toutes* les catégories cochées (ET) ou à *au moins une* (OU). |
| **Tous les ateliers** (menu déroulant) | Même principe que ci-dessus, mais pour les **ateliers**. |
| **Filtres complexes** (icône curseurs) | Combine **plusieurs conditions** (catégories / ateliers) reliées par ET ou OU. Un badge indique le nombre de conditions actives ; un bandeau permet de les *Modifier* ou *Désactiver*. |
| **Colonnes** (bouton) | Affiche ou masque les colonnes **Catégories**, **Ateliers**, **Lieu** (préférence mémorisée). |
| **En-têtes Année / Titre / Lieu** | Cliquez un en-tête pour **trier** ; reclic pour inverser l'ordre (la flèche ↑/↓ indique le sens). |

### 10.4 Actions groupées (sélection multiple)

Cochez la case de plusieurs cartels — ou **« Tout sélectionner »** — pour faire apparaître une barre d'actions :

| Action | Ce qu'elle fait |
|---|---|
| **Tout sélectionner** (case en-tête) | Sélectionne / désélectionne tous les cartels actuellement affichés (selon l'onglet et les filtres). |
| **Publier (N)** | Publie d'un coup tous les cartels sélectionnés qui ne le sont pas encore. |
| **Retraduire (N)** | Relance la **traduction automatique** (IA) sur tous les cartels sélectionnés. Demande confirmation. |
| **Associer à un atelier (N)** | Rattache les cartels sélectionnés à un **atelier existant** ou à un **nouvel atelier** que vous nommez. |
| **Supprimer** | Supprime les cartels sélectionnés (confirmation). N'affecte que votre site dédié. |
| **Exporter** (menu déroulant) | Génère un export des cartels sélectionnés — voir les 4 formats ci-dessous. |

**Formats d'export proposés par le menu « Exporter » :**

| Format | Contenu |
|---|---|
| **Cartels JPEG (ZIP)** | Une image par cartel, en haute définition, dans une archive ZIP. |
| **PDF impression** | Les cartels au format imprimable A4 (avec QR code — voir §10.5). |
| **PDF traduit (autre langue)** | Un PDF des cartels traduits dans la langue de votre choix — voir [§6.6](#66-exporter-un-pdf-traduit-dans-nimporte-quelle-langue). |
| **Archive complète (JSON + Images)** | Une sauvegarde complète (données + images) réimportable. |

Sans aucune sélection, un bouton **« Exporter tout »** propose directement l'archive complète de tous les cartels.

> 💡 Les boutons de la barre groupée dépendent du contexte : par exemple **Publier (N)** n'apparaît **pas** dans l'onglet *Publiés* (les cartels y sont déjà publiés).

> 💡 Les actions groupées qui **modifient** (Publier, Retraduire, Associer à un atelier, Supprimer) **ignorent automatiquement** les cartels du site principal (« consultation », en lecture seule) : seuls vos cartels sont concernés. L'**export**, lui, les inclut (sans risque).

> 📸 **[Capture S17]** — La barre d'outils de la gestion : en haut la **recherche** et les filtres (*Toutes catégories*, *Tous les ateliers*, *Filtres complexes*) ; le compteur **« N sélectionnés »** et le bouton **Colonnes** ; la **barre d'actions groupées** (Retraduire, Exporter, Associer à un atelier, Supprimer) avec le menu **Exporter** ouvert sur ses 4 formats ; et à gauche les **cases de sélection** de chaque ligne (§10.3 et §10.4).

### 10.5 Impression et QR codes

Les exports **PDF impression** et **JPEG** génèrent les cartels au format imprimable, avec un **QR code** renvoyant vers la fiche en ligne du cartel (lien externe si renseigné, sinon la fiche interne). Idéal pour une exposition ou une signalétique physique.

---

## 11. Le circuit « soumettre au site principal »

Vos cartels vivent d'abord sur **votre** site dédié. Vous pouvez proposer qu'ils apparaissent **aussi** sur le site principal — mais c'est l'administrateur général qui valide.

> ⚠️ **Automatisme important :** quand vous **publiez** un cartel de votre site dédié, il est **automatiquement mis dans la file de validation** du site principal (sauf s'il a déjà été traité). Vous n'avez donc en général **rien à faire** : la publication suffit à proposer le cartel. Le bouton « Soumettre » sert surtout à **re-proposer** un cartel que vous aviez retiré.

### 11.1 Les trois états (icône dans la colonne Statut)

| Icône / état | Signification | Clic = |
|---|---|---|
| **Envoyer** (violet) | Non soumis. | Soumettre au site principal. |
| **Horloge** (rose) | Soumis, **en attente** de validation. | Retirer la soumission. |
| **Globe** (vert) | **Validé** : visible sur le site principal. | Retirer du site principal. |

> 📸 **[Capture S18]** — Les boutons d'état de soumission sur un cartel publié.

### 11.2 Le déroulé complet

1. **Vous publiez** un cartel → il entre automatiquement dans la file (icône horloge rose).
2. **L'administrateur général** voit la soumission dans son onglet « Soumissions » et **approuve** ou **rejette**.
   - *Approuvé* → le cartel devient visible sur le site principal (icône globe verte) **tout en restant** sur votre site dédié.
   - *Rejeté* → le cartel **reste publié sur votre site dédié**, mais n'apparaît pas sur le principal.
3. **À tout moment**, vous pouvez **retirer** votre cartel du site principal (ou annuler une soumission en attente) : il revient simplement à l'état « publié sur le site dédié seulement ».

> 💡 Retirer un cartel du site principal **ne le dépublie pas** de votre site dédié : ce sont deux choses distinctes.

---

## 12. Modes opératoires pas-à-pas (recettes)

### Recette A — Publier un nouveau cartel
1. Connectez-vous.
2. Cliquez **« Proposer un cartel »**.
3. Remplissez au minimum le **Titre** ; ajoutez idéalement une **image**, une **année**, un **lieu**, une **description** et des **catégories**.
4. Cliquez **« Publier »**.
5. Le cartel apparaît sur la **frise** et, automatiquement, dans la file de validation du site principal (voir chapitre 11).

### Recette B — Préparer un cartel sans le publier tout de suite
1. Mêmes étapes que la recette A, mais cliquez **« Sauvegarder brouillon »**.
2. Retrouvez-le plus tard dans **Gérer → onglet « Idées & Brouillons »**.
3. Quand il est prêt : bouton **Publier**.

### Recette C — Modifier la page d'accueil
1. Menu **« Administration » → « Page d'accueil »**.
2. Ajustez la **couleur**, ajoutez/réordonnez des **blocs**.
3. Validez → publication immédiate.
4. Fermez la fenêtre et vérifiez le rendu sur l'accueil.

### Recette D — Gérer les partenaires de votre site dédié
1. Menu **« Administration » → « Partenaires »**.
2. Pour chaque partenaire, choisissez le **rôle** : **Principal**, **Standard** ou **—** (masqué). Filtrez avec la **recherche** si la liste est longue.
3. *(Optionnel)* **« + Nouveau »** pour ajouter un partenaire propre à votre site (Nom obligatoire, URL et logo facultatifs).
4. Cliquez **« Enregistrer »** (un **« Enregistré ✓ »** confirme).

### Recette E — Faire apparaître un cartel sur le site principal
1. Assurez-vous que le cartel est **publié** (il est alors normalement déjà soumis automatiquement).
2. Sinon, dans **Gérer → Publiés**, cliquez l'icône **Envoyer** (violet) du cartel.
3. Confirmez. L'icône passe à l'**horloge rose** (en attente).
4. Attendez la validation de l'administrateur général (icône **globe verte** = validé).

### Recette F — Retirer un cartel du site principal (sans le dépublier chez vous)
1. **Gérer → Publiés**.
2. Cliquez l'icône **globe verte** (ou **horloge rose**) du cartel.
3. Confirmez. Le cartel reste visible sur votre site dédié.

### Recette G — Archiver un cartel devenu obsolète
1. **Gérer → Publiés**.
2. Bouton **Archiver** → confirmez. Le cartel disparaît du public mais reste conservé.
3. Pour le réactiver : **Gérer → Archives → Désarchiver**.

### Recette H — Modérer une proposition reçue d'un visiteur
1. **Gérer → onglet « En attente »**.
2. Ouvrez **Aperçu** ou **Éditer** pour vérifier/corriger.
3. **Publier** pour accepter, ou **Supprimer** pour refuser.

### Recette I — Imprimer des cartels pour une exposition
1. **Gérer → Publiés**.
2. Sélectionnez les cartels voulus (cases à cocher).
3. **Exporter → PDF impression** (ou *Cartels JPEG (ZIP)*).
4. Imprimez : chaque cartel porte un **QR code** vers sa fiche en ligne.

### Recette J — Exporter un PDF dans une autre langue (ex. expo internationale)
1. *(Optionnel)* Basculez l'interface dans la langue **source** souhaitée (FR ou EN) via le sélecteur FR/EN.
2. **Gérer → Publiés**, sélectionnez les cartels voulus.
3. **Exporter → « PDF traduit (autre langue) »**.
4. Saisissez la **langue cible** (ex. *Espagnol*) puis lancez. L'IA traduit et génère le PDF.
5. **Relisez** le PDF : la traduction n'est pas enregistrée, elle n'existe que dans ce fichier.

---

## 13. Points d'attention et pièges à éviter

- **Accès strictement personnels.** Ne partagez **jamais** vos identifiants en dehors de votre structure — c'est **à vos risques et périls** et **formellement interdit** (voir les mentions légales).
- **Publier = proposer au site principal.** Publier un cartel le met automatiquement dans la file de validation du principal. Si vous ne le souhaitez pas, gardez-le en **brouillon**, ou **retirez-le** après publication.
- **Page d'accueil : pas de brouillon.** Toute modification validée est immédiatement en ligne. Préparez votre contenu avant d'enregistrer.
- **Page d'accueil bilingue, mais EN saisi à la main.** Les blocs ont une version FR et une version EN (onglet *English* de l'éditeur), sans traduction automatique. Si vous laissez l'EN vide, le visiteur anglophone voit le français (voir [§6.3](#63-ce-qui-se-traduit-et-ce-qui-ne-se-traduit-pas)).
- **Pas d'aperçu en direct** dans l'éditeur de blocs : enregistrez puis vérifiez sur la page réelle.
- **Identité figée.** Nom, slug et type de source ne se changent plus après création : passez par l'administrateur général.
- **Source « Atelier » = mise à jour automatique.** Si votre site dédié est alimenté par un atelier, ajouter ou retirer un cartel de cet atelier modifie aussitôt votre frise.
- **Cartels du site principal = lecture seule** dans votre vue (badge « consultation »).
- **Suppression locale.** Supprimer un cartel depuis votre site dédié n'affecte pas le site principal.
- **Réordonnancement des blocs : flèches ▲▼ uniquement** (pas de glisser-déposer).
- **Partenaires : page dédiée.** Ils ne se règlent plus dans l'éditeur d'accueil mais via **Administration → Partenaires** (voir [chapitre 9](#9-gérer-les-partenaires-de-votre-site-dédié)).
- **Contact des visiteurs jamais public**, mais précieux pour les recontacter : encouragez-le.
- **Traduction automatique** : pratique, mais relisez toujours le résultat (surtout les descriptions), et pensez à combler les cartels marqués **« Pas de traduction EN »**.

---

## 14. FAQ

**Mon cartel publié n'apparaît pas sur le site principal. Normal ?**
Oui : la publication le *propose* (file de validation), mais il faut l'**approbation** de l'administrateur général. Tant que l'icône est une horloge rose, il est en attente.

**Puis-je changer la couleur de mon site dédié ?**
Oui, via **« Page d'accueil » → Couleur**. Elle s'applique partout.

**Puis-je changer le nom ou l'adresse (slug) de mon site dédié ?**
Non, pas vous-même : demandez à l'administrateur général.

**Pourquoi ma page d'accueil reste en français pour un visiteur anglophone ?**
Parce que vous n'avez pas (encore) saisi de **version anglaise des blocs**. Ouvrez « Page d'accueil », passez sur l'onglet **English** et composez la version EN (voir [§6.3](#63-ce-qui-se-traduit-et-ce-qui-ne-se-traduit-pas) et [§8.2](#82-le-contenu--léditeur-de-blocs)). Tant qu'elle est vide, c'est la version française qui s'affiche.

**Comment proposer mes cartels en espagnol/allemand/… pour une expo ?**
Utilisez l'export **« PDF traduit (autre langue) »** (voir [§6.6](#66-exporter-un-pdf-traduit-dans-nimporte-quelle-langue) et la recette J). C'est un PDF ponctuel, non enregistré.

**Où gère-t-on les partenaires de mon site dédié ?**
Depuis le menu **Administration → Partenaires** (voir [chapitre 9](#9-gérer-les-partenaires-de-votre-site-dédié)) : choisissez le rôle de chacun (Principal / Standard / —), filtrez avec la recherche, et ajoutez au besoin un partenaire propre à votre site avec **« + Nouveau »**.

**J'ai supprimé un cartel par erreur.**
La suppression est définitive côté site dédié. Avant de supprimer, préférez **Archiver** (réversible). En cas de doute, contactez l'administrateur général (une archive/export peut exister).

**Comment masquer temporairement un cartel sans le perdre ?**
Utilisez **Archiver** : il est retiré du public mais conservé, et **Désarchiver** le republie.

**Mes images sont-elles compressées automatiquement ?**
Oui, à l'upload, pour optimiser le chargement, sans démarche de votre part.

---

## Glossaire

- **Cartel** — fiche d'un objet/invention affichée sur la frise.
- **Site dédié** — mini-site thématique autonome rattaché à l'écosystème Paléo.
- **Slug** — partie « adresse » d'un site dédié dans l'URL.
- **Owner / Propriétaire** — administrateur d'un site dédié donné.
- **Superadmin / Administrateur général** — administrateur de toute la plateforme.
- **Source (catégorie / atelier)** — mode d'alimentation de la frise du site dédié.
- **Statut** — état d'un cartel : Brouillon, En attente, Publié, Archivé.
- **Soumettre au site principal** — proposer qu'un cartel publié apparaisse aussi sur le site principal (sur validation).
- **Bloc** — élément de contenu de la page d'accueil (titre, texte, image, etc.).
- **Partenaire (principal / standard)** — organisation affichée sur la page Partenaires du site dédié ; *Principal* = mis en avant, *Standard* = groupe courant, *—* = non affiché.
- **Repli / fallback** — affichage du texte français quand la version anglaise d'un champ est vide.
- **QR code** — code-barres 2D imprimé sur un cartel, renvoyant vers sa fiche en ligne.

---

*Fin du manuel. Pour toute action touchant l'identité d'un site dédié (nom, adresse, source) ou la création de comptes, adressez-vous à l'administrateur général de la plateforme.*
