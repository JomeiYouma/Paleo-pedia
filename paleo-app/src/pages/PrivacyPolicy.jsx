import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Politique de confidentialité — page statique accessible depuis le footer.
 * Contenu rédigé pour le contexte "proposer un cartel" (donnée principale
 * collectée : email/téléphone laissé volontairement par le proposant pour
 * être recontacté). Aucun tracker, aucune analytique tierce.
 */
const PrivacyPolicy = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const dateLocale = lang === 'en' ? 'en-GB' : 'fr-FR';
    return (
        <div style={{
            maxWidth: '760px', margin: '0 auto',
            padding: '40px 24px 80px',
            color: '#222', lineHeight: 1.6,
        }}>
            <Link to=".." style={{ color: '#888', textDecoration: 'none', fontSize: '0.88rem' }}>
                {t('privacy.backHome')}
            </Link>

            <h1 style={{ marginTop: '20px', fontSize: '1.8rem', fontWeight: 800 }}>
                {t('privacy.title')}
            </h1>
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '-6px' }}>
                {t('privacy.lastUpdate')} : {new Date().toLocaleDateString(dateLocale)}
            </p>

            <h2 style={{ marginTop: '28px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section1Title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section1Html') }} />

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section2Title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section2Html1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section2Html2') }} />

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section3Title')}</h2>
            <ul style={{ paddingLeft: '22px' }}>
                <li>{t('privacy.section3Item1')}</li>
                <li>{t('privacy.section3Item2')}</li>
                <li>{t('privacy.section3Item3')}</li>
            </ul>
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section3Html') }} />

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section4Title')}</h2>
            <ul style={{ paddingLeft: '22px' }}>
                <li>{t('privacy.section4Item1')}</li>
                <li>{t('privacy.section4Item2')}</li>
                <li>{t('privacy.section4Item3')}</li>
            </ul>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section5Title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section5Html') }} />

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section6Title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section6Html') }} />

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>{t('privacy.section7Title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('privacy.section7Html') }} />
        </div>
    );
};

export default PrivacyPolicy;
