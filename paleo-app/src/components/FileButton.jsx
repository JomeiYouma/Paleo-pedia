import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { ghostBtnStyle } from '../styles/formStyles';

/**
 * Bouton de sélection de fichier stylé (remplace l'<input type="file"> natif,
 * dont l'apparence varie selon le navigateur). Le vrai input reste présent,
 * masqué mais focusable via le <label> (accessible).
 */
const FileButton = ({ onChange, accept = 'image/*', label = 'Choisir un fichier' }) => {
    const [name, setName] = useState('');
    return (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ ...ghostBtnStyle, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Upload size={15} aria-hidden="true" /> {label}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle, #888)' }}>
                {name || 'Aucun fichier choisi'}
            </span>
            <input
                type="file"
                accept={accept}
                onChange={e => { setName(e.target.files?.[0]?.name || ''); onChange?.(e); }}
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            />
        </label>
    );
};

export default FileButton;
