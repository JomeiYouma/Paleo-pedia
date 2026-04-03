# paleo-energetique API

API REST + JWT pour l'application d'exposition.

## Stack
- **Node.js** (ESM) + Express
- **PostgreSQL** (Supabase, Neon, Railway…)
- **JWT** pour l'authentification
- Pas d'ORM — SQL direct via `pg`

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → éditer .env avec votre DATABASE_URL et JWT_SECRET

# 3. Initialiser la base de données
# Dans Supabase > SQL Editor (ou psql) :
# → coller et exécuter sql/schema.sql

# 4. Lancer en développement
npm run dev
```

## Routes

### Auth
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | — | Créer un compte |
| POST | `/api/auth/login` | — | Connexion → retourne JWT |
| GET | `/api/auth/me` | ✓ | Profil courant |

### Cartels
| Méthode | Route | Permission | Description |
|---------|-------|-----------|-------------|
| GET | `/api/cartels` | — | Liste (filtres: status, visible, category, search) |
| GET | `/api/cartels/:id` | — | Détail avec catégories |
| POST | `/api/cartels` | can_create_cartel | Créer (draft par défaut) |
| PATCH | `/api/cartels/:id` | can_create_cartel | Modifier |
| PATCH | `/api/cartels/:id/status` | can_publish_cartel (pour published) | Changer le statut |
| DELETE | `/api/cartels/:id` | owner ou admin | Supprimer |

**Statuts disponibles** : `draft` → `pending_review` → `published` → `archived`

### Catégories
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET | `/api/categories` | — |
| POST/PATCH/DELETE | `/api/categories` | can_manage_admin |

### Utilisateurs
| Méthode | Route | Permission |
|---------|-------|-----------|
| GET/PATCH/DELETE | `/api/users` | can_manage_admin |

## Client JS (React)

```js
import api from './src/client.js'

// Connexion
await api.auth.login('user@example.com', 'motdepasse')

// Créer un cartel (brouillon)
const cartel = await api.cartels.create({
  titre: 'Les éoliennes de Nashtifan',
  titre_en: 'Iranian Wind Turbines in Nashtifan',
  annee: '900 av JC',
  description: '...',
  location: 'Nashtifan',
  lat: 34.4337222,
  lng: 60.1777943,
  category_ids: ['eolien', 'agriculture'],
})

// Soumettre pour relecture
await api.cartels.submitForReview(cartel.id)

// Publier (nécessite can_publish_cartel)
await api.cartels.publish(cartel.id)

// Filtrer les cartels publiés d'une catégorie
const results = await api.cartels.getAll({ status: 'published', category: 'eolien' })
```

## Roles et permissions

| Role | can_create | can_publish | can_manage_admin |
|------|-----------|-------------|-----------------|
| contributor | ✓ | — | — |
| editor | ✓ | ✓ | — |
| admin | ✓ | ✓ | ✓ |
| superadmin | ✓ | ✓ | ✓ |