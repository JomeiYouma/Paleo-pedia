import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/apiClient';

/**
 * Liste des partenaires sélectionnés pour l'affichage public (primaires + autres).
 *
 * Composant partagé entre la page Partenaires dédiée et la section
 * « Partenaires » de la page À propos. Charge ses données via
 * /api/partners (filtré côté serveur sur la sélection visible).
 */
const PartnersList = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [primaryPartners, setPrimaryPartners] = useState([]);
    const [partners, setPartners] = useState([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await api.partners.getSiteSelection();
                setPrimaryPartners(Array.isArray(data?.primary_partners) ? data.primary_partners : []);
                setPartners(Array.isArray(data?.partners) ? data.partners : []);
            } catch (e) {
                console.error('Erreur chargement partenaires', e);
                setPrimaryPartners([]);
                setPartners([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const renderCard = (p, accent = false) => (
        <a
            key={p.id}
            href={p.url || '#'}
            target={p.url ? '_blank' : '_self'}
            rel="noopener noreferrer"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                minHeight: accent ? '190px' : '150px',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                textDecoration: 'none',
                color: 'var(--color-text)',
                padding: '12px',
                transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
            {/* Tuile blanche derrière le logo : garantit un fond neutre quel que
                soit le PNG (transparent, sombre ou clair) et homogénéise les tailles. */}
            <div style={{
                background: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                width: '100%',
                minHeight: accent ? '120px' : '96px',
                padding: accent ? '20px 28px' : '16px 22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxSizing: 'border-box',
            }}>
                {p.logo_path ? (
                    <img src={p.logo_path} alt={p.name} style={{ height: accent ? '78px' : '60px', maxHeight: '100%', objectFit: 'contain', maxWidth: '100%' }} />
                ) : (
                    <div style={{
                        width: accent ? '72px' : '56px',
                        height: accent ? '72px' : '56px',
                        background: 'var(--color-primary)',
                        color: 'var(--color-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: accent ? '1.8rem' : '1.4rem',
                        letterSpacing: '0.04em',
                    }}>
                        {p.name?.charAt(0) || '?'}
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: accent ? '0.95rem' : '0.85rem', color: 'var(--color-text)' }}>{p.name}</div>
            {p.url && <ExternalLink size={14} color="var(--color-text-subtle)" />}
        </a>
    );

    if (loading) {
        return (
            <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                {t('library.loading', 'Chargement...')}
            </div>
        );
    }

    if (primaryPartners.length === 0 && partners.length === 0) {
        return (
            <div style={{ color: 'var(--color-text-subtle)', textAlign: 'center', padding: '40px 0' }}>
                {t('pages.partners.empty', 'Aucun partenaire affiché pour le moment.')}
            </div>
        );
    }

    return (
        <>
            {primaryPartners.length > 0 && (
                <section style={{ marginBottom: '42px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.5rem' }}>
                        {t('pages.partners.primaryTitle', 'Partenaires principaux')}
                    </h3>
                    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                        {primaryPartners.map(p => renderCard(p, true))}
                    </div>
                </section>
            )}

            {partners.length > 0 && (
                <section>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>
                        {t('pages.partners.secondaryTitle', 'Partenaires')}
                    </h3>
                    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                        {partners.map(p => renderCard(p, false))}
                    </div>
                </section>
            )}
        </>
    );
};

export default PartnersList;
