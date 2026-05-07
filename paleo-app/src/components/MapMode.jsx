import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedContent } from '../utils/i18nHelpers';
import { rememberReturn } from '../utils/navigation';
import 'leaflet/dist/leaflet.css';

// Marqueur de carte : noir par défaut, le cœur passe en jaune quand
// le marqueur est sélectionné (popup ouvert). Le badge de cluster
// reste noir pour ne pas concurrencer l'état de focus.
const getMarkerIcon = (count, focused = false) => {
    const size = count > 1 ? 40 : 30;
    const innerSize = count > 1 ? 24 : 12;
    const innerColor = focused ? '#FFE700' : '#1a1a1a';
    const ring = focused ? '3px solid #FFE700' : '3px solid white';

    return L.divIcon({
        className: 'custom-geo-marker',
        html: `<div style="
            background-color: black;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: ${ring};
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
            position: relative;
        ">
            ${count > 1 ? `
                <div style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background-color: #1a1a1a;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'PT Sans Narrow', sans-serif;
                    font-size: 12px;
                    font-weight: 700;
                    border: 2px solid white;
                ">${count}</div>
                <div style="
                     width: ${innerSize}px;
                     height: ${innerSize}px;
                     border-radius: 50%;
                     background-color: ${innerColor};
                     opacity: ${focused ? 1 : 0.2};
                "></div>
            ` : `
                <div style="
                    background-color: ${innerColor};
                    width: ${innerSize}px;
                    height: ${innerSize}px;
                    border-radius: 50%;
                "></div>
            `}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)]
    });
};

// Sub-component for Popup content to handle navigation within the cluster
const ClusterPopup = ({ items, onNavigate, onTimeline }) => {
    const { t, i18n } = useTranslation();
    const [view, setView] = React.useState(items.length === 1 ? 'detail' : 'list');
    const [selectedId, setSelectedId] = React.useState(items.length === 1 ? items[0].id : null);

    const activeCartel = items.find(c => c.id === selectedId);

    if (view === 'list') {
        return (
            <div style={{ width: '200px', maxHeight: '300px', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{t('map.clusterTitle', { count: items.length })}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {items.map(c => (
                        <button
                            key={c.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); setView('detail'); }}
                            style={{
                                textAlign: 'left',
                                padding: '8px',
                                background: '#f5f5f5',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <span style={{ fontWeight: 'bold' }}>{c.annee}</span> - {getLocalizedContent(c, i18n.language).title}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (activeCartel) {
        const { title } = getLocalizedContent(activeCartel, i18n.language);
        return (
            <div style={{ width: '200px' }}>
                {items.length > 1 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setView('list'); }}
                        style={{ marginBottom: '10px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                    >
                        {t('map.backToList')}
                    </button>
                )}

                {activeCartel.imageUrl && (
                    <img
                        src={activeCartel.imageUrl}
                        alt={title}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                    />
                )}
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{title}</h3>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>{activeCartel.annee}</div>
                <div style={{ fontSize: '0.8rem', marginBottom: '10px', fontStyle: 'italic' }}>
                    {activeCartel.location}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onTimeline && onTimeline(activeCartel.id); }}
                        style={{
                            width: '100%',
                            padding: '8px 10px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-white)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        {t('cartel.viewTimeline')} →
                    </button>
                </div>
            </div>
        );
    }
    return null;
};

const MapMode = ({ cartels, onGoToTimeline, isAdmin }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Marqueur dont le popup est ouvert : cœur jaune pour matérialiser le focus.
    const [focusedKey, setFocusedKey] = React.useState(null);

    // Group cartels by coordinates
    const clusters = React.useMemo(() => {
        const groups = {};
        cartels.forEach(c => {
            if (c.lat != null && c.lng != null) {
                const key = `${c.lat},${c.lng}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(c);
            }
        });
        return groups;
    }, [cartels]);

    const items = Object.entries(clusters); // [key, cartels[]] pour identifier le marqueur focusé
    const unlocatedCartels = cartels.filter(c => c.lat == null || c.lng == null);

    const defaultPosition = [46.603354, 1.888334]; // Center of France

    return (
        <div style={{
            height: 'calc(100vh - 200px)',
            marginTop: '20px',
            display: 'flex',
            gap: '20px'
        }}>
            {/* Map Area */}
            <div style={{
                flex: 1,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
            }}>
                <MapContainer
                    center={defaultPosition}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />

                    {items.map(([key, group]) => {
                        const position = [group[0].lat, group[0].lng];
                        const focused = key === focusedKey;
                        return (
                            <Marker
                                key={key}
                                position={position}
                                icon={getMarkerIcon(group.length, focused)}
                                eventHandlers={{
                                    popupopen:  () => setFocusedKey(key),
                                    popupclose: () => setFocusedKey(prev => prev === key ? null : prev),
                                }}
                            >
                                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                    {group.length > 1 ? `${group.length} inventions` : getLocalizedContent(group[0], i18n.language).title}
                                </Tooltip>
                                <Popup>
                                    <ClusterPopup
                                        items={group}
                                        onNavigate={navigate}
                                        onTimeline={onGoToTimeline}
                                    />
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Unlocated Sidebar */}
            {unlocatedCartels.length > 0 && (
                <div style={{
                    width: '260px',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        background: 'var(--color-primary)',
                        color: 'var(--color-white)',
                        borderBottom: '3px solid var(--color-accent)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        {t('map.unlocated')} ({unlocatedCartels.length})
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {unlocatedCartels.map(c => (
                            <div key={c.id} style={{ marginBottom: '8px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{getLocalizedContent(c, i18n.language).title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.annee}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                const returnTo = rememberReturn(location, { scrollId: c.id });
                                                navigate(`/app/create?edit=${c.id}`, { state: { returnTo } });
                                            }}
                                            title={t('cartel.addLocation')}
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, fontSize: '0.78rem', fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}
                                        >
                                            <MapPin size={14} /> {t('cartel.addLocation')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onGoToTimeline && onGoToTimeline(c.id)}
                                        title={t('cartel.viewTimeline')}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, fontSize: '0.78rem', fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}
                                    >
                                        {t('cartel.viewTimeline')} →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapMode;
