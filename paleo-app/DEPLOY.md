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

## Redéploiement standard (mise à jour de code)

Depuis `~/public_html/paleo/` en SSH (après avoir uploadé les fichiers source modifiés via File Manager ou scp) :

```bash
source ~/nodevenv/public_html/paleo/*/bin/activate
npm install --omit=dev          # si nouvelles deps dans package.json
npm run build                   # régénère dist/
# cPanel → Setup Node.js App → Stop puis Start (PAS Restart, cf. piège #4)
```

Vérifier ensuite :
- Le site répond : `curl -I https://paleo.madore.projetsmmichamps.fr`
- L'API répond : `curl https://paleo.madore.projetsmmichamps.fr/api/cartels | head -c 200`
- Une image charge : ouvrir `https://paleo.madore.projetsmmichamps.fr/api/images/IMG_3510.jpg`

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

## Contacts

- Hébergeur : o2switch (cPanel)
- Nom de domaine : `paleo.madore.projetsmmichamps.fr`
- User cPanel : `madore`
