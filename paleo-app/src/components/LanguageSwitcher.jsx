import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('paleo-app-lang', lng);
    };

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
                onClick={() => changeLanguage('fr')}
                style={{
                    border: i18n.language === 'fr' ? '2px solid black' : '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '5px',
                    background: i18n.language === 'fr' ? '#fff' : 'transparent',
                    cursor: 'pointer',
                    opacity: i18n.language === 'fr' ? 1 : 0.6
                }}
                title="Français"
            >
                🇫🇷
            </button>
            <button
                onClick={() => changeLanguage('en')}
                style={{
                    border: i18n.language === 'en' ? '2px solid black' : '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '5px',
                    background: i18n.language === 'en' ? '#fff' : 'transparent',
                    cursor: 'pointer',
                    opacity: i18n.language === 'en' ? 1 : 0.6
                }}
                title="English"
            >
                🇬🇧
            </button>
        </div>
    );
};

export default LanguageSwitcher;
