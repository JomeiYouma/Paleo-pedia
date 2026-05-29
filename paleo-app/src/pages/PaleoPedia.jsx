import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { HOST_TO_SUBSITE_SLUG } from '../utils/subsiteHost';
import { usePageMeta } from '../hooks/usePageMeta';

// Vitrine "paleo-pedia" : page d'entrée qui présente l'écosystème Paléo
// (programme central + sous-sites thématiques). Servie pour l'instant sur
// /pedia ; quand paleo-energetique.org sera acquis, elle prendra la racine
// de paleo-pedia.org (cf. memory site-architecture).
//
// Mise en page : le schéma cliquable est le PREMIER élément, mis en avant.
// La présentation textuelle vient en dessous. Palette neutre (gris foncé /
// blanc) sans jaune accent, pour bien démarquer pedia du programme principal.

// Hub central : le programme principal. Tant que paleo-energetique.org
// n'existe pas, son contenu vit à la racine de paleo-pedia.org → on pointe
// le hub vers '/'. Après bascule DNS, ce href deviendra
// 'https://paleo-energetique.org' (external = true).
const HUB = {
    host: 'paleo-energetique.org',
    description: 'Frise complète · Détail équipe, projet, museum',
    href: '/',
    external: false,
};

// Sous-sites en orbite. Dérivés de HOST_TO_SUBSITE_SLUG (les hôtes "www."
// sont filtrés pour ne garder que l'apex canonique) afin que l'ajout d'un
// nouveau sous-site avec domaine dédié apparaisse ici sans modifier ce fichier.
const SUBSITES = Object.entries(HOST_TO_SUBSITE_SLUG)
    .filter(([host]) => !host.startsWith('www.'))
    .map(([host, slug]) => ({ host, slug }));

// Position des orbites autour du hub, sur un cercle. Un seul sous-site →
// à droite (angle 0). Deux → opposés. Trois et plus → répartis uniformément.
function orbitCoords(index, count, radius = 38) {
    const angle = (index / Math.max(count, 1)) * 2 * Math.PI;
    return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
    };
}

const PaleoPedia = () => {
    const { t } = useTranslation();
    usePageMeta({
        title: 'Paleo Pedia',
        description: "Paleo Pedia — l'écosystème de recherche Paléo : programme principal Paléo-Énergétique et sous-sites thématiques.",
        path: '/pedia',
    });

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
            <section aria-labelledby="ecosystem-heading" style={{ marginBottom: 48 }}>
                <h1 id="ecosystem-heading" style={{
                    textAlign: 'center',
                    margin: '0 0 6px',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                }}>
                    L'écosystème Paléo
                </h1>
                <p style={{
                    textAlign: 'center',
                    margin: '0 0 24px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.95rem',
                }}>
                    Cliquez sur un domaine pour le visiter.
                </p>

                <EcosystemDiagram />
            </section>

            <section aria-labelledby="intro-heading" style={{
                maxWidth: 760,
                margin: '0 auto',
                textAlign: 'center',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 40,
            }}>
                <h2 id="intro-heading" style={{
                    margin: '0 0 18px',
                    fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                    color: 'var(--color-text)',
                    lineHeight: 1.25,
                }}>
                    {t('footer.tagline')}
                </h2>
                <p style={{
                    margin: 0,
                    fontSize: '1.02rem',
                    lineHeight: 1.65,
                    color: 'var(--color-text-muted)',
                }}>
                    {t('pages.presentation.intro')}
                </p>
            </section>
        </div>
    );
};

// Schéma cliquable : hub au centre, orbites positionnées sur un cercle
// derrière une couche SVG qui dessine les liaisons. Le ratio est paysage
// (16/9) pour limiter la hauteur — on évite que la vitrine ne demande
// trop de scroll. Le SVG est étiré (preserveAspectRatio="none") pour que
// les liaisons restent collées aux pastilles malgré la forme non carrée.
const EcosystemDiagram = () => {
    const orbits = SUBSITES.map((s, i) => ({ ...s, ...orbitCoords(i, SUBSITES.length) }));

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
                {orbits.map((o, i) => (
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
                <HubNode {...HUB} />
            </div>

            {orbits.map(orbit => (
                <div
                    key={orbit.slug}
                    style={{
                        position: 'absolute',
                        left: `${orbit.x}%`,
                        top: `${orbit.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <OrbitNode host={orbit.host} />
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
const OrbitNode = ({ host }) => (
    <a
        href={`https://${host}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            borderRadius: 999,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
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
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--color-surface)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
        }}
    >
        {host}
        <ExternalLink size={14} aria-hidden="true" />
    </a>
);

export default PaleoPedia;
