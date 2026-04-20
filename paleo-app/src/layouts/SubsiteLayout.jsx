/**
 * SubsiteLayout.jsx
 * Layout pour tous les sous-sites (/site/:slug/*)
 * - Charge le sous-site depuis l'API
 * - Injecte la couleur primaire comme CSS variable
 * - Header propre + footer discret avec retour au site principal
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useParams, useNavigate } from 'react-router-dom';
import { Menu, X, Lock, LogOut, Languages, PlusCircle, Settings2, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/apiClient';

// ── Contexte interne sous-site ────────────────────────────────
export const SubsiteContext = createContext(null);
export const useSubsite = () => useContext(SubsiteContext);

// ── Nav links du sous-site (Accueil · Frise · Présentation · Partenaires) ─
const NAV = (slug) => [
    { to: `/site/${slug}`,              label: 'Accueil',       end: true },
    { to: `/site/${slug}/frise`,        label: 'Frise'                    },
    { to: `/site/${slug}/presentation`, label: 'Présentation'             },
    { to: `/site/${slug}/partenaires`,  label: 'Partenaires'              },
];


const SubsiteLayout = () => {
    const { slug } = useParams();
    const { user, isAdmin, login, logout } = useApp();
    const navigate = useNavigate();

    const [subsite,    setSubsite]    = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);
    const [menuOpen,   setMenuOpen]   = useState(false);

    const [showLogin,     setShowLogin]     = useState(false);
    const [loginEmail,    setLoginEmail]    = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError,    setLoginError]    = useState('');
    const [loginLoading,  setLoginLoading]  = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        try {
            await login(loginEmail, loginPassword);
            setShowLogin(false);
            setLoginEmail('');
            setLoginPassword('');
        } catch (err) {
            setLoginError(err.message || 'Identifiants incorrects');
        } finally {
            setLoginLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        api.subsites.getOne(slug)
            .then(s => { setSubsite(s); setError(null); })
            .catch(() => setError('Sous-site introuvable'))
            .finally(() => setLoading(false));
    }, [slug]);

    // Injecter la couleur primaire en CSS variable + surcharger les tokens globaux
    useEffect(() => {
        if (!subsite) return;
        const el = document.documentElement;
        el.style.setProperty('--subsite-color', subsite.primary_color);
        // Surcharger les tokens globaux pour que les composants partagés héritent de la bonne couleur
        el.style.setProperty('--color-pink-darker', subsite.primary_color);
        el.style.setProperty('--color-red-accent', subsite.primary_color);
        // Version très atténuée pour les fonds (ex: cartel-card)
        el.style.setProperty('--color-pink', `color-mix(in srgb, ${subsite.primary_color} 12%, white)`);
        return () => {
            el.style.removeProperty('--subsite-color');
            el.style.removeProperty('--color-pink-darker');
            el.style.removeProperty('--color-red-accent');
            el.style.removeProperty('--color-pink');
        };
    }, [subsite]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' }}>
            Chargement…
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
            <p style={{ color: '#888', fontSize: '1.1rem' }}>{error}</p>
            <Link to="/" style={{ color: '#555', textDecoration: 'underline', fontSize: '0.9rem' }}>← Retour au site principal</Link>
        </div>
    );

    const color = subsite.primary_color || '#D65A5A';
    const navLinks = NAV(slug);

    return (
        <SubsiteContext.Provider value={subsite}>
            <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ── Header ────────────────────────────────── */}
                <header style={{ background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '58px' }}>

                        {/* Logo / nom */}
                        <Link to={`/site/${slug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <div style={{ width: '10px', height: '32px', borderRadius: '3px', background: color }} />
                            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.3px' }}>
                                {subsite.name}
                            </span>
                        </Link>

                        {/* Nav desktop */}
                        <nav style={{ display: 'flex', gap: '2px', flex: 1 }}>
                            {navLinks.map(l => (
                                <NavLink
                                    key={l.to}
                                    to={l.to}
                                    end={l.end}
                                    style={({ isActive }) => ({
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontSize: '0.88rem',
                                        fontWeight: '600',
                                        color: isActive ? color : '#666',
                                        background: isActive ? `${color}15` : 'transparent',
                                        transition: 'all 0.12s',
                                    })}
                                >
                                    {l.label}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Actions droite */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <LanguageSwitcher />

                            {/* Proposer un cartel (visiteurs + admins) */}
                            <button
                                onClick={() => navigate(`/site/${slug}/create`)}
                                title="Proposer un cartel pour ce sous-site"
                                style={{ background: color, border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <PlusCircle size={14} /> Proposer un cartel
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => navigate(`/site/${slug}/admin/drafts`)}
                                    title="Gérer les cartels de ce sous-site"
                                    style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '8px', padding: '6px 12px', color, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Settings2 size={14} /> Gérer
                                </button>
                            )}
                            {user ? (
                                <button onClick={() => { logout(); navigate(`/site/${slug}`); }} title="Se déconnecter"
                                    style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                                    <LogOut size={14} />
                                </button>
                            ) : (
                                <button onClick={() => setShowLogin(true)} title="Se connecter"
                                    style={{ background: 'white', border: `1px solid ${color}40`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'inherit' }}>
                                    <LogIn size={14} /> Se connecter
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Contenu ───────────────────────────────── */}
                <main style={{ flex: 1 }}>
                    <Outlet />
                </main>

                {/* ── Modal de connexion ───────────────────── */}
                {showLogin && (
                    <div
                        onClick={() => setShowLogin(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'white', borderRadius: '14px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LogIn size={16} color={color} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Se connecter</h3>
                            </div>
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                    placeholder="email@exemple.org"
                                    required
                                    autoFocus
                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                />
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    placeholder="Mot de passe"
                                    required
                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                />
                                {loginError && (
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#d32f2f' }}>{loginError}</p>
                                )}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowLogin(false)}
                                        style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#555', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '600' }}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loginLoading}
                                        style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: loginLoading ? `${color}80` : color, color: 'white', cursor: loginLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '700' }}
                                    >
                                        {loginLoading ? '…' : 'Se connecter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Footer ───────────────────────────────── */}
                <footer style={{ background: '#f8f9fa', borderTop: '1px solid #eee', padding: '32px 24px' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '1rem', color: '#1a1a1a', marginBottom: '4px' }}>{subsite.name}</div>
                            <div style={{ color: '#999', fontSize: '0.82rem' }}>© {new Date().getFullYear()} Atelier 21</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                            <Link to={`/site/${slug}/mentions`} style={{ color: '#aaa', fontSize: '0.82rem', textDecoration: 'none' }}>Mentions légales</Link>
                            <Link to="/contact" style={{ color: '#aaa', fontSize: '0.82rem', textDecoration: 'none' }}>Contact</Link>
                            {/* Lien retour discret */}
                            <Link to="/" style={{ color: '#ccc', fontSize: '0.76rem', textDecoration: 'none', marginTop: '8px' }}>
                                ← Retour au site Paléo-Énergétique
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </SubsiteContext.Provider>
    );
};

export default SubsiteLayout;
