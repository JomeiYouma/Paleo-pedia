import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Bouton avec menu déroulant ancré dessous. Le menu se ferme au clic
// extérieur ou quand on appelle `close()` depuis un DropItem (utile pour
// les actions asynchrones lancées depuis le menu).
export const DropdownButton = ({ label, icon: Icon, color = '#555', variant = 'solid', children }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position:'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 11px', borderRadius:'8px', border: variant === 'outline' ? `1px solid ${color}` : 'none', background: variant === 'outline' ? 'white' : color, color: variant === 'outline' ? color : 'white', cursor:'pointer', fontSize:'0.84rem', fontWeight:'600', fontFamily:'inherit' }}>
                {Icon && <Icon size={14} />} {label} <ChevronDown size={13} style={{ opacity:0.7 }} />
            </button>
            {open && (
                <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, background:'white', border:'1px solid #eee', borderRadius:'10px', boxShadow:'0 6px 24px rgba(0,0,0,0.12)', zIndex:50, minWidth:'190px', overflow:'hidden' }}>
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
};

export const DropItem = ({ icon: Icon, label, onClick, danger }) => (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'11px 14px', border:'none', background:'none', textAlign:'left', cursor:'pointer', fontSize:'0.88rem', color: danger ? '#d32f2f' : '#333', fontFamily:'inherit' }}
        onMouseEnter={e => e.currentTarget.style.background = danger ? '#fff5f5' : '#f8f8f8'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
        {Icon && <Icon size={15} color={danger ? '#d32f2f' : '#666'} />} {label}
    </button>
);
