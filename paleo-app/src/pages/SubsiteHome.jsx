/**
 * SubsiteHome.jsx
 * Page d'accueil d'un sous-site — rendu des content_blocks.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSubsite, useSubsiteEditor } from '../layouts/SubsiteLayout';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutTemplate, Pencil } from 'lucide-react';
import { subsiteBasePath } from '../utils/subsiteHost';
import { BlockList } from '../components/blocks/BlockRenderer';

const SubsiteHome = () => {
    const subsite = useSubsite();
    const { canEditSubsite, openEditor } = useSubsiteEditor();
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

    // Page d'accueil vide (aucun bloc affiché) : on invite l'admin/propriétaire
    // à la configurer. Repère visible UNIQUEMENT pour qui peut éditer le sous-site.
    const homeIsEmpty = !homeBlocks || homeBlocks.length === 0;
    const showEmptyHomeCta = canEditSubsite && homeIsEmpty;

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
                paddingBottom: (homeBlocks?.length > 0 || showEmptyHomeCta) ? '60px' : '0',
            }}>
                {homeBlocks?.length > 0 && (
                    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
                        <BlockList blocks={homeBlocks} color={color} />
                    </div>
                )}

                {/* ── Repère admin : page d'accueil vide ──────────
                   Visible seulement par un admin/propriétaire pouvant éditer ce
                   sous-site. Clic → ouvre le module de contrôle de la page
                   d'accueil (SubsiteEditor, géré par le layout). */}
                {showEmptyHomeCta && (
                    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px' }}>
                        <div style={{
                            border: `2px dashed ${color}`,
                            borderRadius: 'var(--radius-lg)',
                            background: `color-mix(in srgb, ${color} 6%, white)`,
                            padding: '40px 32px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '18px',
                        }}>
                            <div style={{
                                width: '54px', height: '54px', borderRadius: '50%',
                                background: color, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <LayoutTemplate size={26} color="var(--color-white)" />
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: 'var(--color-text)' }}>
                                    {t('subsite.emptyHomeTitle', "Votre page d'accueil est vide")}
                                </h2>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>
                                    {t('subsite.emptyHomeText', "Ajoutez du texte, des images ou des blocs pour présenter votre thématique aux visiteurs. Ce message n'est visible que par vous, en tant qu'administrateur.")}
                                </p>
                            </div>
                            <button
                                onClick={openEditor}
                                style={{
                                    background: color, border: 'none', borderRadius: 'var(--radius-md)',
                                    padding: '12px 24px', cursor: 'pointer',
                                    color: 'var(--color-primary)',
                                    fontSize: '0.85rem', fontWeight: '700', fontFamily: 'var(--font-heading)',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                <Pencil size={16} /> {t('subsite.emptyHomeCta', "Configurer la page d'accueil")}
                            </button>
                        </div>
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
