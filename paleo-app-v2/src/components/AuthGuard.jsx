import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * AuthGuard — Protège les routes admin.
 * Redirige vers /login si non connecté ou non admin.
 */
export default function AuthGuard({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p>Vérification de l'accès...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="loading-center">
        <p style={{ color: 'var(--color-danger)' }}>
          Accès refusé — droits administrateur requis.
        </p>
      </div>
    );
  }

  return children;
}
