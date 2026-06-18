import React, { useState, useEffect } from 'react';
import { KeyRound, X } from 'lucide-react';

/**
 * Modale de mot de passe, réutilisable.
 *
 *   mode="self"  → l'utilisateur change SON mot de passe : champ « mot de passe
 *                  actuel » + nouveau + confirmation. onSubmit reçoit
 *                  { currentPassword, newPassword }.
 *   mode="reset" → un admin réinitialise le mot de passe d'un membre : nouveau
 *                  + confirmation (pas de mot de passe actuel). onSubmit reçoit
 *                  { newPassword }.
 *
 * onSubmit doit renvoyer une promesse ; si elle rejette, le message d'erreur
 * est affiché dans la modale et celle-ci reste ouverte.
 */
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', fontSize: '0.95rem',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: '700',
  color: 'var(--color-text-muted)', marginBottom: '6px',
  fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px',
};

const PasswordModal = ({ mode = 'reset', targetEmail, onClose, onSubmit }) => {
  const isSelf = mode === 'self';
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  const title = isSelf
    ? 'Changer mon mot de passe'
    : `Réinitialiser le mot de passe${targetEmail ? ` — ${targetEmail}` : ''}`;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSelf && !current) { setError('Indiquez votre mot de passe actuel.'); return; }
    if (next.length < 8) { setError('Le nouveau mot de passe doit faire 8 caractères minimum.'); return; }
    if (next !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      await onSubmit(isSelf ? { currentPassword: current, newPassword: next } : { newPassword: next });
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => { if (!loading) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          padding: '32px', width: '100%', maxWidth: '420px',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} /> {title}
          </h2>
          <button
            onClick={() => !loading && onClose()}
            aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSelf && (
            <div>
              <label style={labelStyle}>Mot de passe actuel</label>
              <input
                type="password" value={current} autoFocus autoComplete="current-password"
                onChange={e => setCurrent(e.target.value)} placeholder="••••••••" style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Nouveau mot de passe (8+ car.)</label>
            <input
              type="password" value={next} minLength={8} autoComplete="new-password"
              autoFocus={!isSelf}
              onChange={e => setNext(e.target.value)} placeholder="••••••••" style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
            <input
              type="password" value={confirm} minLength={8} autoComplete="new-password"
              onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={inputStyle}
            />
          </div>

          {!isSelf && targetEmail && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              Communiquez ce nouveau mot de passe à la personne par un canal sûr. Elle pourra le changer
              elle-même ensuite depuis son menu.
            </p>
          )}

          {error && (
            <div role="alert" style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--color-error)', fontSize: '0.87rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button" onClick={() => !loading && onClose()} disabled={loading}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '11px 18px', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: '700', fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--color-text-muted)',
              }}
            >
              Annuler
            </button>
            <button
              type="submit" disabled={loading}
              style={{
                background: loading ? 'var(--color-border-strong)' : 'var(--color-primary)',
                color: 'var(--color-white)', border: 'none', borderRadius: 'var(--radius-md)',
                padding: '11px 18px', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: '700', fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase', letterSpacing: '0.4px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <KeyRound size={15} />
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
