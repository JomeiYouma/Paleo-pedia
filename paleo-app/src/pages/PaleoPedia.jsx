import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExternalLink, Boxes } from 'lucide-react';
import { HOST_TO_SUBSITE_SLUG, MAIN_SITE_URL, PEDIA_SITE_URL, isPediaHost, pediaBasePath } from '../utils/subsiteHost';
import { usePageMeta } from '../hooks/usePageMeta';
import api from '../services/apiClient';
import MethodoSection from '../components/pedia/MethodoSection';

// Vitrine "paleo-pedia" : page d'entrée qui présente l'écosystème Paléo
// (programme central + sous-sites thématiques). Servie pour l'instant sur
// /pedia ; quand paleo-energetique.org sera acquis, elle prendra la racine
// de paleo-pedia.org (cf. memory site-architecture).
//
// L'écosystème est présenté en 3D (WebGL, « système solaire ») quand le
// navigateur le permet ; sinon (ou si l'utilisateur préfère réduire les
// animations) on retombe sur le diagramme 2D, qui reste la version de
// référence pour l'accessibilité et le SEO.

// Scène 3D chargée en lazy : embarque three.js, ne doit jamais entrer dans
// le bundle principal. Vite la découpe en chunk séparé, téléchargé seulement
// quand la 3D est réellement affichée.
const Ecosystem3D = lazy(() => import('../components/pedia/Ecosystem3D'));

// Vrai quand la vitrine est servie sur son host dédié (paleo-pedia.org). Le
// host ne change pas pendant la session SPA → on le calcule une fois.
const ON_PEDIA_HOST = isPediaHost();

// Hub central : le programme principal (Paléo-Énergétique).
//   - sur le host Pédia → c'est un AUTRE domaine : lien absolu, ouvert dans un
//     nouvel onglet (external = true ; en 3D, external déclenche window.open).
//   - en sous-chemin /pedia (même host) → navigation SPA interne vers '/'.
const HUB = {
    host: 'paleo-energetique.org',
    description: 'Frise complète · Détail équipe, projet, museum',
    href: ON_PEDIA_HOST ? MAIN_SITE_URL : '/',
    external: ON_PEDIA_HOST,
};

// Carte slug → domaine dédié (premier hôte non-"www."). Un sous-site qui
// possède un domaine dédié est lié vers https://<host> (externe) ; les autres,
// créés sans domaine, sont accessibles via /site/<slug> sur le site principal.
const SLUG_TO_HOST = Object.entries(HOST_TO_SUBSITE_SLUG)
    .filter(([host]) => !host.startsWith('www.'))
    .reduce((acc, [host, slug]) => { if (!acc[slug]) acc[slug] = host; return acc; }, {});

// Position des orbites autour du hub, sur un cercle (diagramme 2D). Un seul
// sous-site → à droite (angle 0). Deux → opposés. Trois et plus → répartis
// uniformément.
function orbitCoords(index, count, radius = 38) {
    const angle = (index / Math.max(count, 1)) * 2 * Math.PI;
    return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
    };
}

// Détection WebGL (sans monter de contexte coûteux).
function supportsWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
        return false;
    }
}

// Suit la préférence "réduire les animations" (et ses changements à chaud).
// SPA client pur (pas de SSR) → on peut lire matchMedia dès l'init.
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(() =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return reduced;
}

const PaleoPedia = () => {
    const { t } = useTranslation();
    usePageMeta({
        title: 'Paleo Pedia',
        description: "Paleo Pedia — l'écosystème de recherche Paléo : programme principal Paléo-Énergétique et sous-sites thématiques.",
        // Canonical = la vitrine sur son domaine dédié, quel que soit le host
        // courant (évite le duplicate content avec paleo-energetique.org/pedia).
        url: `${PEDIA_SITE_URL}/`,
    });

    // Tous les sous-sites de la base (endpoint public). Chacun devient une
    // planète, qu'il ait un domaine dédié ou non.
    const [subsiteList, setSubsiteList] = useState([]);
    useEffect(() => {
        let alive = true;
        api.subsites.getAll()
            .then(list => { if (alive && Array.isArray(list)) setSubsiteList(list); })
            .catch(() => { /* repli : aucun sous-site affiché */ });
        return () => { alive = false; };
    }, []);

    const orbits = useMemo(() => subsiteList.map(s => {
        const host = SLUG_TO_HOST[s.slug] || null;
        // Cible du lien :
        //   - domaine dédié     → https://<host> (externe, quel que soit le contexte)
        //   - sinon, host Pédia → /site/<slug> du site principal en ABSOLU (autre
        //     domaine → externe : la route /site/:slug n'existe pas sur ce host)
        //   - sinon (host principal) → /site/<slug> en relatif (navigation SPA)
        let href, external;
        if (host)            { href = `https://${host}`;                 external = true; }
        else if (ON_PEDIA_HOST) { href = `${MAIN_SITE_URL}/site/${s.slug}`; external = true; }
        else                 { href = `/site/${s.slug}`;                 external = false; }
        return {
            slug: s.slug,
            name: s.name || s.slug,
            color: s.primary_color || null,
            planetType: s.planet_type || null,          // type choisi (sinon auto)
            host,                                       // domaine dédié éventuel
            href,
            external,
        };
    }), [subsiteList]);

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
            {/* Accroche + intro en tête de page (au-dessus du visuel) */}
            <section aria-labelledby="intro-heading" style={{
                maxWidth: 760,
                margin: '0 auto 44px',
                textAlign: 'center',
            }}>
                <h1 id="intro-heading" style={{
                    margin: '0 0 18px',
                    fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)',
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                }}>
                    {t('footer.tagline')}
                </h1>
                <p style={{
                    margin: 0,
                    fontSize: '1.02rem',
                    lineHeight: 1.65,
                    color: 'var(--color-text-muted)',
                }}>
                    {t('pages.presentation.intro')}
                </p>
            </section>

            {/* Écosystème + visuel */}
            <section id="ecosysteme" aria-labelledby="ecosystem-heading" style={{ marginBottom: 48 }}>
                <h2 id="ecosystem-heading" style={{
                    textAlign: 'center',
                    margin: '0 0 6px',
                    fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                }}>
                    L'écosystème Paléo
                </h2>
                <p style={{
                    textAlign: 'center',
                    margin: '0 0 24px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.95rem',
                }}>
                    Cliquez sur un domaine pour le visiter.
                </p>

                <EcosystemShowcase hub={HUB} orbits={orbits} />
            </section>

            {/* La méthodologie vient à la suite de l'écosystème (même page). */}
            <MethodoSection />

            {/* ── CTA : participer au projet (passerelle vers l'équipe) ──── */}
            <section aria-labelledby="cta-heading" style={{
                marginTop: 56,
                background: 'var(--color-primary)',
                color: 'var(--color-white)',
                borderRadius: 16,
                padding: '48px 32px',
                textAlign: 'center',
            }}>
                <h2 id="cta-heading" style={{ margin: '0 0 14px', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-white)' }}>
                    Participer au projet
                </h2>
                <p style={{ margin: '0 auto 28px', maxWidth: 620, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 }}>
                    Vous êtes enseignant, formateur, collectivité ou acteur de la transition ? Démonstration, formation, frise thématique dédiée ou votre propre plateforme pédagogique : construisons-la ensemble.
                </p>
                <Link
                    to={`${pediaBasePath()}/participer-au-projet`}
                    style={{
                        display: 'inline-block',
                        background: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.9rem',
                        padding: '14px 28px',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    Participer au projet →
                </Link>
            </section>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// Vitrine de l'écosystème : 3D (WebGL) si possible, sinon 2D.
// ════════════════════════════════════════════════════════════════
const EcosystemShowcase = ({ hub, orbits }) => {
    const reducedMotion = usePrefersReducedMotion();
    // SPA client pur → la détection WebGL peut se faire dès l'init.
    const [canUse3D] = useState(() => supportsWebGL());
    // mode : 'auto' (3D si possible & pas reduced-motion) · '3d' · '2d' (forcés).
    // On initialise sur la vue 2D simplifiée (plus lisible d'entrée) ; l'utilisateur
    // bascule en 3D via le bouton.
    const [mode, setMode] = useState('2d');

    const show3D = canUse3D && (mode === '3d' || (mode === 'auto' && !reducedMotion));

    return (
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
            {show3D ? (
                <>
                    <div style={{
                        width: '100%',
                        height: 'clamp(360px, 56vh, 560px)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: '#0e0e12',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
                    }}>
                        {/* Pendant le téléchargement du chunk three.js, repli 2D. */}
                        <Suspense fallback={<Loading3D />}>
                            <Ecosystem3D hub={hub} orbits={orbits} reducedMotion={reducedMotion} />
                        </Suspense>
                    </div>
                    {/* Liens réels masqués : SEO + lecteurs d'écran (canvas non exposé). */}
                    <nav aria-label="Domaines de l'écosystème Paléo" style={SR_ONLY}>
                        <ul>
                            <li>
                                <a href={hub.href} {...(hub.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                                    {hub.host} — {hub.description}
                                </a>
                            </li>
                            {orbits.map(o => (
                                <li key={o.slug}>
                                    <a href={o.href} {...(o.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                                        {o.name}{o.host ? ` (${o.host})` : ''}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </>
            ) : (
                <EcosystemDiagram2D hub={hub} orbits={orbits} />
            )}

            {/* Bascule 3D / 2D — en surimpression, en bas à droite du visuel */}
            {canUse3D && (
                <button
                    type="button"
                    onClick={() => setMode(show3D ? '2d' : '3d')}
                    title={show3D ? 'Afficher la vue 2D simplifiée' : 'Afficher la vue 3D'}
                    style={{
                        position: 'absolute', bottom: 12, right: 12, zIndex: 5,
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '7px 13px', borderRadius: 999,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: 'rgba(255,255,255,0.92)',
                        color: '#1a1a1a',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                        backdropFilter: 'blur(2px)',
                    }}
                >
                    {show3D
                        ? 'Vue simplifiée'
                        : (<><Boxes size={14} aria-hidden="true" /> Vue 3D</>)}
                </button>
            )}
        </div>
    );
};

const Loading3D = () => (
    <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem',
        background: '#0e0e12',
    }}>
        Chargement de la vue 3D…
    </div>
);

// ── Diagramme 2D (repli accessible) ───────────────────────────
// Schéma cliquable : hub au centre, orbites positionnées sur un cercle
// derrière une couche SVG qui dessine les liaisons. Ratio paysage (16/9)
// pour limiter la hauteur. Le SVG est étiré (preserveAspectRatio="none")
// pour que les liaisons restent collées aux pastilles malgré la forme non
// carrée.
const EcosystemDiagram2D = ({ hub, orbits }) => {
    const placed = orbits.map((o, i) => ({ ...o, ...orbitCoords(i, orbits.length) }));

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 720,
            aspectRatio: '16 / 9',
            margin: '0 auto',
        }}>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
                {placed.map((o, i) => (
                    <line
                        key={i}
                        x1="50" y1="50"
                        x2={o.x} y2={o.y}
                        stroke="var(--color-border)"
                        strokeWidth="0.4"
                    />
                ))}
            </svg>

            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <HubNode {...hub} />
            </div>

            {placed.map(orbit => (
                <div
                    key={orbit.slug}
                    style={{
                        position: 'absolute',
                        left: `${orbit.x}%`,
                        top: `${orbit.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <OrbitNode href={orbit.href} external={orbit.external} name={orbit.name} color={orbit.color} />
                </div>
            ))}
        </div>
    );
};

// Hub : disque sombre, texte blanc. Contraste #fff sur #333 = 12.6:1 (WCAG AAA).
const HubNode = ({ host, description, href, external }) => (
    <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'clamp(160px, 26vw, 220px)',
            height: 'clamp(160px, 26vw, 220px)',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'var(--color-white)',
            textDecoration: 'none',
            textAlign: 'center',
            padding: 24,
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
            transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.18)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.14)';
        }}
        onFocus={e => {
            e.currentTarget.style.outline = '2px solid var(--color-primary)';
            e.currentTarget.style.outlineOffset = '4px';
        }}
        onBlur={e => {
            e.currentTarget.style.outline = '';
            e.currentTarget.style.outlineOffset = '';
        }}
    >
        <strong style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', marginBottom: 10 }}>{host}</strong>
        <span style={{ fontSize: '0.85rem', lineHeight: 1.45, opacity: 0.92 }}>{description}</span>
    </a>
);

// Orbite : pastille claire, texte foncé. Contraste #1a1a1a sur #ffffff = 17.4:1.
// Le liseré reprend la couleur du sous-site (cohérent avec la 3D).
const OrbitNode = ({ href, external, name, color }) => (
    <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            borderRadius: 999,
            background: 'var(--color-surface)',
            border: `1px solid ${color || 'var(--color-border)'}`,
            color: 'var(--color-text)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-primary-soft)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--color-surface)';
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
        }}
    >
        {name}
        {external && <ExternalLink size={14} aria-hidden="true" />}
    </a>
);

const SR_ONLY = {
    position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
    overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

export default PaleoPedia;
