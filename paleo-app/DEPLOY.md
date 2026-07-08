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
| **Front** seul (`src/…`, locales, styles, i18n) | **Build** (régénère `paleo-app/dist/`) |
| **Back** seul (`server/…` : `server.js`, routes, contrôleurs, modèles, middlewares) | **Arrêter → Démarrer** (recharge le process Node) |
| **Front + back** (cas courant d'un correctif) | **Build PUIS Arrêter → Démarrer** |
| **Schéma SQL** (nouvelle migration) | migration phpMyAdmin **AVANT** le redémarrage (cf. § Migrations) |
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
   - **Build** si le front a changé (régénère `dist/`).
   - **Arrêter → Démarrer** si le back a changé (recharge le process).
   - Mixte (front + back) = **Build puis Arrêter → Démarrer**.
4. **Vérifications post-déploiement** (cf. § dédié).

## Migrations SQL (phpMyAdmin)

- **Pas de table de suivi** : chaque `server/migration_vNN_*.sql` est joué **à la main** via
  phpMyAdmin. Ils sont **idempotents** (test `INFORMATION_SCHEMA`) → rejouables sans risque.
- ⚠️ **Ordre impératif** : pour tout déploiement qui change le schéma, appliquer le `.sql`
  **AVANT** de démarrer le nouveau back (sinon les requêtes sur les nouvelles colonnes échouent).
  Les migrations récentes **ajoutent** des colonnes (rollback-safe : l'ancien code les ignore).
- **Comment** : phpMyAdmin (base de prod) → onglet **SQL** → coller le contenu du fichier `.sql`
  → **Exécuter** (ou **Importer** le fichier).
- **Dernière migration** : **v34** — `migration_v34_shop_item_versions.sql` ajoute la colonne
  `shop_items.versions` (boutique à variantes / options de paiement Stripe). À jouer avant de
  démarrer le back qui gère la boutique 3 niveaux.

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
