import React from 'react';
import { useTranslation } from 'react-i18next';

const Contact = () => {
    const { t } = useTranslation();

    return (
        <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-pink-darker, #C2185B)' }}>{t('pages.contact.title')}</h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                {t('pages.contact.intro')}
            </p>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('pages.contact.name')}</label>
                    <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('pages.contact.email')}</label>
                    <input type="email" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('pages.contact.subject')}</label>
                    <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('pages.contact.message')}</label>
                    <textarea rows="5" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
                </div>

                <button type="submit" style={{ background: 'black', color: 'white', border: 'none', padding: '15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                    {t('pages.contact.send')}
                </button>
            </form>
        </div>
    );
};

export default Contact;
