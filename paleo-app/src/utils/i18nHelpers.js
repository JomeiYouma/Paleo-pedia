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
