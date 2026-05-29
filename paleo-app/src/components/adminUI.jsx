/**
 * adminUI.jsx — Helpers et composants partagés par les pages admin
 * (AdminTeamContent, AdminPartners, AdminTeam, AdminCategoriesWorkshops,
 * AdminLogs, …). Style : gris primaire + jaune accent, fontes Bebas Neue
 * pour les labels/boutons, arêtes vives.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Languages } from 'lucide-react';
import api from '../services/apiClient';
import Breadcrumb from './Breadcrumb';

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
 * Header standard d'une page admin : fil d'Ariane (Accueil > Admin > <titre>),
 * pastille d'icône jaune et titre. Convention : breadcrumb plutôt que bouton
 * retour seul (cf. feedback_breadcrumb_over_back_button).
 *
 * `backTo` / `backLabel` (legacy) restent supportés : par défaut le fil
 * remonte vers `/app/admin` (page Admin), mais une page peut surcharger
 * `crumbs` pour un parcours plus profond.
 */
export const AdminPageHeader = ({
    icon: Icon, title,
    backTo = '/app/admin',
    backLabel = 'Admin',
    crumbs,
}) => {
    // Crumbs par défaut : Accueil > Admin (ou ce que `backTo`/`backLabel`
    // pointe). Une page peut passer `crumbs` complet pour un parcours custom.
    const effectiveCrumbs = crumbs ?? [
        { label: 'Accueil', href: '/app' },
        { label: backLabel, href: backTo },
    ];
    return (
        <div style={{ marginBottom: '20px' }}>
            <Breadcrumb crumbs={effectiveCrumbs} current={title} style={{ marginBottom: '12px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        </div>
    );
};

/** Toast simple en haut à droite. À utiliser avec useAdminToast().
 *  Entrée slide depuis la droite + fade, sortie fade simple. Le composant
 *  reste monté pendant le fade-out (sinon disparition sèche). */
const ADMIN_TOAST_ENTER_MS = 220;
const ADMIN_TOAST_EXIT_MS = 180;
export const AdminToast = ({ toast }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [phase, setPhase] = useState('exiting');
    // Le hook passe toast=null à la fin du timer → on garde un instantané
    // pour pouvoir continuer à afficher pendant la sortie.
    const [snapshot, setSnapshot] = useState(toast);
    const exitTimer = useRef(null);

    useEffect(() => {
        if (toast) {
            clearTimeout(exitTimer.current);
            setSnapshot(toast);
            setShouldRender(true);
            setPhase('entering');
        } else if (shouldRender) {
            setPhase('exiting');
            exitTimer.current = setTimeout(() => setShouldRender(false), ADMIN_TOAST_EXIT_MS);
        }
        return () => clearTimeout(exitTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);

    if (!shouldRender || !snapshot) return null;
    const isError = snapshot.type === 'error';
    const animation = phase === 'entering'
        ? `paleo-toast-in-right ${ADMIN_TOAST_ENTER_MS}ms cubic-bezier(.2,.8,.2,1) both`
        : `paleo-toast-out ${ADMIN_TOAST_EXIT_MS}ms ease-in both`;
    return (
        <div className="paleo-toast" role="status" style={{
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
            animation,
            willChange: 'transform, opacity',
        }}>
            {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{snapshot.message}</span>
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

/**
 * Bouton « Auto-traduire FR→EN » utilisable dans les formulaires admin.
 * @param {object} props
 * @param {() => Record<string, string>} props.getFrFields - retourne la map FR.
 * @param {(out: Record<string, string>) => void} props.onTranslated - callback avec
 *   la map traduite ; même clés, valeurs en anglais.
 * @param {string} [props.target='en'] - 'en' (défaut) ou 'fr' pour traduire l'inverse.
 * @param {string} [props.label] - libellé personnalisé.
 * @param {boolean} [props.disabled]
 */
export const TranslateButton = ({ getFrFields, onTranslated, target = 'en', label, disabled }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const handle = async () => {
        const raw = getFrFields() || {};
        const cleanFields = Object.fromEntries(
            Object.entries(raw).filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
        );
        if (Object.keys(cleanFields).length === 0) {
            setError('Aucun champ source à traduire.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setBusy(true); setError('');
        try {
            const out = await api.translate.fields(cleanFields, { target });
            onTranslated(out);
        } catch (e) {
            setError(e.message || 'Erreur de traduction.');
        } finally {
            setBusy(false);
        }
    };

    const defaultLabel = target === 'en' ? 'Auto-traduire FR → EN' : 'Auto-traduire EN → FR';

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <button
                type="button"
                onClick={handle}
                disabled={disabled || busy}
                style={{
                    ...ghostBtnStyle,
                    background: busy ? 'var(--color-primary-soft)' : 'var(--color-accent-soft)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-primary)',
                    opacity: (disabled || busy) ? 0.6 : 1,
                    cursor: (disabled || busy) ? 'not-allowed' : 'pointer',
                }}
                title="Utilise DeepL/OpenAI selon la clé configurée"
            >
                <Languages size={14} /> {busy ? 'Traduction…' : (label || defaultLabel)}
            </button>
            {error && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-error)' }}>
                    {error}
                </span>
            )}
        </div>
    );
};
