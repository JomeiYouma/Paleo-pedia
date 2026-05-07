import React from 'react';
import { Info } from 'lucide-react';

/**
 * Encart explicatif (intro de page, aide contextuelle) utilisé sur les
 * pages admin pour garder une présentation homogène des paragraphes
 * d'explication. Par défaut : palette DA (gris primaire + jaune accent).
 *
 * @param {object} props
 * @param {string} [props.color]       - couleur d'accent (bord + icône). Défaut : primary.
 * @param {string} [props.background]  - couleur de fond. Défaut : accent-soft.
 * @param {string} [props.border]      - couleur de bordure. Défaut : accent.
 * @param {React.ComponentType} [props.icon] - icône lucide-react. Défaut Info.
 * @param {string} [props.title]       - titre en gras (omis si non fourni).
 * @param {React.ReactNode} props.children - corps du paragraphe.
 */
const ExplainerBox = ({
    color = 'var(--color-primary)',
    background = 'var(--color-accent-soft)',
    border = 'var(--color-accent)',
    icon: Icon = Info,
    title,
    children,
}) => (
    <div style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
        marginBottom: '20px',
        color: 'var(--color-text)',
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
