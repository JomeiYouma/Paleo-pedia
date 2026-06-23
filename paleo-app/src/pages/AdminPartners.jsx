import React, { useState, useEffect, useMemo } from 'react';
import { useBlocker } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Users, Plus, Trash2, Upload, ShieldCheck, Globe, Lock,
} from 'lucide-react';
import api from '../services/apiClient';
import i18n from '../i18n';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, AdminTabs, AdminTabDescription,
    useAdminToast,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// ── Onglets ──────────────────────────────────────────────────
const TABS = [
    {
        key: 'mandatory', label: 'Obligatoires', icon: ShieldCheck,
        description: 'Ces partenaires apparaissent sur tous les sous-sites, par défaut.',
        filter: p => !!p.is_mandatory,
    },
    {
        key: 'pool', label: 'Pool public', icon: Globe,
        description: 'Partenaires disponibles pour tous les sous-sites qui souhaitent les sélectionner.',
        filter: p => !p.owner_subsite_id && !p.is_mandatory,
    },
    {
        key: 'exclusive', label: 'Exclusifs', icon: Lock,
        description: 'Partenaires attachés à un sous-site unique.',
        filter: p => !!p.owner_subsite_id,
    },
];

const AdminPartners = () => {
    const { isAdmin, isSuperadmin, homeSubsiteId } = useApp();
    const { toast, showToast } = useAdminToast();

    const [partners, setPartners] = useState([]);
    const [subsites, setSubsites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('mandatory');

    // Formulaire de création
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newLogoFile, setNewLogoFile] = useState(null);
    const [newMandatory, setNewMandatory] = useState(false);
    const [newOwnerSubsiteId, setNewOwnerSubsiteId] = useState('');
    const [creating, setCreating] = useState(false);

    // Garde-fou « modifications non sauvegardées » : si un partenaire est en
    // cours de saisie (nom / URL / logo) et qu'on tente de quitter la page,
    // on confirme avant de perdre la saisie (cohérence avec Create.jsx).
    const isDirty = !!(newName.trim() || newUrl.trim() || newLogoFile);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && !creating && currentLocation.pathname !== nextLocation.pathname
    );
    useEffect(() => {
        if (blocker.state !== 'blocked') return;
        if (window.confirm("Un partenaire est en cours de saisie et non enregistré. Quitter sans l'ajouter ?")) {
            blocker.proceed();
        } else {
            blocker.reset();
        }
    }, [blocker]);
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

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

    const counts = useMemo(() => Object.fromEntries(
        TABS.map(t => [t.key, partners.filter(t.filter).length])
    ), [partners]);

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-subtle)' }}>
                Accès réservé à l'administration.
            </div>
        );
    }

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
            const payload = { name, url: newUrl.trim() || null, logo_path };
            if (isSuperadmin) {
                payload.is_mandatory = newMandatory;
                payload.owner_subsite_id = newOwnerSubsiteId || null;
            } else if (activeTab === 'exclusive' && homeSubsiteId) {
                payload.owner_subsite_id = homeSubsiteId;
            }
            await api.partners.create(payload);
            setNewName('');
            setNewUrl('');
            setNewLogoFile(null);
            if (!isSuperadmin) setNewMandatory(false);
            await load();
            showToast('success', `« ${name} » ajouté`);
        } catch (e) {
            showToast('error', e.message || i18n.t('errors.creating'));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (p) => {
        if (!confirm(`Supprimer « ${p.name} » ? Cette action est irréversible.`)) return;
        try {
            await api.partners.delete(p.id);
            await load();
            showToast('success', `« ${p.name} » supprimé`);
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
        if (activeTab === 'mandatory') return isSuperadmin;
        if (activeTab === 'pool')      return isSuperadmin;
        if (activeTab === 'exclusive') return isAdmin;
        return false;
    })();

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={Users} title="Gestion des partenaires" />

            <ExplainerBox title="À quoi sert cette page ?">
                Centraliser la bibliothèque de partenaires et décider où chacun s'affiche.
                Trois catégories, mutuellement exclusives :
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                    <li><strong>Obligatoires</strong> — apparaissent automatiquement sur tous les sous-sites, sans action de leur part. Superadmin uniquement.</li>
                    <li><strong>Pool public</strong> — réservoir partagé : chaque sous-site peut piocher dedans depuis sa propre configuration.</li>
                    <li><strong>Exclusifs</strong> — rattachés à un sous-site unique. Invisibles pour les autres. Un <em>owner</em> peut gérer les exclusifs de son propre sous-site.</li>
                </ul>
            </ExplainerBox>

            <AdminTabs
                tabs={TABS}
                active={activeTab}
                onChange={setActiveTab}
                counts={counts}
            />

            <AdminTabDescription>{currentTab.description}</AdminTabDescription>

            {/* Formulaire d'ajout */}
            {canCreateInTab && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Ajouter un partenaire
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={labelStyle}>Nom *</label>
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom du partenaire" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>URL</label>
                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
                        </div>
                    </div>

                    {/* Sélecteur sous-site (exclusif + superadmin) */}
                    {activeTab === 'exclusive' && isSuperadmin && (
                        <div style={{ marginBottom: '10px' }}>
                            <label style={labelStyle}>Sous-site propriétaire</label>
                            <select
                                value={newOwnerSubsiteId}
                                onChange={e => setNewOwnerSubsiteId(e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="">— Choisir le sous-site —</option>
                                {subsites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                        <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                            <Upload size={14} />
                            {newLogoFile ? newLogoFile.name : 'Choisir un logo…'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewLogoFile(e.target.files?.[0] || null)} />
                        </label>
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating || !newName.trim() || (activeTab === 'exclusive' && isSuperadmin && !newOwnerSubsiteId)}
                            style={{
                                ...primaryBtnStyle,
                                opacity: (creating || !newName.trim()) ? 0.5 : 1,
                                cursor: (creating || !newName.trim()) ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <Plus size={14} /> {creating ? 'Envoi…' : 'Ajouter'}
                        </button>
                    </div>
                </AdminSection>
            )}

            {/* Liste */}
            <AdminSection>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0' }}>Chargement…</p>
                ) : filteredPartners.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0', fontSize: '0.9rem' }}>
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
                                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                    padding: '8px 12px', background: 'var(--color-surface-2)',
                                }}>
                                    {p.logo_path ? (
                                        <img src={p.logo_path} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
                                    ) : (
                                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--color-text-muted)', fontSize: '0.9rem', flexShrink: 0 }}>
                                            {(p.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.name}
                                        </div>
                                        {p.url && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.url}
                                            </div>
                                        )}
                                    </div>

                                    {owner && (
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--color-accent-soft)',
                                            color: 'var(--color-primary)',
                                            whiteSpace: 'nowrap',
                                            fontFamily: 'var(--font-heading)',
                                            textTransform: 'uppercase', letterSpacing: '0.4px',
                                        }}>
                                            {owner.name}
                                        </span>
                                    )}

                                    {isSuperadmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleMandatory(p)}
                                            title={p.is_mandatory ? 'Retirer des obligatoires' : 'Rendre obligatoire'}
                                            style={{
                                                ...ghostBtnStyle,
                                                padding: '5px 10px',
                                                background: p.is_mandatory ? 'var(--color-accent)' : 'var(--color-surface)',
                                                color: p.is_mandatory ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                                                borderColor: p.is_mandatory ? 'var(--color-accent)' : 'var(--color-border)',
                                                fontSize: '0.72rem',
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
                                            style={{ ...dangerBtnStyle, padding: '5px 10px' }}
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
            </AdminSection>
        </div>
    );
};

export default AdminPartners;
