import React from 'react';
import { Info } from 'lucide-react';

/**
 * Encart explicatif (intro de page, aide contextuelle) utilisé sur les
 * pages admin pour garder une présentation homogène des paragraphes
 * d'explication.
 *
 * @param {object} props
 * @param {string}  props.color        - couleur d'accent (bord + icône) ; défaut violet
 * @param {string} [props.background]  - couleur de fond ; défaut dérivée d'accent clair
 * @param {string} [props.border]      - couleur de bordure ; défaut dérivée d'accent clair
 * @param {React.ComponentType} [props.icon] - icône lucide-react à utiliser ; défaut Info
 * @param {string} [props.title]       - titre en gras (omis si non fourni)
 * @param {React.ReactNode} props.children - corps du paragraphe
 */
const ExplainerBox = ({
    color = '#6741d9',
    background = '#f3efff',
    border = '#d9ccff',
    icon: Icon = Info,
    title,
    children,
}) => (
    <div style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: '12px',
        padding: '16px 18px',
        marginBottom: '20px',
        color: '#1a1a1a',
        fontSize: '0.88rem',
        lineHeight: '1.55',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
    }}>
        <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
            {title && <><strong>{title}</strong><br /></>}
            {children}
        </div>
    </div>
);

export default ExplainerBox;
