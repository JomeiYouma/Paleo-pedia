/**
 * prestationIcons.js — Registre des icônes Lucide proposées dans
 * l'admin des prestations et utilisées par la page publique.
 *
 * On centralise l'import des icônes ici pour éviter d'imbriquer
 * du dynamic import dans chaque page : Vite tree-shake correctement
 * et on n'embarque que ce qui est listé.
 */
import {
    Users, Presentation, Map, PenTool, Lightbulb, GraduationCap,
    Briefcase, Building2, Sparkles, Hammer, FileText, Award, BookOpen,
    Layers, Star,
} from 'lucide-react';

export const PRESTATION_ICONS = {
    Users, Presentation, Map, PenTool, Lightbulb, GraduationCap,
    Briefcase, Building2, Sparkles, Hammer, FileText, Award, BookOpen,
    Layers, Star,
};

/** Options pour le <select> du formulaire admin (label visible + clé). */
export const PRESTATION_ICON_OPTIONS = [
    { key: 'Users',         label: 'Personnes' },
    { key: 'Presentation',  label: 'Présentation' },
    { key: 'Map',           label: 'Carte / Itinérance' },
    { key: 'PenTool',       label: 'Conseil / Édition' },
    { key: 'Lightbulb',     label: 'Idée' },
    { key: 'GraduationCap', label: 'Formation' },
    { key: 'Briefcase',     label: 'Entreprise' },
    { key: 'Building2',     label: 'Institution' },
    { key: 'Sparkles',      label: 'Innovation' },
    { key: 'Hammer',        label: 'Atelier' },
    { key: 'FileText',      label: 'Document' },
    { key: 'Award',         label: 'Récompense' },
    { key: 'BookOpen',      label: 'Recherche' },
    { key: 'Layers',        label: 'Modules' },
    { key: 'Star',          label: 'Mise en avant' },
];

/**
 * Renvoie le composant icône à partir d'une clé. Fallback sur Sparkles
 * si la clé est inconnue ou nulle.
 */
export function getPrestationIcon(name) {
    return PRESTATION_ICONS[name] || PRESTATION_ICONS.Sparkles;
}
