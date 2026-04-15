import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Menu, X, Lock, LogIn, LogOut,
    Library, PlusCircle, ClipboardList, Settings2, LayoutDashboard
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useNavigate } from 'react-router-dom';
import { subsites as subsitesApi } from '../services/apiClient';

// ── Liens du site public ─────────────────────────────────────
const SITE_NAV = [
    { path: '/',             label: 'Accueil' },
    { path: '/presentation', label: 'Présentation' },
    { path: '/prestations',  label: 'Prestations' },
    { path: '/ouvrages',     label: 'Ouvrages' },
    { path: '/museum',       label: 'Museum' },
    { path: '/contact',      label: 'Contact' },
];

// ── Liens de l'application (frise) ───────────────────────────
const APP_NAV_VISITOR = [
    { path: '/app',        label: 'Frise',  icon: Library,       end: true },
    { path: '/app/create', label: 'Proposer', icon: PlusCircle },
];

const APP_NAV_ADMIN = [
    { path: '/app',              label: 'Frise',         icon: Library,         end: true },
    { path: '/app/manage/drafts',   label: 'Brouillons',   icon: ClipboardList },
    { path: '/app/manage/pending',  label: 'Propositions', icon: ClipboardList },
    { path: '/app/manage/published',label: 'Publiés',      icon: LayoutDashboard },
    { path: '/app/admin',           label: 'Admin',        icon: Settings2 },
];

/**
 * Header unifié — un seul header pour tout le site.
 *
 * Bande 1 : logo + burger site + langue + auth  (toujours visible)
 * Bande 2 : navigation app                      (visible UNIQUEMENT sur /app/*)
 *
 * Props (toutes optionnelles, lues depuis le contexte) :
 *   currentWorkshop, quitWorkshop
 */
const SharedHeader = ({ currentWorkshop, quitWorkshop }) => {
    const { user, isAdmin, login, logout } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen,     setIsMenuOpen]     = useState(false);
    const [showLogin,      setShowLogin]       = useState(false);
    const [loginEmail,     setLoginEmail]      = useState('');
    const [loginPassword,  setLoginPassword]   = useState('');
    const [loginError,     setLoginError]      = useState('');
    const [loginLoading,   setLoginLoading]    = useState(false);
    const [subsites,       setSubsites]        = useState([]);

    const isInApp = location.pathname.startsWith('/app');

    // Charger les sous-sites lors du premier clic burger
    const handleMenuOpen = () => {
        const next = !isMenuOpen;
        setIsMenuOpen(next);
        if (next && subsites.length === 0) {
            subsitesApi.getAll().then(d => setSubsites(Array.isArray(d) ? d : [])).catch(() => {});
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        try {
            await login(loginEmail, loginPassword);
            setShowLogin(false);
            setLoginEmail('');
            setLoginPassword('');
            navigate('/app/admin');
        } catch (err) {
            setLoginError(err.message || 'Identifiants incorrects');
        } finally {
            setLoginLoading(false);
        }
    };

    const appLinks = isAdmin ? APP_NAV_ADMIN : APP_NAV_VISITOR;

    return (
        <>
            {/* ── Bandeau atelier ─────────────────────────────── */}
            {currentWorkshop && !currentWorkshop.is_immersive && (
                <div style={{
                    background: 'linear-gradient(90deg, #006064, #00838f)',
                    color: 'white',
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    letterSpacing: '0.3px',
                }}>
                    <span>⚗️ Mode Atelier : {currentWorkshop.name}</span>
                    <button
                        onClick={quitWorkshop}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.4)',
                            color: 'white',
                            borderRadius: '20px',
                            padding: '3px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        Quitter
                    </button>
                </div>
            )}

            {/* ════════════════════════════════════════════════
                BANDE 1 — Navigation du site public
            ════════════════════════════════════════════════ */}
            <header style={{
                background: 'white',
                borderBottom: isInApp ? '1px solid #f0f0f0' : '1px solid #eee',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 28px',
                    gap: '16px',
                    maxWidth: '1600px',
                    margin: '0 auto',
                }}>
                    {/* ── Gauche : burger + logo ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Burger site public */}
                        <div className="mobile-burger" style={{ position: 'relative' }}>
                            <button
                                onClick={handleMenuOpen}
                                style={{
                                    background: '#f8f8f8',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '10px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    color: '#555',
                                    letterSpacing: '0.4px',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.15s',
                                }}
                                title="Menu du site"
                            >
                                {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
                                <span style={{ display: 'none' }}>Menu</span>
                            </button>

                            {/* Dropdown menu site */}
                            {isMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    left: 0,
                                    zIndex: 2000,
                                    background: 'white',
                                    border: '1px solid #eee',
                                    borderRadius: '14px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    minWidth: '240px',
                                    padding: '8px',
                                    animation: 'menuFadeIn 0.18s ease-out',
                                }}>
                                    {/* Liens site principal */}
                                    {SITE_NAV.map(link => (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            style={{
                                                display: 'block',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                color: location.pathname === link.path ? 'var(--color-pink-darker, #C2185B)' : '#333',
                                                fontWeight: location.pathname === link.path ? '700' : '500',
                                                fontSize: '0.93rem',
                                                background: location.pathname === link.path ? '#fce4ec' : 'transparent',
                                                transition: 'all 0.12s',
                                            }}
                                            onMouseEnter={e => { if (location.pathname !== link.path) e.currentTarget.style.background = '#f5f5f5'; }}
                                            onMouseLeave={e => { if (location.pathname !== link.path) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}

                                    {/* Sous-sites / Thématiques */}
                                    {subsites.length > 0 && (
                                        <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 0', paddingTop: '6px' }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#bbb', padding: '2px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Thématiques</div>
                                            {subsites.map(s => (
                                                <Link key={s.slug} to={`/site/${s.slug}`}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none', color: '#333', fontSize: '0.9rem', fontWeight: '600', transition: 'background 0.12s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.primary_color, flexShrink: 0 }} />
                                                    {s.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Lien vers la frise */}
                                    <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 0' }} />
                                    <Link
                                        to="/app"
                                        onClick={() => setIsMenuOpen(false)}
                                        style={{
                                            display: 'block',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            color: '#C2185B',
                                            fontWeight: '700',
                                            fontSize: '0.93rem',
                                            background: isInApp ? '#fce4ec' : 'transparent',
                                        }}
                                    >
                                        🗓 La Frise Chronologique
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Logo */}
                        <Link
                            to="/"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'var(--color-pink-darker, #C2185B)',
                                borderRadius: '50%',
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: '1.1rem',
                                fontWeight: '800',
                                letterSpacing: '-0.4px',
                                color: '#1a1a1a',
                            }}>
                                {currentWorkshop ? currentWorkshop.name : 'Paléo-Énergétique'}
                            </span>
                        </Link>
                    </div>

                    {/* ── Centre : liens rapides site (compacts, pas en app) ── */}
                    {!isInApp && (
                        <nav className="desktop-nav" style={{
                            gap: '4px',
                            flexWrap: 'wrap',
                        }}>
                            {SITE_NAV.map(link => {
                                const p = link.path;
                                return (
                                    <Link
                                        key={p}
                                        to={p}
                                        style={{
                                            padding: '7px 16px',
                                            borderRadius: '20px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            fontSize: '0.83rem',
                                            color: location.pathname === p ? 'white' : '#555',
                                            background: location.pathname === p ? 'var(--color-red-accent, #D65A5A)' : 'transparent',
                                            transition: 'all 0.15s',
                                            letterSpacing: '0.2px',
                                        }}
                                        onMouseEnter={e => { if (location.pathname !== p) e.currentTarget.style.background = '#f5f5f5'; }}
                                        onMouseLeave={e => { if (location.pathname !== p) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}

                    {/* ── Droite : langue + auth ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <LanguageSwitcher />

                        {!currentWorkshop && (
                            user ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => navigate(isAdmin ? '/app/admin' : '/app')}
                                        style={{
                                            background: '#f8f8f8',
                                            border: '1px solid #e8e8e8',
                                            borderRadius: '8px',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            color: '#444',
                                            maxWidth: '160px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {isAdmin && <span style={{ color: '#C2185B', marginRight: '4px' }}>●</span>}
                                        {user.email}
                                    </button>
                                    <button
                                        onClick={() => { logout(); navigate('/'); }}
                                        title="Se déconnecter"
                                        style={{
                                            background: 'none',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            color: '#888',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <LogOut size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '7px 14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: '#666',
                                        fontSize: '0.84rem',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <Lock size={13} color="#aaa" /> Connexion
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════
                    BANDE 2 — Navigation de l'application (frise)
                    Visible uniquement sur /app/*
                ════════════════════════════════════════════════ */}
                {isInApp && (
                    <div style={{
                        background: 'linear-gradient(180deg, #fafafa 0%, #f4f4f4 100%)',
                        borderTop: '1px solid #ececec',
                        padding: '0 28px',
                    }}>
                        <div style={{
                            maxWidth: '1600px',
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'stretch',
                            gap: '2px',
                            height: '44px',
                        }}>
                            {appLinks.map(link => {
                                const Icon = link.icon;
                                // Détection active manuelle pour éviter le conflit /app vs /app/...
                                const isActive = link.end
                                    ? location.pathname === link.path
                                    : location.pathname.startsWith(link.path);

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '0 16px',
                                            textDecoration: 'none',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            fontFamily: 'var(--font-heading, sans-serif)',
                                            color: isActive ? 'var(--color-red-accent, #D65A5A)' : '#666',
                                            borderBottom: isActive
                                                ? '2px solid var(--color-red-accent, #D65A5A)'
                                                : '2px solid transparent',
                                            transition: 'all 0.15s',
                                            whiteSpace: 'nowrap',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = '#333';
                                                e.currentTarget.style.borderBottomColor = '#ddd';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = '#666';
                                                e.currentTarget.style.borderBottomColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <Icon size={14} />
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Lien "Créer" pour les admins aussi */}
                            {isAdmin && (
                                <>
                                    <div style={{ flex: 1 }} />
                                    <Link
                                        to={{ pathname: '/app/create' }}
                                        state={{ returnTo: location.pathname }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '0 16px',
                                            textDecoration: 'none',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            fontFamily: 'var(--font-heading, sans-serif)',
                                            color: location.pathname === '/app/create' ? 'white' : 'white',
                                            background: 'var(--color-red-accent, #D65A5A)',
                                            margin: '8px 0',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <PlusCircle size={14} />
                                        Nouveau cartel
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ── Modal Connexion ──────────────────────────────── */}
            {showLogin && (
                <div
                    onClick={() => { setShowLogin(false); setLoginError(''); }}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 3000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '18px',
                            padding: '40px',
                            width: '100%',
                            maxWidth: '400px',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Connexion</h2>
                                <p style={{ margin: '4px 0 0', color: '#999', fontSize: '0.85rem' }}>Accès administrateur</p>
                            </div>
                            <button onClick={() => { setShowLogin(false); setLoginError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '700', color: '#555', marginBottom: '6px' }}>Email</label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    autoFocus
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '700', color: '#555', marginBottom: '6px' }}>Mot de passe</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                />
                            </div>

                            {loginError && (
                                <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.87rem' }}>
                                    {loginError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loginLoading}
                                style={{
                                    background: loginLoading ? '#ccc' : '#1a1a1a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '13px',
                                    fontSize: '0.95rem',
                                    fontWeight: '700',
                                    cursor: loginLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginTop: '4px',
                                }}
                            >
                                <LogIn size={16} />
                                {loginLoading ? 'Connexion…' : 'Se connecter'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes menuFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .desktop-nav { display: flex; }
                .mobile-burger { display: none; }
                @media (max-width: 900px) {
                    .desktop-nav { display: none !important; }
                    .mobile-burger { display: block !important; }
                }
            `}</style>
        </>
    );
};

export default SharedHeader;
