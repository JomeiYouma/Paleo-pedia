import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../hooks/usePageMeta';

// Page 404 « brandée » : rendue DANS SiteLayout (donc avec le header + le
// footer du site), elle remplace l'écran d'erreur brut de React Router pour
// les routes inconnues, et offre un vrai retour à la navigation.
const NotFound = () => {
    const { t } = useTranslation();
    usePageMeta({ title: t('notFound.title', 'Page introuvable') });
    return (
        <div style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
            <p style={{
                fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, margin: '0 0 8px',
                color: 'var(--color-primary)', fontFamily: 'var(--font-display, inherit)',
            }}>404</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '1.5rem', color: 'var(--color-text)' }}>
                {t('notFound.heading', 'Cette page est introuvable')}
            </h1>
            <p style={{ margin: '0 0 28px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {t('notFound.message', "Le lien est peut-être erroné, ou la page a été déplacée.")}
            </p>
            <Link to="/" style={{
                display: 'inline-block', padding: '12px 24px',
                background: 'var(--color-primary)', color: '#1a1a1a',
                textDecoration: 'none', borderRadius: 6, fontWeight: 700,
            }}>
                {t('notFound.backHome', "Retour à l'accueil")}
            </Link>
        </div>
    );
};

export default NotFound;
