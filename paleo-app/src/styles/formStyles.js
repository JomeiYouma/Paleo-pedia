// Styles de formulaire partagés — pour des champs et boutons cohérents
// (même border-radius, même bordure) à travers les formulaires du site.
// Les formulaires utilisant des styles inline divergents (padding nu, radius
// 4/6/8px…) doivent référencer ceux-ci.

// Libellé de champ — cohérent avec Contact / Participer (déjà sur ce modèle).
export const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

export const fieldStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    background: 'var(--color-surface, #fff)',
    color: 'var(--color-text)',
};

// Bouton secondaire (Ajouter, géocoder…) — même radius/bordure que les champs.
export const ghostBtnStyle = {
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface, #fff)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
};
