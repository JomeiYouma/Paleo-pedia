import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckSquare, Square } from 'lucide-react';

/**
 * Dropdown multi-sélection avec toggle ET/OU optionnel.
 *
 * Props :
 *  - label : string affiché en repli quand rien n'est sélectionné
 *  - options : [{ value, label }]
 *  - selected : tableau des valeurs cochées
 *  - onChange : (nextSelected) => void
 *  - op : 'OR' | 'AND' (mode de combinaison choisi par l'utilisateur)
 *  - onOpChange : (nextOp) => void   — si absent, le toggle ET/OU n'apparaît pas
 *  - opLabels : { or: 'OU', and: 'ET' } pour l'i18n
 *  - emptyLabel : libellé du bouton "Tout afficher" (clear) — masqué si null
 */
export const MultiSelectDropdown = ({
    label,
    options,
    selected = [],
    onChange,
    op,
    onOpChange,
    opLabels = { or: 'OU', and: 'ET' },
    emptyLabel = null,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleValue = (value) => {
        const set = new Set(selected.map(String));
        const key = String(value);
        set.has(key) ? set.delete(key) : set.add(key);
        onChange(Array.from(set));
    };

    const buttonLabel = selected.length === 0
        ? label
        : selected.length === 1
            ? (options.find(o => String(o.value) === String(selected[0]))?.label || label)
            : `${label} (${selected.length})`;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '0.88rem', color: '#333', fontFamily: 'inherit' }}>
                {buttonLabel}
                {selected.length > 1 && onOpChange && (
                    <span style={{ background: '#eef', color: '#3b5bdb', borderRadius: '6px', padding: '1px 6px', fontSize: '0.72rem', fontWeight: '700', marginLeft: '2px' }}>
                        {op === 'AND' ? opLabels.and : opLabels.or}
                    </span>
                )}
                <ChevronDown size={13} style={{ opacity: 0.6 }} />
            </button>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: 'white', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '220px', maxHeight: '380px', overflowY: 'auto' }}>
                    {/* Toggle ET/OU (visible seulement avec ≥ 2 cases cochées pour éviter
                        d'afficher un choix sans effet) */}
                    {onOpChange && selected.length >= 2 && (
                        <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                            <button
                                onClick={() => onOpChange('OR')}
                                style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: 'none', background: op === 'OR' ? '#3b5bdb' : '#eee', color: op === 'OR' ? 'white' : '#555', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
                            >{opLabels.or}</button>
                            <button
                                onClick={() => onOpChange('AND')}
                                style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: 'none', background: op === 'AND' ? '#3b5bdb' : '#eee', color: op === 'AND' ? 'white' : '#555', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
                            >{opLabels.and}</button>
                        </div>
                    )}
                    <div style={{ padding: '4px 0' }}>
                        {options.map(opt => {
                            const isSelected = selected.map(String).includes(String(opt.value));
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleValue(opt.value)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', color: '#333', fontFamily: 'inherit' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    {isSelected ? <CheckSquare size={16} color="#3b5bdb" /> : <Square size={16} color="#aaa" />}
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                    {emptyLabel && selected.length > 0 && (
                        <div style={{ borderTop: '1px solid #f0f0f0' }}>
                            <button
                                onClick={() => onChange([])}
                                style={{ display: 'block', width: '100%', padding: '8px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: '#666', fontFamily: 'inherit' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >{emptyLabel}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
