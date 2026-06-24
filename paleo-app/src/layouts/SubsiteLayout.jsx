/**
 * SubsiteLayout.jsx
 * Layout pour tous les sous-sites (/site/:slug/*)
 * - Charge le sous-site depuis l'API
 * - Injecte la couleur primaire comme CSS variable
 * - Header propre + footer discret avec retour au site principal
 */
import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Lock, LogOut, Languages, PlusCircle, Settings2, LogIn, Home, Handshake, BookOpen, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SubsiteEditor from '../components/SubsiteEditor';
import api from '../services/apiClient';
import { rememberReturn } from '../utils/navigation';
import { getHostSubsiteSlug, subsiteBasePath, MAIN_SITE_URL, PEDIA_SITE_URL } from '../utils/subsiteHost';

// ── Contexte interne sous-site ────────────────────────────────
export const SubsiteContext = createContext(null);
export const useSubsite = () => useContext(SubsiteContext);

// Contrôles d'édition exposés aux pages enfant (ex : ouvrir l'éditeur de la
// page d'accueil depuis SubsiteHome). Contexte distinct de `useSubsite` pour
// ne pas changer la forme de ce dernier (toujours le sous-site brut).
export const SubsiteEditorContext = createContext({ canEditSubsite: false, openEditor: () => {} });
export const useSubsiteEditor = () => useContext(SubsiteEditorContext);

// Lien de pied de page. Les pages globales (mentions, confidentialité, contact)
// sont désormais rendues DANS le layout du sous-site via des chemins relatifs
// (`${base}/...`) → toujours un <Link>. La branche <a> reste pour d'éventuels
// liens absolus (http) passés en `to`.
const FooterLink = ({ to, children }) => {
    const style = { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textDecoration: 'none' };
    return to.startsWith('http')
        ? <a href={to} style={style}>{children}</a>
        : <Link to={to} style={style}>{children}</Link>;
};

// ── Nav links du sous-site (Accueil · Frise · Présentation · Partenaires) ─
// `base` vaut '' sur le host dédié (paleo-h2o.org) → liens propres `/frise`, etc.
// Sinon vaut `/site/<slug>` (URL classique partout ailleurs).
const NAV = (slug) => {
    const base = subsiteBasePath(slug);
    return [
        { to: base || '/',            key: 'subsite.navHome',         fr: 'Accueil', end: true },
        { to: `${base}/frise`,         key: 'subsite.navFrise',        fr: 'Frise'              },
        { to: `${base}/presentation`,  key: 'subsite.navPresentation', fr: 'Présentation'       },
        { to: `${base}/partenaires`,   key: 'subsite.navPartners',     fr: 'Partenaires'        },
    ];
};


const SubsiteLayout = () => {
    // Sur le host dédié (paleo-h2o.org) la route est `/` sans `:slug` :
    // on retombe alors sur le slug associé au host.
    const params = useParams();
    const slug = params.slug || getHostSubsiteSlug();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { user, isAdmin, isSuperadmin, isOwner, homeSubsiteId, login, logout } = useApp();
    const navigate = useNavigate();

    const [subsite,    setSubsite]    = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);
    const [menuOpen,   setMenuOpen]   = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    // Section sur laquelle ouvrir l'éditeur : null = haut (Page d'accueil),
    // 'partners' = défile jusqu'aux partenaires (item admin « Partenaires »).
    const [editorFocus, setEditorFocus] = useState(null);
    // Menu admin compact (desktop) : regroupe Page d'accueil / Équipe / Gérer.
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    // Repli adaptatif de la navbar : on bascule en burger UNIQUEMENT quand la
    // barre déborde réellement (mesuré ci-dessous), pas à un point de rupture
    // fixe — ainsi le menu complet reste affiché tant qu'il y a la place.
    const [collapsed, setCollapsed] = useState(false);
    const barRef = useRef(null);
    const neededWidthRef = useRef(0);

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
            setLoginError(err.message || t('subsite.loginErrorDefault', 'Identifiants incorrects'));
        } finally {
            setLoginLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        api.subsites.getOne(slug)
            .then(s => { setSubsite(s); setError(false); })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [slug]);

    // Injecter la couleur primaire en CSS variable + surcharger les tokens globaux.
    // L'accent jaune du site principal est remplacé par la couleur du sous-site
    // partout où il joue un rôle de signature (active nav, liseré cartel, focus
    // ring, etc.).
    useEffect(() => {
        if (!subsite) return;
        const el = document.documentElement;
        const primary = subsite.primary_color;
        el.style.setProperty('--subsite-color', primary);
        el.style.setProperty('--color-pink-darker', primary);
        el.style.setProperty('--color-red-accent',  primary);
        el.style.setProperty('--color-accent',      primary);
        el.style.setProperty('--color-accent-hover', `color-mix(in srgb, ${primary} 80%, black)`);
        el.style.setProperty('--color-accent-soft', `color-mix(in srgb, ${primary} 15%, white)`);
        el.style.setProperty('--focus-ring-color',  primary);
        // Version très atténuée pour les fonds (ex: cartel-card)
        el.style.setProperty('--color-pink', `color-mix(in srgb, ${primary} 12%, white)`);
        return () => {
            el.style.removeProperty('--subsite-color');
            el.style.removeProperty('--color-pink-darker');
            el.style.removeProperty('--color-red-accent');
            el.style.removeProperty('--color-accent');
            el.style.removeProperty('--color-accent-hover');
            el.style.removeProperty('--color-accent-soft');
            el.style.removeProperty('--focus-ring-color');
            el.style.removeProperty('--color-pink');
        };
    }, [subsite]);

    // Détection de débordement : on rend la barre complète, puis on mesure si
    // son contenu dépasse la largeur disponible (scrollWidth > clientWidth).
    // Si oui → mode burger, en mémorisant la largeur requise ; on ne ré-étend
    // la barre que lorsque la place redevient suffisante (hystérésis de 8px
    // pour éviter le clignotement à la frontière). Le spacer flexible absorbe
    // la marge tant que ça tient, puis se réduit à 0 avant que ça déborde.
    useLayoutEffect(() => {
        const el = barRef.current;
        if (!el) return;
        const measure = () => {
            if (!collapsed) {
                if (el.scrollWidth > el.clientWidth + 1) {
                    neededWidthRef.current = el.scrollWidth;
                    setCollapsed(true);
                }
            } else if (el.clientWidth >= neededWidthRef.current + 8) {
                setCollapsed(false);
            }
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [collapsed, subsite?.name, user, isAdmin, isSuperadmin, isOwner, i18n.language]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' }}>
            {t('subsite.loading', 'Chargement…')}
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
            <p style={{ color: '#888', fontSize: '1.1rem' }}>{t('subsite.notFound', 'Sous-site introuvable')}</p>
            {getHostSubsiteSlug()
                ? <a href={MAIN_SITE_URL} style={{ color: '#555', textDecoration: 'underline', fontSize: '0.9rem' }}>{t('subsite.backToMain', '← Retour au site principal')}</a>
                : <Link to="/" style={{ color: '#555', textDecoration: 'underline', fontSize: '0.9rem' }}>{t('subsite.backToMain', '← Retour au site principal')}</Link>}
        </div>
    );

    const color = subsite.primary_color || '#D65A5A';
    const navLinks = NAV(slug);
    const base = subsiteBasePath(slug);
    const homeHref = base || '/';

    // ── État actif des menus (calcul fiable sur l'URL) ───────────
    // "Frise" reste actif sur les trois vues de la frise (frise/carte/
    // arborescence). Les autres entrées matchent leur chemin exact.
    const { pathname } = location;
    const adminBase = `${base}/admin`;
    const onTeamContent = pathname === `${adminBase}/team-content`;
    const onManage = !onTeamContent && (pathname === adminBase || pathname.startsWith(`${adminBase}/`));
    const isNavActive = (l) =>
        l.key === 'subsite.navFrise'
            ? ['frise', 'carte', 'arborescence'].some(s => pathname === `${base}/${s}`)
            : pathname === l.to;

    // Style des boutons d'action admin : "rempli" (couleur du sous-site)
    // quand on se trouve sur la section correspondante, sinon "contour".
    const adminBtnStyle = (active) => ({
        background: active ? color : 'var(--color-white)',
        border: `1px solid ${color}`, borderRadius: 'var(--radius-md)', padding: '7px 14px',
        color: active ? 'var(--color-white)' : color, cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: '700', fontFamily: 'var(--font-heading)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        display: 'flex', alignItems: 'center', gap: '6px',
    });

    // Le superadmin peut éditer n'importe quel sous-site. Un owner ne peut
    // éditer que son propre subsite (home_subsite_id === subsite.id). Le
    // backend (subsiteController) re-valide cette règle.
    const canEditSubsite = isSuperadmin || (isOwner && homeSubsiteId === subsite.id);

    // ── Actions admin regroupées sous un seul bouton (comme le site principal) ──
    // Chaque entrée n'apparaît que selon les droits. Le bouton « Administration »
    // (desktop) et le burger (mobile) consomment cette même liste.
    const adminItems = [
        canEditSubsite && { key: 'home',     icon: Home,      label: t('subsite.homePage', "Page d'accueil"), onClick: () => { setEditorFocus(null); setShowEditor(true); } },
        canEditSubsite && { key: 'partners', icon: Handshake, label: t('subsite.partners', 'Partenaires'),    onClick: () => navigate(`${base}/admin/partners`) },
        isAdmin        && { key: 'manage',   icon: Settings2, label: t('subsite.manage', 'Gérer'),            onClick: () => navigate(`${base}/admin/published`),    active: onManage },
    ].filter(Boolean);

    // Styles partagés des menus déroulants (panneau clair posé sur l'en-tête sombre).
    const menuPanelStyle = {
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 2000,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
        minWidth: '220px', padding: '6px',
    };
    const menuItemStyle = (active) => ({
        display: 'flex', alignItems: 'center', gap: '10px', width: '100%', boxSizing: 'border-box',
        padding: '10px 14px', borderRadius: 'var(--radius-md)',
        textDecoration: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: active ? 'var(--color-accent-soft)' : 'transparent',
        color: active ? color : 'var(--color-text)',
        fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '0.85rem',
        textTransform: 'uppercase', letterSpacing: '0.3px',
    });

    const refreshSubsite = async () => {
        try {
            const fresh = await api.subsites.getOne(slug);
            if (fresh) setSubsite(fresh);
        } catch { /* silencieux : la fermeture de la modale ne doit pas planter */ }
    };

    return (
        <SubsiteContext.Provider value={subsite}>
          <SubsiteEditorContext.Provider value={{ canEditSubsite, openEditor: () => setShowEditor(true) }}>
            <div style={{ fontFamily: 'var(--font-body)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ── Header (dark, signature couleur du sous-site) ───────────── */}
                <header style={{ background: 'var(--color-primary)', color: 'var(--color-white)', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <div ref={barRef} style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '60px' }}>

                        {/* Logo / nom */}
                        <Link to={homeHref} style={{ textDecoration: 'none', color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '32px', background: color }} />
                            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '400', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                {subsite.name}
                            </span>
                        </Link>

                        {/* Nav desktop (repliée dans le burger quand ça déborde).
                            flexShrink: 0 → les liens gardent leur largeur naturelle
                            pour que le débordement soit mesurable ; le spacer
                            flexible qui suit absorbe la marge restante. */}
                        {!collapsed && (
                        <nav aria-label={`Navigation ${subsite.name}`} style={{ display: 'flex', gap: '2px', flexShrink: 0, marginLeft: '20px' }}>
                            {navLinks.map(l => {
                                const active = isNavActive(l);
                                return (
                                    <Link
                                        key={l.to}
                                        to={l.to}
                                        aria-current={active ? 'page' : undefined}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 'var(--radius-md)',
                                            textDecoration: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            fontFamily: 'var(--font-heading)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            color: active ? 'var(--color-primary)' : 'var(--color-white)',
                                            background: active ? color : 'transparent',
                                            transition: 'background-color 0.12s, color 0.12s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (active) return;
                                            // Tint léger de la couleur du sous-site pour signaler la cible cliquable
                                            e.currentTarget.style.background = `color-mix(in srgb, ${color} 25%, transparent)`;
                                            e.currentTarget.style.color = color;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (active) return;
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--color-white)';
                                        }}
                                    >
                                        {t(l.key, l.fr)}
                                    </Link>
                                );
                            })}
                        </nav>
                        )}
                        {/* Spacer flexible : pousse les actions à droite et se réduit
                           à 0 avant que la barre ne déborde (déclencheur du repli). */}
                        <div style={{ flex: 1, minWidth: 0 }} />

                        {/* Actions droite */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <LanguageSwitcher />

                            {/* ── Desktop : Proposer + menu admin compact + connexion ── */}
                            {!collapsed && (
                                <>
                                    {/* Proposer un cartel (visiteurs + admins) */}
                                    <button
                                        onClick={() => {
                                            const returnTo = rememberReturn(location);
                                            navigate(`${base}/create`, { state: { returnTo } });
                                        }}
                                        title={t('subsite.proposeCartelTitle', 'Proposer un cartel pour ce sous-site')}
                                        style={{ background: color, border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 14px', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <PlusCircle size={14} /> {t('subsite.proposeCartel', 'Proposer un cartel')}
                                    </button>

                                    {/* Menu admin compact : Page d'accueil · Équipe · Gérer */}
                                    {adminItems.length > 0 && (
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={() => setAdminMenuOpen(v => !v)}
                                                aria-haspopup="true"
                                                aria-expanded={adminMenuOpen}
                                                title={t('subsite.adminMenu', 'Administration du sous-site')}
                                                style={{ ...adminBtnStyle(onManage || onTeamContent), gap: '8px' }}
                                            >
                                                <Settings2 size={14} /> {t('subsite.adminMenu', 'Administration')} <ChevronDown size={13} style={{ opacity: 0.7 }} />
                                            </button>
                                            {adminMenuOpen && (
                                                <>
                                                    <div onClick={() => setAdminMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} />
                                                    <div style={menuPanelStyle}>
                                                        {adminItems.map(it => {
                                                            const Icon = it.icon;
                                                            return (
                                                                <button
                                                                    key={it.key}
                                                                    onClick={() => { setAdminMenuOpen(false); it.onClick(); }}
                                                                    aria-current={it.active ? 'page' : undefined}
                                                                    style={menuItemStyle(it.active)}
                                                                    onMouseEnter={e => { if (!it.active) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                                                                    onMouseLeave={e => { if (!it.active) e.currentTarget.style.background = 'transparent'; }}
                                                                >
                                                                    <Icon size={15} /> {it.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Connexion / déconnexion */}
                                    {user ? (
                                        <button onClick={() => { logout(); navigate(homeHref); }} title={t('subsite.logout', 'Se déconnecter')} aria-label={t('subsite.logout', 'Se déconnecter')}
                                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-md)', padding: '7px 10px', cursor: 'pointer', color: 'var(--color-white)', display: 'flex', alignItems: 'center' }}>
                                            <LogOut size={14} />
                                        </button>
                                    ) : (
                                        <button onClick={() => setShowLogin(true)} title={t('subsite.login', 'Se connecter')}
                                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-md)', padding: '7px 14px', cursor: 'pointer', color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '700', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <LogIn size={14} /> {t('subsite.login', 'Se connecter')}
                                        </button>
                                    )}
                                </>
                            )}

                            {/* ── Replié : navigation + actions dans un burger ── */}
                            {collapsed && (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setMenuOpen(v => !v)}
                                        aria-label="Menu"
                                        aria-haspopup="true"
                                        aria-expanded={menuOpen}
                                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-md)', padding: '8px 10px', cursor: 'pointer', color: 'var(--color-white)', display: 'flex', alignItems: 'center' }}
                                    >
                                        {menuOpen ? <X size={18} /> : <Menu size={18} />}
                                    </button>
                                    {menuOpen && (
                                        <>
                                            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} />
                                            <div style={{ ...menuPanelStyle, minWidth: '240px' }}>
                                                {/* Liens de navigation */}
                                                {navLinks.map(l => {
                                                    const active = isNavActive(l);
                                                    return (
                                                        <Link
                                                            key={l.to}
                                                            to={l.to}
                                                            onClick={() => setMenuOpen(false)}
                                                            aria-current={active ? 'page' : undefined}
                                                            style={menuItemStyle(active)}
                                                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                                                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            {t(l.key, l.fr)}
                                                        </Link>
                                                    );
                                                })}

                                                <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />

                                                {/* Proposer un cartel */}
                                                <button
                                                    onClick={() => { setMenuOpen(false); const returnTo = rememberReturn(location); navigate(`${base}/create`, { state: { returnTo } }); }}
                                                    style={menuItemStyle(false)}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-soft)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <PlusCircle size={15} /> {t('subsite.proposeCartel', 'Proposer un cartel')}
                                                </button>

                                                {/* Actions admin (Page d'accueil · Équipe · Gérer) */}
                                                {adminItems.map(it => {
                                                    const Icon = it.icon;
                                                    return (
                                                        <button
                                                            key={it.key}
                                                            onClick={() => { setMenuOpen(false); it.onClick(); }}
                                                            aria-current={it.active ? 'page' : undefined}
                                                            style={menuItemStyle(it.active)}
                                                            onMouseEnter={e => { if (!it.active) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                                                            onMouseLeave={e => { if (!it.active) e.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            <Icon size={15} /> {it.label}
                                                        </button>
                                                    );
                                                })}

                                                <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />

                                                {/* Connexion / déconnexion */}
                                                {user ? (
                                                    <button
                                                        onClick={() => { setMenuOpen(false); logout(); navigate(homeHref); }}
                                                        style={menuItemStyle(false)}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-soft)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <LogOut size={15} /> {t('subsite.logout', 'Se déconnecter')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { setMenuOpen(false); setShowLogin(true); }}
                                                        style={menuItemStyle(false)}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-soft)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <LogIn size={15} /> {t('subsite.login', 'Se connecter')}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Contenu ───────────────────────────────── */}
                <main style={{ flex: 1 }}>
                    <Outlet />
                </main>

                {/* ── Modal d'édition du sous-site ─────────── */}
                {showEditor && canEditSubsite && (
                    <SubsiteEditor
                        subsite={subsite}
                        canEditIdentity={isSuperadmin}
                        initialFocus={editorFocus}
                        onClose={() => { setShowEditor(false); setEditorFocus(null); }}
                        onSaved={refreshSubsite}
                    />
                )}

                {/* ── Modal de connexion ───────────────────── */}
                {showLogin && (
                    <div
                        onClick={() => setShowLogin(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '28px', maxWidth: '380px', width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LogIn size={16} color="var(--color-white)" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('subsite.loginHeading', 'Se connecter')}</h3>
                            </div>
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                    placeholder="email@exemple.org"
                                    required
                                    autoFocus
                                    style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                />
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    placeholder={t('subsite.passwordPlaceholder', 'Mot de passe')}
                                    required
                                    style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                />
                                {loginError && (
                                    <p role="alert" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-error)' }}>{loginError}</p>
                                )}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowLogin(false)}
                                        style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                    >
                                        {t('subsite.cancel', 'Annuler')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loginLoading}
                                        style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: loginLoading ? 'var(--color-border-strong)' : color, color: 'var(--color-white)', cursor: loginLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                    >
                                        {loginLoading ? '…' : t('subsite.login', 'Se connecter')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Footer ───────────────────────────────── */}
                {/* position+zIndex : le footer doit toujours repeindre par-dessus
                   le décor du hero (personnages en position absolue, qui peuvent
                   déborder vers le bas). Sans ça, les personnages le recouvrent. */}
                <footer style={{ background: 'var(--color-primary)', color: 'var(--color-white)', padding: '32px 24px', borderTop: `4px solid ${color}`, position: 'relative', zIndex: 5 }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-white)', marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{subsite.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>© {new Date().getFullYear()} Atelier 21</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: '2px' }}>
                                {t('footer.createdBy', 'Plateforme créée par')}{' '}
                                <a href="https://jomeiyouma.github.io/portfolio/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)' }}>Youma</a>
                            </div>
                        </div>
                        <nav aria-label={t('subsite.secondaryLinks', 'Liens secondaires')} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                            {/* Lien Guide d'utilisation (PDF statique) — réservé aux utilisateurs
                                connectés (propriétaires). PDF servi depuis public/, selon la langue. */}
                            {user && (
                                <a
                                    href={`/guide-site-dedie-${(i18n.language === 'en' || i18n.language === 'gb') ? 'en' : 'fr'}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <BookOpen size={14} /> {t('subsite.guide', "Guide d'utilisation")}
                                </a>
                            )}
                            <FooterLink to={`${base}/mentions-legales`}>{t('subsite.legalNotices', 'Mentions légales')}</FooterLink>
                            <FooterLink to={`${base}/politique-confidentialite`}>{t('subsite.privacy', 'Politique de confidentialité')}</FooterLink>
                            <FooterLink to={`${base}/contact`}>{t('subsite.contact', 'Contact')}</FooterLink>
                            <a href={PEDIA_SITE_URL} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textDecoration: 'none', marginTop: '8px' }}>
                                {t('subsite.pediaSiteLink', 'Accéder au site Paléo-Pédia →')}
                            </a>
                        </nav>
                    </div>
                </footer>
            </div>
          </SubsiteEditorContext.Provider>
        </SubsiteContext.Provider>
    );
};

export default SubsiteLayout;
