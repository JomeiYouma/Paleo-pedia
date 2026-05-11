import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import api from '../services/apiClient';
import { getPrestationIcon } from '../utils/prestationIcons';

// Page publique « Nos prestations » — cards rendues depuis /api/prestations.
// Le contenu était auparavant codé en dur ; il est désormais administrable
// via /app/admin/prestations.

// ── Card individuelle ────────────────────────────────────────
const PrestationCard = ({ prestation }) => {
    const Icon = getPrestationIcon(prestation.icon_name);
    const bulletLines = (prestation.bullet_points || '')
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
                    {prestation.title}
                </h2>
                {prestation.intro && (
                    <p style={{ fontSize: '1.1rem' }}>{prestation.intro}</p>
                )}
                {prestation.description && (
                    <p style={{ whiteSpace: 'pre-line' }}>{prestation.description}</p>
                )}
                {bulletLines.length > 0 && (
                    <ul style={{ marginTop: '10px' }}>
                        {bulletLines.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                )}
                {prestation.pdf_path && (
                    <p style={{ marginTop: '14px' }}>
                        <a
                            href={prestation.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paleo-btn paleo-btn--ghost"
                            style={{ padding: '10px 18px', fontSize: '0.82rem' }}
                        >
                            <Download size={15} /> {prestation.pdf_label || 'Télécharger la plaquette'}
                        </a>
                    </p>
                )}
            </div>
        </article>
    );
};

const Prestations = () => {
    const { t } = useTranslation();
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

            {/* Bouton plaquette globale */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <a
                    href="#"
                    /* [À REMPLACER : href vers la plaquette PDF globale des prestations,
                        ex: /downloads/plaquette-prestations.pdf ] */
                    className="paleo-btn"
                >
                    <Download size={18} /> Télécharger la plaquette
                </a>
            </div>

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
                    {items.map(p => <PrestationCard key={p.id} prestation={p} />)}
                </div>
            )}
        </div>
    );
};

export default Prestations;
