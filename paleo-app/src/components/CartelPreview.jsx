import React, { useState } from 'react';
import './CartelPreview.css';
import { useTranslation } from 'react-i18next';
import { getLocalizedContent } from '../utils/i18nHelpers';
import { formatYear } from '../utils/helpers';

const CartelPreview = ({ data, isDraft = false }) => {
    const { t, i18n } = useTranslation();
    if (!data) return null; // Safety check
    const { title, description } = getLocalizedContent(data, i18n.language);

    // data: { titre, annee, description, exhume_par, image_path (remote url or blob), categories, url_qr }
    // If image_path is from GitHub, we might need to fetch it or use the data URI if we already have it.
    // For now, assume image_path is a usable URL or we handle the fetching in a wrapper. 
    // Actually, github service returns JSON with 'download_url' usually? 
    // Or we store base64 in the object (not recommended for large files).
    // The Python code pushes images separately and stores "image_path".
    // "image_path" in JSON likely refers to local path "images_archive/...".
    // We need to resolve this to a URL. 
    // In our AppContext, calling `githubService.getFileContent` for an image should probably return a blob url or we use the `download_url` from the tree if cached.
    // For this migration, let's assume `data.imageUrl` is passed in, or we construct it.

    // TEMPORARY: If image_path is relative, we can't display it easily without a raw.githubusercontent URL or fetching it.
    // We will leave image broken or implement a "ImageFetcher" later.

    // Normalize image path
    let imgSrc = data.imageUrl || data.image_path;
    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:')) {
        // Since we use HashRouter, relative paths like "images/foo.jpg" are relative to index.html
        // We just need to clean up "../" which comes from PHP context.
        // We also DO NOT start with "/" to support subfolder deployments.

        // Remove known prefixes if they exist to normalize
        imgSrc = imgSrc.replace(/^(\.\.\/)+/, '').replace(/^\//, '');

        // Ensure it starts with images/ if it looks like an image path
        if (!imgSrc.startsWith('images/') && (imgSrc.endsWith('.jpg') || imgSrc.endsWith('.png') || imgSrc.endsWith('.jpeg') || imgSrc.endsWith('.webp'))) {
            imgSrc = 'images/' + imgSrc;
        }
    }
    const [imgError, setImgError] = useState(false);

    // Reset error state when image source changes (critical for timeline/slider)
    React.useEffect(() => {
        setImgError(false);
    }, [imgSrc]);


    return (
        <div className="cartel-container">
            <div className="cartel-image-column">
                {imgSrc ? (
                    <div className="cartel-image-wrapper" style={{ position: 'relative' }}>
                        <img
                            src={imgSrc}
                            alt={title}
                            className="cartel-img"
                            onError={(e) => {
                                console.error("Image load failed:", imgSrc);
                                setImgError(true);
                            }}
                            style={{ opacity: imgError ? 0.5 : 1 }}
                        />
                        {imgError && (
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'rgba(0,0,0,0.8)', color: 'red', fontSize: '0.8em', padding: '5px'
                            }}>
                                <a href={imgSrc} target="_blank" rel="noreferrer" style={{ color: '#ff4444' }}>
                                    Err: {imgSrc} (Cliquer)
                                </a>
                            </div>
                        )}
                        {data.imageCredit && (
                            <div className="cartel-credit-overlay">
                                © {data.imageCredit}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="cartel-no-image">{i18n.language === 'fr' ? 'Aucune image' : 'No image'}</div>
                )}
                <div className="cartel-credit">{t('cartel.exhumeBy')} {data.exhume_par}</div>
            </div>

            <div className="cartel-content-column">
                <div className="cartel-card">
                    {isDraft && <div className="draft-badge">⚠️ BROUILLON</div>}

                    <div className="cartel-year">{formatYear(data.annee, i18n.language)}</div>
                    <div className="cartel-title">{title}</div>

                    {(data.location || data.location_en) && (
                        <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                            {i18n.language === 'en' ? (data.location_en || data.location) : (data.location || data.location_en)}
                        </div>
                    )}

                    {data.url_qr && (
                        <div className="cartel-qr-link" style={{ marginBottom: '15px', marginTop: '5px' }}>
                            <a href={data.url_qr} target="_blank" rel="noreferrer">🔗 {i18n.language === 'fr' ? 'LIEN' : 'LINK'}</a>
                        </div>
                    )}

                    <div className="cartel-description">
                        {description && description.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                <br />
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="cartel-footer">
                        <small>{t('cartel.categories')} : {((i18n.language === 'en' ? data.categories_en : data.categories) || []).join(' • ')}</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartelPreview;
