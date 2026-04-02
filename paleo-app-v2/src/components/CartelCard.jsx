import React from 'react';
import { MapPin, Calendar, User } from 'lucide-react';
import './CartelCard.css';

/**
 * CartelCard — Aperçu compact d'un cartel.
 * Utilisé dans la Home (grille) et la Library (liste).
 */
export default function CartelCard({ cartel, onClick }) {
  if (!cartel) return null;

  const {
    titre, description, annee, location,
    exhume_par, image_path, categories = [], status
  } = cartel;

  const truncate = (str, len = 120) =>
    str && str.length > len ? str.slice(0, len) + '…' : str;

  return (
    <article
      className="cartel-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`Cartel : ${titre}`}
    >
      {/* Image */}
      <div className="cartel-card-media">
        {image_path ? (
          <img src={image_path} alt={titre} loading="lazy" />
        ) : (
          <div className="cartel-card-placeholder">
            <span>{titre?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}
        {/* Status badge (visible admin) */}
        {status && status !== 'published' && (
          <span className={`badge badge-${status} cartel-card-status`}>
            {status === 'draft' ? 'Brouillon' : status === 'pending_review' ? 'En revue' : status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="cartel-card-body">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="cartel-card-cats">
            {categories.slice(0, 3).map(cat => (
              <span
                key={cat.id}
                className="cartel-card-cat"
                style={{ '--cat-color': cat.color || 'var(--color-accent)' }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        <h3 className="cartel-card-title">{titre}</h3>

        {description && (
          <p className="cartel-card-desc">{truncate(description)}</p>
        )}

        <div className="cartel-card-meta">
          {annee && (
            <span className="cartel-meta-item">
              <Calendar size={12} />
              {annee}
            </span>
          )}
          {location && (
            <span className="cartel-meta-item">
              <MapPin size={12} />
              {location}
            </span>
          )}
          {exhume_par && (
            <span className="cartel-meta-item">
              <User size={12} />
              {exhume_par}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
