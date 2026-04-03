import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Menu, X, Lock, LogIn, LogOut } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
    { path: '/',            label: 'Accueil' },
    { path: '/app',         label: 'La Frise', end: true },
    { path: '/presentation',label: 'Présentation' },
    { path: '/prestations', label: 'Prestations' },
    { path: '/ouvrages',    label: 'Ouvrages' },
    { path: '/museum',      label: 'Museum' },
    { path: '/contact',     label: 'Contact' },
];

/**
 * Composant Header partagé entre SiteLayout et Layout (app).
 * Quand mode="app" : affiche la navigation de l'appli interne.
 * Quand mode="site" : affiche les liens du site public en burger.
 */
const SharedHeader = ({ mode = 'site', appNavSlot, currentWorkshop, quitWorkshop }) => {
    const { user, isAdmin, login, logout } = useApp();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const location = useLocation();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        try {
            await login(loginEmail, loginPassword);
            setShowLoginModal(false);
            setLoginEmail('');
            setLoginPassword('');
            // Si sur le site public et admin → aller sur la gestion
            if (mode === 'site') navigate('/app/admin');
        } catch (err) {
            setLoginError(err.message || 'Identifiants incorrects');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setShowLoginModal(false);
    };

    return (
        <>
            {/* Workshop Banner */}
            {currentWorkshop && !currentWorkshop.is_immersive && (
                <div style={{ background: '#e0f7fa', color: '#006064', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Mode Atelier : {currentWorkshop.name}
                    <button onClick={quitWorkshop} style={{ marginLeft: '16px', fontSize: '0.8em', color: '#006064', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Quitter
                    </button>
                </div>
            )}

            <header style={{
                background: 'white',
                padding: '16px 32px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                position: 'sticky', top: 0, zIndex: 1000,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: '16px',
            }}>
                {/* ── Gauche : burger + logo ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                            title="Menu"
                        >
                            {isMenuOpen ? <X size={22} color="#333" /> : <Menu size={22} color="#333" />}
                        </button>

                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute', top: '120%', left: 0, zIndex: 2000,
                                background: 'white', border: '1px solid #eee', borderRadius: '10px',
                                boxShadow: '0 6px 24px rgba(0,0,0,0.1)', minWidth: '230px',
                                display: 'flex', flexDirection: 'column', padding: '6px 0',
                                animation: 'fadeIn 0.2s ease-out',
                            }}>
                                {NAV_LINKS.map(link => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="site-menu-item"
                                        style={{
                                            display: 'block', padding: '11px 20px',
                                            textDecoration: 'none', color: '#333',
                                            fontSize: '0.95rem', transition: 'all 0.15s',
                                            borderLeft: '3px solid transparent',
                                            fontWeight: location.pathname === link.path ? '700' : '400',
                                        }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link
                        to="/"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        className="site-logo-link"
                    >
                        <div style={{ width: '34px', height: '34px', background: 'var(--color-pink-darker, #C2185B)', borderRadius: '50%', flexShrink: 0 }} />
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#1a1a1a', transition: 'color 0.15s' }}>
                            {currentWorkshop ? currentWorkshop.name : 'Paléo-Énergétique'}
                        </span>
                    </Link>
                </div>

                {/* ── Centre : navigation ── */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    {appNavSlot ? appNavSlot : (
                        // Mode site : liens rapides vers l'app en style pill
                        <nav style={{ display: 'flex', background: 'white', borderRadius: '50px', padding: '5px', gap: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                            {NAV_LINKS.filter(l => ['/app', '/presentation', '/prestations'].includes(l.path)).map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    style={{
                                        padding: '8px 18px', borderRadius: '30px',
                                        textDecoration: 'none', fontWeight: '700',
                                        fontSize: '0.82rem', letterSpacing: '0.5px',
                                        color: location.pathname === link.path ? 'white' : '#444',
                                        background: location.pathname === link.path ? 'var(--color-red-accent, #C2185B)' : 'transparent',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                {/* ── Droite : langue + auth ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <LanguageSwitcher />

                    {!currentWorkshop && (
                        user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Email cliquable → vers la gestion ou l'admin */}
                                <button
                                    onClick={() => navigate(isAdmin ? '/app/admin' : '/app')}
                                    title={isAdmin ? 'Aller à la gestion' : 'Mon espace'}
                                    style={{
                                        background: '#f8f8f8', border: '1px solid #eee', borderRadius: '8px',
                                        padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem',
                                        color: '#555', maxWidth: '150px', overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {user.email}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    title="Se déconnecter"
                                    style={{
                                        background: 'none', border: '1px solid #ddd', borderRadius: '8px',
                                        padding: '6px 10px', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', gap: '5px', color: '#666', fontSize: '0.82rem',
                                    }}
                                >
                                    <LogOut size={15} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                title="Se connecter"
                                style={{
                                    background: 'none', border: '1px solid #ddd', borderRadius: '8px',
                                    padding: '6px 12px', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.85rem',
                                }}
                            >
                                <Lock size={14} color="#aaa" /> Connexion
                            </button>
                        )
                    )}
                </div>
            </header>

            {/* ── Login Modal ── */}
            {showLoginModal && (
                <div
                    onClick={() => { setShowLoginModal(false); setLoginError(''); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'white', borderRadius: '16px', padding: '36px 40px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'modalIn 0.25s ease-out' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Connexion</h2>
                                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>Accès administrateur</p>
                            </div>
                            <button onClick={() => { setShowLoginModal(false); setLoginError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Email</label>
                                <input
                                    type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                                    placeholder="admin@example.com" required autoFocus
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '5px' }}>Mot de passe</label>
                                <input
                                    type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                                    placeholder="••••••••" required
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                />
                            </div>

                            {loginError && (
                                <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.88rem' }}>
                                    {loginError}
                                </div>
                            )}

                            <button
                                type="submit" disabled={loginLoading}
                                style={{ background: loginLoading ? '#aaa' : 'black', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '1rem', fontWeight: '600', cursor: loginLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <LogIn size={17} />
                                {loginLoading ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .site-menu-item:hover { background: #f9f9f9 !important; color: var(--color-pink-darker, #C2185B) !important; border-left-color: var(--color-pink-darker, #C2185B) !important; padding-left: 25px !important; }
                .site-logo-link:hover span { color: var(--color-pink-darker, #C2185B) !important; }
                .site-logo-link:hover { opacity: 0.9; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modalIn { from { opacity: 0; transform: translateY(-16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </>
    );
};

export default SharedHeader;
