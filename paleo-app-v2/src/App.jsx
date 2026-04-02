import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';

// Pages
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import Library from './pages/Library';
import Create from './pages/Create';
import Admin from './pages/Admin';
import LoginPage from './pages/LoginPage';

import './index.css';

/**
 * App — Routing principal de paleo-app-v2.
 *
 * Architecture simplifiée vs v1 :
 * - Plus d'AppContext monolithique (443 lignes → supprimé)
 * - Plus de "service strategy" (github/local/php → Supabase uniquement)
 * - Hooks React ciblés : useAuth, useCartels, useCategories, useWorkshops
 * - Auth Supabase réelle (plus de mot de passe hardcodé)
 *
 * Routes :
 *   /              → Home (grille catégories Supabase)
 *   /category/:id  → CategoryPage (frise filtrée par catégorie)
 *   /library       → Library (tous les cartels publiés)
 *   /create        → Create (public: proposition / connecté: création)
 *   /admin         → Admin (admin only — AuthGuard)
 *   /login         → LoginPage
 */
function App() {
  return (
    <Routes>
      {/* Login : sans Layout */}
      <Route path="/login" element={<LoginPage />} />

      {/* Toutes les autres routes : avec Layout (Outlet) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="library" element={<Library />} />

        {/* Create : accessible à tous (mode public si non connecté) */}
        <Route path="create" element={<Create />} />

        {/* Admin : accès réservé aux admins Supabase */}
        <Route
          path="admin"
          element={
            <AuthGuard requireAdmin>
              <Admin />
            </AuthGuard>
          }
        />

        {/* 404 → redirection accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
