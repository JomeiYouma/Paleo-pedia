import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, Map, PenTool, Layers, X, ChevronRight, ExternalLink } from 'lucide-react';
import { categories as categoriesApi, subsites as subsitesApi } from '../services/apiClient';

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
            navigate(`/site/${item.slug}`);
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
            <section style={{
                background: PRIMARY,
                color: 'var(--color-white)',
                padding: '96px 20px',
                textAlign: 'center',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Bande accent jaune en bas — accent visuel discret de la nouvelle DA */}
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6px', background: ACCENT }} />

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
            </section>

            {/* ── Quick Access Grid ────────────────────────────────── */}
            <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
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
            `}</style>
        </div>
    );
};

export default LandingPage;
