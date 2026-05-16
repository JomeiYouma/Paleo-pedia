import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, Map, PenTool, Layers, X, ChevronRight, ExternalLink } from 'lucide-react';
import { categories as categoriesApi, subsites as subsitesApi } from '../services/apiClient';
import { getSubsiteHostUrl } from '../utils/subsiteHost';

const PRIMARY = 'var(--color-primary)';
const ACCENT  = 'var(--color-accent)';

const LandingPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [cats, setCats] = useState([]);
    const [subsites, setSubsites] = useState([]);
    const [explorerMode, setExplorerMode] = useState(null); // 'subsites' | 'categories' | null
    const [loadingCats, setLoadingCats] = useState(false);

    const closeCategoryModal = () => {
        setShowCategoryModal(false);
        setExplorerMode(null);
    };

    // Charger les catégories + sous-sites à la demande
    const openCategoryModal = async () => {
        setShowCategoryModal(true);
        if (explorerMode) return;
        setLoadingCats(true);
        try {
            const subs = await subsitesApi.getAll();
            const subsiteList = Array.isArray(subs) ? subs : [];
            setSubsites(subsiteList);

            if (subsiteList.length > 0) {
                setCats([]);
                setExplorerMode('subsites');
                return;
            }

            const data = await categoriesApi.getAll();
            setCats(Array.isArray(data) ? data : []);
            setExplorerMode('categories');
        } catch (e) {
            console.error('Impossible de charger les catégories', e);
        } finally {
            setLoadingCats(false);
        }
    };

    const handleThemeClick = (item) => {
        setShowCategoryModal(false);
        if (explorerMode === 'subsites') {
            // Si le sous-site a un domaine dédié, on y envoie l'utilisateur
            // (URL canonique, telle qu'on la communique en externe).
            const hostUrl = getSubsiteHostUrl(item.slug);
            if (hostUrl) {
                window.location.href = hostUrl;
            } else {
                navigate(`/site/${item.slug}`);
            }
        } else {
            navigate(`/app?category=${encodeURIComponent(item.name)}`);
        }
    };

    // Fermer le modal sur Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') closeCategoryModal(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div>
            {/* ── Hero Section ─────────────────────────────────────── */}
            <section className="landing-hero" style={{
                background: PRIMARY,
                color: 'var(--color-white)',
                padding: '96px 20px',
                textAlign: 'center',
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'visible',
                zIndex: 1,
            }}>
                {/* Bande accent jaune en bas — accent visuel discret de la nouvelle DA */}
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6px', background: ACCENT, zIndex: 4 }} />

                {/* ── Décor : Mouchot + son invention (gauche) ─────── */}
                <img
                    src="/photos/mouchot_inov.png"
                    alt=""
                    aria-hidden="true"
                    className="landing-hero__decor landing-hero__decor--mouchot-inov"
                />
                <img
                    src="/photos/mouchot.png"
                    alt=""
                    aria-hidden="true"
                    className="landing-hero__decor landing-hero__decor--mouchot"
                />

                {/* ── Décor : Maria + son invention (droite) ───────── */}
                <img
                    src="/photos/maria_inov.png"
                    alt=""
                    aria-hidden="true"
                    className="landing-hero__decor landing-hero__decor--maria-inov"
                />
                <img
                    src="/photos/maria.png"
                    alt=""
                    aria-hidden="true"
                    className="landing-hero__decor landing-hero__decor--maria"
                />

                <div className="landing-hero__content" style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                        marginBottom: '20px',
                        color: 'var(--color-white)',
                        maxWidth: '900px',
                        lineHeight: '1',
                        letterSpacing: '0.02em',
                    }}>
                        {t('landing.hero.title')}
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'rgba(255,255,255,0.85)',
                        maxWidth: '640px',
                        margin: '0 auto 48px auto',
                        lineHeight: '1.5',
                    }}>
                        {t('landing.hero.subtitle')}
                    </p>

                    {/* CTA buttons */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link
                            to="/app"
                            id="cta-explorer-frise"
                            className="paleo-btn paleo-btn--yellow"
                            style={{ padding: '14px 32px', fontSize: '0.95rem', letterSpacing: '0.6px' }}
                        >
                            {t('landing.hero.exploreTimeline')} <ArrowRight size={18} />
                        </Link>

                        <button
                            id="cta-explorer-thematique"
                            onClick={openCategoryModal}
                            className="paleo-btn paleo-btn--inverse"
                            style={{ padding: '14px 32px', fontSize: '0.95rem', letterSpacing: '0.6px' }}
                        >
                            <Layers size={18} /> {t('landing.hero.exploreTheme')}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Quick Access Grid ────────────────────────────────── */}
            {/* Wrapper en pleine largeur pour que le fond gris recouvre les pieds des personnages */}
            <section style={{
                position: 'relative',
                zIndex: 2,
                background: 'var(--color-bg)',
                paddingTop: '80px',
                paddingBottom: '80px',
            }}>
            <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>{t('landing.discoverTitle')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {[
                        { Icon: BookOpen, title: t('landing.cards.approach.title'),    desc: t('landing.cards.approach.desc'),    link: '/presentation', cta: t('landing.cards.approach.cta') },
                        { Icon: Map,      title: t('landing.cards.museum.title'),      desc: t('landing.cards.museum.desc'),      link: '/museum',       cta: t('landing.cards.museum.cta') },
                        { Icon: PenTool,  title: t('landing.cards.prestations.title'), desc: t('landing.cards.prestations.desc'), link: '/prestations',  cta: t('landing.cards.prestations.cta') },
                    ].map(({ Icon, title, desc, link, cta }) => (
                        <Link
                            key={link}
                            to={link}
                            className="landing-card"
                            style={{
                                display: 'block',
                                padding: '28px',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid var(--color-border)',
                                borderTop: `4px solid ${PRIMARY}`,
                                textDecoration: 'none',
                                color: 'var(--color-text)',
                                transition: 'border-top-color 0.18s, box-shadow 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderTopColor = ACCENT; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderTopColor = PRIMARY; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                        >
                            <div style={{ background: PRIMARY, width: '44px', height: '44px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <Icon color={ACCENT} size={22} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{title}</h3>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>{desc}</p>
                            <span style={{ color: PRIMARY, fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.85rem' }}>
                                {cta} →
                            </span>
                        </Link>
                    ))}

                </div>
            </div>
            </section>

            {/* ── Category Modal ───────────────────────────────────── */}
            {showCategoryModal && (
                <div
                    id="modal-thematiques"
                    onClick={(e) => { if (e.target === e.currentTarget) closeCategoryModal(); }}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 5000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                >
                    <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '40px',
                        maxWidth: '560px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--color-border)',
                        position: 'relative',
                    }}>
                        {/* Close */}
                        <button
                            onClick={closeCategoryModal}
                            aria-label={t('common.close')}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'var(--color-primary-soft)', border: 'none', borderRadius: 'var(--radius-md)',
                                width: '36px', height: '36px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            title={t('common.close')}
                        >
                            <X size={18} color="var(--color-text-muted)" />
                        </button>

                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem' }}>{t('landing.modal.title')}</h2>
                        <p style={{ margin: '0 0 28px 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                            {explorerMode === 'subsites'
                                ? t('landing.modal.subsiteHint')
                                : t('landing.modal.categoryHint')}
                        </p>

                        {loadingCats && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-subtle)' }}>{t('common.loadingEllipsis')}</div>
                        )}

                        {!loadingCats && explorerMode === 'categories' && cats.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-subtle)' }}>{t('landing.modal.emptyCategories')}</div>
                        )}

                        {!loadingCats && explorerMode === 'subsites' && subsites.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-subtle)' }}>{t('landing.modal.emptySubsites')}</div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(explorerMode === 'subsites' ? subsites : cats).map(item => {
                                const isSubsite = explorerMode === 'subsites';
                                const itemColor = isSubsite ? (item.primary_color || PRIMARY) : (item.color || PRIMARY);
                                return (
                                <button
                                    key={item.id || item.slug}
                                    id={`theme-btn-${item.id || item.slug}`}
                                    onClick={() => handleThemeClick(item)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 18px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        borderLeft: `4px solid ${itemColor}`,
                                        background: 'var(--color-surface)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 0.15s, border-color 0.15s',
                                        fontSize: '0.95rem',
                                        fontWeight: '700',
                                        fontFamily: 'var(--font-heading)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px',
                                        color: 'var(--color-text)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--color-primary-soft)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'var(--color-surface)';
                                    }}
                                >
                                    <span>{item.name}</span>
                                    <ChevronRight size={18} color="var(--color-text-subtle)" />
                                </button>
                                );
                            })}
                        </div>

                        {/* Lien vers tous les cartels sans filtre */}
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <Link
                                to="/app"
                                onClick={closeCategoryModal}
                                style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}
                            >
                                {t('landing.modal.allCartels')} →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                /* ── Décor du hero : personnages + inventions ─────── */
                /* bottom négatif : les pieds dépassent du hero et se font recouvrir
                   par la section suivante (z-index plus élevé) */
                .landing-hero__decor {
                    position: absolute;
                    bottom: -70px;
                    pointer-events: none;
                    user-select: none;
                    width: auto;
                }

                /* Inventions (arrière-plan, débordent vers les bords) */
                .landing-hero__decor--mouchot-inov {
                    left: -2%;
                    height: 340px;
                    z-index: 1;
                }
                .landing-hero__decor--maria-inov {
                    right: -2%;
                    height: 340px;
                    z-index: 1;
                }

                /* Personnages (premier plan, devant leur invention) */
                .landing-hero__decor--mouchot {
                    left: 10%;
                    height: 540px;
                    z-index: 2;
                }
                .landing-hero__decor--maria {
                    right: 10%;
                    height: 540px;
                    z-index: 2;
                }

                /* Large desktop : on autorise un peu plus de marge */
                @media (min-width: 1600px) {
                    .landing-hero__decor--mouchot { left: 12%; height: 580px; }
                    .landing-hero__decor--maria   { right: 12%; height: 580px; }
                    .landing-hero__decor--mouchot-inov { height: 340px; }
                    .landing-hero__decor--maria-inov   { height: 340px; }
                }

                /* ── Largeur moyenne : layout "écarté" ──────────────
                   Plus assez de place pour empiler invention + personnage :
                   on plaque les persos aux bords et on détache les inventions
                   vers le centre (dans l'espace entre perso et boutons).
                   Persos agrandis (+25%) et inventions réhaussées (+30% de
                   leur hauteur) pour mieux occuper la composition. */
                @media (max-width: 1280px) {
                    .landing-hero__decor--mouchot { left: 0; height: 575px; }
                    .landing-hero__decor--maria   { right: 0; height: 575px; }
                    /* height +60 et bottom −60 : on conserve la hauteur
                       visible mais on prolonge l'image vers le bas pour
                       qu'elle soit coupée par la section grise */
                    .landing-hero__decor--mouchot-inov {
                        left: 16%;
                        right: auto;
                        height: 236px;
                        bottom: -54px;
                    }
                    .landing-hero__decor--maria-inov {
                        right: 16%;
                        left: auto;
                        height: 228px;
                        bottom: -57px;
                    }
                }

                /* Plus étroit encore : on resserre les inventions vers les persos */
                @media (max-width: 1024px) {
                    .landing-hero__decor--mouchot { height: 500px; }
                    .landing-hero__decor--maria   { height: 500px; }
                    .landing-hero__decor--mouchot-inov {
                        left: 13%;
                        height: 212px;
                        bottom: -43px;
                    }
                    .landing-hero__decor--maria-inov {
                        right: 13%;
                        height: 204px;
                        bottom: -46px;
                    }
                }

                /* Fenêtre étroite : on masque tout (perso + invention) */
                @media (max-width: 820px) {
                    .landing-hero__decor { display: none; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
