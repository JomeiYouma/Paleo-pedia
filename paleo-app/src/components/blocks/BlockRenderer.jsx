/**
 * BlockRenderer.jsx — rendu read-only des blocs de contenu.
 *
 * Partagé entre la page d'accueil sous-site et la page détail "En savoir plus"
 * des cartels. Garde la rétrocompat avec les anciens blocs (title/text/image)
 * et ajoute video / gallery / quote / button / separator / embed.
 */
import React from 'react';

/** Transforme une URL YouTube/Vimeo en URL d'embed. Retourne null pour les vidéos directes. */
function toVideoEmbed(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
}

const isDirectVideo = (url) => /\.(mp4|webm|ogg)(\?|$)/i.test(url || '');

export const BlockRenderer = ({ block, color = '#D65A5A' }) => {
    if (!block || typeof block !== 'object') return null;
    switch (block.type) {
        case 'title': {
            const Tag = block.level === 1 ? 'h1' : block.level === 3 ? 'h3' : 'h2';
            const fontSize = block.level === 1 ? '2.8rem' : block.level === 3 ? '1.6rem' : '2.2rem';
            return (
                <Tag style={{
                    fontSize, fontWeight: 800, color: '#1a1a1a',
                    margin: '48px 0 16px', borderLeft: `4px solid ${color}`, paddingLeft: '16px',
                }}>
                    {block.content}
                </Tag>
            );
        }
        case 'text':
            return (
                <p style={{
                    color: '#444', lineHeight: 1.75, fontSize: '1.05rem',
                    margin: '0 0 20px', whiteSpace: 'pre-wrap',
                }}>
                    {block.content}
                </p>
            );
        case 'image':
            return (
                <figure style={{ margin: '32px 0', textAlign: 'center' }}>
                    <img src={block.url} alt={block.caption || ''}
                        style={{ maxWidth: '100%', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                    {block.caption && (
                        <figcaption style={{ color: '#999', fontSize: '0.85rem', marginTop: '10px' }}>{block.caption}</figcaption>
                    )}
                </figure>
            );
        case 'video': {
            const embed = toVideoEmbed(block.url);
            return (
                <figure style={{ margin: '32px 0', textAlign: 'center' }}>
                    {embed ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                            <iframe src={embed} title={block.caption || 'video'}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                        </div>
                    ) : isDirectVideo(block.url) ? (
                        <video src={block.url} controls
                            style={{ maxWidth: '100%', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                    ) : (
                        <a href={block.url} target="_blank" rel="noreferrer">{block.url}</a>
                    )}
                    {block.caption && (
                        <figcaption style={{ color: '#999', fontSize: '0.85rem', marginTop: '10px' }}>{block.caption}</figcaption>
                    )}
                </figure>
            );
        }
        case 'gallery': {
            const items = Array.isArray(block.items) ? block.items : [];
            if (!items.length) return null;
            return (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px', margin: '32px 0',
                }}>
                    {items.map((it, idx) => (
                        <figure key={idx} style={{ margin: 0, textAlign: 'center' }}>
                            <img src={it.url} alt={it.caption || ''}
                                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                            {it.caption && (
                                <figcaption style={{ color: '#999', fontSize: '0.78rem', marginTop: '6px' }}>{it.caption}</figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            );
        }
        case 'quote':
            return (
                <blockquote style={{
                    margin: '32px 0', padding: '16px 24px',
                    borderLeft: `4px solid ${color}`, background: `${color}11`,
                    borderRadius: '0 10px 10px 0',
                }}>
                    <p style={{ margin: 0, fontSize: '1.15rem', fontStyle: 'italic', color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        « {block.content} »
                    </p>
                    {block.attribution && (
                        <footer style={{ marginTop: '10px', color: '#777', fontSize: '0.9rem' }}>— {block.attribution}</footer>
                    )}
                </blockquote>
            );
        case 'button': {
            const isSecondary = block.style === 'secondary';
            return (
                <div style={{ margin: '24px 0', textAlign: 'center' }}>
                    <a href={block.url || '#'} target={block.url?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                        style={{
                            display: 'inline-block', padding: '12px 28px', borderRadius: '10px',
                            background: isSecondary ? 'transparent' : color,
                            color: isSecondary ? color : 'white',
                            border: `2px solid ${color}`,
                            fontWeight: 700, textDecoration: 'none', letterSpacing: '0.5px',
                        }}>
                        {block.label || 'En savoir plus'}
                    </a>
                </div>
            );
        }
        case 'separator':
            return <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '40px 0' }} />;
        case 'embed': {
            const height = Number(block.height) || 500;
            if (!block.url) return null;
            return (
                <div style={{ margin: '32px 0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <iframe src={block.url} title={block.caption || 'embed'}
                        style={{ width: '100%', height: `${height}px`, border: 0, display: 'block' }}
                        loading="lazy" />
                </div>
            );
        }
        default:
            return null;
    }
};

export const BlockList = ({ blocks, color }) => {
    if (!Array.isArray(blocks) || !blocks.length) return null;
    return blocks.map((b, i) => <BlockRenderer key={i} block={b} color={color} />);
};

export default BlockRenderer;
