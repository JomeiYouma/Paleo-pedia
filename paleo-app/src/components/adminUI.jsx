/**
 * adminUI.jsx — Helpers et composants partagés par les pages admin
 * (AdminTeamContent, AdminPartners, AdminTeam, AdminCategoriesWorkshops,
 * AdminLogs, …). Style : gris primaire + jaune accent, fontes Bebas Neue
 * pour les labels/boutons, arêtes vives.
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

// ── Styles partagés ──────────────────────────────────────────
export const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

export const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
};

export const primaryBtnStyle = {
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '9px 16px',
    background: 'var(--color-primary)',
    color: 'var(--color-white)',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s, color 0.15s',
};

export const ghostBtnStyle = {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '9px 14px',
    background: 'var(--color-surface)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.82rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
};

export const dangerBtnStyle = {
    ...ghostBtnStyle,
    border: '1px solid #fecaca',
    color: '#b42318',
};

// ── Composants ────────────────────────────────────────────────

/** Card-section blanche avec bordure légère, utilisée pour grouper du contenu. */
export const AdminSection = ({ children, style }) => (
    <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px',
        ...style,
    }}>
        {children}
    </div>
);

/**
 * Header standard d'une page admin : bouton « Retour », pastille d'icône
 * jaune avec icône primaire, et titre. Tous les sous-pages utilisent
 * exactement la même barre, ce qui rend la navigation prévisible.
 */
export const AdminPageHeader = ({ icon: Icon, title, backTo = '/app/admin', backLabel = 'Retour' }) => {
    const navigate = useNavigate();
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button onClick={() => navigate(backTo)} style={ghostBtnStyle}>
                <ArrowLeft size={14} /> {backLabel}
            </button>
            <div style={{
                width: '40px', height: '40px',
                background: 'var(--color-accent)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                {Icon && <Icon size={20} color="var(--color-primary)" />}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{title}</h1>
        </div>
    );
};

/** Toast simple en haut à droite. À utiliser avec useAdminToast(). */
export const AdminToast = ({ toast }) => {
    if (!toast) return null;
    const isError = toast.type === 'error';
    return (
        <div role="status" style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
            background: isError ? '#fee' : '#efe',
            color: isError ? '#c00' : '#080',
            border: `1px solid ${isError ? '#fcc' : '#cfc'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.88rem', fontWeight: '600',
            maxWidth: '420px',
        }}>
            {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toast.message}</span>
        </div>
    );
};

/** Hook utilitaire qui gère un toast auto-disparaissant (4s par défaut). */
export const useAdminToast = (duration = 4000) => {
    const [toast, setToast] = useState(null);
    const showToast = useCallback((type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), duration);
    }, [duration]);
    return { toast, showToast };
};

/**
 * Bande d'onglets horizontale, comme dans AdminTeamContent.
 * @param {Array<{key, label}>} tabs
 * @param {string} active
 * @param {(key) => void} onChange
 * @param {Object<string, number>} [counts] - badge optionnel par onglet
 */
export const AdminTabs = ({ tabs, active, onChange, counts }) => (
    <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--color-primary-soft)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        marginBottom: '24px',
    }}>
        {tabs.map(tab => {
            const isActive = tab.key === active;
            const count = counts ? counts[tab.key] : undefined;
            return (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        border: 'none',
                        background: isActive ? 'var(--color-surface)' : 'transparent',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-md)',
                        padding: '11px 16px',
                        fontWeight: '700', fontSize: '0.88rem',
                        cursor: 'pointer',
                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        fontFamily: 'var(--font-heading)',
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                        transition: 'background-color 0.15s, color 0.15s',
                    }}
                >
                    {tab.icon && <tab.icon size={14} />}
                    {tab.label}
                    {count != null && (
                        <span style={{
                            background: isActive ? 'var(--color-accent)' : 'var(--color-primary-soft)',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1px 8px',
                            fontSize: '0.78rem', fontWeight: '800',
                            minWidth: '22px', textAlign: 'center',
                        }}>
                            {count}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);

/** Bandeau descriptif (sous les onglets) — léger, bordure jaune à gauche. */
export const AdminTabDescription = ({ children }) => (
    <p style={{
        background: 'var(--color-surface-2)',
        borderLeft: '3px solid var(--color-accent)',
        padding: '10px 16px',
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        margin: '0 0 20px',
    }}>
        {children}
    </p>
);
