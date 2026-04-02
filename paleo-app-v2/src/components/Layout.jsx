import React from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layers, LogIn, LogOut, Settings, Plus, User } from 'lucide-react';
import './Layout.css';

/**
 * Layout — Header + main content + footer.
 * Navigation principale de l'application.
 */
export default function Layout() {
  const { user, isAdmin, canCreate, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner container">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Layers size={20} />
            </div>
            <span className="logo-text">
              <span className="logo-paleo">Paléo</span>
              <span className="logo-cartels">Cartels</span>
            </span>
          </Link>

          {/* Navigation centrale */}
          <nav className="nav" aria-label="Navigation principale">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Accueil
            </NavLink>
            <NavLink to="/library" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Frise globale
            </NavLink>
            {canCreate && (
              <NavLink to="/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Plus size={14} />
                Créer
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Settings size={14} />
                Admin
              </NavLink>
            )}
          </nav>

          {/* Actions utilisateur */}
          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <User size={16} />
                  <span className="user-email">{user.email?.split('@')[0]}</span>
                  {isAdmin && <span className="admin-badge">Admin</span>}
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Se déconnecter">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <p className="footer-copy">
            © {new Date().getFullYear()} Atelier 21 — Paléo-Cartels
          </p>
          <p className="footer-tagline">
            Une contre-histoire de l'énergie
          </p>
        </div>
      </footer>
    </div>
  );
}
