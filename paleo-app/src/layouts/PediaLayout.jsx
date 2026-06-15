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

const PediaHeader = () => {
    // Page unique : la nav fait défiler vers les sections de l'accueil /pedia.
    const scrollToId = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const navBtnStyle = {
        background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer',
        fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        color: 'var(--color-text-muted)',
    };
    return (
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
                justifyContent: 'space-between',
                gap: 16,
            }}>
                <Link
                    to="/pedia"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
                    aria-label="Paléo-Pédia — accueil"
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

                <nav aria-label="Navigation Paléo-Pédia" style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
                    <button type="button" onClick={() => scrollToId('ecosysteme')}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        style={navBtnStyle}>Écosystème</button>
                    <button type="button" onClick={() => scrollToId('methodologie')}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        style={navBtnStyle}>Méthodologie</button>
                </nav>
            </div>
        </header>
    );
};

const PediaFooter = () => (
    <footer style={{
        background: 'var(--color-primary-soft)',
        borderTop: '1px solid var(--color-border)',
        padding: '32px 24px',
        marginTop: 'auto',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
    }}>
        © {new Date().getFullYear()} Atelier 21
    </footer>
);

export default PediaLayout;
