# Paléo-Énergétique — plateforme web

Plateforme web du programme de recherche participatif **Paléo-Énergétique**, porté par
l'association **[Atelier 21](https://www.atelier21.org)**. Le projet exhume des
**inventions énergétiques oubliées** de l'histoire technique pour inspirer les solutions
d'aujourd'hui, et les présente sous forme de **cartels** (fiches d'invention) disposés sur
une **frise chronologique** interactive.

Ce dépôt contient la **v2** de la plateforme : une application web unique
(React + Node/Express + MySQL) qui sert **plusieurs vitrines** à partir d'un seul code et
d'une seule base de données.

## Ce que fait la plateforme

- **Site principal** ([paleo-energetique.org](https://paleo-energetique.org)) — le hub :
  frise chronologique, carte géolocalisée, arborescence des catégories, pages éditoriales, boutique.
- **Vitrine Paléo-Pédia** ([paleo-pedia.org](https://paleo-pedia.org)) — présentation de l'écosystème.
- **Sous-sites thématiques** — chacun sa frise, sa couleur, son équipe ; servis sous
  `/site/:slug` ou sur un **domaine dédié** (ex. `paleo-h2o.org`, `aero.paleo-energetique.org`).
- **Frise interactive** — cartels sur un axe du temps (zoom, ouverture sur un cartel au hasard),
  carte, arborescence catégories/cartels.
- **Espace d'administration** — création & modération des cartels (deux files de modération),
  comptes & **permissions scopées**, contenus éditoriaux, catégories/ateliers, partenaires,
  boutique, journal d'événements + notifications email.
- **Boutique** — vitrine de produits renvoyant vers des **liens de paiement Stripe**
  (article → variantes → options d'envoi Mondial Relay), avec pages produit référençables.
- **Bilingue FR/EN**, avec traduction automatique assistée.

Le serveur aiguille selon le **nom d'hôte** de la requête : routage multi-domaines,
redirections 301/410, `robots`/`sitemap` et aperçus **Open Graph** par contexte.

## Structure du dépôt

```
.
├── paleo-app/                          # L'application (front React + back Node/Express)
│   ├── src/                            # front React (pages, composants, i18n…)
│   ├── server/                         # API Express, modèles MySQL, migrations SQL
│   ├── README.md                       # ▶ démarrage, stack, variables d'env, structure
│   ├── HEBERGEMENT-INFOMANIAK.md       # setup de production (domaines, DNS, SSL, base)
│   └── DEPLOY.md                       # runbook de redéploiement
├── seed-content/                       # données de départ (équipe, presse, boutique…)
├── Manuel-administration-plateforme.md # manuel superadmin (FR)
├── Manuel-utilisation-sous-site.md     # manuel propriétaire de sous-site (FR)
└── Subsite-user-guide.md               # subsite owner manual (EN)
```

## Démarrer

L'application vit dans **`paleo-app/`**. Voir **[paleo-app/README.md](paleo-app/README.md)**
pour le détail (stack complète, variables d'environnement, structure du code).

```bash
cd paleo-app
npm install
# créer un fichier .env local (modèle : paleo-app/.env.production.example)
npm run dev        # front (Vite) + back (Express) en parallèle
```

Prérequis : **Node.js ≥ 18** et une base **MySQL/MariaDB** accessible.

## Stack

**Front** React 19 + Vite · React Router 6 · i18next (FR/EN) · Three.js / react-three-fiber ·
Leaflet · D3 + Recharts · jsPDF / JSZip / qrcode.
**Back** Node.js + Express 4 · MySQL/MariaDB (`mysql2`) · JWT · bcryptjs · multer · nodemailer ·
OpenAI (traductions). Un **seul process** sert l'API et le build statique en production.

## Documentation

| Document | Pour qui / quoi |
|---|---|
| [paleo-app/README.md](paleo-app/README.md) | Démarrer, stack, variables d'environnement, structure du code |
| [Manuel-administration-plateforme.md](Manuel-administration-plateforme.md) | Manuel complet des **superadmins** (toutes les fonctions) |
| [Manuel-utilisation-sous-site.md](Manuel-utilisation-sous-site.md) · [Subsite-user-guide.md](Subsite-user-guide.md) | Manuel **propriétaire de sous-site** (FR / EN) |
| [paleo-app/docs/PERMISSIONS.md](paleo-app/docs/PERMISSIONS.md) | Modèle de **permissions** (capacités scopées au périmètre) |
| [paleo-app/HEBERGEMENT-INFOMANIAK.md](paleo-app/HEBERGEMENT-INFOMANIAK.md) | **Setup** de production (Infomaniak : domaines, DNS, SSL, base) |
| [paleo-app/DEPLOY.md](paleo-app/DEPLOY.md) | **Runbook** de redéploiement (git pull → build → redémarrage) |
| [paleo-app/server/README.md](paleo-app/server/README.md) · [paleo-app/server/EMAILS.md](paleo-app/server/EMAILS.md) | Doc serveur & système d'emails |

## Déploiement

Production sur **Infomaniak** (site Node.js, Node 24). En résumé : `git pull origin main` en
SSH, puis, selon ce qui a changé, **Build** (front) et/ou **Arrêter → Démarrer** (back) depuis
le Manager ; les migrations SQL sont jouées à la main en **phpMyAdmin**, **avant** le
redémarrage. Détail complet : **[paleo-app/DEPLOY.md](paleo-app/DEPLOY.md)**.

## Crédits

Programme **Paléo-Énergétique** — association **Atelier 21** (Cédric Carles).
Développement : Youma.
