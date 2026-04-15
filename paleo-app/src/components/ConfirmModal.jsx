import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal — remplace window.confirm() avec un dialogue React.
 * Compatible mobile/webview/kiosque.
 *
 * Usage :
 *   const [confirmState, setConfirmState] = useState(null);
 *
 *   // Pour ouvrir :
 *   setConfirmState({ message: 'Supprimer ?', onConfirm: () => doSomething() });
 *
 *   // Dans le JSX :
 *   {confirmState && (
 *       <ConfirmModal
 *           message={confirmState.message}
 *           onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
 *           onCancel={() => setConfirmState(null)}
 *       />
 *   )}
 */
const ConfirmModal = ({ message, confirmLabel, cancelLabel, onConfirm, onCancel, danger = true }) => {
    // Fermer avec Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    return createPortal(
        <div
            onClick={onCancel}
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(2px)',
                animation: 'fadeIn 0.15s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '12px',
                    padding: '28px 32px', maxWidth: '380px', width: '90%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    animation: 'slideUp 0.18s ease',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {danger && <AlertTriangle size={22} color="#e53e3e" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#333' }}>
                        {message}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 18px', borderRadius: '8px',
                            border: '1px solid #ddd', background: 'white',
                            cursor: 'pointer', fontSize: '0.9rem', color: '#555',
                        }}
                    >
                        {cancelLabel || 'Annuler'}
                    </button>
                    <button
                        onClick={onConfirm}
                        autoFocus
                        style={{
                            padding: '8px 18px', borderRadius: '8px',
                            border: 'none',
                            background: danger ? '#e53e3e' : 'var(--color-pink-darker, #c0392b)',
                            color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
                        }}
                    >
                        {confirmLabel || 'Confirmer'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>,
        document.body
    );
};

export default ConfirmModal;
