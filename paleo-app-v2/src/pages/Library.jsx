import React, { useEffect, useState, useMemo } from 'react';
import { useCartels } from '../hooks/useCartels';
import { useCategories } from '../hooks/useCategories';
import CartelCard from '../components/CartelCard';
import { Search, Filter, CalendarDays, LayoutGrid } from 'lucide-react';
import './Library.css';

/**
 * Library — Frise globale de tous les cartels publiés.
 * Version allégée de la Library v1 : grille + filtre catégorie + recherche.
 */
export default function Library() {
  const { cartels, loading, fetchCartels } = useCartels();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedCartel, setSelectedCartel] = useState(null);
  const [sortBy, setSortBy] = useState('annee'); // 'annee' | 'created_at'

  useEffect(() => {
    fetchCartels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let data = [...cartels];

    // Filtre catégorie
    if (selectedCat) {
      data = data.filter(c =>
        c.categories?.some(cat => cat.id === selectedCat)
      );
    }

    // Filtre recherche
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        (c.titre || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q) ||
        String(c.annee || '').includes(q)
      );
    }

    // Tri
    data.sort((a, b) => {
      if (sortBy === 'annee') {
        const ya = parseInt(a.annee) || 9999;
        const yb = parseInt(b.annee) || 9999;
        return ya - yb;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return data;
  }, [cartels, search, selectedCat, sortBy]);

  return (
    <div className="library page-enter">
      <div className="container">

        {/* ── Header ── */}
        <div className="library-header">
          <div>
            <h1 className="library-title">Frise globale</h1>
            <p className="library-subtitle">
              Toutes les inventions exhumées — {filtered.length} cartel{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="library-toolbar">
          {/* Search */}
          <div className="library-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Rechercher (titre, lieu, année…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="library-search-input"
              id="library-search"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="library-search-clear"
                aria-label="Effacer la recherche"
              >✕</button>
            )}
          </div>

          {/* Sort */}
          <div className="library-sort">
            <Filter size={14} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="library-sort-select"
              id="library-sort"
            >
              <option value="annee">Par date (ancienne → récente)</option>
              <option value="created_at">Récemment ajoutés</option>
            </select>
          </div>
        </div>

        {/* ── Category filters ── */}
        {categories.length > 0 && (
          <div className="library-cats">
            <button
              className={`library-cat-btn ${!selectedCat ? 'active' : ''}`}
              onClick={() => setSelectedCat(null)}
              id="cat-filter-all"
            >
              Toutes
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`library-cat-btn ${selectedCat === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                style={selectedCat === cat.id ? {
                  background: `${cat.color}20`,
                  color: cat.color,
                  borderColor: `${cat.color}40`
                } : {}}
                id={`cat-filter-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <p>Chargement des cartels…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="loading-center">
            <p>Aucun cartel{search || selectedCat ? ' pour ces filtres' : ''}.</p>
          </div>
        ) : (
          <div className="library-grid">
            {filtered.map(cartel => (
              <CartelCard
                key={cartel.id}
                cartel={cartel}
                onClick={() => setSelectedCartel(cartel)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal partagé depuis CategoryPage via import dynamique possible */}
      {selectedCartel && (
        <CartelModalInline
          cartel={selectedCartel}
          onClose={() => setSelectedCartel(null)}
        />
      )}
    </div>
  );
}

function CartelModalInline({ cartel, onClose }) {
  return (
    <div
      className="cartel-modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="cartel-modal">
        <button className="cartel-modal-close btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        {cartel.image_path && (
          <div className="cartel-modal-img"><img src={cartel.image_path} alt={cartel.titre} /></div>
        )}
        <div className="cartel-modal-body">
          {cartel.categories?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {cartel.categories.map(cat => (
                <span key={cat.id} className="badge" style={{
                  background: `${cat.color}20`, color: cat.color,
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
          {cartel.description && <p className="cartel-modal-desc">{cartel.description}</p>}
          {cartel.url_qr && (
            <a href={cartel.url_qr} target="_blank" rel="noopener noreferrer"
              className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
              🔗 En savoir plus
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
