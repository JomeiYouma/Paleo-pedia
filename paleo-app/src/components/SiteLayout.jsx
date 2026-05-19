import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SharedHeader from './SharedHeader';

// Layout du site public (/, /presentation, /museum…)
// Le SharedHeader détecte qu'on N'est PAS sur /app et affiche
// seulement le header du site (sans la bande de navigation applicative).
const SiteLayout = () => {
    const { t } = useTranslation();
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <SharedHeader />

            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            <footer style={{
                background: '#f8f9fa',
                padding: '40px',
                marginTop: 'auto',
                borderTop: '1px solid #eee',
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
                            <a href="#/app"     style={{ color: '#666', textDecoration: 'none' }}>{t('footer.timelineLink')}</a>
                            <a href="#/participer" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.participate')}</a>
                            <a href="#/presse" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.press')}</a>
                            <a href="#/partenaires" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.partners')}</a>
                            <a href="#/contact" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.contactUs')}</a>
                            <a href="#/mentions-legales" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.legalNotices')}</a>
                            <a href="#/politique-confidentialite" style={{ color: '#666', textDecoration: 'none' }}>{t('footer.privacy')}</a>
                        </div>
                    </div>
                    <div>
                        <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
                            © {new Date().getFullYear()} Atelier 21
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SiteLayout;
