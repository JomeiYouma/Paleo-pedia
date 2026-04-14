/**
 * SubsitePartners.jsx
 * Page partenaires propre à ce sous-site.
 */
import React from 'react';
import { useSubsite } from '../layouts/SubsiteLayout';
import { ExternalLink } from 'lucide-react';

const SubsitePartners = () => {
    const subsite = useSubsite();
    if (!subsite) return null;

    const color = subsite.primary_color || '#D65A5A';
    const partners = subsite.partners || [];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a' }}>
                Nos Partenaires
            </h1>
            <p style={{ color: '#999', marginBottom: '48px' }}>
                {subsite.name} est soutenu par les acteurs suivants.
            </p>

            {partners.length === 0 ? (
                <p style={{ color: '#bbb', textAlign: 'center', padding: '60px 0' }}>
                    Aucun partenaire associé à ce sous-site pour le moment.
                </p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                    {partners.map(p => (
                        <a
                            key={p.id}
                            href={p.url || '#'}
                            target={p.url ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                gap: '12px', padding: '28px 20px',
                                background: 'white', borderRadius: '14px',
                                border: '1px solid #eee',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                textDecoration: 'none', color: '#1a1a1a',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 20px ${color}25`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}
                        >
                            {p.logo_path ? (
                                <img src={p.logo_path} alt={p.name}
                                    style={{ height: '60px', objectFit: 'contain', maxWidth: '160px' }} />
                            ) : (
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.6rem', fontWeight: '800', color,
                                }}>
                                    {p.name.charAt(0)}
                                </div>
                            )}
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', textAlign: 'center' }}>{p.name}</span>
                            {p.url && <ExternalLink size={13} color="#ccc" />}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubsitePartners;
