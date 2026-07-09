import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Truck } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';
import { usePageMeta } from '../hooks/usePageMeta';
import { useIsMobile } from '../hooks/useIsMobile';
import Breadcrumb from '../components/Breadcrumb';
import ProductPurchase from '../components/ProductPurchase';
import { idFromHandle, productHandle, minPriceLabel, parsePrice } from '../utils/shopHelpers';

// Page produit publique — écran intermédiaire depuis la grille /boutique.
// URL: /boutique/<slug>-<uuid>. Bon pour l'ergonomie ET le référencement
// (URL propre + balises OG injectées côté serveur, cf. server/lib/socialMeta.js).
const SITE_URL = 'https://paleo-energetique.org';

const ProductPage = () => {
    const { handle } = useParams();
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const isMobile = useIsMobile();
    const id = idFromHandle(handle);

    const [items, setItems] = useState(null); // null = en cours de chargement

    useEffect(() => {
        let cancelled = false;
        api.shopItems.getAll()
            .then((d) => { if (!cancelled) setItems(Array.isArray(d) ? d : []); })
            .catch(() => { if (!cancelled) setItems([]); });
        return () => { cancelled = true; };
    }, []);

    const item = useMemo(() => (items || []).find((x) => x.id === id) || null, [items, id]);

    const title       = item ? (pickLang(item, 'title', lang) || item.title) : '';
    const subtitle    = item ? (pickLang(item, 'subtitle', lang) || item.subtitle) : '';
    const description = item ? (pickLang(item, 'description', lang) || item.description) : '';
    const priceHint   = item ? minPriceLabel(item) : null;

    usePageMeta({
        title: item ? title : t('pages.ouvrages.title'),
        description: (description || subtitle || t('pages.ouvrages.intro')),
        path: item ? `/boutique/${productHandle(item)}` : '/boutique',
    });

    if (items === null) {
        return <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--color-text-subtle)' }}>{t('pages.ouvrages.loading')}</div>;
    }
    if (!item) {
        return (
            <div style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-subtle)', marginBottom: '12px' }}>{t('pages.ouvrages.notFound', 'Produit introuvable.')}</p>
                <Link to="/boutique" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>← {t('pages.ouvrages.title')}</Link>
            </div>
        );
    }

    const crumbs = [
        { label: lang === 'en' ? 'Home' : 'Accueil', href: '/' },
        { label: t('pages.ouvrages.title'), href: '/boutique' },
    ];

    // JSON-LD schema.org/Product (résultats enrichis Google — le crawler exécute le JS).
    const priceNum = priceHint != null ? parsePrice(priceHint) : null;
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        ...(description ? { description } : (subtitle ? { description: subtitle } : {})),
        ...(item.image_path ? { image: item.image_path.startsWith('http') ? item.image_path : SITE_URL + item.image_path } : {}),
        brand: { '@type': 'Organization', name: 'Atelier 21' },
        ...(priceNum != null ? {
            offers: { '@type': 'Offer', price: String(priceNum), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: `${SITE_URL}/boutique/${productHandle(item)}` },
        } : {}),
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto 80px', padding: '0 24px', color: 'var(--color-text)' }}>
            <Breadcrumb crumbs={crumbs} current={title} />

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 340px) 1fr',
                gap: isMobile ? '24px' : '44px',
                alignItems: 'start',
            }}>
                {/* Visuel */}
                <div style={{ maxWidth: isMobile ? '280px' : 'none', margin: isMobile ? '0 auto' : 0 }}>
                    {item.image_path ? (
                        <img src={item.image_path} alt={title} style={{
                            width: '100%', aspectRatio: '3 / 4', objectFit: 'cover',
                            borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', boxShadow: 'var(--shadow-sm)',
                        }} />
                    ) : (
                        <div style={{
                            width: '100%', aspectRatio: '3 / 4', background: 'var(--color-primary-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 'var(--radius-md)', color: 'var(--color-text-subtle)',
                        }}><ShoppingBag size={40} /></div>
                    )}
                </div>

                {/* Infos + achat */}
                <div>
                    <h1 style={{ fontSize: '2rem', margin: '0 0 8px', color: 'var(--color-primary)', lineHeight: 1.2 }}>{title}</h1>
                    {subtitle && (
                        <p style={{ margin: '0 0 18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.9rem' }}>
                            {subtitle}
                        </p>
                    )}
                    {description && (
                        <p style={{ margin: '0 0 26px', lineHeight: 1.7, color: 'var(--color-text)', whiteSpace: 'pre-line' }}>{description}</p>
                    )}

                    <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                        <ProductPurchase item={item} lang={lang} t={t} />
                        <p style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            margin: '16px 0 0', paddingTop: '14px', borderTop: '1px solid var(--color-border)',
                            fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5,
                        }}>
                            <Truck size={15} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
                            <span>{t('pages.ouvrages.shippingNote')}</span>
                        </p>
                    </div>
                </div>
            </div>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        </div>
    );
};

export default ProductPage;
