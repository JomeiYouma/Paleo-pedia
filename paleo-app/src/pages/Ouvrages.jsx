import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, ArrowRight } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';
import { usePageMeta } from '../hooks/usePageMeta';
import { productHandle, minPriceLabel, totalOptions } from '../utils/shopHelpers';

// Page publique « Boutique » — vitrine de produits (liens de paiement Stripe).
// La grille affiche des TEASERS ; chaque teaser mène à la page produit dédiée
// (/boutique/<slug>-<id>), où se fait la sélection version/option + achat.
// Items rendus depuis /api/shop-items, groupés par catégorie (book / game / other).

// ── Teaser produit (grille) — carte cliquable vers la page produit ──
const ItemCard = ({ item, lang, t }) => {
    const title     = pickLang(item, 'title',    lang) || item.title;
    const subtitle  = pickLang(item, 'subtitle', lang) || item.subtitle;
    const priceHint = minPriceLabel(item);
    const multi     = totalOptions(item) > 1;

    return (
    <Link
        to={`/boutique/${productHandle(item)}`}
        className="paleo-card-link"
        style={{
            textDecoration: 'none', color: 'inherit',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            boxShadow: 'var(--shadow-sm)',
        }}
    >
        {item.image_path ? (
            <img src={item.image_path} alt={title} style={{
                width: '100%', aspectRatio: '3 / 4', objectFit: 'cover',
                borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)',
            }} />
        ) : (
            <div style={{
                width: '100%', aspectRatio: '3 / 4', background: 'var(--color-primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-text-subtle)', borderRadius: 'var(--radius-md)',
            }}>
                <ShoppingBag size={32} />
            </div>
        )}
        <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', lineHeight: '1.25', color: 'var(--color-text)' }}>
                {title}
            </h3>
            {subtitle && (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {subtitle}
                </p>
            )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            {priceHint && (
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                    {multi ? `${t('pages.ouvrages.from', 'dès')} ` : ''}{priceHint}
                </span>
            )}
            <span className="paleo-btn" style={{ padding: '9px 16px', fontSize: '0.82rem', marginLeft: 'auto', pointerEvents: 'none' }}>
                {t('pages.ouvrages.seeProduct', 'Voir le produit')} <ArrowRight size={14} />
            </span>
        </div>
    </Link>
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
