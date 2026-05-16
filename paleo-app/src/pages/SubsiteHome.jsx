/**
 * SubsiteHome.jsx
 * Page d'accueil d'un sous-site — rendu des content_blocks.
 */
import React from 'react';
import { useSubsite } from '../layouts/SubsiteLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { subsiteBasePath } from '../utils/subsiteHost';

const SubsiteHome = () => {
    const subsite = useSubsite();

    if (!subsite) return null;

    const color = subsite.primary_color || '#D65A5A';
    const friseHref = `${subsiteBasePath(subsite.slug)}/frise`;

    return (
        <div>
            {/* ── Hero ──────────────────────────────────────── */}
            <section style={{
                background: `linear-gradient(135deg, ${color}22 0%, #ffffff 100%)`,
                padding: '80px 24px',
                textAlign: 'center',
                minHeight: '45vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <h1 style={{ fontSize: '3.5rem', color, marginBottom: '16px', lineHeight: 1.1 }}>
                    {subsite.name}
                </h1>
                <p style={{ color: '#666', fontSize: '1.2rem', maxWidth: '560px', marginBottom: '40px', lineHeight: 1.5 }}>
                    {subsite.category_name && `Thématique : ${subsite.category_name}`}
                </p>
                <Link
                    to={friseHref}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        background: color, color: 'white',
                        padding: '14px 32px', borderRadius: '50px',
                        textDecoration: 'none', fontWeight: '700', fontSize: '1rem',
                        boxShadow: `0 4px 20px ${color}55`,
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                    Explorer la frise <ArrowRight size={18} />
                </Link>
            </section>

            {/* ── Blocs de contenu ───────────────────────── */}
            {subsite.content_blocks?.length > 0 && (
                <section style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }}>
                    {subsite.content_blocks.map((block, i) => (
                        <Block key={i} block={block} color={color} />
                    ))}
                </section>
            )}
        </div>
    );
};

const Block = ({ block, color }) => {
    switch (block.type) {
        case 'title':
            return (
                <h2 style={{
                    fontSize: block.level === 3 ? '1.6rem' : '2.2rem',
                    fontWeight: '800',
                    color: '#1a1a1a',
                    marginBottom: '16px',
                    marginTop: '48px',
                    borderLeft: `4px solid ${color}`,
                    paddingLeft: '16px',
                }}>
                    {block.content}
                </h2>
            );
        case 'text':
            return (
                <p style={{
                    color: '#444', lineHeight: '1.75', fontSize: '1.05rem',
                    marginBottom: '20px', whiteSpace: 'pre-wrap',
                }}>
                    {block.content}
                </p>
            );
        case 'image':
            return (
                <figure style={{ margin: '32px 0', textAlign: 'center' }}>
                    <img
                        src={block.url}
                        alt={block.caption || ''}
                        style={{
                            maxWidth: '100%', borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        }}
                    />
                    {block.caption && (
                        <figcaption style={{ color: '#999', fontSize: '0.85rem', marginTop: '10px' }}>
                            {block.caption}
                        </figcaption>
                    )}
                </figure>
            );
        default:
            return null;
    }
};

export default SubsiteHome;
