-- ============================================================
-- SCHEMA SUPABASE - Paléo-Énergétique
-- ============================================================
-- À exécuter dans Supabase Dashboard > SQL Editor
-- La suite peut être copié-collée d'un coup

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- 2. USERS_METADATA (Extension de auth.users)
-- ============================================================
create table if not exists public.users_metadata (
  id uuid primary key references auth.users(id) on delete cascade,
  
  role text default 'viewer' check (role in ('viewer', 'contributor', 'admin')),
  can_create_cartels boolean default false,
  can_publish_cartels boolean default false,
  can_manage_admin boolean default false,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users_metadata enable row level security;

create policy "users_metadata_read" on public.users_metadata
  for select using (id = auth.uid() or (select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- AUTO-CREATE users_metadata on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_metadata (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. CATEGORIES (Référence)
-- ============================================================
create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  description text,
  color text default '#999999',
  icon text,
  created_at timestamptz default now()
);

create index if not exists idx_categories_name on public.categories(name);

alter table public.categories enable row level security;

create policy "categories_read" on public.categories
  for select using (true);

-- ============================================================
-- 4. CARTELS (Table Centrale)
-- ============================================================
create table if not exists public.cartels (
  id text primary key,
  
  status text default 'draft' check (status in ('draft', 'pending_review', 'published', 'rejected')),
  rejection_reason text,
  
  titre text not null,
  titre_en text,
  description text,
  description_en text,
  
  location text,
  location_en text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  
  annee text,
  exhume_par text,
  exhume_par_en text,
  
  url_qr text,
  image_path text,
  
  origin text,
  visible boolean default true,
  
  created_by uuid not null references auth.users(id),
  published_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  
  constraint published_must_have_date check ((status = 'published') = (published_at is not null))
);

create index if not exists idx_cartels_published_visible on public.cartels(status, visible) 
  where status = 'published' and visible = true;
create index if not exists idx_cartels_draft_owner on public.cartels(created_by, status) 
  where status = 'draft';
create index if not exists idx_cartels_pending_review on public.cartels(status) 
  where status = 'pending_review';
create index if not exists idx_cartels_published_at on public.cartels(published_at desc) 
  where status = 'published';

alter table public.cartels enable row level security;

-- Public reads publiés + visibles
create policy "cartels_public_read" on public.cartels
  for select using (status = 'published' and visible = true);

-- Owners voient leurs brouillons
create policy "cartels_owner_read" on public.cartels
  for select using (created_by = auth.uid());

-- Admins voient TOUT
create policy "cartels_admin_read" on public.cartels
  for select using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- Owners editent leurs brouillons
create policy "cartels_owner_write" on public.cartels
  for all using (created_by = auth.uid() and status = 'draft')
  with check (created_by = auth.uid() and status = 'draft');

-- Admins modifient tout
create policy "cartels_admin_write" on public.cartels
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true)
  with check ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ============================================================
-- 5. CARTEL_CATEGORIES (M2M)
-- ============================================================
create table if not exists public.cartel_categories (
  cartel_id text references public.cartels(id) on delete cascade,
  category_id text references public.categories(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (cartel_id, category_id)
);

create index if not exists idx_cartel_categories_category on public.cartel_categories(category_id);

alter table public.cartel_categories enable row level security;

create policy "cartel_categories_read" on public.cartel_categories
  for select using (true);

-- ============================================================
-- 6. WORKSHOPS (Ateliers/Collections)
-- ============================================================
create table if not exists public.workshops (
  id text primary key,
  
  name text not null,
  description text,
  
  type text default 'workshop' check (type in ('workshop', 'branch')),
  parent_id text references public.workshops(id),
  
  cartel_ids text[] default '{}',
  immersive boolean default false,
  
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workshops_type on public.workshops(type);
create index if not exists idx_workshops_parent on public.workshops(parent_id);

alter table public.workshops enable row level security;

create policy "workshops_read" on public.workshops
  for select using (true);

-- ============================================================
-- 7. APP_CONFIG (Secrets Globales)
-- ============================================================
create table if not exists public.app_config (
  id text primary key default 'global',
  
  -- ⚠️ DANGER: À remplacer par Supabase Secrets API
  openai_key text,
  deepl_key text,
  
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

alter table public.app_config enable row level security;

create policy "config_admin_only" on public.app_config
  for all using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true)
  with check ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ============================================================
-- 8. AUDIT_LOGS (Traçabilité)
-- ============================================================
create table if not exists public.audit_logs (
  id bigserial primary key,
  
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id text,
  
  changes jsonb,
  ip_address inet,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_table_record on public.audit_logs(table_name, record_id);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin" on public.audit_logs
  for select using ((select can_manage_admin from public.users_metadata where id = auth.uid()) = true);

-- ============================================================
-- 9. TRIGGER: Audit Automatique
-- ============================================================
create or replace function public.audit_log_changes()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, changes, ip_address)
  values (
    auth.uid(),
    tg_op::text,
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object('old', row_to_json(old), 'new', row_to_json(new)),
    inet_client_addr()
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger audit_cartels 
  after insert or update or delete on public.cartels
  for each row execute function public.audit_log_changes();

create trigger audit_workshops 
  after insert or update or delete on public.workshops
  for each row execute function public.audit_log_changes();

create trigger audit_config 
  after insert or update or delete on public.app_config
  for each row execute function public.audit_log_changes();

-- ============================================================
-- 10. DONNÉES DE TEST (Optionnel)
-- ============================================================
-- Insérer des catégories de base
insert into public.categories (id, name, description, color, icon) values
  ('solaire', 'Énergie Solaire', 'Innovations solaires',  '#FFD700', 'Sun'),
  ('eolien', 'Énergie Éolienne', 'Moulins à vent et turbines', '#87CEEB', 'Wind'),
  ('hydraulique', 'Énergie Hydraulique', 'Moulins à eau, barrages', '#4169E1', 'Waves'),
  ('biomasse', 'Biomasse', 'Bois, charbon, biocarburants', '#8B4513', 'Flame'),
  ('geothermie', 'Géothermie', 'Chaleur souterraine', '#DC143C', 'ThermometerSun')
on conflict do nothing;

-- ============================================================
-- FIN DU SCHEMA
-- ============================================================
-- Tout OK ? Passe à l'étape 2 (variables environment).
