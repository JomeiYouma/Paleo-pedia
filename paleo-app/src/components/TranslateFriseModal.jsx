import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, X } from 'lucide-react';

const COMMON_LANGUAGES = ['Espagnol', 'Allemand', 'Italien', 'Portugais', 'Néerlandais', 'Japonais', 'Chinois (mandarin)', 'Arabe'];

const TranslateFriseModal = ({ count, sourceLang, onCancel, onSubmit }) => {
    const { t } = useTranslation();
    const [language, setLanguage] = useState('');
    const trimmed = language.trim();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    return (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                zIndex: 1200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
        >
            <form
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
                style={{
                    background: 'white', borderRadius: '12px',
                    padding: '24px', maxWidth: '480px', width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    position: 'relative',
                }}
            >
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label={t('action.cancel', 'Annuler')}
                    style={{ position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                >
                    <X size={20} />
                </button>

                <h3 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Languages size={20} />
                    {t('translateFrise.title', 'Frise traduite (PDF)')}
                </h3>
                <p style={{ margin: '0 0 16px', color: '#555', fontSize: '0.9rem' }}>
                    {t('translateFrise.intro', { count, defaultValue: `{{count}} cartel(s) sélectionné(s). Choisissez la langue cible — l'IA traduira les contenus depuis ${sourceLang === 'en' ? 'l\'anglais' : 'le français'}.` })}
                </p>

                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    {t('translateFrise.targetLabel', 'Langue cible')}
                </label>
                <input
                    type="text"
                    autoFocus
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    placeholder={t('translateFrise.placeholder', 'Ex : Espagnol, Allemand, Japonais...')}
                    list="translate-frise-suggestions"
                    style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid #ccc', borderRadius: '8px',
                        fontSize: '0.95rem', boxSizing: 'border-box',
                    }}
                />
                <datalist id="translate-frise-suggestions">
                    {COMMON_LANGUAGES.map(lang => <option key={lang} value={lang} />)}
                </datalist>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        {t('action.cancel', 'Annuler')}
                    </button>
                    <button
                        type="submit"
                        disabled={!trimmed}
                        style={{
                            padding: '8px 16px', border: 'none',
                            background: trimmed ? '#6741d9' : '#ccc',
                            color: 'white', borderRadius: '6px',
                            cursor: trimmed ? 'pointer' : 'not-allowed', fontSize: '0.9rem',
                            fontWeight: 600,
                        }}
                    >
                        {t('translateFrise.submit', 'Traduire et exporter')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TranslateFriseModal;
