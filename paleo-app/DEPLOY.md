# Déploiement Paleo Cartels — o2switch

Guide complet de redéploiement et points critiques à vérifier. Mis à jour après l'incident image_path du 2026-04-21.

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

⚠️ Toute modif des env vars nécessite un **Restart** complet via cPanel (le bouton Restart, pas juste un touch de `tmp/restart.txt`).

## Redéploiement standard (mise à jour de code)

Depuis `~/public_html/paleo/` en SSH :

```bash
git pull origin main
npm install --omit=dev
npm run build
mkdir -p tmp && touch tmp/restart.txt
```

Ou via le `deploy.sh` fourni.

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

## Contacts

- Hébergeur : o2switch (cPanel)
- Nom de domaine : `paleo.madore.projetsmmichamps.fr`
- User cPanel : `madore`
