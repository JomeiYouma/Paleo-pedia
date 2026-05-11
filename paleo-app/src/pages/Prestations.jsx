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

// Page publique « Nos prestations » — cards rendues depuis /api/prestations.
// Le contenu était auparavant codé en dur ; il est désormais administrable
// via /app/admin/prestations.

// ── Card individuelle ────────────────────────────────────────
const PrestationCard = ({ prestation, lang }) => {
    const Icon = getPrestationIcon(prestation.icon_name);
    const title       = pickLang(prestation, 'title',       lang) || prestation.title;
    const intro       = pickLang(prestation, 'intro',       lang) || prestation.intro;
    const description = pickLang(prestation, 'description', lang) || prestation.description;
    const bullets     = pickLang(prestation, 'bullet_points', lang) || prestation.bullet_points;
    const pdfLabel    = pickLang(prestation, 'pdf_label',   lang) || prestation.pdf_label;
    const bulletLines = (bullets || '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    return (
        <article style={{
            display: 'flex',
            gap: '28px',
            alignItems: 'flex-start',
            background: 'var(--color-surface)',
            padding: '36px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-accent)',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <div style={{
                background: 'var(--color-primary)',
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={30} color="var(--color-accent)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ marginTop: 0, color: 'var(--color-primary)' }}>
                    {title}
                </h2>
                {intro && (
                    <p style={{ fontSize: '1.1rem' }}>{intro}</p>
                )}
                {description && (
                    <p style={{ whiteSpace: 'pre-line' }}>{description}</p>
                )}
                {bulletLines.length > 0 && (
                    <ul style={{ marginTop: '10px' }}>
                        {bulletLines.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                )}
                {prestation.image_path && (
                    <img
                        src={prestation.image_path}
                        alt=""
                        loading="lazy"
                        style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '18px',
                        }}
                    />
                )}
                {(() => {
                    if (!prestation.pdf_path) return null;
                    const calameoCode = parseCalameoBookCode(prestation.pdf_path);
                    if (calameoCode) {
                        return (
                            <div style={{ marginTop: '20px' }}>
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
                                {/* Ratio large pour reproduire la vue "double page" du
                                    plugin Calaméo WordPress : sans la place pour les
                                    deux pages côte à côte, Calaméo bascule sur le
                                    viewer compact avec barre d'outils. */}
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '21 / 9',
                                    background: 'var(--color-primary-soft)',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                }}>
                                    <iframe
                                        src={`//v.calameo.com/?bkcode=${calameoCode}`}
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
                                        Ouvrir en plein écran <ExternalLink size={11} />
                                    </a>
                                </p>
                            </div>
                        );
                    }
                    // URL non-Calaméo (PDF direct, autre viewer) → bouton classique
                    return (
                        <p style={{ marginTop: '14px' }}>
                            <a
                                href={prestation.pdf_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="paleo-btn paleo-btn--ghost"
                                style={{ padding: '10px 18px', fontSize: '0.82rem' }}
                            >
                                {pdfLabel || 'Consulter la plaquette'} <ExternalLink size={14} />
                            </a>
                        </p>
                    );
                })()}
            </div>
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
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', lineHeight: '1.6', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)', textAlign: 'center' }}>
                {t('pages.prestations.title')}
            </h1>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '30px', color: 'var(--color-text-muted)' }}>
                {t('pages.prestations.subtitle')}
            </p>

            <p style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--color-text-subtle)', marginBottom: '40px' }}>
                Chaque prestation dispose de sa propre plaquette détaillée — consultable en ligne via les boutons ci-dessous.
            </p>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    Chargement des prestations…
                </p>
            ) : items.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    Aucune prestation publiée pour le moment.
                </p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    {items.map(p => <PrestationCard key={p.id} prestation={p} lang={lang} />)}
                </div>
            )}
        </div>
    );
};

export default Prestations;
