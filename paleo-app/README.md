# Paléo — application (frise, sous-sites, administration)

Application web unique qui sert **plusieurs vitrines** à partir d'un seul code et
d'une seule base de données :

- le **site principal** Paléo-Énergétique (hub institutionnel + la frise) ;
- la vitrine **Paléo-Pédia** (l'écosystème en « système solaire ») ;
- des **sous-sites** thématiques (chacun sa frise, sa couleur, son équipe), servis
  sous `/site/:slug` ou sur un **domaine dédié** (ex. `paleo-h2o.org`).

Le serveur aiguille selon le **nom d'hôte** de la requête (routage multi-domaines,
redirections 301/410, `robots`/`sitemap` par domaine, aperçus Open Graph par contexte).

## Stack

- **Front** : React 19 + Vite, React Router 6, i18next (FR/EN), Three.js / react-three-fiber
  (vue 3D Pédia), Leaflet (carte), D3 + Recharts (frise / stats), jsPDF + JSZip + qrcode
  (exports).
- **Back** : Node.js + Express 4, MySQL/MariaDB (`mysql2`), JWT (`jsonwebtoken`),
  bcryptjs, multer (uploads), nodemailer (emails), OpenAI (traductions auto).
- **Un seul process** sert l'API **et** le build statique (`dist/`) en production.

## Démarrer en local

Prérequis : Node.js ≥ 18, une base MySQL/MariaDB accessible.

```bash
cd paleo-app
npm install
# créer un fichier .env local (voir .env.production.example pour le modèle)
npm run dev            # front (Vite) + back (node --watch) en parallèle
```

- `npm run dev` — front + back ensemble (via `concurrently`).
- `npm run dev:frontend` / `npm run dev:backend` — séparément.
- `npm run build` — build Vite dans `dist/` (les images uploadées sont servies depuis `UPLOADS_DIR`, hors de l'app).
- `npm start` — lance le serveur en `NODE_ENV=production` (sert l'API + `dist/`).
- `npm run lint` — ESLint.

## Variables d'environnement (principales)

Réglées côté serveur (jamais commitées) :

| Variable | Rôle |
|---|---|
| `NODE_ENV` | `production` en prod (active HTTPS redirect, HSTS, etc.). |
| `DATABASE_URL` **ou** `DB_HOST/PORT/NAME/USER/PASSWORD` | Connexion MySQL. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Session (défaut `7d`). |
| `UPLOADS_DIR` | Dossier de stockage des images (hors app). |
| `ALLOWED_ORIGIN` | CORS. |
| `TRUST_PROXY` | Défaut `1` — indispensable derrière le proxy (quotas par IP + routage par domaine). |
| `OPENAI_API_KEY` | Traductions automatiques FR↔EN. |
| SMTP (`SMTP_HOST`, …) | Envoi d'emails (désactivé par défaut si non configuré). |

> Les clés API applicatives (OpenAI, etc.) et les réglages fonctionnels sont pour
> l'essentiel **stockés en base** et modifiables depuis *Admin → Réglages*.

## Structure

```
paleo-app/
├── src/                 # front React
│   ├── pages/           # pages publiques + écrans d'admin (/app/admin/*)
│   ├── components/       # SharedHeader, DataManager, frise, éditeurs…
│   ├── context/          # AppContext (auth, permissions, i18n)
│   ├── services/         # apiClient
│   └── locales/          # fr.json / en.json
├── server/
│   ├── server.js         # entrée : aiguillage domaines, static, API
│   ├── routes/index.js   # toutes les routes API
│   ├── controllers/      # logique par ressource (cartels, shop, team…)
│   ├── models/           # accès MySQL
│   ├── middleware/       # auth.js (permissions v33), tenant.js (périmètre)
│   ├── lib/              # db, socialMeta (Open Graph), …
│   ├── *.sql             # schéma + migrations (migration_vNN_*.sql)
│   ├── README.md         # doc serveur
│   └── EMAILS.md         # notifications & journal d'événements
├── docs/PERMISSIONS.md   # modèle d'autorisation (v33) — source de vérité
└── dist/                 # build Vite (généré)
```

## Permissions (v33)

Le modèle d'autorisation repose sur des **capacités scopées au périmètre** du compte
(site principal ou un sous-site), pas sur un « rôle ». Voir **[docs/PERMISSIONS.md](docs/PERMISSIONS.md)**
(source de vérité) et `server/middleware/auth.js`.

## Documentation

- **[docs/PERMISSIONS.md](docs/PERMISSIONS.md)** — modèle de permissions v33.
- **[HEBERGEMENT-INFOMANIAK.md](HEBERGEMENT-INFOMANIAK.md)** — **setup** de production (Infomaniak : domaines, DNS, SSL, base).
- **[DEPLOY.md](DEPLOY.md)** — **runbook de redéploiement** Infomaniak (git pull → build → redémarrage, migrations, pièges).
- **[server/README.md](server/README.md)**, **[server/EMAILS.md](server/EMAILS.md)** — doc serveur & emails.
- À la racine du dépôt : les **manuels** administrateur (`Manuel-administration-plateforme.md`)
  et sous-site (`Manuel-utilisation-sous-site.md` / `Subsite-user-guide.md`).
