import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Mail, Users } from 'lucide-react';

// Page "Rétrofutur Museum" — contenu repris de
// https://paleo-energetique.org/retrofutur-museum/
// Emplacements [À REMPLACER] : photos additionnelles, plaquette PDF du musée.

const Museum = () => {
    const { t } = useTranslation();
    return (
        <>
            {/* ── Bannière pleine largeur ─────────────────────────────── */}
            <div style={{
                width: '100%',
                height: 'clamp(240px, 38vw, 460px)',
                overflow: 'hidden',
                background: 'var(--color-primary-soft)',
            }}>
                <img
                    src="/photos/museum-banner.png"
                    alt={t('museum.bannerAlt')}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />
            </div>

        <div style={{ maxWidth: '900px', margin: '40px auto 60px', padding: '0 20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                {t('museum.title')}
            </h1>
            <p
                style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', marginTop: 0, marginBottom: '32px' }}
                dangerouslySetInnerHTML={{ __html: t('museum.subtitle') }}
            />

            <blockquote
                style={{
                    margin: '36px 0',
                    padding: '22px 30px',
                    background: 'var(--color-surface)',
                    borderLeft: '4px solid var(--color-accent)',
                    borderRadius: 0,
                    fontStyle: 'italic',
                    color: 'var(--color-text)',
                    lineHeight: '1.55',
                }}
                dangerouslySetInnerHTML={{ __html: t('museum.tagline') }}
            />

            <p dangerouslySetInnerHTML={{ __html: t('museum.intro1Html') }} />

            <p>{t('museum.intro2')}</p>

            <img
                src="/photos/museum-1.jpg"
                alt={t('museum.img1Alt')}
                loading="lazy"
                style={{ width: '100%', borderRadius: '8px', margin: '30px 0' }}
            />

            {/* ── Infos pratiques ──────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px' }}>{t('museum.findUs')}</h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginTop: '20px',
            }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <MapPin size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <strong>{t('museum.addressLabel')}</strong><br />
                        {t('museum.addressLine1')}<br />
                        <span dangerouslySetInnerHTML={{ __html: t('museum.addressLine2Html') }} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <Mail size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <strong>{t('museum.contactLabel')}</strong><br />
                        <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <Users size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <strong>{t('museum.audienceLabel')}</strong><br />
                        {t('museum.audienceText')}
                    </div>
                </div>
            </div>

            {/* ── Une expérience immersive ─────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>{t('museum.immersiveTitle')}</h2>
            <p>{t('museum.immersiveBody')}</p>

            {/* ── Photos intérieures du musée ──────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                margin: '30px 0',
            }}>
                {[1, 2, 3].map(i => (
                    <img
                        key={i}
                        src={`/photos/museum-${i}.jpg`}
                        alt={t('museum.galleryAlt', { n: i })}
                        loading="lazy"
                        style={{
                            width: '100%',
                            aspectRatio: '4 / 3',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            background: '#eee',
                        }}
                    />
                ))}
            </div>

            {/* ── Vidéo de présentation ────────────────────────────────── */}
            <div style={{ margin: '30px 0' }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    background: 'var(--color-primary-soft)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}>
                    <iframe
                        src="https://www.youtube.com/embed/9pG61-I47EA"
                        title={t('museum.videoTitle')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                        }}
                    />
                </div>
            </div>

            {/* ── Expo itinérante ──────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>{t('museum.travelingTitle')}</h2>
            <p>{t('museum.travelingBody')}</p>
            <p>
                <Link to="/prestations" className="paleo-btn">
                    {t('museum.travelingCta')} <span className="paleo-btn-arrow">→</span>
                </Link>
            </p>

            {/* ── Designers & partenaires ──────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>{t('museum.designersTitle')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('museum.designersBodyHtml') }} />
            <p
                style={{ color: 'var(--color-text-muted)' }}
                dangerouslySetInnerHTML={{ __html: t('museum.supportHtml') }}
            />

            {/* ── CTAs participation ───────────────────────────────────── */}
            <div style={{
                marginTop: '50px',
                background: 'var(--color-surface-2)',
                padding: '30px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
            }}>
                <h3 style={{ fontSize: '1.5rem', marginTop: 0, marginBottom: '12px' }}>{t('museum.contributeTitle')}</h3>
                <p>{t('museum.contributeBody')}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
                    <Link to="/participer" className="paleo-btn">
                        {t('museum.contributeCallBtn')}
                    </Link>
                    <Link to="/app/create" className="paleo-btn paleo-btn--outline">
                        {t('museum.contributeProposeBtn')}
                    </Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default Museum;
