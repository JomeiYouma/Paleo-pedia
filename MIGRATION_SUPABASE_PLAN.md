# Plan de Migration Supabase — 7 Étapes

## Vue générale
Migration de **JSON + PHP + AppContext monolithique** vers **Supabase PostgreSQL + Auth + RLS**.

---

## Étape 1 : Setup Supabase & Schéma
**Durée estimée : 30 min**

### À faire
1. Créer un compte Supabase (supabase.com)
2. Créer une organisation et un projet
3. Récupérer :
   - URL du projet (`SUPABASE_URL`)
   - Clé anon (`SUPABASE_ANON_KEY`)
   - Clé service (`SUPABASE_SERVICE_ROLE_KEY`)
4. Créer le schéma (tables) en SQL :

```sql
-- Utilisateurs (gérés par Supabase Auth)
-- Rien à faire côté schema, Auth crée une table public.users automatiquement

-- Cartels
CREATE TABLE cartels (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  titre VARCHAR NOT NULL,
  titre_en VARCHAR,
  description TEXT,
  description_en TEXT,
  location VARCHAR,
  location_en VARCHAR,
  annee VARCHAR,
  categories TEXT[] DEFAULT '{}',
  categories_en TEXT[],
  image_path VARCHAR,
  exhume_par VARCHAR,
  url_qr VARCHAR,
  visible BOOLEAN DEFAULT true,
  origin VARCHAR,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Brouillons publics (drafts)
CREATE TABLE drafts (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  titre VARCHAR NOT NULL,
  titre_en VARCHAR,
  description TEXT,
  description_en TEXT,
  location VARCHAR,
  location_en VARCHAR,
  annee VARCHAR,
  categories TEXT[] DEFAULT '{}',
  image_path VARCHAR,
  exhume_par VARCHAR,
  status VARCHAR DEFAULT 'public_draft', -- 'public_draft', 'pending_review'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Ateliers
CREATE TABLE workshops (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  name VARCHAR NOT NULL,
  cartel_ids BIGINT[] DEFAULT '{}',
  immersive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Admin users (qui a accès à la gestion)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  granted_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cartels_origin ON cartels(origin);
CREATE INDEX idx_cartels_visible ON cartels(visible);
CREATE INDEX idx_cartels_created_by ON cartels(created_by);
CREATE INDEX idx_drafts_created_by ON drafts(created_by);
```

5. Activer **RLS** sur les tables :

```sql
ALTER TABLE cartels ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

### Outputs
- URL + clés dans `.env.local`
- Schema créé dans Supabase

---

## Étape 2 : Créer les RLS Policies (Sécurité)
**Durée estimée : 30 min**

### À faire
```sql
-- CARTELS: publics lectables, writable par créateur/admin
CREATE POLICY "Cartels are publicly readable" ON cartels
  FOR SELECT USING (visible = true);

CREATE POLICY "Owner can update own cartels" ON cartels
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admin can insert cartels" ON cartels
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- DRAFTS: lectables/writable par créateur ou admin
CREATE POLICY "Users can read own drafts or admin reads all" ON drafts
  FOR SELECT USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Users can create drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = current_user_id);

-- WORKSHOPS: publics lectables, writable par admin
CREATE POLICY "Workshops are publicly readable" ON workshops
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage workshops" ON workshops
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ADMIN_USERS: visibles seulement au système
CREATE POLICY "Admin table is private" ON admin_users
  FOR ALL USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
```

### Outputs
- RLS policies en place
- Traçabilité `created_by` on cartels/drafts

---

## Étape 3 : Service Supabase React (`supabaseService.js`)
**Durée estimée : 1h**

### À faire
Créer `src/services/supabaseService.js` qui expose les mêmes méthodes que les services actuels :

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabaseService = {
  // Auth
  login: async (email, password) => { /* signInWithPassword */ },
  logout: async () => { /* signOut */ },
  getCurrentUser: async () => { /* auth.getUser() */ },

  // Cartels
  getCartels: async () => { /* select from cartels */ },
  addCartel: async (cartel) => { /* insert */ },
  updateCartel: async (id, cartel) => { /* update */ },
  deleteCartel: async (id) => { /* delete */ },

  // Drafts
  getDrafts: async () => { /* select from drafts */ },
  addDraft: async (draft) => { /* insert */ },
  updateDraft: async (id, draft) => { /* update */ },
  deleteDraft: async (id) => { /* delete */ },

  // Workshops
  getWorkshops: async () => { /* select from workshops */ },
  addWorkshop: async (workshop) => { /* insert */ },
  updateWorkshop: async (id, workshop) => { /* update */ },
  deleteWorkshop: async (id) => { /* delete */ },

  // Images (Supabase Storage)
  uploadImage: async (file, path) => { /* upload to bucket */ },
  getImageUrl: async (path) => { /* get signed URL */ },
};
```

### Outputs
- Fichier `supabaseService.js` prêt
- Interface compatible avec code existant

---

## Étape 4 : Refactorer AppContext
**Durée estimée : 1.5h**

### À faire
Découper le monolithe de 443 lignes en contextes séparés :

| Contexte | Responsabilité |
|---|---|
| `AuthContext` | login/logout, currentUser, isAdmin |
| `CartelsContext` | cartels CRUD, filtering |
| `DraftsContext` | drafts CRUD, proposals |
| `WorkshopsContext` | workshops CRUD |
| `UIContext` | loading, language, view mode |

Remplacer tous les appels `getActiveService()` par des appels directs `supabaseService.*`.

### Outputs
- AppContext allégée ou supprimée
- 5 contextes ciblées et testables
- Plus facile à maintenir

---

## Étape 5 : Mettre à jour les pages (Create, Admin, etc.)
**Durée estimée : 2h**

### À faire
Remplacer chaque appel aux anciens services par les nouveaux contextes/supabase.

Exemples :
- `addCartel()` → passe par `CartelsContext`
- `uploadImage()` → passe par `supabaseService.uploadImage()` + Supabase Storage
- `fetchData()` → remplacé par abonnement temps réel avec `.on('INSERT')` / `.on('UPDATE')`

### Outputs
- Toutes les pages mises à jour
- Temps réel possible (bonus)

---

## Étape 6 : Supprimer le PHP (optional mais recommandé)
**Durée estimée : 30 min**

### À faire
- Supprimer `/public/api/` (plus besoin)
- Supprimer `/services/local.js`, `/services/phpService.js`, `/services/github.js`
- Garder `/services/translation.js` (appelle OpenAI directement) ou le filtrer (voir point 7)

### Outputs
- Backend PHP supprimé
- Code client clarifié

---

## Étape 7 : Tirer profit de Supabase
**Durée estimée : 2h (bonus)**

### À faire
- **Real-time subscriptions** : vs rechargement à la main
- **Edge Functions** : wrapper sécurisé autour OpenAI/DeepL (clés jamais côté client)
- **Audit logs** : qui a modifié quoi, quand
- **Backup automatique** : Supabase le gère

### Outputs
- App plus résiliente
- Sécurité renforcée (clés API côté serveur)

---

## Résumé

| Étape | Tâche | Durée | Blocker? |
|---|---|---|---|
| 1 | Setup Supabase + schéma | 30 min | Non |
| 2 | RLS policies | 30 min | Non |
| 3 | supabaseService.js | 1h | Non |
| 4 | Refactorer AppContext | 1.5h | Oui (critical) |
| 5 | MAJ pages + hooks | 2h | Non |
| 6 | Supprimer PHP | 30 min | Non |
| 7 | Bonus (real-time, etc) | 2h | Non |

**Total estimé : 7.5h pour une migration complète**

---

## Recommandation de démarrage

1. **Commencer par étapes 1-3** pour tester la plomberie (pas de breaking change).
2. **Une seule page (ex: Create)** pour tester interactions Supabase.
3. **Puis généraliser** aux autres pages.
4. **Garder PHP/old services** en fallback un moment si besoin.

