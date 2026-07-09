import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toVariants } from '../utils/shopHelpers';

/**
 * ProductPurchase — UI d'achat adaptative d'un article de boutique.
 * Article → variantes (Papier/E-book) → options de paiement (modes d'envoi),
 * un lien Stripe par option. L'affichage s'adapte :
 *   - tout unique                 → un bouton « Acheter »
 *   - variantes à option unique   → un bouton par variante (nom — prix)
 *   - variantes multi-options     → sélecteur de variante + boutons d'options
 * Utilisé sur la page produit (et réutilisable ailleurs).
 */
const priceStyle = { fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' };
const headingStyle = { fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '8px' };

const ProductPurchase = ({ item, lang, t }) => {
    const variants = toVariants(item);
    const nV = variants.length;
    const [vi, setVi] = useState(0);
    const activeIdx = Math.min(vi, Math.max(0, nV - 1));
    const active = variants[activeIdx] || null;
    const isEn = lang === 'en';
    const lbl = (x) => (isEn && x?.label_en ? x.label_en : (x?.label || ''));
    const allSingle = nV > 0 && variants.every((v) => v.options.length === 1);
    const trulySingle = nV === 1 && variants[0].options.length === 1;

    // Bouton « Acheter » (prix à gauche, CTA à droite).
    const buyButton = (o) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            {o.price && <span style={priceStyle}>{o.price}</span>}
            <a href={o.url} target="_blank" rel="noopener noreferrer" className="paleo-btn"
                style={{ padding: '12px 22px', fontSize: '0.9rem', marginLeft: 'auto' }}>
                {t('pages.ouvrages.buy')} <ExternalLink size={15} />
            </a>
        </div>
    );
    // Bouton « nom — prix » (une option ou une variante à option unique).
    const linkButton = (o, key, name) => (
        <a key={key} href={o.url} target="_blank" rel="noopener noreferrer" className="paleo-btn"
            style={{ padding: '12px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span>{name}{o.price ? ` — ${o.price}` : ''}</span>
            <ExternalLink size={15} style={{ flexShrink: 0 }} />
        </a>
    );

    if (nV === 0) {
        return <p style={{ color: 'var(--color-warning)', fontSize: '0.9rem', margin: 0 }}>{t('pages.ouvrages.soon', 'Bientôt disponible.')}</p>;
    }
    if (trulySingle) return buyButton(active.options[0]);
    if (allSingle) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {variants.map((v, i) => linkButton(v.options[0], i, lbl(v) || t('pages.ouvrages.buy')))}
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {nV > 1 && (
                <div>
                    <div style={headingStyle}>{t('pages.ouvrages.version', 'Version')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {variants.map((v, i) => {
                            const on = i === activeIdx;
                            return (
                                <button key={i} type="button" onClick={() => setVi(i)} aria-pressed={on}
                                    style={{
                                        padding: '9px 16px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: on ? 700 : 500,
                                        border: on ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        background: on ? 'var(--color-primary)' : 'var(--color-surface)',
                                        color: on ? 'var(--color-white)' : 'var(--color-text-muted)',
                                    }}>
                                    {lbl(v) || `${t('pages.ouvrages.buy')} ${i + 1}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {active && (
                <div>
                    {active.options.length > 1 && (
                        <div style={headingStyle}>{t('pages.ouvrages.delivery', 'Envoi / option')}</div>
                    )}
                    {active.options.length === 1
                        ? buyButton(active.options[0])
                        : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {active.options.map((o, i) => linkButton(o, i, lbl(o) || t('pages.ouvrages.buy')))}
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default ProductPurchase;
