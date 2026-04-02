import React, { useState } from 'react';
import { formatYear } from '../utils/helpers';
import { MapPin, Calendar, User, Link as LinkIcon, Tag } from 'lucide-react';
import './CartelDetail.css';

/**
 * CartelDetail — Affichage plein format d'un cartel.
 * Remplace CartelPreview de la v1, adapté au design v2 (sans i18n).
 *
 * Props :
 *   cartel     {object}  — données du cartel Supabase
 *   isDraft    {boolean} — affiche le badge brouillon
 *   compact    {boolean} — version compacte (moins de padding)
 */
const CartelDetail = ({ cartel, isDraft = false, compact = false }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!cartel) return null;

  const {
    titre, description, annee, location,
    exhume_par, image_path, url_qr,
    categories = [], imageCredit
  } = cartel;

  const imgSrc = image_path || null;
  const formattedYear = formatYear(annee, 'fr');

  return (
    <article className={`cartel-detail ${compact ? 'compact' : ''}`} aria-label={titre}>
      {/* Colonne image */}
      <div className="cartel-detail-media">
        {imgSrc && !imgError ? (
          <div className={`cartel-detail-img-wrap ${imgLoaded ? 'loaded' : 'loading'}`}>
            <img
              src={imgSrc}
              alt={titre}
              className="cartel-detail-img"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
            {imageCredit && (
              <div className="cartel-detail-credit">© {imageCredit}</div>
            )}
          </div>
        ) : (
          <div className="cartel-detail-no-img">
            <span className="cartel-detail-initial">{titre?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}

        {/* Auteur sous image */}
        {exhume_par && (
          <div className="cartel-detail-author">
            <User size={12} />
            <span>Exhumé par <strong>{exhume_par}</strong></span>
          </div>
        )}
      </div>

      {/* Colonne contenu */}
      <div className="cartel-detail-content">
        {isDraft && (
          <div className="badge badge-draft" style={{ marginBottom: 10 }}>
            ⚠️ Brouillon
          </div>
        )}

        {/* Année */}
        {annee && (
          <div className="cartel-detail-year mono">
            <Calendar size={13} />
            {formattedYear}
          </div>
        )}

        {/* Titre */}
        <h2 className="cartel-detail-title">{titre}</h2>

        {/* Lieu */}
        {location && (
          <div className="cartel-detail-location">
            <MapPin size={13} />
            <span>{location}</span>
          </div>
        )}

        {/* Catégories */}
        {categories.length > 0 && (
          <div className="cartel-detail-cats">
            {categories.map(cat => (
              <span
                key={cat.id}
                className="cartel-detail-cat"
                style={{ '--cat-color': cat.color || 'var(--color-accent)' }}
              >
                <Tag size={9} />
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="cartel-detail-desc">
            {description.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < description.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Lien QR/source */}
        {url_qr && (
          <a
            href={url_qr}
            target="_blank"
            rel="noopener noreferrer"
            className="cartel-detail-link"
          >
            <LinkIcon size={13} />
            Voir la source
          </a>
        )}
      </div>
    </article>
  );
};

export default CartelDetail;
