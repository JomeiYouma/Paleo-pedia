import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const activeLanguage = i18n.language === 'gb' ? 'en' : i18n.language;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('paleo-app-lang', lng);
    };

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
                onClick={() => changeLanguage('fr')}
                style={{
                    border: activeLanguage === 'fr' ? '2px solid black' : '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '5px',
                    background: activeLanguage === 'fr' ? '#fff' : 'transparent',
                    cursor: 'pointer',
                    opacity: activeLanguage === 'fr' ? 1 : 0.6
                }}
                title="Français"
            >
                FR
            </button>
            <button
                onClick={() => changeLanguage('en')}
                style={{
                    border: activeLanguage === 'en' ? '2px solid black' : '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '5px',
                    background: activeLanguage === 'en' ? '#fff' : 'transparent',
                    cursor: 'pointer',
                    opacity: activeLanguage === 'en' ? 1 : 0.6
                }}
                title="English"
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
