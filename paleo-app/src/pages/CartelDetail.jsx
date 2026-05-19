/**
 * CartelDetail.jsx — page publique "En savoir plus" d'un cartel.
 *
 * Cible des boutons / QR codes quand `use_internal_details` est activé. Route
 * accessible à `/cartel/:id` (site principal) et `/site/:slug/cartel/:id`
 * (sous-site, ou `/cartel/:id` sur un host dédié).
 *
 * Toujours publique : si `details_blocks` est vide on rend quand même l'en-tête
 * (titre + image + métadonnées). Si le cartel n'est pas accessible (scope hors
 * périmètre, supprimé, brouillon), on affiche un état d'erreur sobre.
 */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getHostSubsiteSlug, subsiteBasePath } from '../utils/subsiteHost';
import api from '../services/apiClient';
import { BlockList } from '../components/blocks/BlockRenderer';
import Breadcrumb from '../components/Breadcrumb';

// Même logique que CartelPreview.jsx : on accepte aussi bien les URLs canoniques
// `/api/images/...` que les anciens chemins relatifs hérités du portage PHP.
const resolveImage = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    if (path.startsWith('/api/') || path.startsWith('api/')) return path;
    let src = path.replace(/^(\.\.\/)+/, '').replace(/^\//, '');
    if (!src.startsWith('images/') && /\.(jpe?g|png|webp)$/i.test(src)) src = 'images/' + src;
    return src;
};

const CartelDetail = () => {
    const { id, slug: slugParam } = useParams();
    const { i18n } = useTranslation();
    const slug = slugParam || getHostSubsiteSlug() || null;

    const [cartel,  setCartel]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        const promise = slug
            ? api.cartels.getOneForSubsite(slug, id)
            : api.cartels.getOne(id);
        promise
            .then(c => { if (!cancelled) { setCartel(c); setError(''); } })
            .catch(err => { if (!cancelled) setError(err.message || 'Cartel introuvable'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id, slug]);

    const isEn = i18n.language === 'en';
    // `var(--color-accent)` vaut le jaune du site principal par défaut, et est
    // surchargé par la couleur primaire du sous-site quand on est sous
    // SubsiteLayout (cf. l'injection CSS dans ce layout).
    const accent = 'var(--color-accent)';

    if (loading) {
        return <div style={{ padding: '60px 24px', textAlign: 'center', color: '#999' }}>Chargement…</div>;
    }
    if (error || !cartel) {
        const fallbackHref = slug ? `${subsiteBasePath(slug)}/frise` : '/app';
        return (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ color: '#999' }}>{error || 'Cartel introuvable.'}</p>
                <Link to={fallbackHref} style={{ color: '#555', textDecoration: 'underline' }}>← Retour</Link>
            </div>
        );
    }

    const titre   = (isEn && cartel.titre_en)       ? cartel.titre_en       : cartel.titre;
    const desc    = (isEn && cartel.description_en) ? cartel.description_en : cartel.description;
    const location = (isEn && cartel.location_en)   ? cartel.location_en    : cartel.location;
    const imgUrl  = resolveImage(cartel.imageUrl || cartel.image_path);
    const blocks  = Array.isArray(cartel.details_blocks) ? cartel.details_blocks : [];

    // Fil d'Ariane : adapté selon contexte site principal vs sous-site.
    // Sur un sous-site, on remonte vers la home du sous-site puis sa frise ;
    // sur le site principal, on remonte vers l'accueil puis la bibliothèque.
    const subsiteBase = subsiteBasePath(cartel.subsite_slug || slug);
    const crumbs = cartel.subsite_slug
        ? [
            { label: cartel.subsite_name || cartel.subsite_slug, href: subsiteBase || '/' },
            { label: isEn ? 'Timeline' : 'Frise',                href: `${subsiteBase}/frise` },
        ]
        : [
            { label: isEn ? 'Home'    : 'Accueil',       href: '/' },
            { label: isEn ? 'Library' : 'Bibliothèque',  href: '/app' },
        ];

    return (
        <div style={{ background: 'var(--color-bg, white)', minHeight: '60vh' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px' }}>
                <Breadcrumb crumbs={crumbs} current={titre} />

                <h1 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#1a1a1a', margin: '0 0 12px', lineHeight: 1.15 }}>
                    {titre}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', color: '#777', fontSize: '0.92rem', marginBottom: '24px' }}>
                    {cartel.annee && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} /> {cartel.annee}
                        </span>
                    )}
                    {location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={14} /> {location}
                        </span>
                    )}
                    {cartel.exhume_par && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <User size={14} /> {cartel.exhume_par}
                        </span>
                    )}
                </div>

                {imgUrl && (
                    <figure style={{ margin: '0 0 32px' }}>
                        <img src={imgUrl} alt={titre || ''}
                            style={{ width: '100%', borderRadius: '14px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }} />
                        {cartel.imageCredit && (
                            <figcaption style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '8px', textAlign: 'right' }}>
                                © {cartel.imageCredit}
                            </figcaption>
                        )}
                    </figure>
                )}

                {desc && (
                    <p style={{
                        color: '#333', lineHeight: 1.75, fontSize: '1.08rem',
                        margin: '0 0 32px', whiteSpace: 'pre-wrap',
                    }}>
                        {desc}
                    </p>
                )}

                {blocks.length > 0 && <BlockList blocks={blocks} color={accent} />}

                {/* Si pas de blocs ET pas de page interne activée, on indique discrètement
                    que la page est en construction plutôt qu'une page presque vide. */}
                {blocks.length === 0 && !cartel.use_internal_details && (
                    <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.92rem', marginTop: '40px' }}>
                        {isEn ? 'No additional details yet.' : 'Pas encore de contenu détaillé.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default CartelDetail;
