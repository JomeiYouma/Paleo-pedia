import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import api from '../services/apiClient';
import { useTranslation } from 'react-i18next';

const Partners = () => {
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
                minHeight: '190px',
                background: 'white',
                borderRadius: '14px',
                border: accent ? '2px solid var(--color-pink-darker, #C2185B)' : '1px solid #eee',
                boxShadow: accent ? '0 4px 20px rgba(194,24,91,0.15)' : '0 2px 12px rgba(0,0,0,0.05)',
                textDecoration: 'none',
                color: '#1a1a1a',
                padding: '20px',
                transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
            {p.logo_path ? (
                <img src={p.logo_path} alt={p.name} style={{ height: '68px', objectFit: 'contain', maxWidth: '180px' }} />
            ) : (
                <div style={{
                    width: '66px', height: '66px', borderRadius: '50%',
                    background: '#fce4ec', color: 'var(--color-pink-darker, #C2185B)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', fontWeight: '800',
                }}>
                    {p.name?.charAt(0) || '?'}
                </div>
            )}
            <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '0.96rem' }}>{p.name}</div>
            {p.url && <ExternalLink size={14} color="#bbb" />}
        </a>
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--color-pink-darker, #C2185B)' }}>
                {t('pages.partners.title', 'Partenaires')}
            </h1>
            <p style={{ color: '#666', marginBottom: '36px', maxWidth: '720px' }}>
                {t('pages.partners.subtitle', 'Les organisations qui soutiennent et accompagnent le projet.')}
            </p>

            {loading ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>
                    {t('library.loading', 'Chargement...')}
                </div>
            ) : (
                <>
                    {primaryPartners.length > 0 && (
                        <section style={{ marginBottom: '42px' }}>
                            <h2 style={{ margin: '0 0 16px', fontSize: '1.45rem', color: '#1a1a1a' }}>
                                {t('pages.partners.primaryTitle', 'Partenaires principaux')}
                            </h2>
                            <div style={{ display: 'grid', gap: '22px', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                                {primaryPartners.map(p => renderCard(p, true))}
                            </div>
                        </section>
                    )}

                    {partners.length > 0 && (
                        <section>
                            <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#666' }}>
                                {t('pages.partners.secondaryTitle', 'Partenaires')}
                            </h2>
                            <div style={{ display: 'grid', gap: '22px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                {partners.map(p => renderCard(p, false))}
                            </div>
                        </section>
                    )}

                    {primaryPartners.length === 0 && partners.length === 0 && (
                        <div style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>
                            {t('pages.partners.empty', 'Aucun partenaire affiché pour le moment.')}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Partners;
