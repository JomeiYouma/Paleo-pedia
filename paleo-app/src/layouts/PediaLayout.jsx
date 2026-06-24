import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { pediaBasePath } from '../utils/subsiteHost';
import { useApp } from '../context/AppContext';

// Layout dédié à la vitrine paleo-pedia (branding "Paléo-Pédia", palette neutre).
// Depuis 2026-06 on y expose aussi un accès connexion + admin : il est logique
// de gérer l'écosystème depuis la Pédia. Les routes /app sont montées sur ce
// host (cf. App.jsx → pediaHostRouter), donc l'admin fonctionne ici aussi.
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

// Style commun aux "pilules" de la barre Pédia (liens/boutons).
const pillStyle = {
    color: 'var(--color-text)',
    background: 'transparent',
    textDecoration: 'none',
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
};

const PediaHeader = () => {
    const { user, logout } = useApp();
    const [showLogin, setShowLogin] = useState(false);
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
                    to={pediaBasePath() || '/'}
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
                <nav aria-label="Navigation Paléo-Pédia" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link to={`${pediaBasePath()}/participer-au-projet`} style={pillStyle}>
                        Participer au projet
                    </Link>
                    {user ? (
                        <>
                            <Link to="/app/admin" style={pillStyle}>Admin</Link>
                            <button type="button" onClick={logout} style={pillStyle}>Déconnexion</button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setShowLogin(true)} style={pillStyle}>
                            Se connecter
                        </button>
                    )}
                </nav>
            </div>
            {showLogin && <PediaLoginModal onClose={() => setShowLogin(false)} />}
        </header>
    );
};

// Modale de connexion minimale (réutilise login() du contexte). La session est
// par origine : se connecter ici crée une session propre à paleo-pedia.org.
const PediaLoginModal = ({ onClose }) => {
    const { login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await login(email, password);
            onClose();
            navigate('/app/admin');
        } catch (err) {
            setError(err?.message || 'Identifiants invalides.');
        } finally {
            setBusy(false);
        }
    };

    const fieldStyle = {
        width: '100%', padding: '10px 12px', marginBottom: 10, boxSizing: 'border-box',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem',
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20,
            }}
        >
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
                style={{
                    background: 'var(--color-surface)', color: 'var(--color-text)',
                    borderRadius: 'var(--radius-md)', padding: 28, width: '100%', maxWidth: 360,
                    boxShadow: '0 18px 48px rgba(0,0,0,0.25)',
                }}
            >
                <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem' }}>Connexion</h2>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" required style={fieldStyle} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" autoComplete="current-password" required style={fieldStyle} />
                {error && <p style={{ color: 'crimson', fontSize: '0.85rem', margin: '0 0 10px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button type="button" onClick={onClose} style={{ ...pillStyle, flex: 1, textAlign: 'center' }}>Annuler</button>
                    <button type="submit" disabled={busy} style={{ ...pillStyle, flex: 1, textAlign: 'center', background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)', opacity: busy ? 0.6 : 1 }}>
                        {busy ? '…' : 'Se connecter'}
                    </button>
                </div>
            </form>
        </div>
    );
};

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
                <Link to={`${pediaBasePath()}/mentions-legales`} style={linkStyle}>Mentions légales</Link>
                <Link to={`${pediaBasePath()}/politique-confidentialite`} style={linkStyle}>Politique de confidentialité</Link>
                <Link to={`${pediaBasePath()}/contact`} style={linkStyle}>Contact</Link>
            </nav>
            <div>© {new Date().getFullYear()} Atelier 21</div>
            <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                Plateforme créée par{' '}
                <a href="https://jomeiyouma.github.io/portfolio/" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, textDecoration: 'underline' }}>Youma</a>
            </div>
        </footer>
    );
};

export default PediaLayout;
