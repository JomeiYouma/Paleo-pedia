import React from 'react';

// Composant de présentation partagé par toutes les pages d'erreur brandées
// (404 introuvable, 403 refusé, 500/erreur inattendue, crash React). Il ne
// porte QUE le visuel — grand code, titre, message — et laisse chaque appelant
// fournir ses propres actions via `children`, car selon le contexte on utilise
// soit un <Link> (dans le router) soit un <a>/<button> (ErrorBoundary, hors
// router). Le style reprend à l'identique l'ancienne page 404.
const ErrorPage = ({ code, heading, message, children }) => (
    <div style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{
            fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, margin: '0 0 8px',
            color: 'var(--color-primary)', fontFamily: 'var(--font-display, inherit)',
        }}>{code}</p>
        <h1 style={{ margin: '0 0 12px', fontSize: '1.5rem', color: 'var(--color-text)' }}>
            {heading}
        </h1>
        <p style={{ margin: '0 0 28px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {message}
        </p>
        {children != null && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {children}
            </div>
        )}
    </div>
);

// Styles d'action réutilisables — appliqués indifféremment à un <Link>, <a> ou
// <button> pour garder un rendu identique quel que soit le contexte de montage.
export const errorButtonPrimary = {
    display: 'inline-block', padding: '12px 24px',
    background: 'var(--color-primary)', color: 'var(--color-accent)',
    textDecoration: 'none', border: 'none', borderRadius: 6,
    fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer',
};

export const errorButtonSecondary = {
    display: 'inline-block', padding: '12px 24px',
    background: 'transparent', color: 'var(--color-text)',
    textDecoration: 'none', border: '1px solid var(--color-border, #cfcfcf)',
    borderRadius: 6, fontWeight: 700, fontSize: '1rem',
    fontFamily: 'inherit', cursor: 'pointer',
};

export default ErrorPage;
