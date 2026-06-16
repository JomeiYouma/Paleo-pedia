import { useState, useEffect } from 'react';

/**
 * Vrai quand la fenêtre est en dessous de `maxWidth` (mobile / écran étroit).
 * Sert à basculer vers des dispositions pensées pour le tactile (filtres
 * repliés, colonnes empilées, etc.) — les styles inline du projet ne
 * permettant pas de media queries directes.
 */
export function useIsMobile(maxWidth = 768) {
    const query = `(max-width: ${maxWidth}px)`;
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(query).matches
    );
    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = () => setIsMobile(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [query]);
    return isMobile;
}
