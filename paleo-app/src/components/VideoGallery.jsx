import React, { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * VideoGallery — une vidéo principale (lecteur) + les autres en vignettes
 * cliquables qui la remplacent au clic.
 *
 * - embed youtube-nocookie (respect vie privée / cookies)
 * - pas d'autoplay au chargement ; autoplay uniquement après un clic vignette
 * - vignettes = boutons accessibles (aria-pressed / aria-label)
 *
 * Props : videos = [{ id: '<youtubeId>', title: '<titre>' }, …]
 */
const VideoGallery = ({ videos = [] }) => {
    const [current, setCurrent] = useState(0);
    const [autoplay, setAutoplay] = useState(false);

    if (!videos.length) return null;
    const idx = Math.min(current, videos.length - 1);
    const active = videos[idx];

    return (
        <div style={{ margin: '30px 0' }}>
            {/* Lecteur principal (16/9) */}
            <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%',
                background: 'var(--color-primary-soft)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
            }}>
                <iframe
                    key={active.id + (autoplay ? '-a' : '')}
                    src={`https://www.youtube-nocookie.com/embed/${active.id}?rel=0${autoplay ? '&autoplay=1' : ''}`}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
            </div>

            {/* Vignettes des autres vidéos */}
            {videos.length > 1 && (
                <div role="list" aria-label="Choisir une vidéo" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px',
                    marginTop: '14px',
                }}>
                    {videos.map((v, i) => {
                        const isActive = i === idx;
                        return (
                            <button
                                key={v.id}
                                type="button"
                                role="listitem"
                                onClick={() => { setCurrent(i); setAutoplay(true); }}
                                aria-pressed={isActive}
                                aria-label={`Lire la vidéo : ${v.title}`}
                                title={v.title}
                                style={{
                                    position: 'relative',
                                    padding: 0,
                                    border: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: '#000',
                                    aspectRatio: '16 / 9',
                                    opacity: isActive ? 1 : 0.85,
                                    transition: 'opacity 0.15s, border-color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = isActive ? '1' : '0.85'; }}
                            >
                                <img
                                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                                    alt=""
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <span aria-hidden="true" style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isActive ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.38)',
                                }}>
                                    <Play size={24} color="#fff" fill="#fff" style={{ opacity: isActive ? 0.5 : 0.95 }} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VideoGallery;
