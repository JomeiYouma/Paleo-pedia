import React from 'react';
import { Outlet, Link } from 'react-router-dom';

// Layout dédié à la vitrine paleo-pedia.
// Distinct de SiteLayout (qui sert le programme Paléo-Énergétique) :
//   - branding "Paléo-Pédia"
//   - pas de bouton connexion ni de menu app
//   - palette neutre (gris foncé / blanc), pas d'accent jaune
// Pensé pour mettre en avant le schéma de l'écosystème comme élément principal.
const PediaLayout = () => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
    }}>
        <PediaHeader />
        <main style={{ flex: 1 }}>
            <Outlet />
        </main>
        <PediaFooter />
    </div>
);

const PediaHeader = () => (
    <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    }}>
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
        }}>
            <Link
                to="/pedia"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
                aria-label="Paléo-Pédia, accueil"
            >
                <div style={{ width: 6, height: 32, background: 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                }}>
                    Paléo-Pédia
                </span>
            </Link>
        </div>
    </header>
);

const PediaFooter = () => {
    const linkStyle = { color: 'var(--color-text-muted)', textDecoration: 'none' };
    return (
        <footer style={{
            background: 'var(--color-primary-soft)',
            borderTop: '1px solid var(--color-border)',
            padding: '28px 24px',
            marginTop: 'auto',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
        }}>
            <nav aria-label="Liens légaux" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', justifyContent: 'center', marginBottom: 12 }}>
                <Link to="/pedia/mentions-legales" style={linkStyle}>Mentions légales</Link>
                <Link to="/pedia/politique-confidentialite" style={linkStyle}>Politique de confidentialité</Link>
                <Link to="/pedia/contact" style={linkStyle}>Contact</Link>
            </nav>
            <div>© {new Date().getFullYear()} Atelier 21</div>
        </footer>
    );
};

export default PediaLayout;
