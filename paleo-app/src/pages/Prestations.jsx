import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import api from '../services/apiClient';
import { getPrestationIcon } from '../utils/prestationIcons';
import { pickLang } from '../utils/i18nHelpers';

/** Extrait le book code Calaméo d'une URL `calameo.com/books/<code>` ou `read/<code>`. */
function parseCalameoBookCode(url) {
    if (!url || typeof url !== 'string') return null;
    const m = url.match(/calameo\.com\/(?:books|read)\/([a-z0-9]+)/i);
    return m ? m[1] : null;
}

/** Bascule en layout 3-colonnes au-delà de cette largeur — sinon empilement vertical. */
const WIDE_BREAKPOINT = 900;
function useIsWide(minWidth = WIDE_BREAKPOINT) {
    const [wide, setWide] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia(`(min-width: ${minWidth}px)`).matches
            : true
    );
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
        const onChange = e => setWide(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [minWidth]);
    return wide;
}

// Page publique « Nos prestations » — cards rendues depuis /api/prestations.
// Le contenu était auparavant codé en dur ; il est désormais administrable
// via /app/admin/prestations.

// ── Card individuelle ────────────────────────────────────────
const PrestationCard = ({ prestation, lang, t }) => {
    const Icon = getPrestationIcon(prestation.icon_name);
    const isWide = useIsWide();
    const title       = pickLang(prestation, 'title',       lang) || prestation.title;
    const intro       = pickLang(prestation, 'intro',       lang) || prestation.intro;
    const description = pickLang(prestation, 'description', lang) || prestation.description;
    const bullets     = pickLang(prestation, 'bullet_points', lang) || prestation.bullet_points;
    const pdfLabel    = pickLang(prestation, 'pdf_label',   lang) || prestation.pdf_label;
    const bulletLines = (bullets || '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const hasImage    = !!prestation.image_path;
    const hasPartners = !!prestation.partners_image_path;

    // Sur grand écran : image (1fr) | texte (2fr) | partenaires (1fr).
    // Les colonnes vides sont retirées pour ne pas créer de gap fantôme.
    const topGridColumns = isWide
        ? [
            hasImage    ? 'minmax(0, 1fr)' : null,
            'minmax(0, 2fr)',
            hasPartners ? 'minmax(0, 1fr)' : null,
          ].filter(Boolean).join(' ')
        : '1fr';

    const calameoCode = parseCalameoBookCode(prestation.pdf_path);

    return (
        <article style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: 'var(--color-surface)',
            padding: '32px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-accent)',
            boxShadow: 'var(--shadow-sm)',
        }}>
            {/* Ligne 1 : image | texte | logos partenaires */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: topGridColumns,
                gap: '28px',
                alignItems: 'start',
            }}>
                {hasImage && (
                    <img
                        src={prestation.image_path}
                        alt=""
                        loading="lazy"
                        style={{
                            width: '100%',
                            aspectRatio: '4 / 3',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                        }}
                    />
                )}

                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Icon size={22} color="var(--color-accent)" />
                        </div>
                        <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.6rem' }}>
                            {title}
                        </h2>
                    </div>
                    {intro && (
                        <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>{intro}</p>
                    )}
                    {description && (
                        <p style={{ whiteSpace: 'pre-line' }}>{description}</p>
                    )}
                    {bulletLines.length > 0 && (
                        <ul style={{ marginTop: '10px' }}>
                            {bulletLines.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                    )}
                </div>

                {hasPartners && (
                    <div>
                        <p style={{
                            margin: '0 0 12px',
                            fontSize: '0.82rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: '700',
                            color: 'var(--color-text-muted)',
                        }}>
                            {t('pages.prestations.partnersLabel')}
                        </p>
                        <img
                            src={prestation.partners_image_path}
                            alt={t('pages.prestations.partnersLabel')}
                            loading="lazy"
                            style={{
                                width: '100%',
                                height: 'auto',
                                objectFit: 'contain',
                                borderRadius: 'var(--radius-md)',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Ligne 2 : plaquette pleine largeur */}
            {prestation.pdf_path && (
                calameoCode ? (
                    <div>
                        {pdfLabel && (
                            <p style={{
                                margin: '0 0 8px',
                                fontSize: '0.82rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: '700',
                                color: 'var(--color-text-muted)',
                            }}>
                                {pdfLabel}
                            </p>
                        )}
                        {/* `mode=mini` = viewer minimal Calaméo : juste la page
                            courante + flèches gauche/droite + compteur, sans
                            barre d'outils, sans zoom, sans branding lourd.
                            On contraint la largeur pour éviter que l'iframe
                            ne s'étire et laisse beaucoup de vide autour du
                            livre (qui reste portrait et de taille fixe). */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '720px',
                            margin: '0 auto',
                            aspectRatio: '16 / 10',
                            background: 'var(--color-primary-soft)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                        }}>
                            <iframe
                                src={`//v.calameo.com/?bkcode=${calameoCode}&mode=mini`}
                                title={pdfLabel || 'Plaquette'}
                                frameBorder="0"
                                scrolling="no"
                                allowTransparency="true"
                                allowFullScreen
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 0,
                                    background: 'transparent',
                                }}
                            />
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '0.82rem' }}>
                            <a
                                href={prestation.pdf_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                                {t('pages.prestations.openFull')} <ExternalLink size={11} />
                            </a>
                        </p>
                    </div>
                ) : (
                    <p style={{ margin: 0 }}>
                        <a
                            href={prestation.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paleo-btn paleo-btn--ghost"
                            style={{ padding: '10px 18px', fontSize: '0.82rem' }}
                        >
                            {pdfLabel || t('pages.prestations.viewBrochure')} <ExternalLink size={14} />
                        </a>
                    </p>
                )
            )}
        </article>
    );
};

const Prestations = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.prestations.getAll()
            .then(d => setItems(Array.isArray(d) ? d : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px', lineHeight: '1.6', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)', textAlign: 'center' }}>
                {t('pages.prestations.title')}
            </h1>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '30px', color: 'var(--color-text-muted)' }}>
                {t('pages.prestations.subtitle')}
            </p>

            <p style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--color-text-subtle)', marginBottom: '40px' }}>
                {t('pages.prestations.intro')}
            </p>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    {t('pages.prestations.loading')}
                </p>
            ) : items.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    {t('pages.prestations.empty')}
                </p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    {items.map(p => <PrestationCard key={p.id} prestation={p} lang={lang} t={t} />)}
                </div>
            )}
        </div>
    );
};

export default Prestations;
