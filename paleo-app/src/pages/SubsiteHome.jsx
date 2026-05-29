/**
 * SubsiteHome.jsx
 * Page d'accueil d'un sous-site — rendu des content_blocks.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSubsite } from '../layouts/SubsiteLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { subsiteBasePath } from '../utils/subsiteHost';
import { BlockList } from '../components/blocks/BlockRenderer';

const SubsiteHome = () => {
    const subsite = useSubsite();
    const { t, i18n } = useTranslation();

    if (!subsite) return null;

    const color = subsite.primary_color || '#D65A5A';
    const friseHref = `${subsiteBasePath(subsite.slug)}/frise`;

    // Page d'accueil bilingue : on affiche la version EN si la langue active
    // est l'anglais ET qu'elle contient au moins un bloc ; sinon repli sur le FR.
    const lang = i18n.language === 'gb' ? 'en' : i18n.language;
    const homeBlocks = (lang === 'en' && subsite.content_blocks_en?.length > 0)
        ? subsite.content_blocks_en
        : subsite.content_blocks;

    return (
        <div>
            {/* ── Hero ──────────────────────────────────────── */}
            <section className="subsite-hero" style={{
                background: `linear-gradient(135deg, ${color}22 0%, #ffffff 100%)`,
                padding: '80px 24px',
                textAlign: 'center',
                minHeight: '45vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'visible',
                zIndex: 1,
            }}>
                {/* ── Décor : Mouchot + son invention (gauche) ─────── */}
                <img
                    src="/photos/mouchot_inov.png"
                    alt=""
                    aria-hidden="true"
                    className="subsite-hero__decor subsite-hero__decor--mouchot-inov"
                />
                <img
                    src="/photos/mouchot.png"
                    alt=""
                    aria-hidden="true"
                    className="subsite-hero__decor subsite-hero__decor--mouchot"
                />

                {/* ── Décor : Maria + son invention (droite) ───────── */}
                <img
                    src="/photos/maria_inov.png"
                    alt=""
                    aria-hidden="true"
                    className="subsite-hero__decor subsite-hero__decor--maria-inov"
                />
                <img
                    src="/photos/maria.png"
                    alt=""
                    aria-hidden="true"
                    className="subsite-hero__decor subsite-hero__decor--maria"
                />

                <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '3.5rem', color, marginBottom: '16px', lineHeight: 1.1 }}>
                        {subsite.name}
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.2rem', maxWidth: '560px', marginBottom: '40px', lineHeight: 1.5 }}>
                        {subsite.category_name && t('subsite.theme', { name: subsite.category_name, defaultValue: `Thématique : ${subsite.category_name}` })}
                    </p>
                    <Link
                        to={friseHref}
                        className="paleo-btn paleo-btn--yellow"
                        style={{ padding: '14px 32px', fontSize: '0.95rem', letterSpacing: '0.6px' }}
                    >
                        {t('subsite.exploreFrise', 'Explorer la frise')} <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* ── Blocs de contenu ───────────────────────── */}
            {/* Wrapper pleine largeur en blanc : recouvre les pieds des personnages
               (cf. landing-hero, qui utilise le même artifice avec --color-bg) */}
            <section style={{
                position: 'relative',
                zIndex: 2,
                background: 'var(--color-bg)',
                paddingTop: homeBlocks?.length > 0 ? '60px' : '120px',
                paddingBottom: homeBlocks?.length > 0 ? '60px' : '0',
            }}>
                {homeBlocks?.length > 0 && (
                    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
                        <BlockList blocks={homeBlocks} color={color} />
                    </div>
                )}
            </section>

            {/* ── Styles décor hero ───────────────────────── */}
            <style>{`
                /* bottom négatif : les pieds dépassent du hero et se font recouvrir
                   par la section suivante (z-index plus élevé) */
                .subsite-hero__decor {
                    position: absolute;
                    bottom: -50px;
                    pointer-events: none;
                    user-select: none;
                    width: auto;
                }

                /* Inventions (arrière-plan, débordent vers les bords) */
                .subsite-hero__decor--mouchot-inov {
                    left: -2%;
                    height: 240px;
                    z-index: 1;
                }
                .subsite-hero__decor--maria-inov {
                    right: -2%;
                    height: 240px;
                    z-index: 1;
                }

                /* Personnages (premier plan, devant leur invention) */
                .subsite-hero__decor--mouchot {
                    left: 8%;
                    height: 380px;
                    z-index: 2;
                }
                .subsite-hero__decor--maria {
                    right: 8%;
                    height: 380px;
                    z-index: 2;
                }

                @media (min-width: 1600px) {
                    .subsite-hero__decor--mouchot { left: 10%; height: 420px; }
                    .subsite-hero__decor--maria   { right: 10%; height: 420px; }
                }

                /* Largeur moyenne : on rapproche personnages des bords et
                   on détache les inventions vers le centre */
                @media (max-width: 1280px) {
                    .subsite-hero__decor--mouchot { left: 0; height: 400px; }
                    .subsite-hero__decor--maria   { right: 0; height: 400px; }
                    .subsite-hero__decor--mouchot-inov {
                        left: 14%;
                        right: auto;
                        height: 170px;
                        bottom: -38px;
                    }
                    .subsite-hero__decor--maria-inov {
                        right: 14%;
                        left: auto;
                        height: 165px;
                        bottom: -40px;
                    }
                }

                @media (max-width: 1024px) {
                    .subsite-hero__decor--mouchot { height: 350px; }
                    .subsite-hero__decor--maria   { height: 350px; }
                    .subsite-hero__decor--mouchot-inov {
                        left: 11%;
                        height: 150px;
                        bottom: -30px;
                    }
                    .subsite-hero__decor--maria-inov {
                        right: 11%;
                        height: 145px;
                        bottom: -32px;
                    }
                }

                /* Fenêtre étroite : on masque tout pour ne pas écraser le contenu */
                @media (max-width: 820px) {
                    .subsite-hero__decor { display: none; }
                }
            `}</style>
        </div>
    );
};

export default SubsiteHome;
