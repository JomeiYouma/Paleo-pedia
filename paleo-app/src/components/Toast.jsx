import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Notification flottante en bas à gauche, par-dessus le contenu.
 * Auto-dismiss configurable (3 s par défaut). Peut être fermée à la main.
 *
 * Usage :
 *   <Toast visible={!!toast} type={toast?.type} message={toast?.message}
 *          onDismiss={() => setToast(null)} />
 */
const ENTER_MS = 220;
const EXIT_MS = 180;

const Toast = ({ visible, message, type = 'success', onDismiss, autoDismiss = 3000 }) => {
    // shouldRender reste true pendant le fade-out, sinon le composant disparaîtrait sec
    const [shouldRender, setShouldRender] = useState(false);
    const [phase, setPhase] = useState('exiting');
    // Le parent vide message/type en même temps que visible → on garde un instantané
    // pour pouvoir continuer à afficher pendant la sortie.
    const [snapshot, setSnapshot] = useState({ message, type });
    const exitTimer = useRef(null);

    useEffect(() => {
        if (visible && message) {
            clearTimeout(exitTimer.current);
            setSnapshot({ message, type });
            setShouldRender(true);
            setPhase('entering');
        } else if (shouldRender) {
            setPhase('exiting');
            exitTimer.current = setTimeout(() => setShouldRender(false), EXIT_MS);
        }
        return () => clearTimeout(exitTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, message, type]);

    useEffect(() => {
        if (!visible || !autoDismiss) return undefined;
        const timer = setTimeout(() => onDismiss?.(), autoDismiss);
        return () => clearTimeout(timer);
    }, [visible, autoDismiss, onDismiss, message]);

    if (!shouldRender || !snapshot.message) return null;

    const themes = {
        success: { bg: '#e6f7ec', color: '#1f7a3f', border: '#bfe5cd', Icon: CheckCircle2 },
        error:   { bg: '#fdecec', color: '#9a1f1f', border: '#f1c2c2', Icon: AlertCircle },
    };
    const t = themes[snapshot.type] || themes.success;
    const Icon = t.Icon;

    const animation = phase === 'entering'
        ? `paleo-toast-in ${ENTER_MS}ms cubic-bezier(.2,.8,.2,1) both`
        : `paleo-toast-out ${EXIT_MS}ms ease-in both`;

    return (
        <div
            className="paleo-toast"
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
                animation,
                willChange: 'transform, opacity',
            }}
        >
            <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{snapshot.message}</span>
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
