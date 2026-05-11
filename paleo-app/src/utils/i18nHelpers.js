export const getLocalizedContent = (data, lang) => {
    if (!data) return { title: '', description: '' };

    // Check for English
    if (lang === 'en') {
        return {
            title: data.titre_en || data.titre,
            description: data.description_en || data.description
        };
    }

    // Default to French
    return {
        title: data.titre,
        description: data.description
    };
};

/**
 * Pioche le champ correspondant à la langue de l'utilisateur. Si la langue
 * est 'en' et que `obj[field + '_en']` est rempli, on le renvoie. Sinon on
 * retombe sur `obj[field]` (le FR sert toujours de fallback).
 *
 * @param {object|null|undefined} obj
 * @param {string} field - nom du champ source (ex: 'bio', 'title')
 * @param {string} [lang='fr'] - langue active (i18n.language)
 * @returns {*}
 */
export const pickLang = (obj, field, lang) => {
    if (!obj || !field) return '';
    if (lang === 'en') {
        const v = obj[`${field}_en`];
        if (v != null && String(v).trim().length > 0) return v;
    }
    return obj[field] ?? '';
};
