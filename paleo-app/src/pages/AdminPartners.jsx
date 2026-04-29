import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, Trash2, Upload, ShieldCheck, Globe, Lock, ArrowLeft,
    CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '../services/apiClient';
import i18n from '../i18n';
import ExplainerBox from '../components/ExplainerBox';

// ── Onglets ──────────────────────────────────────────────────
const TABS = [
    { key: 'mandatory', labelKey: 'Obligatoires',   icon: ShieldCheck, color: '#9c27b0', bg: '#f3e5f5',
      description: 'Ces partenaires apparaissent sur tous les sous-sites, par défaut.',
      filter: p => !!p.is_mandatory,
      superadminOnly: false },
    { key: 'pool',      labelKey: 'Pool public',    icon: Globe,       color: '#00897b', bg: '#e0f2f1',
      description: 'Partenaires disponibles pour tous les sous-sites qui souhaitent les sélectionner.',
      filter: p => !p.owner_subsite_id && !p.is_mandatory,
      superadminOnly: false },
    { key: 'exclusive', labelKey: 'Exclusifs',      icon: Lock,        color: '#c2185b', bg: '#fce4ec',
      description: 'Partenaires attachés à un sous-site unique.',
      filter: p => !!p.owner_subsite_id,
      superadminOnly: false },
];

// ── Card section (réutilise le look d'AdminSettings) ─────────
const Section = ({ children }) => (
    <div style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: '14px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: '24px',
    }}>
        {children}
    </div>
);

const AdminPartners = () => {
    const { isAdmin, isSuperadmin, homeSubsiteId } = useApp();
    const navigate = useNavigate();

    const [partners, setPartners] = useState([]);
    const [subsites, setSubsites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('mandatory');

    // Formulaire de création
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newLogoFile, setNewLogoFile] = useState(null);
    const [newMandatory, setNewMandatory] = useState(false);
    const [newOwnerSubsiteId, setNewOwnerSubsiteId] = useState('');
    const [creating, setCreating] = useState(false);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const load = async () => {
        setLoading(true);
        try {
            const [ps, ss] = await Promise.all([
                api.partners.getAll(),
                api.subsites.getAll().catch(() => []),
            ]);
            setPartners(Array.isArray(ps) ? ps : []);
            setSubsites(Array.isArray(ss) ? ss : []);
        } catch (e) {
            showToast('error', e.message || i18n.t('errors.loading'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Pré-remplir le formulaire selon l'onglet actif
    useEffect(() => {
        if (activeTab === 'mandatory') {
            setNewMandatory(true);
            setNewOwnerSubsiteId('');
        } else if (activeTab === 'pool') {
            setNewMandatory(false);
            setNewOwnerSubsiteId('');
        } else if (activeTab === 'exclusive') {
            setNewMandatory(false);
            if (!isSuperadmin && homeSubsiteId) setNewOwnerSubsiteId(homeSubsiteId);
        }
    }, [activeTab, isSuperadmin, homeSubsiteId]);

    const subsiteById = useMemo(
        () => Object.fromEntries(subsites.map(s => [s.id, s])),
        [subsites]
    );

    const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];

    const filteredPartners = useMemo(() => {
        let data = partners.filter(currentTab.filter);
        if (activeTab === 'exclusive' && !isSuperadmin) {
            data = data.filter(p => p.owner_subsite_id === homeSubsiteId);
        }
        return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [partners, currentTab, activeTab, isSuperadmin, homeSubsiteId]);

    if (!isAdmin) {
        return <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>Accès réservé à l'administration.</div>;
    }

    // ── Création ─────────────────────────────────────────────
    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setCreating(true);
        try {
            let logo_path = null;
            if (newLogoFile) {
                const up = await api.media.upload(newLogoFile);
                logo_path = up?.url || null;
            }
            const payload = {
                name,
                url: newUrl.trim() || null,
                logo_path,
            };
            if (isSuperadmin) {
                payload.is_mandatory = newMandatory;
                payload.owner_subsite_id = newOwnerSubsiteId || null;
            } else if (activeTab === 'exclusive' && homeSubsiteId) {
                // Un tenant admin ne peut créer que ses propres exclusifs — forcé côté serveur
                payload.owner_subsite_id = homeSubsiteId;
            }
            await api.partners.create(payload);
            setNewName('');
            setNewUrl('');
            setNewLogoFile(null);
            if (!isSuperadmin) setNewMandatory(false);
            await load();
            showToast('success', `"${name}" ajouté`);
        } catch (e) {
            showToast('error', e.message || i18n.t('errors.creating'));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (p) => {
        if (!confirm(`Supprimer "${p.name}" ? Cette action est irréversible.`)) return;
        try {
            await api.partners.delete(p.id);
            await load();
            showToast('success', `"${p.name}" supprimé`);
        } catch (e) {
            showToast('error', e.message || i18n.t('errors.deleting'));
        }
    };

    const handleToggleMandatory = async (p) => {
        if (!isSuperadmin) return;
        try {
            await api.partners.update(p.id, { is_mandatory: !p.is_mandatory });
            await load();
            showToast('success', p.is_mandatory ? 'Retiré des obligatoires' : 'Ajouté aux obligatoires');
        } catch (e) {
            showToast('error', e.message || i18n.t('errors.generic'));
        }
    };

    const canCreateInTab = (() => {
        if (activeTab === 'mandatory') return isSuperadmin; // Seul superadmin crée des obligatoires
        if (activeTab === 'pool')      return isSuperadmin; // Le pool public est curé par superadmin
        if (activeTab === 'exclusive') return isAdmin;      // Owner ou superadmin
        return false;
    })();

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
                    background: toast.type === 'error' ? '#fee' : '#efe',
                    color: toast.type === 'error' ? '#c00' : '#080',
                    border: `1px solid ${toast.type === 'error' ? '#fcc' : '#cfc'}`,
                    borderRadius: '10px', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '0.88rem', fontWeight: '600',
                }}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/app/admin')}
                    style={{
                        background: '#f5f5f5', border: '1px solid #e0e0e0',
                        borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.84rem', color: '#666', fontFamily: 'inherit',
                    }}
                >
                    <ArrowLeft size={14} /> Retour
                </button>
                <div style={{
                    width: '40px', height: '40px',
                    background: '#e0f2f1', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Users size={20} color="#00897b" />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1a1a1a' }}>
                    Gestion des partenaires
                </h1>
            </div>

            {/* Paragraphe explicatif */}
            <ExplainerBox
                color="#00897b"
                background="#e0f2f1"
                border="#b2dfdb"
                title="À quoi sert cette page ?"
            >
                Centraliser la bibliothèque de partenaires et décider où chacun s'affiche.
                Trois catégories, mutuellement exclusives :<br />
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                    <li><strong>Obligatoires</strong> — apparaissent automatiquement sur tous les sous-sites, sans action de leur part. Superadmin uniquement.</li>
                    <li><strong>Pool public</strong> — réservoir partagé : chaque sous-site peut piocher dedans depuis sa propre configuration.</li>
                    <li><strong>Exclusifs</strong> — rattachés à un sous-site unique. Invisibles pour les autres. Un <em>owner</em> peut gérer les exclusifs de son propre sous-site.</li>
                </ul>
            </ExplainerBox>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: '4px', background: '#f5f5f5', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = tab.key === activeTab;
                    const count = partners.filter(tab.filter).length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                border: 'none',
                                background: active ? 'white' : 'transparent',
                                color: active ? tab.color : '#777',
                                borderRadius: '10px', padding: '11px 16px',
                                fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                boxShadow: active ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                fontFamily: 'inherit', transition: 'all 0.15s',
                            }}
                        >
                            <Icon size={15} />
                            {tab.labelKey}
                            <span style={{
                                background: active ? tab.bg : '#e8e8e8',
                                color: active ? tab.color : '#999',
                                borderRadius: '20px', padding: '1px 8px',
                                fontSize: '0.78rem', fontWeight: '800', minWidth: '22px', textAlign: 'center',
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Description */}
            <p style={{
                background: currentTab.bg, color: currentTab.color,
                borderRadius: '8px', padding: '10px 16px',
                fontSize: '0.85rem', fontWeight: '600', margin: '0 0 20px',
            }}>
                {currentTab.description}
            </p>

            {/* Formulaire d'ajout */}
            {canCreateInTab && (
                <Section>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: currentTab.color }}>
                        Ajouter un partenaire
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Nom du partenaire *"
                            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem' }}
                        />
                        <input
                            value={newUrl}
                            onChange={e => setNewUrl(e.target.value)}
                            placeholder="URL (https://...)"
                            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem' }}
                        />
                    </div>

                    {/* Sélecteur sous-site (seulement pour exclusive + superadmin) */}
                    {activeTab === 'exclusive' && isSuperadmin && (
                        <div style={{ marginBottom: '10px' }}>
                            <select
                                value={newOwnerSubsiteId}
                                onChange={e => setNewOwnerSubsiteId(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem', background: 'white' }}
                            >
                                <option value="">— Choisir le sous-site propriétaire —</option>
                                {subsites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed #b2dfdb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.83rem', color: '#555', background: 'white' }}>
                            <Upload size={14} color="#00897b" />
                            {newLogoFile ? newLogoFile.name : 'Choisir un logo…'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewLogoFile(e.target.files?.[0] || null)} />
                        </label>
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating || !newName.trim() || (activeTab === 'exclusive' && isSuperadmin && !newOwnerSubsiteId)}
                            style={{
                                flexShrink: 0, border: 'none', borderRadius: '8px', padding: '9px 16px',
                                background: (creating || !newName.trim()) ? '#b2dfdb' : currentTab.color,
                                color: 'white', fontWeight: '700',
                                cursor: (creating || !newName.trim()) ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', fontSize: '0.88rem',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            <Plus size={14} /> Ajouter
                        </button>
                    </div>
                </Section>
            )}

            {/* Liste */}
            <Section>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>Chargement…</p>
                ) : filteredPartners.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: '0.9rem' }}>
                        Aucun partenaire dans cet onglet.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredPartners.map(p => {
                            const owner = p.owner_subsite_id ? subsiteById[p.owner_subsite_id] : null;
                            const canDelete = isSuperadmin || (p.owner_subsite_id && p.owner_subsite_id === homeSubsiteId);
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    border: '1px solid #eee', borderRadius: '10px',
                                    padding: '8px 12px', background: '#fafafa',
                                }}>
                                    {p.logo_path ? (
                                        <img src={p.logo_path} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', background: 'white', border: '1px solid #eee' }} />
                                    ) : (
                                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#e0f2f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#00897b', fontSize: '0.9rem', flexShrink: 0 }}>
                                            {(p.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.name}
                                        </div>
                                        {p.url && (
                                            <div style={{ fontSize: '0.75rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.url}
                                            </div>
                                        )}
                                    </div>

                                    {owner && (
                                        <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#fce4ec', color: '#c2185b', whiteSpace: 'nowrap' }}>
                                            {owner.name}
                                        </span>
                                    )}

                                    {isSuperadmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleMandatory(p)}
                                            title={p.is_mandatory ? 'Retirer des obligatoires' : 'Rendre obligatoire'}
                                            style={{
                                                flexShrink: 0,
                                                border: `1px solid ${p.is_mandatory ? '#9c27b0' : '#e0e0e0'}`,
                                                background: p.is_mandatory ? '#f3e5f5' : 'white',
                                                color: p.is_mandatory ? '#9c27b0' : '#999',
                                                borderRadius: '6px', padding: '5px 8px',
                                                cursor: 'pointer', fontFamily: 'inherit',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.75rem', fontWeight: '700',
                                            }}
                                        >
                                            <ShieldCheck size={12} />
                                            {p.is_mandatory ? 'Obligatoire' : 'Optionnel'}
                                        </button>
                                    )}

                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(p)}
                                            style={{ flexShrink: 0, border: '1px solid #fecaca', background: 'white', color: '#b42318', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default AdminPartners;
