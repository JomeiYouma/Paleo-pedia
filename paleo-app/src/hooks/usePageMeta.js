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
 * @param {{ title?: string, description?: string, path?: string, url?: string }} opts
 *   - title : titre court de la page (sans le site name)
 *   - description : phrase courte (< 160 caractères idéalement)
 *   - path  : chemin relatif sans le hash, ex. "/museum" — combiné au domaine
 *             principal (SITE_URL) pour positionner <link rel="canonical">.
 *   - url   : URL canonique ABSOLUE, prioritaire sur `path`. À utiliser pour une
 *             page servie sur un autre domaine (ex. la vitrine Pédia sur
 *             paleo-pedia.org). Si ni `path` ni `url`, on garde la canonical
 *             par défaut de index.html.
 */
export function usePageMeta({ title, description, path, url } = {}) {
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
        const canonicalUrl = url || (path ? SITE_URL + path : null);
        if (canonicalUrl) {
            upsertMeta('property', 'og:url', canonicalUrl);
            const link = document.querySelector('link[rel="canonical"]');
            if (link) link.setAttribute('href', canonicalUrl);
        }
    }, [title, description, path, url]);
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
