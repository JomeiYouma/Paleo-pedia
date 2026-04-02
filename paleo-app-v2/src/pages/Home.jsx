import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { supabase } from '../lib/supabase';
import * as LucideIcons from 'lucide-react';

/** Résout un nom d'icône Lucide stocké en DB → composant React */
function LucideIcon({ name, size = 22, color }) {
  const Icon = LucideIcons[name];
  if (!Icon) return <span style={{ color }}>{name}</span>;
  return <Icon size={size} color={color} />;
}
import { ArrowRight, Layers, Search } from 'lucide-react';
import './Home.css';

/**
 * Home — Page d'accueil principale paléo.
 * 
 * Affiche une grille de catégories chargées depuis Supabase.
 * Chaque catégorie pointe vers /category/:id (frise filtrée).
 * Le titre et la description de chaque catégorie sont paramétrables via Admin.
 */
export default function Home() {
  const { categories, loading } = useCategories();
  const [counts, setCounts] = useState({});

  // Compter le nombre de cartels publiés par catégorie
  useEffect(() => {
    if (categories.length === 0) return;
    const fetchCounts = async () => {
      const results = await Promise.all(
        categories.map(async (cat) => {
          const { count } = await supabase
            .from('cartel_categories')
            .select('cartel_id', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          return [cat.id, count || 0];
        })
      );
      setCounts(Object.fromEntries(results));
    };
    fetchCounts();
  }, [categories]);

  return (
    <div className="home page-enter">
      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden />
        <div className="container home-hero-content">
          <div className="home-hero-tag">Atelier 21</div>
          <h1 className="home-hero-title">
            Une contre-histoire<br />
            <span className="home-hero-accent">de l'énergie</span>
          </h1>
          <p className="home-hero-sub">
            Explorez des siècles d'inventions oubliées à travers une frise interactive.
            Chaque cartel ressuscite une technique, un lieu, une époque.
          </p>
          <div className="home-hero-cta">
            <Link to="/library" className="btn btn-primary btn-lg" id="hero-cta-library">
              Voir toute la frise <ArrowRight size={18} />
            </Link>
            <Link to="/create" className="btn btn-secondary btn-lg" id="hero-cta-create">
              Proposer un cartel
            </Link>
          </div>
        </div>
        {/* Decorative timeline dots */}
        <div className="home-hero-timeline" aria-hidden>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="home-hero-dot" style={{ '--i': i }} />
          ))}
        </div>
      </section>

      {/* ── Catégories ── */}
      <section className="home-categories">
        <div className="container">
          <div className="home-section-header">
            <h2 className="home-section-title">Explorer par thématique</h2>
            <p className="home-section-sub">
              Sélectionnez une catégorie pour afficher la frise des inventions correspondantes.
            </p>
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <p>Chargement des thématiques…</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="home-empty">
              <Layers size={40} />
              <p>Aucune thématique disponible pour l'instant.</p>
              <p className="home-empty-sub">Les catégories sont configurables depuis l'interface Admin.</p>
            </div>
          ) : (
            <div className="home-grid">
              {categories.map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  count={counts[cat.id]}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Global CTA ── */}
      <section className="home-banner">
        <div className="container home-banner-inner">
          <div>
            <h2 className="home-banner-title">Vous avez une découverte à partager ?</h2>
            <p className="home-banner-sub">
              Soumettez un cartel sans compte — l'équipe le validera et l'intégrera à la frise.
            </p>
          </div>
          <Link to="/create" className="btn btn-primary btn-lg" id="banner-cta">
            <Search size={18} />
            Proposer une invention
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Sous-composant : CategoryCard ── */
function CategoryCard({ category, count, index }) {
  const { id, name, description, color, icon } = category;
  const accentColor = color || '#c8622a';

  return (
    <Link
      to={`/category/${id}`}
      className="cat-card"
      id={`cat-card-${id}`}
      style={{
        '--cat-accent': accentColor,
        '--cat-delay': `${index * 60}ms`
      }}
      aria-label={`Explorer la thématique : ${name}`}
    >
      {/* Color bar */}
      <div className="cat-card-bar" />

      <div className="cat-card-body">
        {/* Icon : nom Lucide ou emoji */}
        <div className="cat-card-icon" style={{ background: `${accentColor}20`, color: accentColor }}>
          {icon ? (
            LucideIcons[icon]
              ? <LucideIcon name={icon} size={22} color={accentColor} />
              : <span className="cat-card-icon-text">{icon}</span>
          ) : (
            <Layers size={22} />
          )}
        </div>

        <div className="cat-card-content">
          <h3 className="cat-card-name">{name}</h3>
          {description && (
            <p className="cat-card-desc">{description}</p>
          )}
        </div>

        <div className="cat-card-footer">
          {count !== undefined && (
            <span className="cat-card-count">
              {count} cartel{count !== 1 ? 's' : ''}
            </span>
          )}
          <span className="cat-card-arrow">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
