# Notifications par email — guide de déploiement et d'utilisation

Ce document explique le système de **journal d'événements** et de **notifications email** ajouté en v8 (migration `migration_v8_event_logs.sql`). Il couvre l'architecture, la configuration SMTP, le déploiement en prod, et l'usage côté admin.

---

## 1. Vue d'ensemble

Chaque action métier importante (création / modification / suppression de cartel, utilisateur, sous-site, partenaire, catégorie, atelier) est journalisée en BDD dans la table `event_logs`. Pour chaque type d'événement, un **superadmin** peut activer l'envoi automatique d'un email vers le destinataire de son choix, via la page `Admin → Journal d'événements → Configuration emails`.

Concrètement :

```
[contrôleur métier] ─→ dispatchEvent({ type, ... })
                         │
                         ├─→ INSERT dans event_logs       (toujours)
                         └─→ if event_email_config[type].enabled:
                               sendMail(...)              (asynchrone, fire-and-forget)
```

Si le SMTP n'est pas configuré, **rien ne plante** : les événements continuent d'être journalisés, mais aucun email ne part. Un warning unique est imprimé dans la console serveur.

---

## 2. Composants

| Fichier | Rôle |
|---|---|
| `migration_v8_event_logs.sql` | Crée les 2 tables et seed les types d'événements (28 à l'origine en v8 ; **30 aujourd'hui** avec les ajouts v22/v23, cf. § 5). Note : ce fichier a depuis été fusionné dans `schema_mysql.sql` (seed canonique). |
| `models/EventLog.js` | Insertion + lecture filtrable du journal |
| `models/EventEmailConfig.js` | Lecture/upsert de la config email par type |
| `services/mailer.js` | Wrapper nodemailer (no-op si SMTP non configuré) |
| `services/eventDispatcher.js` | Point d'entrée unique : `dispatchEvent({ type, req, ... })` |
| `controllers/eventLogController.js` | Routes admin de consultation/configuration |
| `routes/index.js` | Expose `/api/logs/*` (superadmin only) |
| `src/pages/AdminLogs.jsx` | UI : journal + configuration emails |

---

## 3. Variables d'environnement

À renseigner dans le `.env` côté serveur. **Si ces variables sont absentes, l'app fonctionne mais aucun email ne part.**

```bash
# Hôte SMTP
MAIL_SMTP_HOST=mail.atelier21.org

# Port (587 = STARTTLS, 465 = SSL direct)
MAIL_SMTP_PORT=465

# true si port 465, false si 587 (souvent)
MAIL_SMTP_SECURE=true

# Identifiants de la boîte qui ENVOIE
MAIL_SMTP_USER=hello@atelier21.org
MAIL_SMTP_PASS=mot_de_passe_de_la_boite

# Adresse "From" affichée dans les mails (peut différer du USER)
MAIL_FROM="Paléo-Énergétique <hello@atelier21.org>"
```

### 3.1 Cas o2switch (boîte cPanel)

Si tu utilises une adresse `hello@atelier21.org` créée dans **cPanel → Email Accounts** :

```bash
MAIL_SMTP_HOST=mail.atelier21.org   # ou le nom du serveur o2switch (cf. cPanel > Connect Devices)
MAIL_SMTP_PORT=465
MAIL_SMTP_SECURE=true
MAIL_SMTP_USER=hello@atelier21.org
MAIL_SMTP_PASS=...                  # mot de passe créé dans cPanel
MAIL_FROM="Paléo-Énergétique <hello@atelier21.org>"
```

Pour récupérer l'hôte exact : **cPanel → Email Accounts → "Connect Devices"** sur ta boîte. o2switch affiche les paramètres SMTP/IMAP exacts à utiliser.

### 3.2 Cas Gmail / Google Workspace

Si l'équipe utilise Gmail (`hello@atelier21.org` derrière Workspace), il faut un **mot de passe d'application** (le mot de passe normal ne marche pas avec SMTP) :

1. Aller sur https://myaccount.google.com/apppasswords (compte concerné)
2. Créer un mot de passe d'application "Mail" pour "Paléo"
3. Copier les 16 caractères générés

Puis dans le `.env` :

```bash
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_SECURE=false
MAIL_SMTP_USER=hello@atelier21.org
MAIL_SMTP_PASS=xxxx_xxxx_xxxx_xxxx   # mot de passe d'application, sans espaces
MAIL_FROM="Paléo-Énergétique <hello@atelier21.org>"
```

> **Pré-requis Workspace** : la 2FA doit être activée sur le compte pour pouvoir générer un mot de passe d'application.

---

## 4. Déploiement

### 4.1 Premier déploiement (prod o2switch)

```bash
# 1. Récupérer la nouvelle version
git pull

# 2. Installer la dépendance nodemailer
npm install

# 3. Appliquer la migration sur la base de prod
node server/scripts/run_migration.js server/migration_v8_event_logs.sql

# 4. Renseigner les variables MAIL_* dans le .env
nano .env

# 5. Redémarrer l'app (Passenger / cPanel Node.js App)
#    → Setup Node.js App → "Restart"
```

> Les nouvelles tables sont créées avec `CREATE TABLE IF NOT EXISTS`, donc la migration est **idempotente** — la rejouer n'écrase rien.

### 4.2 Vérification post-déploiement

```bash
# 1. Vérifier que les tables existent et que le seed est en place
node server/scripts/verify_event_tables.js
# Attendu : 30 types seedés, 0 entrées dans event_logs

# 2. Smoke test du dispatcher (insertion + lecture + cleanup)
node server/scripts/smoke_event_dispatcher.js
# Attendu : "1 résultat(s)" puis "0 (devrait être identique à avant)"
```

Si l'app est démarrée et qu'un superadmin se connecte, l'événement `cartel.published` (ou autre) est journalisé à chaque action. Tu peux vérifier dans **Admin → Journal d'événements → Journal**.

### 4.3 Tester l'envoi d'email

1. Une fois `MAIL_*` renseigné, va sur **Admin → Journal d'événements → Configuration emails**
2. Pour un type peu critique (ex : `cartel.draft_created`), coche `Email`, mets ton adresse perso comme `Destinataire`, et clique `Enregistrer`
3. Crée un brouillon de cartel depuis l'app
4. Vérifie ta boîte. Le sujet est `[Paléo] Cartel / draft created — <titre>`

Si rien n'arrive : voir [§ 7 Troubleshooting](#7-troubleshooting).

---

## 5. Liste des types d'événements

> **56 types au total** : 28 seedés à l'origine (v8) + `mission_application.created` (v22) + `contact_message.created` (v23) + **26 ajoutés en v30** (audit « logs pour toutes les actions » : auth/sécurité, réglages, import, CRUD de contenu, notes). Liste canonique = seed de `event_email_config` dans `schema_mysql.sql`.

| Scope | Type | Émis par |
|---|---|---|
| **cartel** | `cartel.created` | création générique |
| | `cartel.draft_created` | création en brouillon |
| | `cartel.published` | publication directe (site principal) |
| | `cartel.subsite_published` | publication directe (sous-site) |
| | `cartel.updated` | modification (hors changement de statut majeur) |
| | `cartel.deleted` | suppression |
| | `cartel.submission_pending` | **soumission anonyme** via formulaire public |
| | `cartel.submission_approved` | (réservé : non émis automatiquement, à brancher si besoin) |
| | `cartel.submission_rejected` | (idem) |
| | `cartel.subsite_submitted` | un sous-site demande publication sur le site principal |
| | `cartel.subsite_approved` | superadmin approuve la soumission sous-site |
| | `cartel.subsite_rejected` | superadmin rejette la soumission sous-site |
| **subsite** | `subsite.created` / `.updated` / `.deleted` | CRUD sous-sites (superadmin) |
| **user** | `user.created` | création de compte global |
| | `user.updated` | modification (permissions, rôle…) |
| | `user.deleted` | suppression |
| | `user.assigned_subsite` | ajout d'un membre à un sous-site (équipe) |
| **partner** | `partner.created` / `.updated` / `.deleted` | CRUD partenaires |
| **category** | `category.created` / `.updated` / `.deleted` | CRUD catégories |
| **workshop** | `workshop.created` / `.updated` / `.deleted` | CRUD ateliers (`.updated` couvre aussi ajout/retrait de cartels) |
| **mission_application** | `mission_application.created` | candidature soumise via le formulaire public `/participer` (ajouté en v22) |
| **contact_message** | `contact_message.created` | message envoyé via le formulaire public `/contact` (ajouté en v23) |
| **auth** _(v30)_ | `auth.login` | connexion réussie |
| | `auth.login_failed` | échec de connexion (email inconnu ou mot de passe incorrect ; `payload.reason`) |
| | `auth.locked_out` | blocage anti-force-brute (seuil d'IP franchi, `loginGuard`) — émis une fois par fenêtre |
| | `auth.register` | inscription (seulement si `ALLOW_PUBLIC_REGISTRATION="true"`) |
| **user** _(v30, déjà émis depuis le durcissement)_ | `user.password_changed` | l'utilisateur change son propre mot de passe |
| | `user.password_reset` | un admin réinitialise le mot de passe d'un compte |
| **setting** _(v30)_ | `setting.updated` | modification des réglages (`payload.changed` ; valeurs des clés API masquées) |
| **cartel** _(v30)_ | `cartel.imported` | import ZIP de masse (un événement de synthèse par import) |
| **event_email_config** _(v30)_ | `event_email_config.updated` | modification de la config des notifications email |
| **mission** _(v30)_ | `mission.created` / `.updated` / `.deleted` | CRUD des missions (`/participer`) |
| **press_article** _(v30)_ | `press_article.created` / `.updated` / `.deleted` | CRUD des articles de presse (`/presse`) |
| **prestation** _(v30)_ | `prestation.created` / `.updated` / `.deleted` | CRUD des prestations (`/prestations`) |
| **shop_item** _(v30)_ | `shop_item.created` / `.updated` / `.deleted` | CRUD de la boutique (`/ouvrages`) |
| **team_member** _(v30)_ | `team_member.created` / `.updated` / `.deleted` | CRUD des membres d'équipe (page « À propos », scopé par sous-site) |
| **cartel_note** _(v30)_ | `cartel_note.created` / `.deleted` | notes internes admin sur un cartel |

> **Note sur les deux files de modération** : `cartel.submission_pending` (visiteur anonyme via le formulaire public) et `cartel.subsite_submitted` (sous-site → site principal) sont **distincts**. Ne pas les confondre — voir mémoire interne `project_submissions_vs_pending`.

---

## 6. Utilisation par l'admin

### 6.1 Consulter le journal

`Admin → Journal d'événements → Journal`

- Filtre par **type** (select des types présents dans la BDD)
- Filtre par **résumé** (recherche textuelle : titre cartel, email…)
- Filtre par **date "depuis"**
- Pagination 100/page

Chaque ligne montre : date, type, acteur (email si connecté, "anonyme" sinon), résumé, ID cible (tronqué).

### 6.2 Configurer les emails par type

`Admin → Journal d'événements → Configuration emails`

Pour chaque type, 4 options :

| Champ | Effet |
|---|---|
| **Email** (case à cocher) | Active/désactive l'envoi pour ce type |
| **Destinataire** | Adresse email cible (vide = pas d'envoi même si "Email" est coché) |
| **Sujet préfixe** | Préfixe ajouté au sujet du mail. Défaut : `[Paléo]` |
| **Spam** | Ajoute l'en-tête `X-Spam-Flag: YES` — utile pour créer une règle de tri côté boîte de réception |

Cliquer **Enregistrer** sur la ligne concernée pour appliquer.

### 6.3 Pourquoi le marquage "Spam" ?

Certains types peuvent être bruyants (ex : `cartel.updated` sur un site très actif). Plutôt que de désactiver complètement la notification, on peut la marquer comme spam : l'email arrive quand même mais avec un en-tête `X-Spam-Flag: YES` qui permet de le filtrer automatiquement vers un dossier dédié (règle Gmail, filtre Outlook, etc.). On garde la traçabilité, on protège la boîte de réception.

---

## 7. Troubleshooting

### 7.1 Aucun email n'arrive

1. **Le SMTP est-il configuré ?** Lance `node -e 'console.log(process.env.MAIL_SMTP_HOST)'` côté serveur. Si vide, le `.env` n'est pas chargé ou la variable manque.
2. **Le warning au démarrage** : si tu vois `[mailer] SMTP non configuré` dans les logs serveur, c'est qu'il manque `MAIL_SMTP_HOST`, `MAIL_SMTP_USER` ou `MAIL_SMTP_PASS`.
3. **Le type est-il activé ?** Sur la page de config, vérifie que la case `Email` est cochée ET que `Destinataire` n'est pas vide.
4. **Vérifie les logs serveur** : si l'envoi échoue, on imprime `[mailer] Échec envoi : <message>`. Causes courantes :
   - Authentification refusée (`Invalid login`) → mauvais mot de passe, ou Gmail sans mot de passe d'application
   - Connexion refusée → mauvais host/port, ou pare-feu o2switch
   - Self-signed cert → ajoute `MAIL_SMTP_SECURE=true` si port 465

### 7.2 Les événements ne sont pas journalisés

1. Vérifie que la migration est bien appliquée : `node server/scripts/verify_event_tables.js`
2. Si la table n'existe pas → relance `run_migration.js`
3. Si les actions métier ne génèrent pas de logs : redémarre l'app (les imports `eventDispatcher` ne sont chargés qu'au boot)

### 7.3 La page `/app/admin/logs` renvoie 403

C'est superadmin only (`can_manage_admin`). Vérifie le rôle de l'utilisateur connecté dans la table `users`.

### 7.4 Trop d'emails

Soit désactive le type concerné dans la config, soit coche `Spam` pour qu'ils partent vers un dossier filtré au lieu de la boîte principale.

---

## 8. Étendre le système

### 8.1 Ajouter un nouveau type d'événement

1. Émettre l'événement depuis le contrôleur concerné :
   ```js
   import { dispatchEvent } from '../services/eventDispatcher.js';
   dispatchEvent({
     type: 'mon_scope.mon_action',
     req,
     targetId: entity.id,
     summary: entity.name,
     payload: { /* détails JSON sérialisables */ },
   }).catch(() => {});  // fire-and-forget
   ```
2. Seeder la config email (sinon le type est invisible côté UI tant que personne ne l'a déclenché) :
   ```sql
   INSERT IGNORE INTO event_email_config (type) VALUES ('mon_scope.mon_action');
   ```
3. Pas besoin de toucher l'UI : la page de config liste automatiquement tous les types présents dans `event_email_config`, et le journal liste tous les types présents dans `event_logs`.

### 8.2 Modèle de payload recommandé

```js
{
  // Toujours utile pour audit
  status: 'published', previousStatus: 'draft',

  // Pour user.updated, capturer le diff
  changed: { role: 'editor', can_publish_cartel: true },

  // Éviter : mots de passe, hashes, données personnelles non nécessaires
}
```

---

## 9. Sécurité

- Routes `/api/logs/*` strictement superadmin (`requireAdmin`)
- Le dispatcher est **fire-and-forget** : si la BDD ou le SMTP plante, l'action métier réussit quand même (aucune corruption de données possible côté metier)
- Aucune donnée sensible n'est stockée dans `payload` (pas de hash, pas de mots de passe — uniquement diffs de permissions, slugs, statuts)
- Les emails contiennent l'`actor_email`, le `summary` et le `payload` sérialisé. **À surveiller** si tu actives des types qui ont des données personnelles dans le résumé (ex : `cartel.submission_pending` peut contenir le titre d'un cartel soumis)

---

## 10. Checklist déploiement prod

- [ ] `git pull` la version contenant `migration_v8_event_logs.sql`
- [ ] `npm install` (ajoute `nodemailer`)
- [ ] `node server/scripts/run_migration.js server/migration_v8_event_logs.sql`
- [ ] `node server/scripts/verify_event_tables.js` (30 types seedés)
- [ ] Renseigner `MAIL_SMTP_*` + `MAIL_FROM` dans le `.env` de prod
- [ ] Redémarrer l'app (Passenger restart sur o2switch)
- [ ] `node server/scripts/smoke_event_dispatcher.js` (insertion + cleanup OK)
- [ ] Se connecter en superadmin → `Admin → Journal d'événements → Configuration emails` → activer un type test → vérifier la réception
