import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const activeLanguage = i18n.language === 'gb' ? 'en' : i18n.language;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('paleo-app-lang', lng);
    };

    // Les boutons héritent la couleur du parent via `currentColor` :
    // sur header sombre (color: white) → texte/bordure blancs, lisibles.
    // L'état actif passe en jaune avec texte foncé pour un contraste maximal.
    const baseStyle = {
        borderRadius: 'var(--radius-md)',
        padding: '4px 10px',
        cursor: 'pointer',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.78rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        lineHeight: 1.2,
        transition: 'background-color 0.12s, color 0.12s, border-color 0.12s',
    };

    // Active : surface claire + texte foncé, le liseré coloré reprend
    // l'accent (jaune sur main, couleur du sous-site sinon). Évite les
    // problèmes de contraste si la couleur du sous-site est foncée.
    const activeStyle = {
        ...baseStyle,
        background: 'var(--color-white)',
        color: 'var(--color-primary)',
        border: '2px solid var(--color-accent)',
        padding: '3px 9px',
    };

    const inactiveStyle = {
        ...baseStyle,
        background: 'transparent',
        color: 'currentColor',
        border: '1px solid currentColor',
        opacity: 0.85,
    };

    return (
        <div role="group" aria-label="Choix de la langue" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
                onClick={() => changeLanguage('fr')}
                aria-pressed={activeLanguage === 'fr'}
                style={activeLanguage === 'fr' ? activeStyle : inactiveStyle}
                title="Français"
            >
                FR
            </button>
            <button
                onClick={() => changeLanguage('en')}
                aria-pressed={activeLanguage === 'en'}
                style={activeLanguage === 'en' ? activeStyle : inactiveStyle}
                title="English"
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
