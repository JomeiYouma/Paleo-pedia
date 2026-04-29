import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Notification flottante en bas à gauche, par-dessus le contenu.
 * Auto-dismiss configurable (3 s par défaut). Peut être fermée à la main.
 *
 * Usage :
 *   <Toast visible={!!toast} type={toast?.type} message={toast?.message}
 *          onDismiss={() => setToast(null)} />
 */
const Toast = ({ visible, message, type = 'success', onDismiss, autoDismiss = 3000 }) => {
    useEffect(() => {
        if (!visible || !autoDismiss) return undefined;
        const timer = setTimeout(() => onDismiss?.(), autoDismiss);
        return () => clearTimeout(timer);
    }, [visible, autoDismiss, onDismiss, message]);

    if (!visible || !message) return null;

    const themes = {
        success: { bg: '#e6f7ec', color: '#1f7a3f', border: '#bfe5cd', Icon: CheckCircle2 },
        error:   { bg: '#fdecec', color: '#9a1f1f', border: '#f1c2c2', Icon: AlertCircle },
    };
    const t = themes[type] || themes.success;
    const Icon = t.Icon;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                bottom: 20, left: 20,
                zIndex: 10000,
                background: t.bg,
                color: t.color,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                padding: '12px 14px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                maxWidth: 480, minWidth: 240,
                fontSize: '0.9rem', fontWeight: 500,
                lineHeight: 1.35,
            }}
        >
            <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{message}</span>
            <button
                onClick={onDismiss}
                aria-label="Fermer"
                style={{
                    border: 'none', background: 'transparent', color: t.color,
                    cursor: 'pointer', padding: 2, display: 'flex',
                    flexShrink: 0,
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
