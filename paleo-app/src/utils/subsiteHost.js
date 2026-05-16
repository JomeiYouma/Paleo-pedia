// Map host → subsite slug. Un domaine dédié comme paleo-h2o.org affiche
// le sous-site h2o à la racine (`/`, `/frise`, `/admin/...`) au lieu de
// passer par `/site/h2o/...`. Quand le host ne correspond à aucun sous-site,
// l'app utilise son routeur historique (createHashRouter) sans changement.
export const HOST_TO_SUBSITE_SLUG = {
    'paleo-h2o.org':      'paleo-h2o',
    'www.paleo-h2o.org':  'paleo-h2o',
};

// Retourne le slug du sous-site associé au host courant, ou null.
// Sûr côté SSR / tests : window peut être absent.
export function getHostSubsiteSlug() {
    if (typeof window === 'undefined' || !window.location) return null;
    return HOST_TO_SUBSITE_SLUG[window.location.hostname] || null;
}

// Préfixe à utiliser dans les Link/navigate pour pointer vers un sous-site :
//   - '' (chaîne vide) quand on est sur le host dédié de CE sous-site
//     → permet `${base}/frise` = `/frise` et `${base || '/'}` = `/`
//   - '/site/<slug>' sinon (URL historique, fonctionne sur n'importe quel host)
export function subsiteBasePath(slug) {
    if (!slug) return '';
    return getHostSubsiteSlug() === slug ? '' : `/site/${slug}`;
}
