import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCartels } from '../hooks/useCartels';
import { useCategories } from '../hooks/useCategories';
import { supabase } from '../lib/supabase';
import CartelCard from '../components/CartelCard';
import { ArrowLeft, CalendarDays, Map as MapIcon, LayoutGrid, Search } from 'lucide-react';
import './CategoryPage.css';

/**
 * CategoryPage — Frise filtrée par catégorie.
 * 
 * URL : /category/:categoryId
 * Charge uniquement les cartels publiés de cette catégorie.
 * Mode timeline / carte / grille.
 */
export default function CategoryPage() {
  const { categoryId } = useParams();
  const { categories } = useCategories();
  const { cartels, loading, error, fetchCartels } = useCartels();
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedCartel, setSelectedCartel] = useState(null);

  // Trouver la catégorie courante
  const category = categories.find(c => c.id === categoryId);

  // Charger les cartels filtrés par catégorie au montage ou changement de categoryId
  useEffect(() => {
    loadFilteredCartels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const loadFilteredCartels = async () => {
    // Récupérer les ids de cartels dans cette catégorie
    const { data: links } = await supabase
      .from('cartel_categories')
      .select('cartel_id')
      .eq('category_id', categoryId);

    if (!links || links.length === 0) {
      fetchCartels(null); // vide
      return;
    }

    // Récupérer les cartels avec ces ids (publiés uniquement)
    const { data, error: err } = await supabase
      .from('cartels')
      .select(`
        *,
        cartel_categories(category_id, category:categories(id, name, color, icon))
      `)
      .in('id', links.map(l => l.cartel_id))
      .eq('status', 'published')
      .eq('visible', true)
      .order('annee', { ascending: true });

    if (err) { console.error(err); return; }

    // Normaliser
    const normalized = (data || []).map(c => ({
      ...c,
      categories: c.cartel_categories?.map(cc => cc.category).filter(Boolean) || []
    }));

    // Injecter dans le hook (accès via cartels)
    fetchCartels.__inject?.(normalized);
    // Fallback direct
    setLocalCartels(normalized);
  };

  // État local pour les cartels filtrés (car useCartels.fetchCartels ne suffit pas ici)
  const [localCartels, setLocalCartels] = useState([]);

  const displayCartels = localCartels.length > 0 ? localCartels : cartels;

  const filtered = useMemo(() => {
    if (!search) return displayCartels;
    const q = search.toLowerCase();
    return displayCartels.filter(c =>
      (c.titre || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q) ||
      String(c.annee || '').includes(q)
    );
  }, [displayCartels, search]);

  const accentColor = category?.color || 'var(--color-accent)';

  return (
    <div className="cat-page page-enter">
      <div className="container">

        {/* ── Breadcrumb ── */}
        <div className="cat-page-breadcrumb">
          <Link to="/" className="cat-page-back">
            <ArrowLeft size={14} /> Accueil
          </Link>
          <span className="cat-page-sep">/</span>
          <span>{category?.name || categoryId}</span>
        </div>

        {/* ── Header ── */}
        <div className="cat-page-header" style={{ '--accent': accentColor }}>
          <div className="cat-page-header-bar" />
          <div className="cat-page-header-body">
            {category?.icon && (
              <div className="cat-page-icon" style={{ background: `${accentColor}20`, color: accentColor }}>
                <span>{category.icon}</span>
              </div>
            )}
            <div>
              <h1 className="cat-page-title">{category?.name || 'Catégorie'}</h1>
              {category?.description && (
                <p className="cat-page-desc">{category.description}</p>
              )}
            </div>
          </div>
          <div className="cat-page-count">
            {filtered.length} cartel{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="cat-page-toolbar">
          {/* Recherche */}
          <div className="cat-page-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Rechercher dans cette thématique…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="cat-page-search-input"
              id="cat-search-input"
            />
          </div>

          {/* Modes d'affichage */}
          <div className="cat-page-views">
            <button
              className={`cat-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vue grille"
              id="view-grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`cat-view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              title="Vue frise"
              id="view-timeline"
            >
              <CalendarDays size={16} />
            </button>
            <button
              className={`cat-view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Vue carte"
              id="view-map"
            >
              <MapIcon size={16} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <p>Chargement des cartels…</p>
          </div>
        ) : error ? (
          <div className="loading-center">
            <p style={{ color: 'var(--color-danger)' }}>Erreur : {error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="loading-center">
            <p>Aucun cartel trouvé{search ? ' pour cette recherche' : ' dans cette catégorie'}.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="cat-page-grid">
                {filtered.map(cartel => (
                  <CartelCard
                    key={cartel.id}
                    cartel={cartel}
                    onClick={() => setSelectedCartel(cartel)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'timeline' && (
              <MiniTimeline cartels={filtered} accentColor={accentColor} />
            )}

            {viewMode === 'map' && (
              <div className="loading-center">
                <p style={{ color: 'var(--color-text-muted)' }}>
                  Vue carte disponible dans la prochaine version.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Cartel Modal ── */}
        {selectedCartel && (
          <CartelModal cartel={selectedCartel} onClose={() => setSelectedCartel(null)} />
        )}
      </div>
    </div>
  );
}

/* ── Mini Timeline ── */
function MiniTimeline({ cartels, accentColor }) {
  return (
    <div className="mini-timeline">
      {cartels.map((cartel, i) => (
        <div key={cartel.id} className="mini-tl-item" style={{ '--accent': accentColor }}>
          <div className="mini-tl-year">{cartel.annee || '?'}</div>
          <div className="mini-tl-line">
            <div className="mini-tl-dot" />
            {i < cartels.length - 1 && <div className="mini-tl-connector" />}
          </div>
          <div className="mini-tl-card">
            <h4 className="mini-tl-title">{cartel.titre}</h4>
            {cartel.location && (
              <p className="mini-tl-loc">{cartel.location}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Cartel Modal ── */
function CartelModal({ cartel, onClose }) {
  return (
    <div
      className="cartel-modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={cartel.titre}
    >
      <div className="cartel-modal">
        <button className="cartel-modal-close btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        {cartel.image_path && (
          <div className="cartel-modal-img">
            <img src={cartel.image_path} alt={cartel.titre} />
          </div>
        )}

        <div className="cartel-modal-body">
          {cartel.categories?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {cartel.categories.map(cat => (
                <span key={cat.id} className="badge" style={{
                  background: `${cat.color}20`,
                  color: cat.color,
                  border: `1px solid ${cat.color}40`
                }}>{cat.name}</span>
              ))}
            </div>
          )}

          <h2 className="cartel-modal-title">{cartel.titre}</h2>

          <div className="cartel-modal-meta">
            {cartel.annee && <span>📅 {cartel.annee}</span>}
            {cartel.location && <span>📍 {cartel.location}</span>}
            {cartel.exhume_par && <span>👤 {cartel.exhume_par}</span>}
          </div>

          {cartel.description && (
            <p className="cartel-modal-desc">{cartel.description}</p>
          )}

          {cartel.url_qr && (
            <a
              href={cartel.url_qr}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 16 }}
            >
              🔗 En savoir plus
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
