import React from 'react';
import { useTranslation } from 'react-i18next';
import { PEDIA_SITE_URL } from '../utils/subsiteHost';

// Footer commun au site public (SiteLayout) et à la zone applicative (/app).
// Centralisé ici pour garantir la présence d'un pied de page cohérent sur
// toutes les pages (conformité Opquast : liens légaux/contact toujours
// accessibles).
const SiteFooter = () => {
    const { t } = useTranslation();
    return (
        <footer style={{
            background: '#f8f9fa',
            padding: '40px',
            marginTop: 'auto',
            borderTop: '1px solid #eee',
            position: 'relative',
            zIndex: 2,
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
            }}>
                <div>
                    <h3 style={{ margin: '0 0 10px 0' }}>{t('footer.brand')}</h3>
                    <p style={{ color: '#666', maxWidth: '300px', margin: 0 }}>
                        {t('footer.tagline')}
                    </p>
                </div>
                <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>{t('footer.linksHeading')}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <a href={PEDIA_SITE_URL} style={{ color: '#666', textDecoration: 'none', fontWeight: 600 }}>← Paléo-Pédia</a>
                        <a href="/app"     style={{ color: '#666', textDecoration: 'none' }}>{t('footer.timelineLink')}</a>
                        <a href="/participer" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.participate')}</a>
                        <a href="/presse" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.press')}</a>
                        <a href="/partenaires" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.partners')}</a>
                        <a href="/contact" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.contactUs')}</a>
                        <a href="/mentions-legales" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.legalNotices')}</a>
                        <a href="/politique-confidentialite" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.privacy')}</a>
                    </div>
                </div>
                <div>
                    <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
                        © {new Date().getFullYear()} Atelier 21
                    </p>
                    <p style={{ color: '#999', fontSize: '0.85rem', margin: '6px 0 0' }}>
                        {t('footer.createdBy')}{' '}
                        <a
                            href="https://jomeiyouma.github.io/portfolio/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#666', textDecoration: 'underline' }}
                        >
                            Youma
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
