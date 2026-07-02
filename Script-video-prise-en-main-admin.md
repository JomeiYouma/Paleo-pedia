# Script vidéo — Prise en main de l'administration Paléo

> Storyboard plan-par-plan, prêt à enregistrer. Complète le
> `Manuel-administration-plateforme.md` (chaque capsule renvoie à ses chapitres).
> Public : nouveaux administrateurs (association, personnel commercial, superadmins).

## Format retenu

- **5 capsules courtes** (~2 à 5 min) plutôt qu'une seule longue vidéo — chacune
  regarde-able seule, facile à re-tourner si l'UI évolue.
- **Screencast narré** : capture d'écran + voix off. Sous-titres **FR** (option EN,
  plateforme bilingue).
- Durée totale visée : **~16 min**.

## Avant de tourner (checklist)

- [ ] Enregistrer sur un **environnement de démo** avec des **données factices**
      — jamais la prod, jamais de vrais e-mails/mots de passe à l'écran.
- [ ] Préparer les comptes de démo : 1 superadmin, 1 propriétaire de sous-site,
      1 compte exportateur, + un cartel « en attente » (visiteur) et une
      « soumission » (sous-site) déjà présents pour la capsule 3.
- [ ] Navigateur en plein écran, zoom ~110 %, curseur agrandi, notifications coupées.
- [ ] Résolution 1920×1080, 30 fps. Micro testé.
- [ ] Masquer/flouter toute clé API réelle si l'écran Réglages est filmé.

---

## Capsule 1 — Tour de la plateforme & connexion (~2 min)
*Réf. manuel : §2 (architecture), §4 (connexion), §14 (hub Administration).*

**Objectif :** comprendre les « 4 faces » d'une seule application et savoir se connecter.

| # | À l'écran | Voix off |
|---|---|---|
| 1 | Page d'accueil `/` (hero « Une autre histoire de l'énergie »). | « Bienvenue. Toute la plateforme Paléo, c'est **une seule application** — mais elle a **quatre visages**. » |
| 2 | Cliquer « Explorer la Frise » → `/app`. | « Le **site principal**, ici, la vitrine. Et **la frise** de tous les cartels publiés. » |
| 3 | Ouvrir `/pedia` (vue système solaire). | « **Paléo-Pédia** : la vitrine de tout l'écosystème. » |
| 4 | Ouvrir un sous-site `…/site/paleo-h2o` (ou `paleo-h2o.org`). | « Et les **sous-sites** thématiques, chacun avec sa frise et sa couleur. **Un seul code, une seule base.** » |
| 5 | Bouton **Connexion** (cadenas) → fenêtre → saisir un compte démo → `/app/admin`. | « Pour administrer : Connexion, en haut à droite. On arrive sur le **hub Administration**. » |
| 6 | Survoler les grands blocs du hub `/app/admin`. | « C'est le tableau de bord : réglages, cartels, sous-sites, équipe, exports. On va tout voir. » |

---

## Capsule 2 — Créer et publier un cartel (~4 min)
*Réf. manuel : §10 (le cartel), §11 (le formulaire), §7 (la frise).*

**Objectif :** créer un cartel bilingue et le publier.

| # | À l'écran | Voix off |
|---|---|---|
| 1 | Depuis `/app`, bouton **« Nouveau cartel »** (ou `/app/create`). | « Créons un cartel — la fiche d'une invention. » |
| 2 | Remplir **Titre, Année, Lieu**, puis uploader une **image**. | « Les champs clés : titre, année, lieu, une image. » |
| 3 | Choisir une ou plusieurs **catégories**. | « On classe avec les catégories : ce sont elles qui alimentent la frise et les sous-sites. » |
| 4 | Rédiger la **description** en français. Montrer les onglets **FR / EN**. | « Tout est bilingue. Je remplis le français… » |
| 5 | Laisser l'anglais vide, enregistrer → montrer la **traduction auto** générée. | « …et l'anglais est **traduit automatiquement à la création**. À **relire** toujours. » |
| 6 | Bouton **« Publier »** (vs « Enregistrer brouillon »). | « Brouillon pour garder au chaud, **Publier** pour le rendre visible. » |
| 7 | Retour sur la **frise** `/app` → retrouver le cartel. | « Et voilà : il apparaît sur la frise. » |

> 💡 Insister : *auto-traduction seulement à la création*, pas à chaque modification
> (bouton **Retraduire** pour la refaire — vu en capsule 5).

---

## Capsule 3 — Les deux files de modération (à ne jamais confondre) (~3 min)
*Réf. manuel : §13 (LE chapitre piège).*

**Objectif :** distinguer les deux circuits de validation. **Le point le plus délicat.**

| # | À l'écran | Voix off |
|---|---|---|
| 1 | Schéma simple (2 flèches) en incrustation. | « Il existe **deux files** de modération, totalement différentes. Ne les confondez jamais. » |
| 2 | `/app/manage/pending` — onglet **« En attente »**. | « File n°1 : les propositions des **visiteurs** non connectés. Elles arrivent ici, en attente. » |
| 3 | Ouvrir une proposition → **Publier** (accepter) / Supprimer (refuser). | « On relit, puis on **publie** pour accepter, ou on supprime. » |
| 4 | `/app/manage/submissions` — onglet **« Soumissions »** (superadmin). | « File n°2, réservée au superadmin : les cartels des **sous-sites** qui demandent à apparaître **aussi sur le site principal**. » |
| 5 | Approuver / Rejeter une soumission. | « **Approuver** = visible sur le principal. **Rejeter** = reste sur son sous-site. » |
| 6 | Rappel côté sous-site : « publier un cartel de sous-site = le proposer au principal ». | « Attention : côté sous-site, **publier un cartel le propose automatiquement** à cette file. » |

> ⚠️ Bien marquer la différence : **« En attente » = visiteurs** ; **« Soumissions » = sous-sites → principal**.

---

## Capsule 4 — Sous-sites, comptes & permissions (v33) (~5 min)
*Réf. manuel : §3 (permissions), §8 (sous-sites), §12.6 (exportateur), §15 (équipe).*

**Objectif :** créer un sous-site, inviter un membre, comprendre les capacités v33.

| # | À l'écran | Voix off |
|---|---|---|
| 1 | *Admin → Administration → Sous-sites thématiques → « Nouveau sous-site »*. | « Créons un sous-site : nom, slug, et sa **source** — une catégorie ou un atelier. » |
| 2 | Régler **couleur** + **type de planète**, composer l'accueil (FR/EN). | « Sa couleur de signature, son apparence dans la Pédia, sa page d'accueil bilingue. » |
| 3 | Surligner que la **source est figée** après création. | « La source est **figée à vie** ; le nom et le slug ne bougent que par un superadmin. » |
| 4 | `/app/admin/team` — **Inviter un membre** (e-mail + mot de passe). | « Pour lui donner un propriétaire : Gestion d'équipe, on invite. » |
| 5 | Montrer la **carte membre** avec les **5 interrupteurs** : Gérer les cartels · Exporter (langues du site) · Exporter (autre langue) · Gérer les contenus · **Gérer l'équipe**. | « Pas de « rôle » : des **capacités**, toutes **limitées au périmètre** du compte. » |
| 6 | Activer **« Gérer l'équipe »** → le membre devient **propriétaire** du sous-site. | « ‘Gérer l'équipe’ + un sous-site = **propriétaire**. Il gère tout **son** sous-site, rien d'autre. » |
| 7 | Montrer un **badge Superadmin**. | « Le **superadmin**, lui, a tout, partout — plus la création de sous-sites et la validation des soumissions. » |
| 8 | Créer un compte avec **seulement** « Exporter (langues du site) » → ouvrir la Gestion en lecture seule. | « Cas spécial : le **compte exportateur**. Une capacité d'export **seule** = accès **lecture seule**, idéal pour un imprimeur. » |

> 💡 Message-clé : **superadmin et propriétaire ont déjà toutes les capacités dans leur
> périmètre** — on ne coche les interrupteurs un par un que pour les autres comptes.

---

## Capsule 5 — Exports, impression & QR codes (~3 min)
*Réf. manuel : §12 (Gestion), §21 (exports/QR/impression).*

**Objectif :** sortir les cartels pour l'impression / l'exposition.

| # | À l'écran | Voix off |
|---|---|---|
| 1 | `/app/manage/published` — cocher plusieurs cartels. | « Depuis la Gestion, on sélectionne les cartels à sortir. » |
| 2 | Barre d'actions → **Exporter** (montrer les 4 formats). | « Quatre formats d'export : PDF, images, archive… selon le besoin. » |
| 3 | **PDF traduit (autre langue)** → générer. | « Un **PDF traduit à la volée** dans une autre langue, pour une expo multilingue. **Non enregistré** en base : c'est un export ponctuel. » |
| 4 | Montrer un **QR code** sur un aperçu / une fiche imprimée. | « Chaque cartel porte un **QR code** qui renvoie vers sa fiche en ligne. » |
| 5 | Bouton **Retraduire (N)** en sélection. | « Et pour **enregistrer** durablement une traduction refaite : ‘Retraduire’. » |
| 6 | Écran de fin : renvoi vers le manuel + contact support. | « Pour le détail, le **manuel d'administration**. Bonne prise en main ! » |

---

## Notes de production

- **Outil de capture** : OBS Studio (gratuit) ou Loom/Tella. Montage : DaVinci Resolve
  (gratuit) ou CapCut.
- **Habillage** (intro/outro, titres de capsule, sous-titres) : Canva convient bien.
- **Voix off** : script ci-dessus lu naturellement ; prévoir 2–3 secondes de respiration
  entre les étapes pour le montage.
- **Cohérence** : les moments filmés recoupent les **captures [Axx]** du manuel — on peut
  réutiliser les mêmes écrans pour la doc écrite.
- **Maintenance** : si l'UI change, seule la capsule concernée est à re-tourner (intérêt
  du découpage). Les libellés cités (capacités v33, onglets) sont ceux de l'app au 2026-07.
