/**
 * useCopyBlock — bloque la copie du contenu des fiches (cartels) pour les
 * visiteurs non connectés.
 *
 * Renvoie des props à étaler sur le conteneur de la fiche :
 *   - `data-no-copy` : la CSS globale (index.css) y coupe la sélection de texte
 *     et le menu d'appui long sur mobile ;
 *   - clic droit et glisser-déposer bloqués (sauf sur les liens, pour garder
 *     « ouvrir dans un nouvel onglet ») ;
 *   - un écouteur `copy` / `cut` au niveau du document annule la copie dès que
 *     la sélection touche une fiche (cas d'un Ctrl+A lancé hors de la fiche,
 *     ou d'un navigateur qui ignorerait `user-select`).
 *
 * Les utilisateurs connectés (admins, éditeurs de sous-sites) ne sont pas
 * concernés : ils doivent pouvoir copier pour travailler.
 *
 * Limite assumée : c'est un frein à la copie ordinaire, pas une protection
 * absolue (inspecteur, code source et API publique restent lisibles).
 */
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const ATTR = 'data-no-copy';

const selectionTouchesProtected = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    const nodes = document.querySelectorAll(`[${ATTR}]`);
    if (nodes.length === 0) return false;
    for (let i = 0; i < sel.rangeCount; i++) {
        const range = sel.getRangeAt(i);
        for (const node of nodes) {
            if (range.intersectsNode(node)) return true;
        }
    }
    return false;
};

const blockIfProtected = (e) => {
    if (selectionTouchesProtected()) e.preventDefault();
};

const blockOutsideLinks = (e) => {
    if (e.target instanceof Element && e.target.closest('a')) return;
    e.preventDefault();
};

export default function useCopyBlock() {
    const { user } = useApp() || {};
    const enabled = !user;

    useEffect(() => {
        if (!enabled) return undefined;
        document.addEventListener('copy', blockIfProtected);
        document.addEventListener('cut', blockIfProtected);
        return () => {
            document.removeEventListener('copy', blockIfProtected);
            document.removeEventListener('cut', blockIfProtected);
        };
    }, [enabled]);

    if (!enabled) return {};
    return {
        [ATTR]: '',
        onContextMenu: blockOutsideLinks,
        onDragStart: blockOutsideLinks,
    };
}
