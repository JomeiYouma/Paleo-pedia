/**
 * Breadcrumb.jsx — fil d'Ariane partagé.
 *
 * Convention d'usage : à mettre sur toute page profonde qui aurait sinon eu un
 * simple bouton « ← Retour ». Donne plus de contexte de navigation, surtout
 * pour les pages accessibles via QR code ou lien direct.
 *
 * Props :
 *   - crumbs: [{ label, href }, …]  liens cliquables menant aux parents
 *   - current: string               label de la page courante (non cliquable)
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ crumbs = [], current, style }) => {
    return (
        <nav aria-label="Breadcrumb" style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px',
            fontSize: '0.85rem', color: '#999', marginBottom: '20px',
            ...style,
        }}>
            {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <ChevronRight size={14} style={{ color: '#ccc' }} />}
                    <Link to={c.href} onClick={c.onClick}
                        style={{ color: '#666', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#222'}
                        onMouseLeave={e => e.currentTarget.style.color = '#666'}>
                        {c.label}
                    </Link>
                </React.Fragment>
            ))}
            {current && (
                <>
                    <ChevronRight size={14} style={{ color: '#ccc' }} />
                    <span style={{ color: '#222', fontWeight: 600 }} aria-current="page">{current}</span>
                </>
            )}
        </nav>
    );
};

export default Breadcrumb;
