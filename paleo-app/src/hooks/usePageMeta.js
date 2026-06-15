import { useEffect } from 'react';

const SITE_NAME = 'Paléo-Énergétique';
const SITE_URL  = 'https://paleo-energetique.org';

/**
 * Hook léger pour SEO côté SPA : met à jour <title>, la meta description
 * et le lien canonical en fonction de la page courante.
 *
 * On évite d'embarquer react-helmet pour ce besoin minimal — un effet
 * direct sur document.head suffit.
 *
 * Convention de titre : « <pageTitle> Paléo-Énergétique » (séparé par une espace).
 * Si aucun titre, on retombe sur le SITE_NAME seul.
 *
 * @param {{ title?: string, description?: string, path?: string }} opts
 *   - title : titre court de la page (sans le site name)
 *   - description : phrase courte (< 160 caractères idéalement)
 *   - path  : chemin relatif sans le hash, ex. "/museum" — sert à
 *             positionner <link rel="canonical">. Si absent, on garde
 *             la canonical par défaut de index.html.
 */
export function usePageMeta({ title, description, path } = {}) {
    useEffect(() => {
        const fullTitle = title ? `${title} ${SITE_NAME}` : SITE_NAME;
        document.title = fullTitle;

        if (description) {
            upsertMeta('name', 'description', description);
            // Open Graph et Twitter peuvent reprendre la même description par
            // défaut — utile si une page est partagée individuellement.
            upsertMeta('property', 'og:description', description);
            upsertMeta('name', 'twitter:description', description);
        }
        if (title) {
            upsertMeta('property', 'og:title', fullTitle);
            upsertMeta('name', 'twitter:title', fullTitle);
        }
        if (path) {
            const url = SITE_URL + path;
            upsertMeta('property', 'og:url', url);
            const link = document.querySelector('link[rel="canonical"]');
            if (link) link.setAttribute('href', url);
        }
    }, [title, description, path]);
}

function upsertMeta(attrName, attrValue, content) {
    let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}
