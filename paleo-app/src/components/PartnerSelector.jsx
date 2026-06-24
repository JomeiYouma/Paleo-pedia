import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/apiClient';
import { fieldStyle as inputStyle } from '../styles/formStyles';

// Sélecteur / gestionnaire de partenaires d'un sous-site.
// Réutilisé par SubsiteEditor (modale) et la page dédiée SubsitePartnersAdmin.
// Contrôlé : le parent détient primaryIds / regularIds et reçoit onSetRole.
//   - recherche pour filtrer le pool (gérable même avec beaucoup de partenaires)
//   - une ligne par partenaire avec un rôle : Principal / Standard / —
//   - ajout inline d'un partenaire EXCLUSIF au sous-site (jamais obligatoire)
export default function PartnerSelector({
    allPartners = [],
    onPartnersChanged,
    primaryIds = [],
    regularIds = [],
    onSetRole,
    subsiteId,
    color = '#4A90D9',
}) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newLogo, setNewLogo] = useState(null);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    const filtered = allPartners.filter(p =>
        (p.name || '').toLowerCase().includes(search.trim().toLowerCase()));

    const handleAdd = async () => {
        const name = newName.trim();
        if (!name) return;
        setAdding(true); setError('');
        try {
            let logo_path = null;
            if (newLogo) { const up = await api.media.upload(newLogo); logo_path = up?.url || null; }
            const payload = { name, url: newUrl.trim() || null, logo_path };
            if (subsiteId) payload.owner_subsite_id = subsiteId; // exclusif au sous-site
            const created = await api.partners.create(payload);
            const fresh = await api.partners.getAll();
            onPartnersChanged?.(Array.isArray(fresh) ? fresh : []);
            if (created?.id) onSetRole?.(created.id, 'regular');
            setNewName(''); setNewUrl(''); setNewLogo(null); setShowAdd(false);
        } catch (e) {
            setError(e.message || "Erreur lors de l'ajout du partenaire.");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div>
            {/* Recherche + bouton ajouter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('subsiteEditor.partnersSearch', 'Rechercher un partenaire…')}
                    style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button" onClick={() => setShowAdd(s => !s)} style={{
                    padding: '0 16px', borderRadius: '10px', border: `2px solid ${color}`,
                    background: showAdd ? color : 'white', color: showAdd ? 'white' : color,
                    fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>
                    + {t('subsiteEditor.partnersNew', 'Nouveau')}
                </button>
            </div>

            {/* Formulaire d'ajout inline (partenaire exclusif au sous-site) */}
            {showAdd && (
                <div style={{ border: '1px dashed #ddd', borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'grid', gap: '8px' }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('subsiteEditor.partnersNewName', 'Nom du partenaire *')} style={inputStyle} />
                    <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://… (optionnel)" style={inputStyle} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px dashed #ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#666' }}>
                        {newLogo ? newLogo.name : t('subsiteEditor.partnersNewLogo', 'Logo (optionnel)…')}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewLogo(e.target.files?.[0] || null)} />
                    </label>
                    {error && <div style={{ color: '#c0392b', fontSize: '0.82rem' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>{t('subsiteEditor.cancel', 'Annuler')}</button>
                        <button type="button" onClick={handleAdd} disabled={adding || !newName.trim()} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: (adding || !newName.trim()) ? '#ccc' : color, color: 'white', fontWeight: '700', cursor: (adding || !newName.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            {adding ? t('subsiteEditor.partnersAdding', 'Ajout…') : t('subsiteEditor.partnersAdd', 'Ajouter')}
                        </button>
                    </div>
                </div>
            )}

            {/* Liste filtrée : une ligne par partenaire avec sélecteur de rôle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>{t('subsiteEditor.partnersNone', 'Aucun partenaire.')}</p>
                ) : (
                    filtered.map(p => {
                        const role = primaryIds.includes(p.id) ? 'primary' : regularIds.includes(p.id) ? 'regular' : 'none';
                        return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eee', borderRadius: '10px', padding: '6px 10px' }}>
                                {p.logo_path ? (
                                    <img src={p.logo_path} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#999', fontSize: '0.8rem', flexShrink: 0 }}>{(p.name || '?').charAt(0).toUpperCase()}</div>
                                )}
                                <span style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    <RoleBtn active={role === 'primary'} color={color} onClick={() => onSetRole?.(p.id, 'primary')}>{t('subsiteEditor.partnersPrimaryShort', 'Principal')}</RoleBtn>
                                    <RoleBtn active={role === 'regular'} color={color} onClick={() => onSetRole?.(p.id, 'regular')}>{t('subsiteEditor.partnersRegularShort', 'Standard')}</RoleBtn>
                                    <RoleBtn active={role === 'none'} color="#bbb" onClick={() => onSetRole?.(p.id, 'none')}>—</RoleBtn>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Sélecteur de rôle d'un partenaire (Principal / Standard / —).
const RoleBtn = ({ active, color, onClick, children }) => (
    <button type="button" onClick={onClick} style={{
        padding: '4px 10px', borderRadius: '14px', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: '700', whiteSpace: 'nowrap',
        background: active ? color : '#f5f5f5',
        color: active ? 'white' : '#777',
        border: active ? `2px solid ${color}` : '2px solid transparent',
        transition: 'all 0.12s',
    }}>{children}</button>
);
