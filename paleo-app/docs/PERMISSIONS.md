# Modèle de permissions (v33)

> Source de vérité du modèle d'autorisation de l'app paléo. Mis en place par
> `migration_v33_permissions_v2.sql`. Voir aussi `server/middleware/auth.js`.

## Principe

Un compte = un `role` (libellé, **sans effet** sur l'autorisation) + des **capacités**
booléennes + un `home_subsite_id` (le **périmètre** du compte : `NULL` = site principal,
sinon un sous-site).

Toutes les capacités sont **scopées au périmètre du compte**. Le **superadmin**
(`can_manage_admin`) et l'**owner** (`can_manage_team`) disposent **implicitement** de
toutes les capacités dans leur périmètre — ce n'est pas un flag stocké mais la logique
des gardes (`auth.js`).

Les permissions sont portées par le **JWT** : un changement de droits prend effet à la
**prochaine connexion**.

## Les capacités

| Colonne | Libellé UI | Autorise | Périmètre |
|---|---|---|---|
| `can_manage_cartels` | Gérer les cartels | créer / éditer / brouillon / archive / **publier** + auto-traduire l'autre langue | cartels du périmètre |
| `can_export_cartels` | Exporter (langues du site) | exporter une sélection (PDF / images / archive) dans les langues déjà saisies | cartels du périmètre |
| `can_export_translated` | Exporter (autre langue) | export traduit à la volée vers une langue cible (frise traduite). **Inclut** `can_export_cartels` | cartels du périmètre |
| `can_manage_content` | Gérer les contenus | contenus hors cartels : partenaires, équipe « à propos » ; **au niveau principal** aussi presse, missions, prestations, boutique | contenus du périmètre |
| `can_manage_admin` | Administration générale | comptes, réglages, sous-sites (CRUD), **modération des soumissions**, logs/emails, import | global |
| `can_manage_team` | Owner / admin de sous-site | gérer les comptes & la config de son sous-site ; accorder les capacités à ses membres ; dispose implicitement des 4 capacités sur son sous-site | son sous-site |

### Champs structurels
- `home_subsite_id` — périmètre du compte (`NULL` = principal). Combiné à `can_manage_team` = owner de ce sous-site.
- `role` — `contributor`/`editor`/`admin`/`superadmin` : **purement cosmétique**, aucun garde ne le lit.

## Règle des gardes (serveur)

- **Capacité** (`requireManageCartels`, `requireExport`, `requireExportTranslated`,
  `requireTranslateFields`) : passe si `can_manage_admin` **ou** `can_manage_team` **ou**
  la capacité explicite. Le **périmètre exact** (quels cartels / contenus) est ensuite
  borné dans le contrôleur via `home_subsite_id`.
- **Contenu principal** (`requireManageContentMain`) : superadmin **ou** compte rattaché
  au principal (`home_subsite_id` NULL) avec `can_manage_content`. Un owner de sous-site
  n'y a **pas** accès (son périmètre est son sous-site ; il gère ses contenus via les
  routes scopées `/s/:slug/*`).
- **Administration** (`requireAdmin`) : `can_manage_admin` strict.
- **Export scopé** : `/export`, `/export/image-check`, `/translate/bulk` ne renvoient que
  les cartels du périmètre du compte (`resolveCartelExportScope` / `cartelMatchesExportScope`
  dans `middleware/tenant.js`). Les ids hors périmètre sont silencieusement écartés.

## Visiteurs non connectés
La création de cartel reste ouverte aux anonymes : leur soumission part toujours en
`pending_review` (modération). C'est le « niveau contributeur » — inutile d'avoir un
compte connecté non-publieur.

## Migration depuis l'ancien modèle
`migration_v33` ajoute les 4 nouvelles colonnes et **backfille** depuis les anciennes :
`can_manage_cartels = (can_create_cartel OR can_publish_cartel)` ;
`can_export_cartels = can_export_translated = can_export_cartel`. Les superadmins/owners
héritent des capacités via les gardes (pas de backfill). Les anciennes colonnes
(`can_create_cartel`, `can_publish_cartel`, `can_create_subsite`, `can_export_cartel`)
restent en base, ignorées, jusqu'à leur suppression par un futur `v34` (rollback safe).

Un **shim de compatibilité** dans `auth.js` dérive les capacités v33 des anciens claims
si un token émis avant le déploiement est encore valide → pas de session cassée.
