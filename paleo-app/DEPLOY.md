# Déploiement Paléo — runbook Infomaniak

> **Runbook de REDÉPLOIEMENT** (mise à jour d'une prod déjà en place).
> Pour le **setup initial** (domaines, DNS, SSL, accès SSH, création `.env` / base),
> voir **[HEBERGEMENT-INFOMANIAK.md](HEBERGEMENT-INFOMANIAK.md)**.
>
> 🗄️ L'ancien runbook **o2switch / cPanel / Passenger** a été retiré le 2026-07-08 :
> la prod tourne sur **Infomaniak** depuis le 2026-07-02. Les postmortems o2switch
> (symlink `public/images`, cache ESM Phusion, Stop/Start cPanel) **ne s'appliquent plus**.

## En bref — la prod

- App **Node/Express + React/Vite**, **Node 24**, **port 3001** (`process.env.PORT || 3001`).
- Repo `github.com/JomeiYouma/Paleo-pedia`, branche **`main`**, app dans le sous-dossier **`paleo-app/`**.
- Racine sur le serveur : **`/srv/customer/sites/v2.atelier21.org/`** (racine du repo).
- Console SSH = carte **Node.js** : `57-113333.ssh.hosting-ik.com`, home `/srv/customer`
  (⚠️ **pas** la console PHP/Apache de l'ancien WP).
- Config du site Node (Manager) : build `cd paleo-app && npm install && npm run build` · exec `cd paleo-app && npm run start`.
- `.env` : **`paleo-app/.env`** (gitignoré → **survit aux `git pull`**). DB : **`e44qd.myd.infomaniak.com`** (MariaDB, **pas** `localhost`).
- Uploads persistants : **`/srv/customer/paleo-uploads`** (hors arbre déployé, **pas de symlink**).

## 🔑 La règle d'or : Build ≠ git pull

Le bouton **Build** du Manager rebuild le code **déjà présent** — il ne récupère **PAS**
les nouveaux commits. Pour déployer du nouveau code : **`git pull` en SSH**, PUIS Build / redémarrage.

| Ce qui a changé | Action (après `git pull`) |
|---|---|
| **Front** seul (`src/…`, locales, styles, i18n) | **Build PUIS Arrêter → Démarrer** (cf. ⚠️ ci-dessous) |
| **Back** seul (`server/…` : `server.js`, routes, contrôleurs, modèles, middlewares) | **Arrêter → Démarrer** (recharge le process Node) |
| **Front + back** (cas courant d'un correctif) | **Build PUIS Arrêter → Démarrer** |
| **Schéma SQL** (nouvelle migration) | migration phpMyAdmin **AVANT** le redémarrage (cf. § Migrations) |

> ⚠️ **Un Build sans redémarrage = site blanc.** `server.js` lit `dist/index.html` **une seule
> fois au démarrage** et le garde en mémoire. Le Build remplace les fichiers `dist/assets/*` (noms
> hachés) : le process encore en vie sert l'ancien `index.html`, qui pointe vers des JS/CSS
> supprimés → page blanche pour tout le monde. **Toujours enchaîner Arrêter → Démarrer après un
> Build.** (Incident du 2026-10-16.)
| **Nouvelle variable `.env`** | éditer `paleo-app/.env` puis **Arrêter → Démarrer** |

> Le Build lance `npm install`, donc une **nouvelle dépendance** dans `package.json` est
> installée au Build. En cas de doute, relancer un Build.

## Séquence standard de redéploiement

1. **(si migration)** Appliquer le(s) `.sql` en phpMyAdmin — cf. § Migrations.
2. **SSH** (carte Node.js) :
   ```bash
   cd /srv/customer/sites/v2.atelier21.org
   git pull origin main
   ```
3. **Manager Infomaniak → site Node.js** :
   - **Build** si le front a changé (régénère `dist/`), **toujours suivi de Arrêter → Démarrer**.
   - **Arrêter → Démarrer** seul si seul le back a changé (recharge le process).
4. **Vérifications post-déploiement** (cf. § dédié).

## Savoir si la prod est à jour (SSH seul)

```bash
cd /srv/customer/sites/v2.atelier21.org
git status --short                       # attendu : ' M paleo-app/package-lock.json' (réécrit par le Build, sans gravité)
git fetch origin
git --no-pager log --oneline HEAD..origin/main   # vide = code à jour
git --no-pager diff --stat HEAD origin/main -- paleo-app/src paleo-app/server paleo-app/package.json
cd paleo-app
git --no-pager log -1 --format='commit en place : %h %ci'
ls -l --time-style=full-iso dist/index.html      # build : doit être POSTÉRIEUR au commit (attention, heure en UTC)
curl -sI https://paleo-energetique.org | head -1
```

- `--no-pager` évite que `git` ouvre un pager (`(END)` en bas d'écran → `q` pour sortir).
- Chaque nouvelle connexion SSH repart de `~` : toujours refaire le `cd`.
- Le diff indique quoi faire : `src/` → Build + redémarrage, `server/` → redémarrage, nouveau
  `migration_v*.sql` → migration (cf. § Migrations, vérification incluse).
- **Build en SSH** : la console est limitée à ~512 Mo, `npm run build` y plante souvent
  (`JavaScript heap out of memory`). Ne jamais builder directement dans `dist/` (Vite le vide au
  démarrage → site cassé si le build échoue). Builder à part, puis basculer seulement si
  `✓ built in …` s'affiche :
  ```bash
  cd /srv/customer/sites/v2.atelier21.org/paleo-app
  rm -rf dist.new
  GOMAXPROCS=1 NODE_OPTIONS=--max-old-space-size=1024 npx vite build --outDir dist.new --emptyOutDir
  rm -rf dist.new/images && rm -rf dist.old && mv dist dist.old && mv dist.new dist
  ```
  puis **Arrêter → Démarrer** dans le Manager (cf. ⚠️ plus haut). Le Build du Manager reste préférable.

**Limite** : le process Node tourne dans le Node.js Builder, **pas** dans le conteneur de la console
SSH (`ps` ne le voit pas). Impossible donc de vérifier ou de faire le redémarrage du back en SSH :
**Arrêter → Démarrer reste à faire dans le Manager.** Pour contrôler que le nouveau back tourne,
tester dans l'interface une fonctionnalité du dernier commit back.

## Migrations SQL (phpMyAdmin)

- **Pas de table de suivi** : chaque `server/migration_vNN_*.sql` est joué **à la main** via
  phpMyAdmin. Ils sont **idempotents** (test `INFORMATION_SCHEMA`) → rejouables sans risque.
- ⚠️ **Ordre impératif** : pour tout déploiement qui change le schéma, appliquer le `.sql`
  **AVANT** de démarrer le nouveau back (sinon les requêtes sur les nouvelles colonnes échouent).
  Les migrations récentes **ajoutent** des colonnes (rollback-safe : l'ancien code les ignore).
- **Comment** : phpMyAdmin (base de prod) → onglet **SQL** → coller le contenu du fichier `.sql`
  → **Exécuter** (ou **Importer** le fichier).
- **Sans phpMyAdmin** (SSH seul) : depuis `paleo-app/`, le script lit `paleo-app/.env` et joue
  le fichier sur la base de prod :
  ```bash
  cd /srv/customer/sites/v2.atelier21.org/paleo-app
  node server/scripts/run_migration.js server/migration_vNN_xxx.sql
  ```
- **Dernière migration** : **v36** — `migration_v36_cartel_archived_from.sql` ajoute la colonne
  `cartels.archived_from` (statut d'origine d'un cartel archivé). Les précédentes :
  v35 (`event_email_config` : types `shop_item.checkout_click`, `cartel.subsite_withdrawn`,
  `partner.site_selection_updated`), v34 (colonne `shop_items.versions`, boutique à variantes).
- **Vérifier en SSH ce qui est appliqué** (v34 → v36 ; ajouter une ligne à chaque nouvelle migration) :
  ```bash
  cd /srv/customer/sites/v2.atelier21.org/paleo-app
  node --input-type=module <<'EOF'
  import 'dotenv/config';
  import mysql from 'mysql2/promise';
  const c = await mysql.createConnection(process.env.DATABASE_URL || {
    host: process.env.DB_HOST, port: +(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  const col = async (t, k) => (await c.query(
    "SELECT COUNT(*) n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?", [t, k]))[0][0].n > 0;
  const [[ev]] = await c.query("SELECT COUNT(*) n FROM event_email_config WHERE type IN ('shop_item.checkout_click','cartel.subsite_withdrawn','partner.site_selection_updated')");
  console.log('v34 shop_items.versions     :', await col('shop_items', 'versions') ? 'OK' : 'MANQUANTE');
  console.log('v35 types event_email_config:', ev.n === 3 ? 'OK' : `MANQUANTE (${ev.n}/3)`);
  console.log('v36 cartels.archived_from   :', await col('cartels', 'archived_from') ? 'OK' : 'MANQUANTE');
  await c.end();
  EOF
  ```
  Coller le bloc **en entier** jusqu'à la ligne `EOF` (sinon le shell reste sur une invite `>` : Ctrl+C).

## Vérifications post-déploiement

```bash
curl -I https://paleo-energetique.org
curl -s https://paleo-energetique.org/api/cartels | head -c 200
```

Côté navigateur (**navigation privée**, Ctrl+F5 pour éviter un `index.html` en cache) :

- [ ] Accueil, `/boutique`, `/conditions-generales-vente`, `/mentions-legales` s'affichent.
- [ ] **Frise** : cartel au hasard à l'arrivée ; bouton **« Explorer la Frise »** → nouveau tirage.
- [ ] Une **image** charge : `/api/images/<un fichier existant>`.
- [ ] (superadmin) `/app/admin/logs` : les événements récents apparaissent.
- [ ] (si migration boutique) créer un **article test** dans Admin → Boutique — valide la colonne `versions`.

## Rollback

- **Code** :
  ```bash
  cd /srv/customer/sites/v2.atelier21.org
  git log --oneline -5
  git reset --hard <sha_stable>     # ou : git revert <sha>
  ```
  puis **Build + Arrêter → Démarrer**.
- **BDD** : faire un **backup AVANT toute migration** — phpMyAdmin → *Exporter* la base
  (ou `mysqldump -h e44qd.myd.infomaniak.com -u <user> -p <base> > backup_AAAAMMJJ.sql`).

## Pièges encore valables (indépendants de l'hébergeur)

### MariaDB ≠ MySQL — pas de `CAST(? AS JSON)`
Infomaniak = **MariaDB**. Le type JSON y est un alias de LONGTEXT ; `CAST(... AS JSON)`
(extension MySQL 8) **échoue**. Ne jamais l'utiliser : passer la string JSON directement dans
la colonne. (Bug corrigé en v8 sur `EventLog.js` ; la colonne boutique `versions` est LONGTEXT
pour la même raison, sérialisée/parsée côté app.)

### image_path — format legacy `images/...`
Deux formats en base : ✅ `/api/images/<ts>-<hash>.ext` (marche partout) et ❌ `images/<name>.ext`
(relatif, cassé hors homepage). Vient d'imports legacy. Normaliser après un import massif :
```sql
START TRANSACTION;
UPDATE cartels
SET image_path = CONCAT('/api/images/', SUBSTRING_INDEX(image_path, '/', -1))
WHERE image_path LIKE 'images/%';
SELECT COUNT(*) FROM cartels WHERE image_path LIKE 'images/%';  -- doit retourner 0
COMMIT;
```

### Routing multi-host
- Le mapping host → sous-site est dans `src/utils/subsiteHost.js` (`HOST_TO_SUBSITE_SLUG`). Le slug
  à droite doit exister **à la lettre** dans la table `subsites` (sinon 404 « sous-site introuvable »).
  Après ajout d'un domaine dédié, un **Build** est requis (la map part dans le bundle JS).
- Les hosts dédiés (BrowserRouter) exigent le **fallback SPA serveur** (`app.get('*')` dans
  `server.js`) — ne pas le retirer, sinon un refresh sur `/frise` renvoie une 404.
- `localStorage` / session = **par origine** : être connecté sur `paleo-pedia.org` est indépendant
  de `paleo-energetique.org` (même base/API, sessions séparées).

Détail complet des domaines, DNS et redirections : **[HEBERGEMENT-INFOMANIAK.md](HEBERGEMENT-INFOMANIAK.md)**.

## Diagnostic rapide

**L'app ne démarre pas** → la lancer à la main pour voir l'erreur en clair :
```bash
cd /srv/customer/sites/v2.atelier21.org/paleo-app
node server/server.js     # Ctrl+C une fois le diagnostic fait
```
Causes fréquentes : `JWT_SECRET` absent du `.env` (**refus de boot en prod**) · DB injoignable
(vérifier `DB_HOST=e44qd.myd.infomaniak.com`, pas `localhost`) · dépendance manquante (relancer un Build).

**Une image ne charge pas** → vérifier le fichier dans `/srv/customer/paleo-uploads/`, la variable
`UPLOADS_DIR` dans `.env`, puis `curl -I https://…/api/images/<fichier>`.

**Le nouveau code ne prend pas** → rappel de la règle d'or : le **Build** ne fait pas de `git pull`,
et il ne recharge pas le **back** (il faut **Arrêter → Démarrer**).
