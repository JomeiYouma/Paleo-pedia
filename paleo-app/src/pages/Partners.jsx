import React from 'react';
import { useTranslation } from 'react-i18next';
import PartnersList from '../components/PartnersList';

const Partners = () => {
    const { t } = useTranslation();

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' }}>
            <h1 style={{ fontSize: '2.75rem', marginBottom: '10px' }}>
                {t('pages.partners.title', 'Partenaires')}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '36px', maxWidth: '720px' }}>
                {t('pages.partners.subtitle', 'Les organisations qui soutiennent et accompagnent le projet.')}
            </p>
            <PartnersList />
        </div>
    );
};

export default Partners;
