import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Send, Search, FileText } from 'lucide-react';

// Page "Appel à participation" — contenu repris de
// https://paleo-energetique.org/participer/kit-affiche/
// Les emplacements [À REMPLACER] doivent être complétés (PDF du kit,
// affiche haute définition, exemples concrets d'inventions).
const Participer = () => {
    const { t } = useTranslation();
    const cards = [
        { title: t('participer.cards.techTitle'),         desc: t('participer.cards.techDesc') },
        { title: t('participer.cards.socialTitle'),       desc: t('participer.cards.socialDesc') },
        { title: t('participer.cards.imaginariesTitle'),  desc: t('participer.cards.imaginariesDesc') },
    ];
    return (
        <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-pink-darker, #C2185B)' }}>
                {t('participer.title')}
            </h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                {t('participer.intro')}
            </p>

            {/* ── Proposer une invention directement ───────────────────── */}
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
                marginBottom: '50px',
                textAlign: 'center',
            }}>
                <h2 style={{ marginTop: 0 }}>{t('participer.alreadyIdeaTitle')}</h2>
                <p style={{ marginBottom: '24px' }}>{t('participer.alreadyIdeaBody')}</p>
                <Link to="/app/create" className="paleo-btn">
                    <Send size={18} /> {t('participer.proposeBtn')}
                </Link>
            </div>

            {/* ── Affiche + bouton de téléchargement ───────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '40px',
                alignItems: 'center',
                background: '#fafafa',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '50px',
            }}>
                <img
                    src="/downloads/kit-appel-participation.jpg"
                    alt={t('participer.posterAlt')}
                    style={{
                        width: '100%',
                        aspectRatio: '700 / 989',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        background: '#eee',
                    }}
                />
                <noscript>
                    <a href="/downloads/kit-appel-participation.jpg">{t('participer.posterNoscript')}</a>
                </noscript>

                <div>
                    <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>{t('participer.downloadTitle')}</h2>
                    <p>{t('participer.downloadBody')}</p>
                    <a
                        href="#"
                        /* [À REMPLACER : href vers le PDF du kit affiche, ex: /downloads/kit-appel-participation.pdf ] */
                        className="paleo-btn"
                    >
                        <Download size={18} /> {t('participer.downloadBtn')}
                    </a>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '14px' }}>
                        {t('participer.jpgAvailable')}{' '}
                        <a
                            href="/downloads/kit-appel-participation.jpg"
                            download
                            style={{ color: '#666' }}
                        >
                            {t('participer.jpgLink')}
                        </a>.
                    </p>
                </div>
            </div>

            {/* ── Que recherche-t-on ? ─────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px' }}>{t('participer.lookingForTitle')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                {cards.map((card, i) => (
                    <div
                        key={i}
                        style={{
                            background: 'var(--color-surface)',
                            padding: '20px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            borderTop: '3px solid var(--color-accent)',
                        }}
                    >
                        <Search size={22} color="var(--color-primary)" />
                        <h3 style={{ marginTop: '10px', fontSize: '1.05rem' }}>{card.title}</h3>
                        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', margin: 0 }}>
                            {card.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Comment ça marche ────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px' }}>{t('participer.howTitle')}</h2>
            <ol style={{ paddingLeft: '20px', marginTop: '20px', fontSize: '1.05rem' }}>
                <li style={{ marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('participer.step1Html') }} />
                <li style={{ marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('participer.step2Html') }} />
                <li style={{ marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('participer.step3Html') }} />
                <li dangerouslySetInnerHTML={{ __html: t('participer.step4Html') }} />
            </ol>

            {/* ── Pour aller plus loin ─────────────────────────────────── */}
            <div style={{
                background: '#f8f9fa',
                padding: '24px',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-pink-darker, #C2185B)',
                marginTop: '40px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
            }}>
                <FileText size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong>{t('participer.questionTitle')}</strong><br />
                    <span style={{ fontSize: '0.95rem' }}>
                        {t('participer.questionWriteTo')}{' '}
                        <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>{' '}
                        {t('participer.questionOrVia')} <Link to="/contact">{t('participer.questionContactPage')}</Link>.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Participer;
