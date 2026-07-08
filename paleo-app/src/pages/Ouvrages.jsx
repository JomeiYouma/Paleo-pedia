import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, ShoppingBag, Truck } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';
import { usePageMeta } from '../hooks/usePageMeta';

// Page publique « Ouvrages » — vitrine de liens de paiement Stripe.
// Items rendus depuis /api/shop-items, groupés par catégorie (book / game / other).

// Normalise un article en variantes → options d'affichage :
//   [{ label, label_en, price, options: [{ label, label_en, price, url }] }]
// Repli sur l'ancien format plat (version.url) puis sur external_url.
const toVariants = (item) => {
    const raw = (Array.isArray(item.versions) && item.versions.length)
        ? item.versions
        : (item.external_url ? [{ label: '', label_en: '', price: item.price_text || '', url: item.external_url }] : []);
    return raw
        .map(v => {
            const options = (Array.isArray(v.options) && v.options.length)
                ? v.options
                : (v.url ? [{ label: '', label_en: '', price: v.price || '', url: v.url }] : []);
            return { label: v.label || '', label_en: v.label_en || '', price: v.price || '', options };
        })
        .filter(v => v.options.length);
};

const priceStyle = { fontSize: '1rem', fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' };

// ── Card individuelle ────────────────────────────────────────
const ItemCard = ({ item, lang, t }) => {
    const title       = pickLang(item, 'title',       lang) || item.title;
    const subtitle    = pickLang(item, 'subtitle',    lang) || item.subtitle;
    const description = pickLang(item, 'description', lang) || item.description;

    // Variantes (ex. Papier / E-book) → options de paiement (ex. modes d'envoi).
    const variants = toVariants(item);
    const nV = variants.length;
    const [vi, setVi] = useState(0);
    const activeIdx = Math.min(vi, Math.max(0, nV - 1));
    const active = variants[activeIdx] || null;
    const isEn = lang === 'en';
    const lbl = (x) => (isEn && x?.label_en ? x.label_en : (x?.label || ''));
    const allSingle   = nV > 0 && variants.every(v => v.options.length === 1);
    const trulySingle = nV === 1 && variants[0].options.length === 1;

    // Bouton « Acheter » simple (prix à gauche, CTA à droite).
    const buyButton = (o) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {o.price && <span style={priceStyle}>{o.price}</span>}
            <a href={o.url} target="_blank" rel="noopener noreferrer" className="paleo-btn"
                style={{ padding: '10px 18px', fontSize: '0.82rem', marginLeft: 'auto' }}>
                {t('pages.ouvrages.buy')} <ExternalLink size={14} />
            </a>
        </div>
    );
    // Bouton « nom — prix » (une option ou une variante à option unique).
    const linkButton = (o, key, name) => (
        <a key={key} href={o.url} target="_blank" rel="noopener noreferrer" className="paleo-btn"
            style={{ padding: '10px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span>{name}{o.price ? ` — ${o.price}` : ''}</span>
            <ExternalLink size={14} style={{ flexShrink: 0 }} />
        </a>
    );

    return (
    <article style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow-sm)',
    }}>
        {item.image_path ? (
            <img
                src={item.image_path}
                alt={title}
                style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary-soft)',
                }}
            />
        ) : (
            <div style={{
                width: '100%',
                aspectRatio: '3 / 4',
                background: 'var(--color-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-subtle)',
                borderRadius: 'var(--radius-md)',
            }}>
                <ShoppingBag size={32} />
            </div>
        )}
        <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', lineHeight: '1.25' }}>
                {title}
            </h3>
            {subtitle && (
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {subtitle}
                </p>
            )}
            {description && (
                <p style={{ margin: '8px 0 0', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}>
                    {description}
                </p>
            )}
        </div>
        {nV === 0 ? null : trulySingle ? (
            // Tout unique : prix + bouton « Acheter ».
            buyButton(active.options[0])
        ) : allSingle ? (
            // Chaque variante a une seule option : un bouton par variante (nom — prix).
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {variants.map((v, i) => linkButton(v.options[0], i, lbl(v) || t('pages.ouvrages.buy')))}
            </div>
        ) : (
            // Au moins une variante a plusieurs options : sélecteur de variante (si >1) + options.
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {nV > 1 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {variants.map((v, i) => {
                            const on = i === activeIdx;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setVi(i)}
                                    aria-pressed={on}
                                    style={{
                                        padding: '7px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: on ? 700 : 500,
                                        border: on ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        background: on ? 'var(--color-primary)' : 'var(--color-surface)',
                                        color: on ? 'var(--color-white)' : 'var(--color-text-muted)',
                                    }}
                                >
                                    {lbl(v) || `${t('pages.ouvrages.buy')} ${i + 1}`}
                                </button>
                            );
                        })}
                    </div>
                )}
                {active && (
                    active.options.length === 1
                        ? buyButton(active.options[0])
                        : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {active.options.map((o, i) => linkButton(o, i, lbl(o) || t('pages.ouvrages.buy')))}
                            </div>
                        )
                )}
            </div>
        )}
    </article>
    );
};

const Ouvrages = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    usePageMeta({
        title: t('pages.ouvrages.title'),
        description: t('pages.ouvrages.intro'),
        path: '/boutique',
    });
    const CATEGORY_LABELS = {
        book:  t('pages.ouvrages.categoryBook'),
        game:  t('pages.ouvrages.categoryGame'),
        other: t('pages.ouvrages.categoryOther'),
    };
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.shopItems.getAll()
            .then(d => setItems(Array.isArray(d) ? d : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const grouped = useMemo(() => {
        const map = { book: [], game: [], other: [] };
        items.forEach(it => {
            if (map[it.category]) map[it.category].push(it);
            else map.other.push(it);
        });
        return map;
    }, [items]);

    const hasAny = items.length > 0;

    return (
        <div style={{ maxWidth: '1100px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)' }}>{t('pages.ouvrages.title')}</h1>

            <p style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                {t('pages.ouvrages.intro')}
            </p>

            {/* Note livraison — transporteur Mondial Relay (frais selon le mode d'envoi) */}
            <p style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                marginBottom: '40px', padding: '10px 14px',
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5',
            }}>
                <Truck size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
                <span>{t('pages.ouvrages.shippingNote')}</span>
            </p>

            {loading ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>{t('pages.ouvrages.loading')}</p>
            ) : !hasAny ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    {t('pages.ouvrages.empty')}
                </p>
            ) : (
                ['book', 'game', 'other'].map(cat => {
                    const list = grouped[cat];
                    if (!list.length) return null;
                    return (
                        <section key={cat} style={{ marginBottom: '50px' }}>
                            <h2 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>
                                {CATEGORY_LABELS[cat]}
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '24px',
                            }}>
                                {list.map(it => <ItemCard key={it.id} item={it} lang={lang} t={t} />)}
                            </div>
                        </section>
                    );
                })
            )}
        </div>
    );
};

export default Ouvrages;
