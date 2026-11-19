/**
 * ArvrMusee.jsx — pages des QR « cube » des pancartes imprimées.
 *
 *   /ARVR_musee/                → index (scènes + récits audio)
 *   /ARVR_musee/:scene/         → scène 3D / AR (<model-viewer>)
 *   /ARVR_musee/audio/:slug/    → récit audio
 *
 * Ces URLs sont imprimées : elles doivent rester stables (cf. utils/arvrMusee.js).
 * Les .glb / .usdz / .mp3 sont servis par server.js depuis ARVR_DIR (hors Git).
 *
 * <model-viewer> est chargé depuis un CDN, version FIGÉE, et seulement sur ces
 * pages : le paquet npm (4.4.0) exige three ^0.183 alors que l'app est en 0.184,
 * ce qui ferait échouer le `npm install` du Build Infomaniak. Le bundle CDN
 * embarque sa propre copie de three.
 */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Box, Headphones, Smartphone } from 'lucide-react';
import api from '../services/apiClient';
import Breadcrumb from '../components/Breadcrumb';
import { usePageMeta } from '../hooks/usePageMeta';
import NotFound from './NotFound';
import { ARVR_BASE, AR_SCENES, AUDIO_PAGES } from '../utils/arvrMusee';
import './ArvrMusee.css';

const MODEL_VIEWER_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js';

/** Charge <model-viewer> une seule fois ; `ready` passe à true une fois l'élément défini. */
function useModelViewer() {
    const [ready, setReady] = useState(() => typeof customElements !== 'undefined' && !!customElements.get('model-viewer'));
    useEffect(() => {
        if (ready) return;
        if (!document.querySelector(`script[src="${MODEL_VIEWER_SRC}"]`)) {
            const s = document.createElement('script');
            s.type = 'module';
            s.src = MODEL_VIEWER_SRC;
            document.head.appendChild(s);
        }
        let alive = true;
        customElements.whenDefined('model-viewer').then(() => { if (alive) setReady(true); });
        return () => { alive = false; };
    }, [ready]);
    return ready;
}

/** Fiche liée (titre, année) — repli silencieux si absente ou hors ligne. */
function useCartel(id) {
    const [cartel, setCartel] = useState(null);
    useEffect(() => {
        if (!id) return;
        let alive = true;
        api.cartels.getOne(id).then(c => { if (alive) setCartel(c); }).catch(() => {});
        return () => { alive = false; };
    }, [id]);
    return cartel;
}

const useIsEn = () => {
    const { i18n } = useTranslation();
    return i18n.language === 'en';
};

const crumbsFor = (isEn, withIndex = true) => [
    { label: isEn ? 'Home' : 'Accueil', href: '/' },
    ...(withIndex ? [{ label: isEn ? 'AR museum' : 'Musée en AR', href: `${ARVR_BASE}/` }] : []),
];

/** Boutons de bas de page : fiche liée (ou frise) + retour à l'index. */
const Actions = ({ cartelId, isEn }) => (
    <div className="arvr-actions">
        {cartelId ? (
            <Link to={`/cartel/${cartelId}`} className="paleo-btn">
                {isEn ? 'See the invention card' : 'Voir la fiche de l’invention'} <ArrowRight size={18} />
            </Link>
        ) : (
            <Link to="/app" state={{ random: true }} className="paleo-btn">
                {isEn ? 'Explore the timeline' : 'Explorer la frise'} <ArrowRight size={18} />
            </Link>
        )}
        <Link to={`${ARVR_BASE}/`} className="paleo-btn paleo-btn--outline">
            {isEn ? 'All scenes and audio stories' : 'Toutes les scènes et récits'}
        </Link>
    </div>
);

const Heading = ({ eyebrow, icon, title, year }) => (
    <header className="arvr-heading">
        <span className="arvr-eyebrow">{icon} {eyebrow}</span>
        <h1 className="arvr-title">{title}</h1>
        {year && <div className="arvr-year">{year}</div>}
    </header>
);

export const ArvrScene = () => {
    const { scene } = useParams();
    const isEn = useIsEn();
    const key = (scene || '').toLowerCase();
    const def = AR_SCENES[key];
    const ready = useModelViewer();
    const cartel = useCartel(def?.cartelId);
    const label = def ? (isEn ? def.label.en : def.label.fr) : '';
    const title = cartel ? ((isEn && cartel.titre_en) || cartel.titre) : label;
    usePageMeta(def ? { title: `${label} — 3D / AR`, path: `${ARVR_BASE}/${key}/` } : {});

    if (!def) return <NotFound />;

    const base = `${ARVR_BASE}/${key}/${def.model}`;

    return (
        <div className="arvr-page">
            <div className="arvr-inner">
                <Breadcrumb crumbs={crumbsFor(isEn)} current={label} />
                <Heading
                    eyebrow={isEn ? 'Augmented reality scene' : 'Scène en réalité augmentée'}
                    icon={<Box size={15} />}
                    title={title}
                    year={cartel?.annee}
                />

                <div className="arvr-stage">
                    {ready ? (
                        <model-viewer
                            src={`${base}.glb`}
                            ios-src={`${base}.usdz`}
                            alt={isEn ? `3D model: ${label}` : `Modèle 3D : ${label}`}
                            ar=""
                            ar-modes="webxr scene-viewer quick-look"
                            ar-scale="auto"
                            camera-controls=""
                            touch-action="pan-y"
                            autoplay=""
                            shadow-intensity="1"
                            className="arvr-viewer"
                        >
                            <button slot="ar-button" className="paleo-btn arvr-ar-btn">
                                <Smartphone size={18} /> {isEn ? 'View in your space' : 'Voir chez moi en AR'}
                            </button>
                        </model-viewer>
                    ) : (
                        <div className="arvr-viewer arvr-viewer--loading">{isEn ? 'Loading the 3D model…' : 'Chargement du modèle 3D…'}</div>
                    )}
                </div>

                <p className="arvr-hint">
                    {isEn
                        ? 'Drag to rotate the model, pinch to zoom. On a phone, the AR button places it in the room around you.'
                        : 'Faites tourner le modèle du doigt, pincez pour zoomer. Sur téléphone, le bouton AR le pose dans la pièce autour de vous.'}
                </p>

                <Actions cartelId={def.cartelId} isEn={isEn} />
            </div>
        </div>
    );
};

export const ArvrAudio = () => {
    const { slug } = useParams();
    const isEn = useIsEn();
    const key = (slug || '').toLowerCase();
    const def = AUDIO_PAGES[key];
    const cartel = useCartel(def?.cartelId);
    usePageMeta(def ? { title: `${def.title} — ${isEn ? 'audio' : 'récit audio'}`, path: `${ARVR_BASE}/audio/${key}/` } : {});

    if (!def) return <NotFound />;

    return (
        <div className="arvr-page">
            <div className="arvr-inner arvr-inner--narrow">
                <Breadcrumb crumbs={crumbsFor(isEn)} current={def.title} />
                <Heading
                    eyebrow={isEn ? 'Audio story' : 'Récit audio'}
                    icon={<Headphones size={15} />}
                    title={def.title}
                    year={cartel?.annee}
                />

                <div className="arvr-audio">
                    <audio controls preload="metadata" src={`${ARVR_BASE}/audio/${key}/${def.mp3}`}>
                        {isEn ? 'Your browser cannot play this audio.' : 'Votre navigateur ne peut pas lire cet audio.'}
                    </audio>
                </div>

                {isEn && <p className="arvr-lang-note">Audio and text in French.</p>}
                <div className="arvr-text" lang="fr">
                    {def.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>

                <Actions cartelId={def.cartelId} isEn={isEn} />
            </div>
        </div>
    );
};

export const ArvrIndex = () => {
    const isEn = useIsEn();
    usePageMeta({ title: isEn ? 'AR museum' : 'Musée en réalité augmentée', path: `${ARVR_BASE}/` });
    return (
        <div className="arvr-page">
            <div className="arvr-inner">
                <Breadcrumb crumbs={crumbsFor(isEn, false)} current={isEn ? 'AR museum' : 'Musée en AR'} />
                <Heading
                    eyebrow={isEn ? 'Signs of the exhibition' : 'Pancartes de l’exposition'}
                    icon={<Box size={15} />}
                    title={isEn ? 'AR museum' : 'Musée en réalité augmentée'}
                />

                <h2 className="arvr-section">{isEn ? '3D scenes' : 'Scènes 3D'}</h2>
                <ul className="arvr-grid">
                    {Object.entries(AR_SCENES).map(([k, s]) => (
                        <li key={k}>
                            <Link to={`${ARVR_BASE}/${k}/`} className="arvr-tile">
                                <Box size={18} /> <span>{isEn ? s.label.en : s.label.fr}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <h2 className="arvr-section">{isEn ? 'Audio stories (in French)' : 'Récits audio'}</h2>
                <ul className="arvr-grid">
                    {Object.entries(AUDIO_PAGES).map(([k, a]) => (
                        <li key={k}>
                            <Link to={`${ARVR_BASE}/audio/${k}/`} className="arvr-tile">
                                <Headphones size={18} /> <span>{a.title}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
