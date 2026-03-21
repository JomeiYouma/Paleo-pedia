-- ============================================================
-- FIX 🔴 #1 : INJECTION JWT ROLE (Optimisation RLS)
-- ============================================================
-- À exécuter dans Supabase Dashboard > SQL Editor APRÈS schema.sql
--
-- PROBLÈME : RLS policies avec subqueries lentes
--   (select can_manage_admin from users_metadata ...) 
--   = N+1 queries, chaque policy check
--
-- SOLUTION : Injecter role dans JWT token
--   RLS lit auth.jwt() ->> 'user_metadata' ->> 'role'
--   Au lieu de subquery
--   = Ultra-rapide (lecture token, pas requête BD)
-- ============================================================

-- ============================================================
-- 1. Fonction : Sync role à auth.user_metadata après changements
-- ============================================================
create or replace function public.sync_user_metadata_to_auth()
returns trigger as $$
begin
  -- Mettre à jour auth.users.user_metadata avec le rôle
  -- Cela injecte le rôle dans le JWT token
  update auth.users
  set user_metadata = jsonb_set(
    coalesce(user_metadata, '{}'::jsonb),
    '{role}',
    to_jsonb(new.role)
  )
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer;

-- Attacher trigger sur updates de users_metadata
create or replace trigger sync_metadata_to_auth
  after insert or update on public.users_metadata
  for each row execute function public.sync_user_metadata_to_auth();

-- ============================================================
-- 2. Fonction : Sync role lors du sign-up (créer metadata par défaut)
-- ============================================================
create or replace function public.handle_new_user_v2()
returns trigger as $$
begin
  -- Insérer metadata avec rôle 'viewer' par défaut
  insert into public.users_metadata (id, role) 
  values (new.id, 'viewer')
  on conflict (id) do update set role = 'viewer';

  -- IMMÉDIATEMENT injecter dans auth.users
  update auth.users
  set user_metadata = jsonb_set(
    coalesce(user_metadata, '{}'::jsonb),
    '{role}',
    '"viewer"'
  )
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer;

-- Remplacer le trigger existant
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_v2();

-- ============================================================
-- 3. REFRACTOR RLS Policies : Utiliser auth.jwt()
-- ============================================================
-- 
-- À la place de :
--   (select can_manage_admin from users_metadata where id = auth.uid()) = true
--
-- Utiliser :
--   (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
--
-- ============================================================

-- Admins lisent TOUT
drop policy if exists "cartels_admin_read" on public.cartels;

create policy "cartels_admin_read_v2" on public.cartels
  for select using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admins modifient TOUT
drop policy if exists "cartels_admin_write" on public.cartels;

create policy "cartels_admin_write_v2" on public.cartels
  for all using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  )
  with check (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin categories write
drop policy if exists "categories_admin_write" on public.categories;

create policy "categories_admin_write_v2" on public.categories
  for all using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin cartel_categories write
drop policy if exists "cartel_categories_write" on public.cartel_categories;

create policy "cartel_categories_write_v2" on public.cartel_categories
  for all using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin workshops write
drop policy if exists "workshops_admin_write" on public.workshops;

create policy "workshops_admin_write_v2" on public.workshops
  for all using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin config
drop policy if exists "config_admin_only" on public.app_config;

create policy "config_admin_only_v2" on public.app_config
  for all using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  )
  with check (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin audit logs
drop policy if exists "audit_logs_admin" on public.audit_logs;

create policy "audit_logs_admin_v2" on public.audit_logs
  for select using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ============================================================
-- 4. Users_metadata : Admin peut voir et modifier
-- ============================================================

drop policy if exists "users_metadata_read" on public.users_metadata;

create policy "users_metadata_read_v2" on public.users_metadata
  for select using (
    id = auth.uid() 
    or (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

create policy "users_metadata_admin_write" on public.users_metadata
  for all using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  )
  with check (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ============================================================
-- RÉSULTAT
-- ============================================================
--
-- ✅ RLS policies maintenant ultra-rapides
--   (lisent JWT token au lieu de requête BD)
--
-- ✅ Automatique : quand role change en users_metadata
--   → JWT mis à jour dans auth.users.user_metadata
--   → Prochaine requête RLS lit le nouveau rôle
--
-- ============================================================
