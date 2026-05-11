import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Mentions légales — page statique accessible depuis le footer.
 * Contenu : éditeur du site, hébergement, propriété intellectuelle, contact.
 * Distinct de la politique de confidentialité (RGPD/données personnelles).
 */
const LegalNotices = () => {
    const { t } = useTranslation();
    return (
        <div style={{
            maxWidth: '760px', margin: '0 auto',
            padding: '40px 24px 80px',
            color: 'var(--color-text)', lineHeight: 1.6,
        }}>
            <Link to="/" style={{ color: 'var(--color-text-subtle)', textDecoration: 'none', fontSize: '0.88rem' }}>
                ← {t('legal.backHome')}
            </Link>

            <h1 style={{ marginTop: '20px', fontSize: '1.8rem' }}>
                {t('legal.title')}
            </h1>
            <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.85rem', marginTop: '-6px' }}>
                {t('legal.lastUpdate')} : {new Date().toLocaleDateString()}
            </p>

            <h2 style={{ marginTop: '28px', fontSize: '1.15rem' }}>{t('legal.editor.title')}</h2>
            <p>
                {t('legal.editor.body')}{' '}
                <a href="mailto:hello@atelier21.org" style={{ color: 'var(--color-primary)' }}>hello@atelier21.org</a>.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem' }}>{t('legal.publication.title')}</h2>
            <p>{t('legal.publication.body')}</p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem' }}>{t('legal.hosting.title')}</h2>
            <p>
                {t('legal.hosting.body')}<br />
                <a href="https://www.o2switch.fr" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                    o2switch.fr
                </a>
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem' }}>{t('legal.ip.title')}</h2>
            <p>{t('legal.ip.body')}</p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem' }}>{t('legal.contact.title')}</h2>
            <p>
                {t('legal.contact.body')}{' '}
                <a href="mailto:hello@atelier21.org" style={{ color: 'var(--color-primary)' }}>hello@atelier21.org</a>{' '}
                — <Link to="/contact" style={{ color: 'var(--color-primary)' }}>{t('legal.contact.formLink')}</Link>.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem' }}>{t('legal.privacy.title')}</h2>
            <p>
                {t('legal.privacy.body')}{' '}
                <Link to="/politique-confidentialite" style={{ color: 'var(--color-primary)' }}>
                    {t('legal.privacy.linkLabel')}
                </Link>.
            </p>
        </div>
    );
};

export default LegalNotices;
