import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trans, useTranslation } from 'react-i18next';
import { AlertTriangle, FileX, Link as LinkIcon, Image as ImageIcon, Globe } from 'lucide-react';

const TYPE_ICON = {
  missing_file:  { icon: FileX,     color: '#e53e3e' },
  legacy_format: { icon: LinkIcon,  color: '#e67e00' },
  no_image:      { icon: ImageIcon, color: '#888'    },
  remote_url:    { icon: Globe,     color: '#3b5bdb' },
};

/**
 * Modal d'alerte affichée au chargement de ManageCartels si des cartels ont
 * des problèmes d'images. Deux actions :
 *   - Continuer              : ferme le modal
 *   - Voir les cartels       : filtre la liste sur les cartels problématiques
 */
const ImageHealthModal = ({ issues, onContinue, onShowIssues }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onContinue(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onContinue]);

  const countsByType = issues.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return createPortal(
    <div
      onClick={onContinue}
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
          padding: '28px 32px', maxWidth: '520px', width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: '18px',
          animation: 'slideUp 0.18s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={28} color="#e53e3e" />
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>{t('imageHealth.title')}</h2>
        </div>

        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#444' }}>
          <Trans i18nKey="imageHealth.summary" count={issues.length} components={[<strong key="s" />]} />
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8f9fa', borderRadius: '8px', padding: '12px 14px' }}>
          {Object.entries(countsByType).map(([type, count]) => {
            const meta = TYPE_ICON[type] || { icon: AlertTriangle, color: '#888' };
            const Icon = meta.icon;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#444' }}>
                <Icon size={16} color={meta.color} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, minWidth: '28px', color: meta.color }}>{count}</span>
                <span style={{ fontWeight: 500 }}>{t(`imageHealth.type_${type}_label`)}</span>
                <span style={{ color: '#888', fontSize: '0.82rem' }}>— {t(`imageHealth.type_${type}_help`)}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={onContinue}
            style={{
              padding: '9px 18px', borderRadius: '8px',
              border: '1px solid #ddd', background: 'white',
              cursor: 'pointer', fontSize: '0.9rem', color: '#555',
            }}
          >
            {t('imageHealth.continue')}
          </button>
          <button
            onClick={onShowIssues}
            autoFocus
            style={{
              padding: '9px 18px', borderRadius: '8px',
              border: 'none', background: '#e53e3e', color: 'white',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            {t('imageHealth.viewIssues')}
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

export default ImageHealthModal;
