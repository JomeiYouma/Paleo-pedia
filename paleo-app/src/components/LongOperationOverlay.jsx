import React from 'react';
import { useTranslation } from 'react-i18next';

const LongOperationOverlay = ({ visible, label, current = 0, total = 0 }) => {
    const { t } = useTranslation();
    if (!visible) return null;

    const showProgress = total > 0;
    const pct = showProgress ? Math.min(100, (current / total) * 100) : 0;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(255,255,255,0.94)',
                zIndex: 9999,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '20px', textAlign: 'center',
            }}
        >
            <div style={{
                width: '50px', height: '50px',
                border: '5px solid #eee',
                borderTop: '5px solid var(--color-pink-darker, #C2185B)',
                borderRadius: '50%',
                animation: 'longOpSpin 1s linear infinite',
            }} />
            <style>{`@keyframes longOpSpin { to { transform: rotate(360deg); } }`}</style>

            {label && <h3 style={{ marginTop: '20px', marginBottom: 0 }}>{label}</h3>}

            {showProgress && (
                <>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '12px 0 8px' }}>
                        {current} / {total}
                    </div>
                    <div style={{ width: '300px', maxWidth: '80vw', height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${pct}%`, height: '100%',
                            background: 'var(--color-pink-darker, #C2185B)',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </>
            )}

            <p style={{
                marginTop: '24px', maxWidth: '480px',
                color: '#b3261e', fontWeight: 600, fontSize: '0.95rem',
            }}>
                {t('common.dontCloseTab')}
            </p>
        </div>
    );
};

export default LongOperationOverlay;
