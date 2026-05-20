# Déploiement Paleo Cartels — o2switch

Guide complet de redéploiement et points critiques à vérifier. Mis à jour après les incidents image_path (2026-04-21) et logs/emails v8 (2026-04-29).

> **Note workflow** — il n'y a **pas de remote git** sur ce projet. Les fichiers source (`.js`, `.jsx`, `.sql`) sont uploadés manuellement via le **File Manager cPanel** ou par scp/sftp depuis la copie locale. Le `dist/` est régénéré côté prod par `npm run build`. Voir § "Redéploiement v8 (logs/emails)" plus bas pour la séquence détaillée.

## Architecture prod

```
/home/madore/
├── public_html/paleo/              ← racine de l'app (code, déployé via git pull)
│   ├── server/server.js
│   ├── dist/                        ← build Vite (npm run build)
│   └── public/images → /home/madore/paleo-uploads  (SYMLINK — ne PAS supprimer)
├── paleo-uploads/                   ← images uploadées (HORS de l'app, préservées entre déploiements)
└── nodevenv/public_html/paleo/<ver>/  ← Node.js venv géré par cPanel
```

- **Runtime** : Phusion Passenger (lancé par cPanel → Setup Node.js App)
- **Process visible** via : `ps -fu madore | grep -i node` → "Passenger NodeApp: /home/madore/public_html/paleo"
- **BDD** : MariaDB/MySQL `madore_paleo` (localhost, user `madore_paleoadmin`)
- **Domaines** : un domaine principal (`paleo.madore.projetsmmichamps.fr`) + N domaines dédiés à des sous-sites (ex. `paleo-h2o.org`). Tous partagent le même docroot et la même app Node. Voir la section "Sous-sites sur domaines dédiés" plus bas pour la procédure d'ajout.

## Variables d'environnement obligatoires

Définies dans cPanel → Setup Node.js App → Environment variables (PAS dans un `.env` file) :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `UPLOADS_DIR` | `/home/madore/paleo-uploads` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `madore_paleo` |
| `DB_USER` | `madore_paleoadmin` |
| `DB_PASSWORD` | (voir panel) |
| `JWT_SECRET` | (chaîne aléatoire longue) |

### Notifications email (v8+) — optionnel

Renseigne ces variables pour activer l'envoi d'emails depuis Admin → Journal d'événements → Configuration emails. Sans elles l'app fonctionne, mais aucun email ne part (warning unique côté serveur).

| Variable | Valeur prod actuelle |
|---|---|
| `MAIL_SMTP_HOST` | `mail.madore.projetsmmichamps.fr` |
| `MAIL_SMTP_PORT` | `465` |
| `MAIL_SMTP_SECURE` | `true` |
| `MAIL_SMTP_USER` | `paleo@madore.projetsmmichamps.fr` |
| `MAIL_SMTP_PASS` | (mot de passe défini dans cPanel → Email Accounts) |
| `MAIL_FROM` | `Paléo-Énergétique <paleo@madore.projetsmmichamps.fr>` |

> ⚠️ Le `MAIL_FROM` **doit** correspondre à `MAIL_SMTP_USER`. o2switch refuse les `From:` qui ne sont pas l'utilisateur authentifié (anti-spoofing).

⚠️ Toute modif des env vars nécessite un **Stop / Start** complet via cPanel — le bouton "Restart" seul ne purge pas le cache ESM Phusion (cf. § "Cache Phusion ESM" plus bas).

## Redéploiement — deux approches selon le type de changement

Choisir l'une ou l'autre selon ce qui a été modifié :

| Type de changement | Méthode recommandée |
|---|---|
| Frontend pur (`src/**/*.jsx`, `src/**/*.js`, locales, styles) | **A. Build local → ship dist** (plus simple, pas de SSH) |
| Serveur (`server/**`), nouvelle dep npm, env vars, migration SQL | **B. Ship sources → build prod** (procédure historique) |
| Mixte (frontend + serveur) | **B. Ship sources → build prod** |

### A. Build local → ship dist (frontend uniquement)

Avantages : 1 seul artifact, pas de SSH, pas de risque de build qui foire sur prod. À privilégier dès que possible.

```bash
# Local
cd paleo-app
npm run build
# → produit paleo-app/dist/ avec tous les assets hashés (index.html + assets/*.js + assets/*.css)
```

Préparer l'upload (zip = atomique, évite les états intermédiaires où index.html pointe vers des hashes pas encore arrivés) :

```bash
# Bash
(cd dist && zip -r ../dist-deploy.zip .)
# PowerShell
# Compress-Archive -Path dist\* -DestinationPath dist-deploy.zip -Force
```

Sur prod, via **cPanel File Manager** (chemin `/home/madore/public_html/paleo/`) :
1. Renommer le `dist/` existant en `dist.old/` (rollback rapide en cas de souci)
2. Créer un nouveau dossier `dist/` vide
3. Uploader `dist-deploy.zip` dedans
4. Clic droit sur le zip → **Extract**
5. Supprimer `dist-deploy.zip`

Ou via scp/sftp :
```bash
scp -r dist/ madore@<host>:~/public_html/paleo/dist-new/
ssh madore@<host>
mv ~/public_html/paleo/dist ~/public_html/paleo/dist.old
mv ~/public_html/paleo/dist-new ~/public_html/paleo/dist
```

**Stop/Start cPanel** : facultatif pour un déploiement frontend pur (le cache ESM Phusion ne concerne pas les assets statiques). Mais le faire reste la voie safe — ça purge les workers qui peuvent avoir un `dist/` ouvert en file handle.

Pour revert en cas de pépin : `rm -rf dist && mv dist.old dist` + Stop/Start.

### B. Ship sources → build prod (serveur ou mixte)

Procédure historique, à utiliser dès qu'il y a du code serveur ou une nouvelle dep npm. Depuis `~/public_html/paleo/` en SSH, après avoir uploadé les fichiers source modifiés via File Manager ou scp :

```bash
source ~/nodevenv/public_html/paleo/*/bin/activate
npm install --omit=dev          # si nouvelles deps dans package.json (cf. piège #5)
npm run build                   # régénère dist/
# cPanel → Setup Node.js App → Stop puis Start (PAS Restart, cf. piège #4)
```

### Vérifications post-déploiement (commune aux 2 méthodes)

- Le site répond : `curl -I https://paleo.madore.projetsmmichamps.fr`
- L'API répond : `curl https://paleo.madore.projetsmmichamps.fr/api/cartels | head -c 200`
- Une image charge : ouvrir `https://paleo.madore.projetsmmichamps.fr/api/images/IMG_3510.jpg`
- Pour un changement frontend, vider le cache navigateur (Ctrl+F5) ou tester en navigation privée — les hashes Vite changent à chaque build donc les anciens assets sont invalidés automatiquement, mais l'OS peut servir un index.html cached.

## Les 3 pièges qui ont déjà causé des incidents

### 1. Symlink `public/images` → `paleo-uploads`

```bash
# Ne doit JAMAIS être supprimé :
ls -la /home/madore/public_html/paleo/public/images
# → lrwxrwxrwx ... -> /home/madore/paleo-uploads
```

Pourquoi : si `UPLOADS_DIR` n'est pas correctement propagé au process Node par Passenger (cas observé le 2026-04-21 malgré config correcte), le fallback de [uploadController.js:15-16](server/controllers/uploadController.js#L15-L16) pointe sur `<app>/public/images/`. Le symlink rend ce fallback équivalent à `paleo-uploads`, donc le site marche dans tous les cas.

**⚠️ PIÈGE git pull** : git suit le symlink. Si un commit distant supprime des fichiers de `public/images/`, `git pull` les supprimera **à travers le symlink dans `paleo-uploads/`**. Avant tout pull qui modifie `public/images/` :

```bash
# 1. Désactiver temporairement le symlink
rm public/images           # supprime le lien uniquement, pas paleo-uploads
mkdir public/images

# 2. Pull
git pull origin <branch>

# 3. Restaurer le symlink
rm -rf public/images
ln -s /home/madore/paleo-uploads public/images
```

Si le dossier `public/images` réapparaît en tant que vrai dossier (après un build ou un déploiement bizarre), le recréer :

```bash
# Migrer d'éventuels fichiers coincés vers paleo-uploads
mv /home/madore/public_html/paleo/public/images/* /home/madore/paleo-uploads/ 2>/dev/null
# Remettre le symlink
rm -rf /home/madore/public_html/paleo/public/images
ln -s /home/madore/paleo-uploads /home/madore/public_html/paleo/public/images
```

### 2. `image_path` legacy format `images/...`

La BDD peut contenir 2 formats :
- ✅ `/api/images/<timestamp>-<hash>.ext` — chemin absolu, marche partout
- ❌ `images/<name>.ext` — chemin **relatif**, ne marche que sur la homepage (cassé sur `/museum/...`, `/s/<slug>/...`, etc.)

Le format legacy vient des cartels importés depuis l'ancien système PHP. Pour les normaliser :

```sql
START TRANSACTION;
UPDATE cartels
SET image_path = CONCAT('/api/images/', SUBSTRING_INDEX(image_path, '/', -1))
WHERE image_path LIKE 'images/%';
-- Vérif : doit retourner 0
SELECT COUNT(*) FROM cartels WHERE image_path LIKE 'images/%';
COMMIT;
```

Appliquer cette migration après chaque import massif de données legacy.

### 3. Permissions des fichiers uploadés

Les fichiers dans `paleo-uploads/` doivent être **644** (lisibles par Apache/Node) et le dossier **755**.

```bash
chmod 755 /home/madore/paleo-uploads
chmod 644 /home/madore/paleo-uploads/*
```

Multer écrit par défaut avec le bon mode, mais un `scp` / `rsync` depuis Windows peut donner des permissions bizarres.

### 4. Cache Phusion ESM — le bouton "Restart" cPanel ne suffit pas toujours

**Symptôme** : tu uploades du nouveau code, tu cliques "Restart" dans cPanel, mais l'app continue de servir l'ancienne version. Vérifié sur 2026-04-29 lors du déploiement v8 — les events ne se créaient pas car `cartelController.js` était encore l'ancienne version en cache ESM.

**Fix** : faire un vrai cycle Stop / Start dans **cPanel → Setup Node.js App** (pas juste Restart). Si l'UI n'expose pas Stop/Start :

```bash
pkill -9 -fu madore "Passenger NodeApp.*paleo"
curl -s -o /dev/null https://paleo.madore.projetsmmichamps.fr   # relance Passenger
```

**Toujours** : après un changement d'env vars (notamment ajout de `MAIL_SMTP_*`), Stop/Start obligatoire — un `touch tmp/restart.txt` ne propage pas les nouvelles vars au worker.

### 5. `npm install --omit=dev` ne réinstalle pas toujours après upload

**Symptôme** : tu uploades un nouveau `package.json` qui contient une nouvelle dep (ex `nodemailer`). `npm install --omit=dev` retourne `up to date` mais la dep n'est pas dans `node_modules/`. L'app crash au démarrage avec `Cannot find package 'nodemailer'`.

**Cause probable** : le `package-lock.json` côté prod n'a pas été uploadé en même temps, ou npm utilise un cache désynchronisé.

**Fix** : forcer l'install explicitement :

```bash
cd ~/public_html/paleo
source ~/nodevenv/public_html/paleo/*/bin/activate
npm install <nom_de_la_dep>          # ex: npm install nodemailer
ls node_modules/<nom_de_la_dep>/package.json   # doit exister
```

Diagnostic le plus rapide quand l'app ne boot pas : lancer le serveur à la main, l'erreur s'affiche en clair :

```bash
cd ~/public_html/paleo
source ~/nodevenv/public_html/paleo/*/bin/activate
node server/server.js
# → Ctrl+C une fois le diagnostic fait
```

### 6. MariaDB ≠ MySQL : `CAST(? AS JSON)` non supporté

**Symptôme** : un INSERT avec un cast JSON échoue côté prod (MariaDB) alors qu'il marche en local (MySQL/XAMPP). Erreur :

```
You have an error in your SQL syntax; ... near 'JSON)' at line 3
```

**Cause** : sur MariaDB, le type JSON est un alias pour LONGTEXT. La syntaxe `CAST(... AS JSON)` n'existe pas (c'est une extension MySQL 8). Le moteur valide le JSON à l'INSERT sans cast nécessaire.

**Fix** : ne **jamais** utiliser `CAST(? AS JSON)` — passer directement la string JSON dans une colonne déclarée `JSON`. Cf. `server/models/EventLog.js` qui a corrigé ce bug le 2026-04-29.

## Redéploiement v8 (logs/emails) — procédure complète

Cette section documente le déploiement de référence pour la mise à jour qui ajoute le journal d'événements et les notifications email. Sert aussi de modèle pour les futures releases avec migration SQL + nouvelle dépendance npm + nouvelles env vars.

### Pré-requis local

- Tous les commits validés en local (working tree clean : `git status`).
- Build Vite vérifié : `cd paleo-app && npx vite build`.
- Tag de safety posé sur l'ancienne tête de main : `git tag main-pre-<release> main` avant le merge de la branche feature.

### Étape 1 — Backup BDD prod

```bash
ssh madore@<host>
mkdir -p ~/backups
mysqldump -u madore_paleoadmin -p madore_paleo > ~/backups/paleo_$(date +%Y%m%d_%H%M).sql
ls -la ~/backups/  # vérifie la taille (>1 Mo attendu)
```

### Étape 2 — Upload des fichiers source modifiés

Via **File Manager cPanel** ou scp/sftp depuis la machine locale. Liste à transférer pour la v8 :

| Catégorie | Fichiers |
|---|---|
| Migration SQL | `server/migration_v8_event_logs.sql` |
| Nouveaux modèles | `server/models/EventLog.js`, `server/models/EventEmailConfig.js` |
| Nouveaux services | `server/services/mailer.js`, `server/services/eventDispatcher.js` |
| Nouveau contrôleur | `server/controllers/eventLogController.js` |
| Routes | `server/routes/index.js` |
| Schéma central | `server/schema_mysql.sql` (mis à jour pour nouvelles installations) |
| Auth (email dans JWT) | `server/controllers/authController.js`, `server/middleware/auth.js` |
| Contrôleurs instrumentés | `server/controllers/{cartel,user,partner,Category,subsite,team,workshop}Controller.js` |
| Scripts ops | `server/scripts/run_migration.js`, `verify_event_tables.js`, `smoke_event_dispatcher.js` |
| Config npm | `package.json`, `package-lock.json` (pour `nodemailer`) |
| Front | `src/components/{LongOperationOverlay,TranslateFriseModal,Toast}.jsx`, `src/pages/{AdminLogs,ManageCartels,Library,Admin,Drafts,Proposals,AdminSettings}.jsx`, `src/components/CartelPreview.jsx`, `src/services/apiClient.js`, `src/locales/{fr,en}.json`, `src/App.jsx` |
| Doc | `server/EMAILS.md`, `DEPLOY.md` |

> Astuce : tu peux uploader tout `paleo-app/` en remplaçant les fichiers, sauf `node_modules/`, `dist/` (régénéré sur prod), et `.env` (vit dans cPanel env vars).

### Étape 3 — Dépendances + migration

```bash
cd ~/public_html/paleo
source ~/nodevenv/public_html/paleo/*/bin/activate

# 3.1 Installer la nouvelle dep nodemailer (cf. piège #5 si npm install --omit=dev semble inopérant)
npm install nodemailer
ls node_modules/nodemailer/package.json  # doit exister

# 3.2 Appliquer la migration v8 (idempotente : CREATE TABLE IF NOT EXISTS + INSERT IGNORE)
node server/scripts/run_migration.js server/migration_v8_event_logs.sql
node server/scripts/verify_event_tables.js
# → doit afficher : 28 types seedés, event_email_config + event_logs présentes
```

### Étape 4 — Variables d'env email (cPanel UI)

cPanel → Setup Node.js App → Environment variables → ajouter les 6 vars `MAIL_SMTP_*` + `MAIL_FROM` (cf. tableau plus haut).

### Étape 5 — Build + restart

```bash
cd ~/public_html/paleo
source ~/nodevenv/public_html/paleo/*/bin/activate
npm run build
```

Puis **cPanel → Setup Node.js App → Stop puis Start** (cf. piège #4 : pas Restart, qui ne purge pas le cache ESM Phusion). Si le bouton Stop/Start n'est pas exposé :

```bash
pkill -9 -fu madore "Passenger NodeApp.*paleo"
curl -s -o /dev/null https://paleo.madore.projetsmmichamps.fr
```

### Étape 6 — Vérifications post-déploiement

```bash
# 6.1 Smoke test dispatcher (insert + cleanup)
node server/scripts/smoke_event_dispatcher.js
# → "1 résultat(s)" puis "0 (devrait être identique à avant)"

# 6.2 API
curl -I https://paleo.madore.projetsmmichamps.fr
curl -s https://paleo.madore.projetsmmichamps.fr/api/cartels | head -c 200
```

Côté UI (en superadmin) :

- [ ] `/app/admin/logs` ouvre la page sans 404
- [ ] Onglet **Journal** : créer un brouillon → la ligne `cartel.draft_created` apparaît
- [ ] Onglet **Configuration emails** : 28 types listés ; le formulaire mauve "Appliquer un destinataire à tous" fonctionne ; sticky footer "Enregistrer (N)" avec lignes dirty surlignées
- [ ] Activer un type avec un destinataire valide + créer le brouillon correspondant → le mail arrive
- [ ] Frise traduite (Gestion → Exporter → "PDF traduit") : si clé OpenAI configurée, le PDF est généré ; si DeepL, toast en bas à gauche "Clef DeepL pas assez puissante"
- [ ] Bibliothèque publique (en navigation privée) : les boutons PNG/PDF sur les cartels ont disparu

### Erreurs typiques rencontrées sur le déploiement v8

| Symptôme | Cause | Page de fix |
|---|---|---|
| Page blanche / `Error ID: <hex>` Passenger | `Cannot find package 'nodemailer'` | Piège #5 |
| `node server/server.js` boot OK mais Journal reste vide | Cache ESM Phusion | Piège #4 (Stop/Start) |
| Smoke test : `[eventDispatcher] log INSERT failed ... near 'JSON)'` | MariaDB ≠ MySQL | Piège #6 |
| Frise traduite renvoie 500 | Clé DeepL configurée au lieu d'OpenAI | Admin → Réglages, mettre une clé `sk-...` |
| Email pas envoyé même si type activé | Vars `MAIL_*` absentes ou pas restart après ajout | Étape 4 + Stop/Start |

## Sous-sites sur domaines dédiés (paleo-h2o.org, …)

Depuis 2026-05-16, l'app supporte plusieurs **domaines dédiés** qui pointent chacun vers un sous-site spécifique avec **URLs propres** (`paleo-h2o.org/frise` au lieu de `paleo-energetique.org/#/site/paleo-h2o/frise`).

### Comment ça marche

- **Côté infra** : tous les domaines dédiés partagent la même app Node/Passenger (même docroot `/home/madore/public_html/paleo`). Le serveur Express ne fait **aucune** différence entre les hosts — il sert le même `index.html` SPA et la même API.
- **Côté React** : au boot, `src/utils/subsiteHost.js` lit `window.location.hostname` et, si le host est dans la map `HOST_TO_SUBSITE_SLUG`, instancie un `createBrowserRouter` avec des routes plates (`/`, `/frise`, `/admin/...`) qui rendent le sous-site à la racine. Sinon, l'app utilise le `createHashRouter` historique avec les routes `/site/:slug/*`.
- **Conséquence** : aucun changement serveur n'est nécessaire pour ajouter un nouveau domaine dédié. Tout se passe au niveau DNS + cPanel + 2 lignes dans `subsiteHost.js`.

### Ajouter un nouveau domaine dédié (procédure complète)

Exemple : on veut faire pointer `solidarite-energetique.org` vers le sous-site de slug `solidarite`.

**1. DNS chez le registrar (Namecheap, Gandi, etc.)**

Méthode A — déléguer les NS à o2switch (recommandé) :
- Dans le dashboard du registrar → Manage → Nameservers → "Custom DNS"
- `ns1.o2switch.net` / `ns2.o2switch.net`
- Valider (chez Namecheap : coche verte à droite)

Méthode B — garder le DNS chez le registrar, créer un A record :
- Récupérer l'IP serveur o2switch (cPanel → Informations générales → IP partagée)
- A record `@` + A record `www` pointant sur cette IP

Vérifier la propagation (15 min à 2 h en général) :
```bash
nslookup -type=NS solidarite-energetique.org 8.8.8.8
# ou via https://dnschecker.org/#NS/solidarite-energetique.org
```

> ⚠️ **DNS hijacking Numericable/SFR** : certains FAI français interceptent transparentement le port 53 vers 8.8.8.8/1.1.1.1 et répondent avec leur propre redirection. Si `nslookup` montre un `*.numericable.fr` / `*.sdv.fr`, ce n'est PAS un échec de propagation — c'est ton FAI qui ment. Tester via VPN, DoH, ou téléphone en 4G.

**2. cPanel — ajouter le domaine**

cPanel → **Domains** → "Create A New Domain" :

| Champ | Valeur |
|---|---|
| Nom du nouveau domaine | `solidarite-energetique.org` |
| Sous-domaine système (auto) | (laisser la valeur générée) |
| **Racine du document** | **`public_html/paleo`** ⚠️ écraser la valeur par défaut, c'est le docroot de l'app Node |
| Compte FTP associé | décoché |

Si cPanel refuse "le répertoire est déjà utilisé", passer par **Aliases** (= Alias de domaine / Parked Domain) à la place — le résultat pour Passenger est identique.

**3. SSL — AutoSSL**

cPanel → **SSL/TLS Status** → cocher `solidarite-energetique.org` + `www.solidarite-energetique.org` → "Run AutoSSL". Attendre 5-10 min, puis vérifier :

```bash
curl -I https://solidarite-energetique.org
# attendu : HTTP/2 200, certificat Let's Encrypt valide
```

**4. Code — ajouter le mapping**

Éditer `paleo-app/src/utils/subsiteHost.js` :

```js
export const HOST_TO_SUBSITE_SLUG = {
    'paleo-h2o.org':              'paleo-h2o',
    'www.paleo-h2o.org':          'paleo-h2o',
    'solidarite-energetique.org': 'solidarite',          // ← nouvelle ligne
    'www.solidarite-energetique.org': 'solidarite',      // ← nouvelle ligne
};
```

⚠️ Le slug à droite doit correspondre **exactement** à la colonne `slug` dans la table `subsites` :

```bash
mysql -u madore_paleoadmin -p madore_paleo -e "SELECT slug, name FROM subsites"
```

**5. Build + déploiement**

```bash
# Upload du fichier modifié sur prod (ou fichier complet si plus de changements)
cd ~/public_html/paleo
source ~/nodevenv/public_html/paleo/*/bin/activate
npm run build
# cPanel → Setup Node.js App → Stop puis Start (PAS Restart, cf. piège #4)
```

**6. Vérifications**

Sur le nouveau domaine :
- [ ] `https://solidarite-energetique.org` → page d'accueil du sous-site (couleur primaire, header au nom du sous-site)
- [ ] `https://solidarite-energetique.org/frise` → URL **propre** (pas de `/#/site/...`), frise filtrée sur la catégorie du sous-site
- [ ] `https://solidarite-energetique.org/site/solidarite/frise` → **redirection automatique** vers `/frise` (canonicalisation)
- [ ] Refresh sur n'importe quelle sous-page → recharge sans 404 (testé le fallback SPA Express)
- [ ] (admin) Login → bouton "Gérer" → URL `/admin/published` propre

Sur le site principal (paleo-energetique.org / paleo.madore.projetsmmichamps.fr) :
- [ ] **Tout** continue de marcher (depuis 2026-05-XX, le site principal est aussi en BrowserRouter — fallback SPA déjà en place dans `server.js`)
- [ ] Liens externes legacy `#/site/solidarite/frise` réécrits au boot par le script inline dans `index.html` → fonctionnent toujours

### Fichiers touchés par cette feature

Pour mémoire, ce sont les fichiers à connaître si on doit débugger le routing multi-host :

| Fichier | Rôle |
|---|---|
| `src/utils/subsiteHost.js` | Map host→slug, helpers `getHostSubsiteSlug()` et `subsiteBasePath()` |
| `src/App.jsx` | Sélection du routeur (BrowserRouter si host dédié, sinon HashRouter) + catch-all canonicalisation `/site/:slug/*` → `/*` |
| `src/layouts/SubsiteLayout.jsx` | Lit le slug via `useParams().slug ?? getHostSubsiteSlug()`. NavLinks via `subsiteBasePath()` |
| `src/pages/SubsiteHome.jsx`, `SubsiteAdmin.jsx` | Slug via `useSubsite()` (depuis le contexte), liens via helper |
| `src/pages/Create.jsx` | Fallback slug via host pour `/create` sur subsite host |
| `src/components/TimelineMode.jsx`, `src/pages/ManageCartels.jsx` | basePath de navigation via `subsiteBasePath()` |

### Pièges spécifiques au routing multi-host

**P1. Le slug map doit matcher la BDD à la lettre près**

Si tu mets `'h2o'` dans la map mais que le sous-site est `'paleo-h2o'` en BDD, l'API `/api/subsites/h2o` renvoie 404 → page "Sous-site introuvable" sur le domaine dédié. Toujours vérifier avec un `SELECT slug FROM subsites` avant d'ajouter une entrée.

**P2. BrowserRouter exige le fallback SPA serveur**

Sur paleo-h2o.org/frise, le navigateur fait un GET `/frise` au serveur. Express doit retourner `index.html` pour que le SPA prenne le relais. C'est déjà géré par [server.js](server/server.js) (catch-all `app.get('*')` après `express.static`). **Ne pas supprimer ce fallback**, sinon refresh sur `/frise` → 404 Apache.

**P3. Liens cross-domain depuis le site principal**

Sur la landing page paleo-energetique, [`LandingPage.jsx`](src/pages/LandingPage.jsx) et [`SharedHeader.jsx`](src/components/SharedHeader.jsx) génèrent des liens vers `/site/<slug>` (route interne du BrowserRouter principal). Ces liens ouvrent le subsite **dans le même domaine** (`paleo-energetique.org/site/paleo-h2o`), pas sur le domaine dédié. C'est un choix UX volontaire (rester dans l'onglet courant), mais ce n'est pas canonique. Pour ouvrir le domaine dédié, il faudrait détecter si le slug a une entrée inverse dans `HOST_TO_SUBSITE_SLUG` et générer un `<a href="https://...">` plutôt qu'un `<Link to>`. À faire plus tard si besoin.

**P4. Pas de cookie/localStorage cross-domain**

`paleo-h2o.org` et `paleo-energetique.org` sont des origines différentes pour le navigateur → leurs localStorage/cookies sont isolés. Conséquence pratique : un admin loggé sur `paleo-energetique.org` n'est PAS automatiquement loggé sur `paleo-h2o.org` (et inversement). Si tu veux le login partagé, il faudra mettre en place du SSO ou un domaine racine partagé (pas prévu actuellement).

## Restauration après incident

Backup BDD avant toute migration SQL :

```bash
mysqldump -u madore_paleoadmin -p madore_paleo > ~/backups/paleo_$(date +%Y%m%d_%H%M).sql
```

Rollback `image_path` si la normalisation a foiré (réintroduit `images/...` pour les entrées qui n'ont pas le format `<timestamp>-<hash>`) :

```sql
UPDATE cartels
SET image_path = CONCAT('images/', SUBSTRING_INDEX(image_path, '/', -1))
WHERE image_path LIKE '/api/images/%'
  AND SUBSTRING_INDEX(image_path, '/', -1) NOT REGEXP '^[0-9]{13}-[0-9a-f]{8}\\.';
```

## Diagnostic rapide

Image qui ne charge pas :

```bash
# 1. Le fichier existe-t-il avec le bon nom ?
ls -la /home/madore/paleo-uploads/<nom_du_fichier>

# 2. Le process Node a-t-il la bonne UPLOADS_DIR ?
PID=$(pgrep -fu madore "node.*server" | head -1)
cat /proc/$PID/environ | tr '\0' '\n' | grep UPLOADS_DIR

# 3. Le symlink est-il en place ?
ls -la /home/madore/public_html/paleo/public/images
# → doit être un symlink vers /home/madore/paleo-uploads

# 4. Test direct de l'URL
curl -I https://paleo.madore.projetsmmichamps.fr/api/images/<nom_du_fichier>
```

Journal d'événements vide / emails muets :

```bash
# 1. Tables présentes ?
mysql -u madore_paleoadmin -p madore_paleo -e "SHOW TABLES LIKE 'event_%'"
# → doit afficher event_email_config + event_logs

# 2. Le dispatcher écrit-il en BDD ?
cd ~/public_html/paleo
source ~/nodevenv/public_html/paleo/*/bin/activate
node server/scripts/smoke_event_dispatcher.js
# → "1 résultat(s)" attendu. Si erreur SQL → cf. piège #6 (CAST AS JSON).

# 3. Le code en cours d'exécution est-il à jour ?
# Le smoke marche mais l'UI ne génère rien → cache ESM. Stop/Start cPanel (piège #4).

# 4. Vars MAIL_* propagées au worker ?
PID=$(pgrep -fu madore "node.*server" | head -1)
cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -E "^MAIL_"
# → doit afficher les 6 lignes MAIL_*. Si vides ou incomplètes : Stop/Start.
```

Voir aussi `server/EMAILS.md` pour le détail du système (configuration SMTP, types d'événements, troubleshooting mailer).

Domaine dédié sous-site qui ne marche pas (ex: `paleo-h2o.org` affiche une 404, une page blanche, ou le mauvais sous-site) :

```bash
# 1. DNS propagé ? Vérifier hors FAI (cf. DNS hijacking)
nslookup -type=NS paleo-h2o.org 8.8.8.8
# → doit afficher ns1.o2switch.net / ns2.o2switch.net
# OU via https://dnschecker.org/#NS/paleo-h2o.org

# 2. Apache route bien vers Passenger sur ce domaine ?
curl -I https://paleo-h2o.org
# → HTTP/2 200, Server: Apache + headers Passenger (X-Powered-By, etc.)

curl -s https://paleo-h2o.org/api/cartels | head -c 200
# → JSON de cartels. Si HTML / 404 : Apache ne route pas vers Node → vérifier
#   cPanel → Domains : le docroot du domaine doit être public_html/paleo

# 3. Le slug est-il correctement mappé côté JS ?
grep -A 4 HOST_TO_SUBSITE_SLUG paleo-app/src/utils/subsiteHost.js
# → la valeur à droite doit exister en BDD :
mysql -u madore_paleoadmin -p madore_paleo -e "SELECT slug FROM subsites"

# 4. Le fallback SPA fonctionne (refresh sur /frise ne donne pas 404) ?
curl -I https://paleo-h2o.org/frise
# → doit retourner 200 + Content-Type: text/html (pas 404)

# 5. Le build de prod contient bien la nouvelle map ?
grep -c "paleo-h2o" /home/madore/public_html/paleo/dist/assets/index-*.js
# → doit retourner > 0. Si 0 : npm run build pas refait après ajout au map.
```

## Contacts

- Hébergeur : o2switch (cPanel)
- Nom de domaine : `paleo.madore.projetsmmichamps.fr`
- User cPanel : `madore`
