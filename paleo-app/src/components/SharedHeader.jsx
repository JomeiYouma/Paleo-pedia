import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Menu, X, Lock, LogIn, LogOut,
    Library, PlusCircle, ClipboardList, Settings2, BarChart3,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useNavigate } from 'react-router-dom';
import { subsites as subsitesApi } from '../services/apiClient';
import { getSubsiteHostUrl } from '../utils/subsiteHost';
import { useTranslation } from 'react-i18next';

// ── Liens du site public (inclut la frise) ──────────────────
const SITE_NAV = [
    { path: '/',             labelKey: 'header.home' },
    { path: '/app',          labelKey: 'header.timeline' },
    { path: '/museum',       labelKey: 'header.museum' },
    { path: '/presentation', labelKey: 'header.presentation' },
    { path: '/prestations',  labelKey: 'header.prestations' },
    { path: '/participer',   labelKey: 'header.participer' },
    { path: '/ouvrages',     labelKey: 'header.ouvrages' },
    { path: '/presse',       labelKey: 'header.presse' },
    { path: '/partenaires',  labelKey: 'header.partners' },
    { path: '/contact',      labelKey: 'header.contact' },
];

// ── Liens de l'application (frise) ───────────────────────────
const APP_NAV_VISITOR = [
    { path: '/app',        labelKey: 'nav.library',  icon: Library,       end: true },
    { path: '/app/create', labelKey: 'nav.create', icon: PlusCircle },
];

// Une seule entrée "Cartels" remplace l'ancien trio drafts/pending/published :
// les filtres par statut sont déjà sur la page elle-même (onglets internes), pas
// la peine de les redoubler dans la nav. La pastille rouge reste sur les cartels
// en attente, c'est l'info dont l'admin a besoin d'un coup d'œil.
const APP_NAV_ADMIN = [
    { path: '/app',             labelKey: 'nav.library', icon: Library,         end: true },
    { path: '/app/manage',      labelKey: 'nav.cartels', icon: ClipboardList,   countKey: 'pending' },
    { path: '/app/admin',       labelKey: 'nav.admin',   icon: Settings2 },
    { path: '/app/admin/stats', labelKey: 'nav.stats',   icon: BarChart3 },
];

/**
 * Détermine quel lien d'une nav est actif. Quand plusieurs préfixes matchent
 * (ex: /app/admin/stats startsWith /app/admin), on prend le plus spécifique
 * — sinon GESTION et STATS s'allumeraient ensemble.
 */
function pickActiveLink(links, pathname) {
    const matches = links.filter(link =>
        link.end ? pathname === link.path : pathname.startsWith(link.path)
    );
    return matches.sort((a, b) => b.path.length - a.path.length)[0] || null;
}

// Pastille de notification à côté du libellé "Cartels" : jaune vif sur fond noir,
// fort contraste pour qu'on la repère immédiatement (Opquast — visibilité de l'info).
const NavBadge = ({ count }) => {
    if (!count) return null;
    return (
        <span
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '20px', height: '20px', padding: '0 6px',
                marginLeft: '6px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent)',
                color: 'var(--color-primary)',
                fontSize: '0.7rem', fontWeight: '800',
                lineHeight: 1,
                fontFamily: 'var(--font-heading)',
                border: '1px solid var(--color-primary)',
            }}
            aria-label={`${count} en attente`}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
};

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
    const { user, isAdmin, homeSubsiteId, login, logout, cartels = [] } = useApp();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Compteur visible à côté de l'onglet "Cartels" : on veut attirer l'œil sur
    // ce qui attend une action (modération), sans faire clignoter le reste.
    const adminNavCounts = useMemo(() => {
        if (!isAdmin) return { pending: 0 };
        const scoped = homeSubsiteId
            ? cartels.filter(c => c.subsite_id === homeSubsiteId)
            : cartels;
        return {
            pending: scoped.filter(c => c.status === 'pending_review').length,
        };
    }, [cartels, isAdmin, homeSubsiteId]);

    const [isMenuOpen,     setIsMenuOpen]     = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

    // Précharger les sous-sites pour afficher le badge tenant si l'utilisateur en a un
    useEffect(() => {
        if (homeSubsiteId && subsites.length === 0) {
            subsitesApi.getAll().then(d => setSubsites(Array.isArray(d) ? d : [])).catch(() => {});
        }
    }, [homeSubsiteId]);

    const homeSubsite = homeSubsiteId ? subsites.find(s => s.id === homeSubsiteId) : null;

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
                    background: 'var(--color-primary)',
                    color: 'var(--color-accent)',
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    letterSpacing: '0.3px',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                }}>
                    <span>⚗️ {t('header.workspaceMode')} : {currentWorkshop.name}</span>
                    <button
                        onClick={quitWorkshop}
                        style={{
                            background: 'var(--color-accent)',
                            border: 'none',
                            color: 'var(--color-primary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '4px 14px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            fontFamily: 'var(--font-heading)',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('header.exit')}
                    </button>
                </div>
            )}

            {/* ════════════════════════════════════════════════
                BANDE 1 — Navigation du site public (dark)
            ════════════════════════════════════════════════ */}
            <header style={{
                background: 'var(--color-primary)',
                color: 'var(--color-white)',
                borderBottom: 'none',
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
                        {/* Burger — visible sur mobile uniquement (desktop a la nav centrale) */}
                        <div className="mobile-burger" style={{ position: 'relative' }}>
                            <button
                                onClick={handleMenuOpen}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                    color: 'var(--color-white)',
                                    letterSpacing: '0.4px',
                                    textTransform: 'uppercase',
                                    fontFamily: 'var(--font-heading)',
                                    transition: 'background-color 0.15s',
                                }}
                                title={t('header.home')}
                            >
                                {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
                                <span style={{ display: 'none' }}>{t('header.home')}</span>
                            </button>

                            {/* Dropdown menu site */}
                            {isMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    zIndex: 2000,
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    minWidth: '260px',
                                    padding: '6px',
                                    animation: 'menuFadeIn 0.18s ease-out',
                                }}>
                                    {/* En mode app : liens de l'application */}
                                    {isInApp ? (
                                        <>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-subtle)', padding: '4px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-heading)' }}>
                                                {t('header.navigation', 'Navigation')}
                                            </div>
                                            {(() => {
                                                const activeLink = pickActiveLink(appLinks, location.pathname);
                                                return appLinks.map(link => {
                                                const Icon = link.icon;
                                                const isActive = activeLink?.path === link.path;
                                                return (
                                                    <Link
                                                        key={link.path}
                                                        to={link.path}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        aria-current={isActive ? 'page' : undefined}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                                            textDecoration: 'none',
                                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                                                            fontWeight: '700',
                                                            fontSize: '0.9rem',
                                                            fontFamily: 'var(--font-heading)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.3px',
                                                            background: isActive ? 'var(--color-accent)' : 'transparent',
                                                            transition: 'background-color 0.12s, color 0.12s',
                                                        }}
                                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        <Icon size={15} />
                                                        {t(link.labelKey)}
                                                        {link.countKey && (
                                                            <NavBadge count={adminNavCounts[link.countKey]} />
                                                        )}
                                                    </Link>
                                                );
                                                });
                                            })()}
                                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 0' }} />
                                            <Link
                                                to="/"
                                                onClick={() => setIsMenuOpen(false)}
                                                style={{
                                                    display: 'block', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                                    textDecoration: 'none', color: 'var(--color-text-muted)',
                                                    fontSize: '0.85rem', fontWeight: '700',
                                                    fontFamily: 'var(--font-heading)',
                                                    textTransform: 'uppercase', letterSpacing: '0.3px',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-soft)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                ← {t('header.backToSite', 'Retour au site')}
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            {/* Liens site principal */}
                                            {SITE_NAV.map(link => {
                                                const isActive = location.pathname === link.path;
                                                return (
                                                <Link
                                                    key={link.path}
                                                    to={link.path}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    aria-current={isActive ? 'page' : undefined}
                                                    style={{
                                                        display: 'block',
                                                        padding: '10px 14px',
                                                        borderRadius: 'var(--radius-md)',
                                                        textDecoration: 'none',
                                                        color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                                                        fontWeight: '700',
                                                        fontSize: '0.9rem',
                                                        fontFamily: 'var(--font-heading)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.3px',
                                                        background: isActive ? 'var(--color-accent)' : 'transparent',
                                                        transition: 'background-color 0.12s, color 0.12s',
                                                    }}
                                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    {t(link.labelKey)}
                                                </Link>
                                                );
                                            })}

                                            {/* Sous-sites / Thématiques */}
                                            {subsites.length > 0 && (
                                                <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0', paddingTop: '6px' }}>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-subtle)', padding: '2px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-heading)' }}>{t('header.themes')}</div>
                                                    {subsites.map(s => {
                                                        // Si le sous-site a un domaine dédié (paleo-h2o.org, etc.),
                                                        // on génère un <a> vers son URL canonique. Sinon Link interne.
                                                        const hostUrl = getSubsiteHostUrl(s.slug);
                                                        const itemStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: '700', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.3px', transition: 'background-color 0.12s' };
                                                        const hoverIn  = e => e.currentTarget.style.background = 'var(--color-primary-soft)';
                                                        const hoverOut = e => e.currentTarget.style.background = 'transparent';
                                                        const inner = (
                                                            <>
                                                                <div style={{ width: '4px', height: '18px', background: s.primary_color, flexShrink: 0 }} />
                                                                {s.name}
                                                            </>
                                                        );
                                                        return hostUrl ? (
                                                            <a key={s.slug} href={hostUrl} onClick={() => setIsMenuOpen(false)} style={itemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                                                                {inner}
                                                            </a>
                                                        ) : (
                                                            <Link key={s.slug} to={`/site/${s.slug}`} onClick={() => setIsMenuOpen(false)} style={itemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                                                                {inner}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Lien vers la frise */}
                                            <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />
                                            <Link
                                                to="/app"
                                                onClick={() => setIsMenuOpen(false)}
                                                style={{
                                                    display: 'block',
                                                    padding: '10px 14px',
                                                    borderRadius: 'var(--radius-md)',
                                                    textDecoration: 'none',
                                                    color: 'var(--color-primary)',
                                                    fontWeight: '700',
                                                    fontSize: '0.9rem',
                                                    fontFamily: 'var(--font-heading)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.3px',
                                                    background: 'var(--color-accent)',
                                                    transition: 'background-color 0.12s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
                                            >
                                                {t('header.timeline')} →
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Logo */}
                        <Link
                            to="/"
                            style={{
                                textDecoration: 'none',
                                color: 'var(--color-white)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            <div style={{
                                width: '6px',
                                height: '32px',
                                background: 'var(--color-accent)',
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: '1.25rem',
                                fontFamily: 'var(--font-display)',
                                fontWeight: '400',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: 'var(--color-white)',
                            }}>
                                {currentWorkshop ? currentWorkshop.name : 'Paléo-Énergétique'}
                            </span>
                        </Link>
                    </div>

                    {/* ── Centre : liens rapides (toujours visibles sur desktop) ── */}
                    <nav className="desktop-nav" style={{
                        gap: '2px',
                        flexWrap: 'wrap',
                    }} aria-label={t('header.navigation', 'Navigation')}>
                        {SITE_NAV.map(link => {
                            const p = link.path;
                            const isActive = p === '/app'
                                ? location.pathname.startsWith('/app')
                                : location.pathname === p;
                            return (
                                <Link
                                    key={p}
                                    to={p}
                                    className="paleo-nav-link"
                                    aria-current={isActive ? 'page' : undefined}
                                    style={{
                                        padding: '8px 16px 10px',
                                        borderRadius: 'var(--radius-md)',
                                        textDecoration: 'none',
                                        fontFamily: 'var(--font-heading)',
                                        fontWeight: '700',
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px',
                                        color: isActive ? 'var(--color-primary)' : 'var(--color-white)',
                                        background: isActive ? 'var(--color-accent)' : 'transparent',
                                        transition: 'background-color 0.18s, color 0.18s',
                                    }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,231,0,0.12)'; e.currentTarget.style.color = 'var(--color-accent)'; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-white)'; } }}
                                >
                                    {t(link.labelKey)}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── Droite : langue + auth ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <LanguageSwitcher />

                        {!currentWorkshop && (
                            user ? (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {homeSubsite && (
                                        <span
                                            title={`Sous-site géré : ${homeSubsite.name}`}
                                            style={{
                                                background: 'rgba(255,255,255,0.12)',
                                                color: 'var(--color-white)',
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '4px 10px',
                                                fontSize: '0.74rem',
                                                fontWeight: '700',
                                                fontFamily: 'var(--font-heading)',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '140px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {homeSubsite.name}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setIsUserMenuOpen(v => !v)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255,255,255,0.25)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            color: 'var(--color-white)',
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontFamily: 'var(--font-heading)',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px',
                                        }}
                                    >
                                        {isAdmin && <span style={{ color: 'var(--color-accent)', marginRight: '6px' }}>●</span>}
                                        {user.email}
                                    </button>

                                    {isUserMenuOpen && (
                                        <>
                                            <div
                                                onClick={() => setIsUserMenuOpen(false)}
                                                style={{ position: 'fixed', inset: 0, zIndex: 1500 }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 6px)',
                                                right: 0,
                                                zIndex: 2000,
                                                background: 'var(--color-surface)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                boxShadow: 'var(--shadow-lg)',
                                                minWidth: '220px',
                                                padding: '6px',
                                            }}>
                                                {isAdmin && ['admin', 'stats'].map(key => {
                                                    const Icon = key === 'admin' ? Settings2 : BarChart3;
                                                    const target = key === 'admin' ? '/app/admin' : '/app/admin/stats';
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => { setIsUserMenuOpen(false); navigate(target); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                background: 'none',
                                                                border: 'none',
                                                                borderRadius: 'var(--radius-md)',
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.82rem',
                                                                color: 'var(--color-text)',
                                                                textAlign: 'left',
                                                                fontFamily: 'var(--font-heading)',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.3px',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-soft)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                        >
                                                            <Icon size={14} />
                                                            {t(`nav.${key}`)}
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => {
                                                        setIsUserMenuOpen(false);
                                                        logout();
                                                        navigate('/app');
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        width: '100%',
                                                        background: 'none',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        color: '#888',
                                                        textAlign: 'left',
                                                        fontFamily: 'inherit',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <LogOut size={14} />
                                                    {t('header.logout')}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '7px 14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'var(--color-white)',
                                        fontSize: '0.82rem',
                                        fontFamily: 'var(--font-heading)',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px',
                                    }}
                                >
                                    <Lock size={13} /> {t('header.login')}
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
                        background: 'var(--color-surface)',
                        borderTop: '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '0 28px',
                    }}>
                        <div style={{
                            maxWidth: '1600px',
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'stretch',
                            gap: '0',
                            height: '46px',
                        }}>
                            {(() => {
                                const activeLink = pickActiveLink(appLinks, location.pathname);
                                return appLinks.map(link => {
                                const Icon = link.icon;
                                const isActive = activeLink?.path === link.path;

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        aria-current={isActive ? 'page' : undefined}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '0 18px',
                                            textDecoration: 'none',
                                            fontSize: '0.82rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            fontFamily: 'var(--font-heading)',
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            borderBottom: isActive
                                                ? '3px solid var(--color-accent)'
                                                : '3px solid transparent',
                                            background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                                            transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                                            whiteSpace: 'nowrap',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = 'var(--color-primary)';
                                                e.currentTarget.style.background = 'var(--color-primary-soft)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = 'var(--color-text-muted)';
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <Icon size={14} />
                                        {t(link.labelKey)}
                                        {link.countKey && (
                                            <NavBadge count={adminNavCounts[link.countKey]} />
                                        )}
                                    </Link>
                                );
                                });
                            })()}

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
                                            padding: '0 18px',
                                            textDecoration: 'none',
                                            fontSize: '0.82rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            fontFamily: 'var(--font-heading)',
                                            color: 'var(--color-primary)',
                                            background: 'var(--color-accent)',
                                            margin: '8px 0',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    >
                                        <PlusCircle size={14} />
                                        {t('manageCartels.newCartel')}
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
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '40px',
                            width: '100%',
                            maxWidth: '400px',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{t('header.login')}</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>{t('header.adminAccess')}</p>
                            </div>
                            <button
                                onClick={() => { setShowLogin(false); setLoginError(''); }}
                                aria-label="Fermer"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '6px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    autoFocus
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '6px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mot de passe</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>

                            {loginError && (
                                <div role="alert" style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--color-error)', fontSize: '0.87rem' }}>
                                    {loginError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loginLoading}
                                style={{
                                    background: loginLoading ? 'var(--color-border-strong)' : 'var(--color-primary)',
                                    color: 'var(--color-white)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '13px',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-heading)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    cursor: loginLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginTop: '4px',
                                }}
                            >
                                <LogIn size={16} />
                                {loginLoading ? `${t('header.login')}…` : t('header.login')}
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
                /* Nav desktop : visible partout sauf /app/* */
                .desktop-nav { display: flex; }
                /* Burger mobile : visible seulement sur petit écran */
                .mobile-burger { display: none; }
                /* Burger app : toujours visible (desktop + mobile) quand dans /app/* */
                .app-burger { display: block; }
                @media (max-width: 900px) {
                    .desktop-nav { display: none !important; }
                    .mobile-burger { display: block !important; }
                }
            `}</style>
        </>
    );
};

export default SharedHeader;
