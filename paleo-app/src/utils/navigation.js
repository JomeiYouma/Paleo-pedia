/**
 * Helpers pour mémoriser l'origine de la navigation vers /create et y revenir
 * proprement, même quand location.state est perdu (reload, lien direct).
 *
 * Deux filets se superposent :
 *   1. location.state.returnTo       — fonctionne tant que l'historique n'est pas cassé
 *   2. sessionStorage 'paleo:returnTo' — filet pour les reloads de la page Create
 *
 * Si un `scrollId` est fourni, on ajoute `#cartel-<id>` en fragment :
 *   les pages liste (ManageCartels, Admin) l'utilisent pour faire défiler
 *   la liste jusqu'au cartel qu'on vient d'éditer au retour.
 */

const RETURN_TO_KEY = 'paleo:returnTo';

/** Construit le returnTo à mémoriser avant d'aller vers /create. */
export function buildReturnTo(location, { scrollId } = {}) {
    const hash = scrollId != null ? `#cartel-${scrollId}` : (location.hash || '');
    return (location.pathname || '') + (location.search || '') + hash;
}

/**
 * Écrit le returnTo dans sessionStorage et retourne la valeur ; à utiliser
 * juste avant `navigate(target, { state: { returnTo } })`.
 */
export function rememberReturn(location, { scrollId } = {}) {
    const returnTo = buildReturnTo(location, { scrollId });
    try { sessionStorage.setItem(RETURN_TO_KEY, returnTo); } catch { /* quota/private mode */ }
    return returnTo;
}

/** À appeler dans Create juste avant/après navigate(returnTo). */
export function clearReturnTo() {
    try { sessionStorage.removeItem(RETURN_TO_KEY); } catch { /* noop */ }
}

/** Lecture défensive du filet sessionStorage. */
export function readStoredReturnTo() {
    try { return sessionStorage.getItem(RETURN_TO_KEY); } catch { return null; }
}
