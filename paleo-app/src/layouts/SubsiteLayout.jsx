/**
 * SubsiteLayout.jsx
 * Layout pour tous les sous-sites (/site/:slug/*)
 * - Charge le sous-site depuis l'API
 * - Injecte la couleur primaire comme CSS variable
 * - Header propre + footer discret avec retour au site principal
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Lock, LogOut, Languages, PlusCircle, Settings2, LogIn, Home, Users, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SubsiteEditor from '../components/SubsiteEditor';
import api from '../services/apiClient';
import { rememberReturn } from '../utils/navigation';
import { getHostSubsiteSlug, subsiteBasePath, MAIN_SITE_URL, mainSitePath } from '../utils/subsiteHost';

// ── Contexte interne sous-site ────────────────────────────────
export const SubsiteContext = createContext(null);
export const useSubsite = () => useContext(SubsiteContext);

// Lien du pied de page vers une page globale du site principal. `mainSitePath`
// renvoie une URL absolue sur un host dédié (où ces routes n'existent pas) →
// on rend alors un <a> ; sinon un <Link> pour la navigation SPA.
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

    const refreshSubsite = async () => {
        try {
            const fresh = await api.subsites.getOne(slug);
            if (fresh) setSubsite(fresh);
        } catch { /* silencieux : la fermeture de la modale ne doit pas planter */ }
    };

    return (
        <SubsiteContext.Provider value={subsite}>
            <div style={{ fontFamily: 'var(--font-body)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ── Header (dark, signature couleur du sous-site) ───────────── */}
                <header style={{ background: 'var(--color-primary)', color: 'var(--color-white)', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '60px' }}>

                        {/* Logo / nom */}
                        <Link to={homeHref} style={{ textDecoration: 'none', color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <div style={{ width: '6px', height: '32px', background: color }} />
                            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '400', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                {subsite.name}
                            </span>
                        </Link>

                        {/* Nav desktop */}
                        <nav aria-label={`Navigation ${subsite.name}`} style={{ display: 'flex', gap: '2px', flex: 1, marginLeft: '20px' }}>
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

                        {/* Actions droite */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <LanguageSwitcher />

                            {/* Proposer un cartel (visiteurs + admins) */}
                            <button
                                onClick={() => {
                                    const returnTo = rememberReturn(location);
                                    navigate(`${base}/create`, { state: { returnTo } });
                                }}
                                title={t('subsite.proposeCartelTitle', 'Proposer un cartel pour ce sous-site')}
                                style={{ background: color, border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 14px', color: 'var(--color-white)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <PlusCircle size={14} /> {t('subsite.proposeCartel', 'Proposer un cartel')}
                            </button>

                            {canEditSubsite && (
                                <button
                                    onClick={() => setShowEditor(true)}
                                    title={t('subsite.homePageTitle', "Éditer le contenu de la page d'accueil, la couleur et les partenaires")}
                                    style={adminBtnStyle(false)}
                                >
                                    <Home size={14} /> {t('subsite.homePage', "Page d'accueil")}
                                </button>
                            )}
                            {canEditSubsite && (
                                <button
                                    onClick={() => navigate(`${base}/admin/team-content`)}
                                    title={t('subsite.teamTitle', 'Gérer les membres affichés sur la page « À propos » de ce sous-site')}
                                    aria-current={onTeamContent ? 'page' : undefined}
                                    style={adminBtnStyle(onTeamContent)}
                                >
                                    <Users size={14} /> {t('subsite.team', 'Équipe')}
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate(`${base}/admin/published`)}
                                    title={t('subsite.manageTitle', 'Gérer les cartels de ce sous-site')}
                                    aria-current={onManage ? 'page' : undefined}
                                    style={adminBtnStyle(onManage)}
                                >
                                    <Settings2 size={14} /> {t('subsite.manage', 'Gérer')}
                                </button>
                            )}
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
                        onClose={() => setShowEditor(false)}
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
                <footer style={{ background: 'var(--color-primary)', color: 'var(--color-white)', padding: '32px 24px', borderTop: `4px solid ${color}` }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-white)', marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{subsite.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>© {new Date().getFullYear()} Atelier 21</div>
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
                            <FooterLink to={mainSitePath('/mentions-legales')}>{t('subsite.legalNotices', 'Mentions légales')}</FooterLink>
                            <FooterLink to={mainSitePath('/politique-confidentialite')}>{t('subsite.privacy', 'Politique de confidentialité')}</FooterLink>
                            <FooterLink to={mainSitePath('/contact')}>{t('subsite.contact', 'Contact')}</FooterLink>
                            <a href={MAIN_SITE_URL} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textDecoration: 'none', marginTop: '8px' }}>
                                {t('subsite.mainSiteLink', 'Accéder au site Paléo-Énergétique →')}
                            </a>
                        </nav>
                    </div>
                </footer>
            </div>
        </SubsiteContext.Provider>
    );
};

export default SubsiteLayout;
