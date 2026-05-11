import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import api from '../services/apiClient';

// Page publique « Ouvrages » — vitrine de liens vers le PrestaShop externe.
// Items rendus depuis /api/shop-items, groupés par catégorie (book / game / other).

const CATEGORY_LABELS = {
    book:  'Livres',
    game:  'Jeux de cartes',
    other: 'Autres',
};

// ── Card individuelle ────────────────────────────────────────
const ItemCard = ({ item }) => (
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
                alt={item.title}
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
                {item.title}
            </h3>
            {item.subtitle && (
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {item.subtitle}
                </p>
            )}
            {item.description && (
                <p style={{ margin: '8px 0 0', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}>
                    {item.description}
                </p>
            )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {item.price_text && (
                <span style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-heading)',
                }}>
                    {item.price_text}
                </span>
            )}
            {item.external_url && (
                <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paleo-btn"
                    style={{ padding: '10px 18px', fontSize: '0.82rem', marginLeft: 'auto' }}
                >
                    Acheter <ExternalLink size={14} />
                </a>
            )}
        </div>
    </article>
);

const Ouvrages = () => {
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
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)' }}>Nos Ouvrages</h1>

            <p style={{ fontSize: '1.15rem', marginBottom: '40px', color: 'var(--color-text-muted)' }}>
                Découvrez nos livres et nos jeux qui compilent des centaines d'inventions oubliées
                et proposent une autre lecture de l'histoire technique.
                Les achats se font sur notre boutique externe.
            </p>

            {loading ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>Chargement…</p>
            ) : !hasAny ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    Aucun produit publié pour le moment.
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
                                {list.map(it => <ItemCard key={it.id} item={it} />)}
                            </div>
                        </section>
                    );
                })
            )}
        </div>
    );
};

export default Ouvrages;
