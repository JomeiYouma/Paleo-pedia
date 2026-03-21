import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';

// Detect language from localStorage or browser
const savedLanguage = localStorage.getItem('paleo-app-lang') || 'fr';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: fr },
            en: { translation: en }
        },
        lng: savedLanguage, // Default language
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false // React already escapes by default
        }
    });

export default i18n;
