import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Conditions Générales de Vente (CGV) — page statique accessible depuis le footer
 * du site principal (la boutique n'existe que là). Contenu piloté par i18n
 * (`cgv.sections`), FR + EN ; la version française fait foi.
 * Distincte des Mentions légales (LegalNotices) et de la Politique de
 * confidentialité (PrivacyPolicy).
 */
const TermsOfSale = () => {
    const { t } = useTranslation();
    const sections = t('cgv.sections', { returnObjects: true });
    const list = Array.isArray(sections) ? sections : [];
    const seller = t('cgv.seller', { defaultValue: '' });
    return (
        <div style={{
            maxWidth: '760px', margin: '0 auto',
            padding: '40px 24px 80px',
            color: 'var(--color-text)', lineHeight: 1.6,
        }}>
            <Link to=".." style={{ color: 'var(--color-text-subtle)', textDecoration: 'none', fontSize: '0.88rem' }}>
                ← {t('cgv.backHome')}
            </Link>

            <h1 style={{ marginTop: '20px', fontSize: '1.8rem' }}>{t('cgv.title')}</h1>
            <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.85rem', marginTop: '-6px' }}>
                {t('cgv.lastUpdate')} : {new Date().toLocaleDateString()}
            </p>

            {seller && (
                <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {seller}
                </p>
            )}

            <p style={{ marginTop: '18px' }}>{t('cgv.intro')}</p>

            {list.map((s, i) => (
                <section key={i}>
                    <h2 style={{ marginTop: '24px', fontSize: '1.15rem' }}>{s.title}</h2>
                    {(Array.isArray(s.paragraphs) ? s.paragraphs : []).map((p, j) => (
                        <p key={j} style={{ margin: '8px 0' }}>{p}</p>
                    ))}
                    {s.privacyLink && (
                        <p style={{ margin: '8px 0' }}>
                            <Link to="../politique-confidentialite" style={{ color: 'var(--color-primary)' }}>
                                {t('cgv.privacyLinkLabel')}
                            </Link>
                        </p>
                    )}
                </section>
            ))}
        </div>
    );
};

export default TermsOfSale;
