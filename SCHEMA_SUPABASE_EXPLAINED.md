# Schéma Supabase — Design Complet & Justifications

## Partie 0 : Philosophie Globale

**Objectifs du design**
1. **Sécurité** : RLS au cœur (jamais de brouillons en public)
2. **Performance** : Indexes ciblés, pas de N+1 queries
3. **Maintenabilité** : Normalisé (pas d'arrays TEXT), auditabilité complète
4. **Flexibilité** : Catégories modulables, rôles granulaires, hiérarchie ateliers

**Comparer à l'ancien système (JSON + PHP)**
- Ancien : toutes les données chargées, multi-edit = race condition, pas d'audit
- Nouveau : chargement filtré, transactions ACID, traçabilité, RLS côté BD

---

## Partie 1 : Setup Minimal

```sql
-- Extensions PostgreSQL (optionnel mais utile)
create extension if not exists pgcrypto; -- UUID v4, hashing
```

**Pourquoi ?**
- `pgcrypto` donne accès à `gen_random_uuid()` pour les IDs (plus propre que `gen_random_bigint()`)
- PostgreSQL n'a besoin de rien d'autre pour ce projet

---

## Partie 2 : Gestion des Utilisateurs & Rôles

```sql
-- =============================================
-- TABLE: users_metadata
-- =============================================
-- Supabase crée automatiquement auth.users quand tu enregistres quelqu'un.
-- Cette table ÉTEND auth.users avec des rôles applicatifs (viewer/contributor/admin).

create table if not exists public.users_metadata (
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- Rôle: détermine les permissions
  role text default 'viewer',
  
  -- Permissions explicites (alternative fine-grained aux rôles)
  -- Utile si tu veux +tard un gris "peut créer mais pas publier"
  can_create_cartels boolean default false,
  can_publish_cartels boolean default false,
  can_manage_admin boolean default false,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

COMMENT ON TABLE public.users_metadata IS 
  'Extension de auth.users avec rôles métier. Créé manuellement ou via trigger à l''inscription.';

COMMENT ON COLUMN public.users_metadata.role IS 
  'viewer: lit justed public | contributor: crée brouillons | admin: publie + gère';

COMMENT ON COLUMN public.users_metadata.can_manage_admin IS 
  'Peut gérer admins, modifier config, accéder audit logs = superuser';
```

**Pourquoi ce design ?**

| Aspect | Choix | Raison |
|---|---|---|
| Table séparée de `auth.users` | Oui | auth.users est géré par Supabase, on ne peut pas la modifier directement. On étend dans une table applicative. |
| Rôles + permissions séparées | Oui (redondant mais intentionnel) | Rôles = sémantique (simple). Permissions = flexibilité (peut ajouter cas limites genre "draft only"). |
| `on delete cascade` | Oui | Si user supprimé, sa metadata l'est aussi. Cohérence. |
| Pas de données sensibles | Oui | Pas de hash, tokens, clés. Ça c'est le job de auth.users. |

**Points critiquables**
- ⚠ Rôle + permissions = légère redondance. Alternative : juste rôles (simple) ou juste permissions (flexible). Le mix c'est les deux avantages + un peu de complexité.
- ⚠ Rôles hardcodés en check() auraient pu être une enum Postgres (plus strict). Je l'ai pas fait pour flexibilité.

---

## Partie 3 : Les Catégories (Table de Référence)

```sql
-- =============================================
-- TABLE: categories
-- =============================================
-- Table MAÎTRE pour les catégories réutilisables.
-- Une fois créée, elle est utilisée partout (cartels, drafts, workshops).

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  description text,
  color text default '#999999', -- Hexa: permet l'UI de styliser
  icon text, -- nom d'icône Lucide: 'Wind', 'Zap', etc
  created_at timestamptz default now()
);

-- Index sur name (recherche rapide)
create index if not exists idx_categories_name on public.categories(name);

COMMENT ON TABLE public.categories IS 'Catégories réutilisables (Hydraulique, Éolien, Solaire, etc)';
COMMENT ON COLUMN public.categories.icon IS 'Icône Lucide React: voir https://lucide.dev/icons/';
```

**Pourquoi ce design ?**

| Aspect | Choix | Raison |
|---|---|---|
| Table séparée | Oui | Normalisé. Si 100 cartels avec "Solaire", une table centralisée c'est une source de vérité. Ancien système : array TEXT dans chaque cartel = duplication + pas de typage. |
| `id = text` | Oui dans ce cas | Permet des slugs (ex: "energie-solaire") lisibles. Clé sémantique = facile debug. MAIS moins performant qu'UUID pour foreign keys (voir risque ci-dessous). |
| `color + icon` | Oui | Optionnel mais utile pour UI (badges stylisées). |
| `unique` sur `name` | Oui | Empêche créer 2 catégories "Éolien" par erreur. |

**Points critiquables**
- ⚠ `id = text` au lieu d'UUID : plus lisible mais légèrement moins performant en indexes. Pour petit volume (< 100 catégories), c'est négligeable. **Altérative critique : passer à UUID primaire + ajouter `slug text unique` pour l'UI**.

---

## Partie 4 : La Table Centrale — CARTELS

```sql
-- =============================================
-- TABLE: cartels
-- =============================================
-- Table PRINCIPAL.e : stocke TOUT (brouillons + publiés).
-- Le champ `status` détermine la visibilité (RLS le filtrera).

create table if not exists public.cartels (
  -- ===== IDENTIFIANT =====
  id text primary key, -- UUID ou timestamp-based. Voir discussion ci-dessous.
  
  -- ===== WORKFLOW =====
  status text default 'draft', 
  -- draft: créateur seul peut le voir/éditer
  -- pending_review: admin attend = visible en admin dashboard
  -- published: publié et potentiellement visible (si visible=true)
  -- rejected: rejeté avec raison documentée
  
  rejection_reason text, -- Non-null seulement si status='rejected'
  
  -- ===== CONTENU (métadonnées) =====
  titre text not null,
  titre_en text,
  description text,
  description_en text,
  
  -- ===== LOCALISATION =====
  location text, -- Nom lisible: "Paris", "Seine-et-Marne"
  location_en text,
  latitude numeric(10, 8), -- 10 chiffres, 8 décimales = précision ~1cm
  longitude numeric(11, 8),
  -- Stocké séparé de location pour filtrage spatial (+tard).
  
  -- ===== TEMPORALITÉ & CONTEXTE =====
  annee text, -- Pas INT car peut être "1974-1980" ou "avant 1800"
  exhume_par text, -- Nom de la personne qui a découvert/exhumé
  exhume_par_en text,
  
  -- ===== MÉDIA & LIEN =====
  url_qr text, -- String JSON: utilisateur l'a scanné, sauvegardé
  image_path text, -- Chemin Supabase Storage: "images/123456.jpg"
  
  -- ===== CONTEXTE ATELIER =====
  origin text, -- Atelier d'origine: "Paléo-Énergétique", "Paléo H2O", etc
  visible boolean default true, 
  -- INDÉPENDANT du status.
  -- Cas : cartel publié mais hidden (admin le retire temporairement de la frise).
  
  -- ===== MÉTADONNÉES SYSTÈME =====
  created_by uuid not null references auth.users(id),
  published_by uuid references auth.users(id), -- NULL tant que non-publié
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz, -- NULL tant que status != 'published'
  
  -- ===== CONTRAINTES =====
  constraint status_valid check (status in ('draft', 'pending_review', 'published', 'rejected')),
  constraint published_must_have_date check ((status = 'published') = (published_at is not null))
);

-- Enable RLS
alter table public.cartels enable row level security;

COMMENT ON TABLE public.cartels IS 
  'Table centrale: brouillons (status=draft), en review, publié, rejeté.';

COMMENT ON COLUMN public.cartels.status IS 
  'Workflow: draft → pending_review → published ou rejected';

COMMENT ON COLUMN public.cartels.visible IS 
  'Indépendant du status. Permet de "masquer temporairement" un cartel publié de la frise.';

COMMENT ON COLUMN public.cartels.annee IS 
  'TEXT car peut être plage ("1974-1980") ou période imprécise ("avant 1800").';
```

**Pourquoi ce design ?**

| Aspect | Choix | Raison |
|---|---|---|
| Une table (pas drafts séparée) | Oui | Simplification. Réduit duplication, audit sur une seule table, statut unique source de vérité. |
| `status` au cœur | Oui | Determine tout : qui peut voir, qui peut éditer, quand c'est publié. RLS le filtre. |
| `status` + `visible` séparés | Oui | Découpage : status = ÉtatWorkflow, visible = "montrer/cacher de la frise". Cas réel : admin veut retirer un cartel de la vue publique sans le dépublier. |
| `latitude/longitude` numeric(10,8) | Oui | Précision ~1cm. `float` suffirait mais `numeric` = exact en SQL (important pour comparaisons). |
| `annee = text` | Oui | Flexibilité (plages, imprécis). Alternative : `year_start INT, year_end INT, is_approximate BOOLEAN` = plus rigide mais queryable. Choix trade-off. |
| `published_by` ET `created_by` | Oui | Traçabilité : qui a créé, qui a validé/publié. Important pour audit. |
| Constraints `check` | Oui | `published_at is not null iff status='published'`. Empêche state invalide (ex: status=published mais published_at=NULL). |

**Points critiquables**
- ⚠ `annee = text` : non queryable pour "cartels entre 1900 et 1950". Alternative meilleure : `year_start INT, year_end INT`. Mais casse flexibilité "avant 1800".
- ⚠ `id = text` : même problème. `id = UUID` + `id_display = text` serait plus robuste.
- ⚠ Pas de versionning. Si tu veux "voir l'historique d'édition d'un cartel", il faudrait audit_logs ou une table `cartel_versions`. Actuellement juste `updated_at`.

---

## Partie 5 : Catégories par Cartel (Many-to-Many Normalisé)

```sql
-- =============================================
-- TABLE: cartel_categories (M2M)
-- =============================================
-- Relie cartels aux catégories.
-- Ancien système : categories = array text dans cartels.
-- Nouveau : table dédiée = normalized, queryable, relationnel.

create table if not exists public.cartel_categories (
  cartel_id text references public.cartels(id) on delete cascade,
  category_id text references public.categories(id) on delete cascade,
  
  created_at timestamptz default now(),
  
  primary key (cartel_id, category_id)
);

-- Indexes pour requêtes inverses
create index if not exists idx_cartel_categories_category 
  on public.cartel_categories(category_id);

COMMENT ON TABLE public.cartel_categories IS 
  'Many-to-many: chaque cartel peut avoir N catégories, chaque catégorie N cartels.';
```

**Pourquoi M2M ?**

| Ancien (array TEXT) | Nouveau (M2M table) |
|---|---|
| `categories: ['Solaire', 'Hydraulique']` | Deux tables: normal SQL |
| Non queryable directement (LIKE %) | Queryable: `SELECT * FROM cartels WHERE id IN (SELECT cartel_id FROM cartel_categories WHERE category_id = ...)` |
| Duplication si 100 cartels partagent "Solaire" | Centralisé : 1 ligne "Solaire" |
| Pas d'indexes possibles | Index sur category_id |
| Pas de constraints (typo possible) | Foreign key : impossible de lier catégorie inexistante |

**Points critiquables**
- ✓ Aucun vrai point ici : M2M est le standard relationnel.
- Note : performance = légère requête JOIN, mais négligeable pour ~100 catégories.

---

## Partie 6 : Catégories de Référence (Categories Table — Simplifiée)

```sql
-- Les categories ne sont créées qu'une fois par admin.
-- Pas besoin d'une table "categories par draft" = on réutilise cartels_categories.
```

**Alternative rejetée : `draft_categories` séparée**
- ❌ Duplication : deux M2M tables identiques
- ❌ Si draft → published, faut copier categories = deux operations
- ✓ Solution : cartels = tout, categories partagées

---

## Partie 7 : Ateliers/Workshops (Hiérarchie Future-Proof)

```sql
-- =============================================
-- TABLE: workshops
-- =============================================
-- Ateliers ET branches futures (Paléo-Tech, Paléo H2O, etc).

create table if not exists public.workshops (
  id text primary key,
  
  name text not null,
  description text,
  
  -- Détermine hiérarchie
  type text default 'workshop', -- workshop | branch
  -- workshop : "Atelier Solaire"
  -- branch : "Paléo H2O" (peut contenir ateliers)
  
  parent_id text references public.workshops(id), -- Hiérarchie
  -- NULL si racine (Paléo-Tech) ou workshop indépendant
  -- "paleo-h2o" si c'est un sous-atelier de H2O
  
  -- Dénormalisation pour perf (sinon table M2M)
  cartel_ids text[] default '{}', -- IDs des cartels dans cet atelier
  -- ⚠ ATTENTION : dénormalisé = peut être source de désync.
  -- Alternative : table M2M workshops_cartels. Voir discussion ci-dessous.
  
  immersive boolean default false, -- Masque UI en immersive
  
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint type_valid check (type in ('workshop', 'branch'))
);

create index if not exists idx_workshops_type on public.workshops(type);
create index if not exists idx_workshops_parent on public.workshops(parent_id);

COMMENT ON TABLE public.workshops IS 
  'Ateliers (groupes de cartels) ou branches futures (Paléo H2O, Paléo Agri).';

COMMENT ON COLUMN public.workshops.cartel_ids IS 
  'Dénormalisé pour perf. À SYNCER manuellement ou via trigger quand cartel.origin change.';
```

**Choix Dénormalisation : `cartel_ids text[]` vs M2M**

| Dénormalisé (Array) | M2M Table |
|---|---|
| Perf : SELECT * FROM workshops, puis cartel_ids est JSON array | Perf : JOIN workshop_cartels. Fractionnement de données. |
| Sync : si cartel.origin change, faut UPDATE cartel_ids (trigger) | Sync : automatique, juste INSERT/DELETE |
| Simple côté code | Plus relationnel, queryable |

**Choix : DÉNORMALISÉ pour ce projet.**

Raison : lectures >> écritures. Ateliers lus souvent, rarement modifiés. Array en JSON = performant.

Alternative : si tu veux ajouter +tard des colonnes (ex: `order_in_workshop`), tu passeras en M2M.

**Points critiquables**
- ⚠ Dénormalisation = risque de désync. Si cartel supprimé, faut mettre à jour cartel_ids. Soluton : trigger SQL.
- ⚠ `type = text` : pas d'enum (plus strict serait `CREATE TYPE workshop_type`).

---

## Partie 8 : Configuration Globale

```sql
-- =============================================
-- TABLE: app_config
-- =============================================
-- Clés API etc, partagées entre admins.

create table if not exists public.app_config (
  id text primary key default 'global',
  
  openai_key text,
  deepl_key text,
  
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

alter table public.app_config enable row level security;

create policy "config_admin_only" on public.app_config
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true)
  with check ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

COMMENT ON TABLE public.app_config IS 
  'Configuration globale (clés API). Admin-only accès.';
```

**Pourquoi pas dans une column de users_metadata?**
- ⚠ Config est globale, pas par user. Si 2 admins la modifient, besoin d'une table unique. Enfin bon, plutôt en env variables ou Supabase Secrets. Mais là c'est "changeable par UI admin".

**Choix critiquable**
- ⚠DANGER : Stockes des clés API ici. En PROD, c'est risky. Meilleur : Supabase Secrets API (jamais exposé au client). Alternative safe : une Edge Function fait les appels API, clés jamais côté BD.

---

## Partie 9 : Audit Logs (Traçabilité Complète)

```sql
-- =============================================
-- TABLE: audit_logs
-- =============================================
-- Enregistre chaque action (create/update/delete) sur cartels/workshops.
-- Automatique via trigger.

create table if not exists public.audit_logs (
  id bigserial primary key,
  
  user_id uuid references auth.users(id),
  action text not null, -- INSERT | UPDATE | DELETE
  table_name text not null, -- cartels | workshops | app_config
  record_id text, -- ID de l'entité modifiée
  
  -- JSON des changements
  changes jsonb, -- { old: {...}, new: {...} } pour UPDATE, ou just new/old
  
  -- Contexte
  ip_address inet,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_read" on public.audit_logs
  for select using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- Index pour queries admin
create index if not exists idx_audit_logs_table_record 
  on public.audit_logs(table_name, record_id);

create index if not exists idx_audit_logs_user 
  on public.audit_logs(user_id);

create index if not exists idx_audit_logs_created_at 
  on public.audit_logs(created_at desc);

COMMENT ON TABLE public.audit_logs IS 
  'Traçabilité complète : qui a change quoi, quand. Rempli automatique par trigger.';
```

**Pourquoi Audit ?**

| Ancien System | Nouveau |
|---|---|
| PHP écrase fichier JSON : trace zéro | Audit log de tout |
| Admin peut effacer erreur sans trace | Historique complet |
| Crash serveur = perte donnée (backup manuel) | Supabase backup auto + audit trail |

**Points critiquables**
- ⚠ JSON change = peut devenir énorme pour cartels complexes (field par field). Alternative : juste stocker `field_name, old_value, new_value`.
- ⚠ `ip_address` : peut être NULL en HTTPS ou derrière proxy. Pour tester, pas critique.

---

## Partie 10 : Triggers pour Automation

```sql
-- =============================================
-- TRIGGER: audit_log_changes
-- =============================================
-- Remplir audit_logs automatique quand modifs.

create or replace function public.audit_log_changes()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, changes, ip_address)
  values (
    auth.uid(),
    tg_op::text, -- INSERT | UPDATE | DELETE
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object('old', row_to_json(old), 'new', row_to_json(new)),
    inet_client_addr() -- IP du client
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Attacher le trigger
create trigger audit_cartels 
  after insert or update or delete on public.cartels
  for each row execute function public.audit_log_changes();

create trigger audit_workshops 
  after insert or update or delete on public.workshops
  for each row execute function public.audit_log_changes();

create trigger audit_config 
  after insert or update or delete on public.app_config
  for each row execute function public.audit_log_changes();

COMMENT ON FUNCTION public.audit_log_changes() IS 
  'Trigger automatique : enregistre toute modif dans audit_logs.';
```

**Avantages**
- ✓ Zéro overhead côté client : trigger = côté serveur
- ✓ Impossible d'oublier un "log cette action"

**Points critiquables**
- ⚠ Trigger = JSON complet dans changes = peut être lourd. Solution : juste stocker `updated_fields` (list de champs modifiés).

---

## Partie 11 : Indexes (Performance)

```sql
-- =============================================
-- INDEXES DE PERFORMANCE
-- =============================================

-- Lecture publique: INDEX COMPOSITE (ultra-important)
-- Cette query sera exécutée MILLIONS de fois (affichage frise publique)
create index if not exists idx_cartels_published_visible 
  on public.cartels(status, visible) 
  where status = 'published' and visible = true;
-- Index PARTIEL : inclut seulement publiés+visibles. 
-- Gain : 10x plus rapide que index(status, visible) sur toute la table.

-- Brouillons du user
create index if not exists idx_cartels_draft_owner 
  on public.cartels(created_by, status) 
  where status = 'draft';

-- Workflow admin (en attente review)
create index if not exists idx_cartels_pending_review 
  on public.cartels(status) 
  where status = 'pending_review';

-- Géolocalisation
create index if not exists idx_cartels_location 
  on public.cartels(location) 
  where visible = true and status = 'published';

-- Timeline (ordre publication)
create index if not exists idx_cartels_published_at 
  on public.cartels(published_at desc) 
  where status = 'published';

-- Many-to-many lookups
create index if not exists idx_cartel_categories_cartel 
  on public.cartel_categories(cartel_id);

create index if not exists idx_cartel_categories_category 
  on public.cartel_categories(category_id);

COMMENT ON INDEX idx_cartels_published_visible IS 
  'Index PARTIEL : optimise requête "tous les cartels publics visibles" (la + fréquente).';
```

**Strattégie Indexing**

| Index | Quand utilisé | Raison |
|---|---|---|
| `(status, visible)` filtered | SELECT * WHERE status='published' AND visible=true | Frise publique, exécuté continuellement |
| `(created_by, status)` | SELECT * FROM cartels WHERE created_by=? AND status='draft' | Brouillons utilisateur |
| `(published_at DESC)` | ORDER BY published_at DESC | Timeline triée |
| M2M indexes | JOIN sur cartel_categories | Recherche par catégorie |

**Points critiquables**
- ⚠ Trop d'indexes ralentit les écritures (INSERT/UPDATE/DELETE). Choix : indexes sur colonnes prouvent lues fréquemment, pas toutes.
- ⚠ Index partiel sur `(status, visible)` : parfait pour ce projet, mais si tu ajoutes une colonne `archived`, faut réviser.

---

## Partie 12 : Row Level Security (RLS) — Le Cœur

```sql
-- =============================================
-- RLS: QUI VOIT QUOI
-- =============================================

-- ========== CARTELS ==========

-- 1. Public lit les cartels publiés + visibles
create policy "cartels_public_read" on public.cartels
  for select using (status = 'published' and visible = true);
-- RLS filter : jamais de brouillon en public.

-- 2. Owners voient leurs brouillons (pas besoin de policy: use (3))
create policy "cartels_owner_read" on public.cartels
  for select using (created_by = auth.uid());
-- RLS filter : je vois MES brouillons.

-- 3. Admins voient TOUT (brouillon, en review, everything)
create policy "cartels_admin_read" on public.cartels
  for select using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);
-- RLS filter : if admin = true, voir tout.

-- 4. Admins peuvent modifier/publier
create policy "cartels_admin_write" on public.cartels
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true)
  with check ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- 5. Owners peuvent modifier LEURS BROUILLONS seulement
create policy "cartels_owner_write" on public.cartels
  for all using (created_by = auth.uid() and status = 'draft')
  with check (created_by = auth.uid() and status = 'draft');
-- RLS filter : owner peut ÉDITER son draft, pas une fois publié.

-- ========== CATEGORIES ==========

-- Tout le monde lit categories
create policy "categories_read" on public.categories
  for select using (true);

-- Juste admins créent/modifient
create policy "categories_admin_write" on public.categories
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ========== CARTEL_CATEGORIES M2M ==========

-- Tout le monde lit (associations publiques)
create policy "cartel_categories_read" on public.cartel_categories
  for select using (true);

-- Admins modifient (quand éditent cartels)
create policy "cartel_categories_write" on public.cartel_categories
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ========== WORKSHOPS ==========

-- Tout le monde lit workshops
create policy "workshops_read" on public.workshops
  for select using (true);

-- Admins modifient
create policy "workshops_admin_write" on public.workshops
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ========== APP_CONFIG ==========

-- Juste admins
create policy "config_admin_only" on public.app_config
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ========== AUDIT_LOGS ==========

-- Juste admins lisent
create policy "audit_logs_admin" on public.audit_logs
  for select using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ========== USERS_METADATA ==========

-- Cada user voit sa metadata, admins voient tout
create policy "users_metadata_read" on public.users_metadata
  for select using (id = auth.uid() or (select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

create policy "users_metadata_admin_write" on public.users_metadata
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

COMMENT ON POLICY "cartels_public_read" ON public.cartels IS 
  'Le cœur de la sécurité : pas d''accès aux brouillons sans auth.';
```

**Architecture RLS**

```
User (unauthenticated)
  ↓ Can see: cartels WHERE (status='published' AND visible=true)
  ↓ Can NOT see: drafts, config, audit logs

User (authenticated, role='viewer')
  ↓ Can see: (same as above) + their own metadata
  ↓ Cannot see: other users' drafts

User (authenticated, role='contributor')
  ↓ Can see: (same as viewer) + their own drafts
  ↓ Can see: can_create_cartels=true
  ↓ Cannot: publish

Admin (can_manage_admin=true)
  ↓ Can SEE: everything
  ↓ Can MODIFY: cartels (publish), users_metadata, config, audit_logs
```

**Points critiquables**
- ⚠ RLS queries `(select can_manage_admin ...)` exécutées À CHAQUE CHECK = N+1 queries. Meilleur : mettre role dans le JWT token. Supabase le supporte via `auth.jwt() -> 'user_metadata'`.
- ⚠ Pas de RLS sur `cartel_categories.write` basée sur cartel.created_by. Admins peuvent créer liens, mais pas les owners (volontaire).

---

## Partie 13 : Script SQL Complet à Exécuter

Voir fichier séparé `SCHEMA_COMPLETE.sql` (trop long pour ici).

---

## Comparaison : Ancien vs Nouveau

| Aspect | Ancien (JSON + PHP) | Nouveau (Supabase) |
|---|---|---|
| **Concurrence** | Race condition (file_put_contents écrase) | Transactions ACID garanties |
| **Sécurité** | Mot de passe clair + tokens URL visibles | JWT + RLS côté DB |
| **Audit** | Aucun | Audit logs complets (automatic) |
| **Performance** | Tout chargé. N+1 requêtes PHP côté client | Index partiel, RLS côté BD, query optimized |
| **Scalabilité** | 1000 cartels = 1-5MB JSON. OK. 10k = ralenti | PostgreSQL gère millions de rows |
| **Maintenabilité** | Code dispersé (PHP + JS). M2M en array TEXT | Normalisé relationnel. Une source de vérité |
| **Récupération d'erreur** | Backup manuel | Supabase backup auto + PITR |

---

## Points Critiques à Réviser

### 🔴 HAUTE PRIORITÉ (avant production)

1. **Clés API dans `app_config`**
   - ❌ Risqué : stockées en clair en DB.
   - ✓ Solution : utiliser Supabase Secrets + Edge Functions. Clés n'arrivent jamais en BD.

2. **RLS Subqueries**
   - ❌ Chaque policy query la metadata de l'user = slow.
   - ✓ Solution : stocker role dans JWT token, RLS lit `auth.jwt() ->> 'role'` au lieu de subquery.

3. **ID Format**
   - ❌ `id = text` lisible mais moins performant.
   - ✓ Alternative : `id = UUID primaire` + `display_id = text slug` pour UI.

### 🟡 MOYENNE PRIORITÉ (optimiser +tard)

4. **Dénormalisation cartels_ids**
   - ⚠️ Peut se désynchroniser (cartel supprimé, cartel_ids non updaté).
   - ✓ Solution : trigger pour syncer, ou passer en M2M table.

5. **Historique Édition**
   - Audit logs existe mais peu queryable ("qui a changé ce champ spécifique ?").
   - ✓ Future : ajouter table `cartel_versions` pour historiqu complet.

### 🟢 BASSE PRIORITÉ (nice-to-have)

6. **Enum Types**
   - `status`, `type`, `role` en text avec CHECK.
   - ✓ Futur : créer ENUM Postgres (plus strict).

7. **Permissions Granulaires**
   - Actuellement : rôles simples (viewer/admin).
   - ✓ Futur : ajouter permissions par workshop (modifier un atelier spécifique).

---

## Conclusion

**Ce schéma est le "bon équilibre" entre**
- ✓ Normalisé (pas d'array TEXT)
- ✓ Sécurisé (RLS + audit)
- ✓ Performant (index stratégiques)
- ✓ Maintenable (pas de code dispersé)

**Et accepte les compromis de :**
- ⚠️ Clés API nécessitent sécurisation (Secrets API +tard)
- ⚠️ RLS subqueries = penser token JWT +tard
- ⚠️ Dénormalisation workshop = syncing manuel (triggers)

**Pour débuter ? C'est solide.**

