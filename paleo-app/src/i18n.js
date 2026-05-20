import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';

// Detect language from localStorage or browser
const rawSavedLanguage = localStorage.getItem('paleo-app-lang') || 'fr';
const savedLanguage = rawSavedLanguage === 'gb' ? 'en' : rawSavedLanguage;

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

// Synchronise l'attribut <html lang> avec la langue active. Crawlers, lecteurs
// d'écran et navigateurs s'en servent (a11y + SEO). On positionne aussi au
// boot, sinon le HTML statique garde lang="fr" même si l'utilisateur navigue
// en anglais.
const setHtmlLang = (lng) => {
    const lang = lng === 'en' ? 'en' : 'fr';
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = lang;
    }
};
setHtmlLang(savedLanguage);
i18n.on('languageChanged', setHtmlLang);

export default i18n;
