# Hébergement & déploiement — Infomaniak (v2)

> Réf. de la prod actuelle de la v2 (app Node/Express + React/Vite + MySQL).
> Remplace l'ancien hébergement o2switch (cf. `DEPLOY.md`, désormais en partie obsolète).

## Vue d'ensemble

- La v2 tourne sur un **site Node.js Infomaniak** (compte « atelier21 hébergements web »).
- **Un seul process Node** sert plusieurs domaines. Le routage par host se fait
  côté client (`src/utils/subsiteHost.js`) et côté serveur pour les
  redirections (`server/server.js`).

## Domaines — qui sert quoi

| Domaine | Rôle |
|---|---|
| `paleo-energetique.org` (+ `www`) | Site principal (hub v2) |
| `paleo-pedia.org` (+ `www`) | Vitrine Paléo-Pédia (à la racine) |
| `paleo-h2o.org` | Host dédié du sous-site `paleo-h2o` |
| `aero.paleo-energetique.org` | Host dédié du sous-site `paleo-aerospace` |
| `cyclo.paleo-energetique.org` | **301** → `paleo-pedia.org` |
| `stockage.paleo-energetique.org` | **410 Gone** |
| `paleo-pedia.com` (+ `www`) | **301** → `paleo-pedia.org` |
| URLs spam `…-k-<chiffres>` | **410 Gone** (héritage du WP piraté) |

## Accès (⚠️ deux consoles SSH distinctes)

- **Node (conteneur)** — *c'est celle de l'app* : carte « Node.js », hôte
  `57-113333.ssh.hosting-ik.com`, prompt `client@ik-…`, home **`/srv/customer`**.
- **PHP/Apache** — l'ancien WP : prompt `uid…@h2web…`, `/home/clients/…`.

App déployée dans **`/srv/customer/sites/v2.atelier21.org/`** (racine du repo),
l'app vit dans le **sous-dossier `paleo-app/`**.

## Déploiement (Git)

- Repo : `github.com/JomeiYouma/Paleo-pedia`, branche `main`, app dans `paleo-app/`.
- Config du site Node : **Node 24** · build `cd paleo-app && npm install && npm run build`
  · exec `cd paleo-app && npm run start` · **port 3001** (= `process.env.PORT || 3001`).

### ⚠️ « Build » ≠ `git pull`
Le bouton **Build** rebuild le code **déjà présent** — il ne récupère **PAS** les
nouveaux commits. Pour déployer du nouveau code :

```bash
cd /srv/customer/sites/v2.atelier21.org && git pull origin main
```

puis, selon ce qui a changé :
- **front modifié** (src/…) → **Build** (régénère `dist/`).
- **`server.js` seul** → **Arrêter → Démarrer** suffit (le back n'est pas « buildé »,
  il faut juste recharger le process).

## Variables d'environnement — `.env`

Fichier **`paleo-app/.env`** (l'app fait `import 'dotenv/config'`, cwd = `paleo-app`).
**Survit aux redéploiements** (git pull, fichier gitignoré/untracked).

```
NODE_ENV=production            # déjà posé par le script start
JWT_SECRET=<openssl rand -hex 64>   # requis au boot
DB_HOST=e44qd.myd.infomaniak.com
DB_PORT=3306
DB_NAME=<base Infomaniak créée>
DB_USER=<user>
DB_PASSWORD=<mdp>
UPLOADS_DIR=/srv/customer/paleo-uploads
TRUST_PROXY=1
# MAIL_* si emails ; ALLOWED_ORIGIN si appels cross-origin
```

## Base de données

- Hôte MySQL Infomaniak : **`e44qd.myd.infomaniak.com`** (port 3306, MariaDB) — **pas** `localhost`.
- Créer la base via Manager → Bases de données. Import via **phpMyAdmin**.

## Uploads

- Dossier persistant **hors de l'arbre déployé** : **`/srv/customer/paleo-uploads`**
  (survit aux `git pull`). `UPLOADS_DIR` pointe dessus ; le serveur sert
  `/api/images` depuis là. **Pas de symlink nécessaire.**
- Transfert : **SFTP** (FileZilla) via le compte Node (`…@57-113333.ssh.hosting-ik.com`,
  port 22, **mot de passe** — clé privée pas encore supportée) → dépôt dans
  `/srv/customer`, puis `unzip`.

## DNS — 🔑 LEÇON CLÉ

- Registrar : **Namecheap**.
- ✅ **Bon montage** : **Namecheap BasicDNS** + enregistrements **A** (`@`, `www`,
  et les sous-domaines) → **`185.125.27.88`** (IP de l'hébergement Infomaniak).
- ❌ **NE PAS** mettre les nameservers sur Infomaniak (`ns1/2/3.infomaniak.com`) :
  Infomaniak **n'héberge pas** automatiquement la zone d'un domaine externe →
  **SERVFAIL / domaine down**.
- Pièges rencontrés :
  - Après un changement de NS, un **SERVFAIL** = souvent **DNSSEC périmé**
    (désactiver DNSSEC chez Namecheap) ou **zone absente** côté NS cible.
  - **Cache DNS local** capricieux → vérifier avec **whatsmydns.net** +
    `nslookup … 1.1.1.1` + `ipconfig /flushdns` (pas le résolveur local).

## SSL

- **Let's Encrypt** via le dashboard, **une fois que le domaine résout** (sinon le
  challenge échoue). Le **HSTS** empêche de contourner une erreur de certificat →
  il faut installer le vrai certificat (pas de « continuer quand même »).

## Ancien WordPress (décommissionné)

- L'ancien WP de `paleo-energetique.org` (multisite, **compromis : spam farm +
  backdoor**, PHP 7.4) est **retiré** : tous ses domaines sont passés sur la v2.
- **Backups Phase 0 conservés** : `wp-files-backup.zip`, export base `e44qd_paleoener`, uploads.
- ⚠️ **Ne pas toucher** aux autres sites/bases du compte (`solarsoundsystem.org`,
  `juiceenergybar.com`, `radio3s.org`, `station-e.org`, `atelier21.org`, `solidarite-energetique.org`…).

## Redirections / SEO (`server/server.js`)

- `LEGACY_HOST_301` : `cyclo` → pedia, `paleo-pedia.com` (+www) → pedia.
- `LEGACY_HOST_410` : `stockage` + URLs spam `…-k-<chiffres>`.
- `aero` n'est **pas** une redirection : c'est un **host dédié** qui sert le
  sous-site `paleo-aerospace` (cf. `HOST_TO_SUBSITE_SLUG` dans `subsiteHost.js`).
- **robots/sitemap par domaine** : `server.js` sert `robots-pedia.txt` /
  `sitemap-pedia.xml` quand le host est la Pédia, sinon les versions principales.
- **TODO SEO** : Search Console (soumettre les 2 sitemaps), vérifier les actions
  manuelles (le domaine a hébergé du spam), renvoyer 410 sur le spam (fait).

## Admin depuis la Pédia

- Les routes `/app` (gestion/admin) sont **montées aussi sur le host Pédia**
  (`paleo-pedia.org/app/...`) — voir `pediaHostRouter` dans `App.jsx`. PediaLayout
  expose un bouton « Se connecter » + un lien « Admin ».
- ⚠️ La session (token) est en **localStorage = par origine** : se connecter sur
  `paleo-pedia.org` est **indépendant** de `paleo-energetique.org` (même base/API,
  sessions séparées).
