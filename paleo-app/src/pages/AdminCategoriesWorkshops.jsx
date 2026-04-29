import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    FolderOpen, Hammer, ArrowLeft, Edit, Trash2, Save, X, Check,
    CheckCircle2, AlertCircle, Plus,
} from 'lucide-react';
import api from '../services/apiClient';

const ACCENT = '#0d9488';
const ACCENT_BG = '#ecfdf5';
const ACCENT_BORDER = '#b7e4d8';

const Section = ({ icon: Icon, title, color, children, right }) => (
    <div style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '18px 24px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
        }}>
            <div style={{
                width: '36px', height: '36px',
                background: `${color}18`, borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={18} color={color} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1a1a1a', flex: 1 }}>{title}</h3>
            {right}
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
);

const AdminCategoriesWorkshops = () => {
    const { isAdmin, fetchData } = useApp();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [workshops, setWorkshops]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [toast, setToast]           = useState(null);

    // édition inline
    const [editingCategory, setEditingCategory] = useState(null); // { id, name, name_en, color, icon }
    const [editingWorkshop, setEditingWorkshop] = useState(null); // { id, name, is_immersive }

    // création catégorie
    const [newCatName, setNewCatName]   = useState('');
    const [newCatNameEn, setNewCatNameEn] = useState('');
    const [newCatColor, setNewCatColor] = useState('#888888');

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const load = async () => {
        setLoading(true);
        try {
            const [cats, wks] = await Promise.all([
                api.categories.getAll(),
                api.workshops.getAll(),
            ]);
            setCategories(Array.isArray(cats) ? cats : []);
            setWorkshops(Array.isArray(wks) ? wks : []);
        } catch (e) {
            showToast('error', e.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

    // ── Catégories ────────────────────────────────────────────
    const handleCreateCategory = async () => {
        const name = newCatName.trim();
        if (!name) return showToast('error', 'Nom requis');
        try {
            const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            await api.categories.create({
                id: slug,
                name,
                name_en: newCatNameEn.trim(),
                color: newCatColor,
                description: '',
            });
            setNewCatName(''); setNewCatNameEn(''); setNewCatColor('#888888');
            await load();
            fetchData?.();
            showToast('success', 'Catégorie créée');
        } catch (e) {
            showToast('error', e.message || 'Erreur de création');
        }
    };

    const handleSaveCategory = async () => {
        if (!editingCategory) return;
        try {
            await api.categories.update(editingCategory.id, {
                name: editingCategory.name,
                name_en: editingCategory.name_en,
                color: editingCategory.color,
                icon: editingCategory.icon,
            });
            setEditingCategory(null);
            await load();
            fetchData?.();
            showToast('success', 'Catégorie mise à jour');
        } catch (e) {
            showToast('error', e.message || 'Erreur de mise à jour');
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!confirm(`Supprimer la catégorie "${cat.name}" ? Les cartels qui la portent la perdront.`)) return;
        try {
            await api.categories.delete(cat.id);
            await load();
            fetchData?.();
            showToast('success', 'Catégorie supprimée');
        } catch (e) {
            showToast('error', e.message || 'Erreur de suppression');
        }
    };

    // ── Ateliers ──────────────────────────────────────────────
    const handleSaveWorkshop = async () => {
        if (!editingWorkshop) return;
        try {
            await api.workshops.update(editingWorkshop.id, {
                name: editingWorkshop.name,
                is_immersive: !!editingWorkshop.is_immersive,
            });
            setEditingWorkshop(null);
            await load();
            fetchData?.();
            showToast('success', 'Atelier mis à jour');
        } catch (e) {
            showToast('error', e.message || 'Erreur de mise à jour');
        }
    };

    const handleDeleteWorkshop = async (w) => {
        if (!confirm(`Supprimer l'atelier "${w.name}" ? Les cartels associés ne seront pas supprimés mais ne seront plus liés.`)) return;
        try {
            await api.workshops.delete(w.id);
            await load();
            fetchData?.();
            showToast('success', 'Atelier supprimé');
        } catch (e) {
            showToast('error', e.message || 'Erreur de suppression');
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                Accès réservé à l'administration.
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '28px 24px 80px' }}>

            {toast && (
                <div style={{
                    position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
                    background: toast.type === 'success' ? '#e8f5e9' : '#fff0f0',
                    border: `1px solid ${toast.type === 'success' ? '#a5d6a7' : '#ffcdd2'}`,
                    borderRadius: '12px', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '340px',
                }}>
                    {toast.type === 'success'
                        ? <CheckCircle2 size={18} color="#2e7d32" />
                        : <AlertCircle size={18} color="#d32f2f" />
                    }
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: toast.type === 'success' ? '#2e7d32' : '#d32f2f' }}>
                        {toast.msg}
                    </span>
                </div>
            )}

            {/* En-tête */}
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/app/admin')}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#666', fontFamily: 'inherit', fontSize: '0.85rem',
                        padding: '4px 0', marginBottom: '10px',
                    }}
                >
                    <ArrowLeft size={14} /> Retour aux paramètres
                </button>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Catégories & ateliers</h1>
                <p style={{ margin: '4px 0 0', color: '#999', fontSize: '0.88rem' }}>
                    Modifier ou supprimer les catégories et ateliers existants.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>Chargement…</div>
            ) : (
                <>
                    {/* ── Catégories ──────────────────────────── */}
                    <Section icon={FolderOpen} title="Catégories" color={ACCENT}>
                        {/* Création rapide */}
                        <div style={{
                            background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`,
                            borderRadius: '10px', padding: '14px', marginBottom: '16px',
                            display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
                        }}>
                            <input
                                type="text"
                                placeholder="Nom (FR)"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', fontFamily: 'inherit' }}
                            />
                            <input
                                type="text"
                                placeholder="Name (EN)"
                                value={newCatNameEn}
                                onChange={e => setNewCatNameEn(e.target.value)}
                                style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', fontFamily: 'inherit' }}
                            />
                            <input
                                type="color"
                                value={newCatColor}
                                onChange={e => setNewCatColor(e.target.value)}
                                title="Couleur"
                                style={{ width: '42px', height: '36px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', padding: '2px' }}
                            />
                            <button
                                onClick={handleCreateCategory}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: ACCENT, color: 'white', border: 'none',
                                    borderRadius: '8px', padding: '9px 14px', cursor: 'pointer',
                                    fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit',
                                }}
                            >
                                <Plus size={14} /> Ajouter
                            </button>
                        </div>

                        {categories.length === 0 ? (
                            <p style={{ color: '#bbb', textAlign: 'center', padding: '24px 0' }}>Aucune catégorie.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {categories.map(cat => {
                                    const editing = editingCategory?.id === cat.id;
                                    return (
                                        <div key={cat.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            background: editing ? '#f8fafc' : '#fafafa',
                                            border: `1px solid ${editing ? ACCENT_BORDER : '#eee'}`,
                                            borderRadius: '10px', padding: '10px 14px',
                                        }}>
                                            {editing ? (
                                                <>
                                                    <input
                                                        type="color"
                                                        value={editingCategory.color || '#888888'}
                                                        onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                                        style={{ width: '32px', height: '32px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingCategory.name || ''}
                                                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                        placeholder="Nom (FR)"
                                                        style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', fontFamily: 'inherit' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingCategory.name_en || ''}
                                                        onChange={e => setEditingCategory({ ...editingCategory, name_en: e.target.value })}
                                                        placeholder="Name (EN)"
                                                        style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', fontFamily: 'inherit' }}
                                                    />
                                                    <button
                                                        onClick={handleSaveCategory}
                                                        title="Enregistrer"
                                                        style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCategory(null)}
                                                        title="Annuler"
                                                        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: cat.color || '#888', flexShrink: 0 }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                                                        <div style={{ color: '#aaa', fontSize: '0.78rem' }}>
                                                            {cat.id}{cat.name_en ? ` · ${cat.name_en}` : ''}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingCategory({ id: cat.id, name: cat.name, name_en: cat.name_en || '', color: cat.color || '#888888', icon: cat.icon || '' })}
                                                        title="Modifier"
                                                        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat)}
                                                        title="Supprimer"
                                                        style={{ background: 'none', border: '1px solid #fcc', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#d32f2f', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Section>

                    {/* ── Ateliers ────────────────────────────── */}
                    <Section icon={Hammer} title="Ateliers" color="#6741d9">
                        <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#888' }}>
                            Créez les ateliers depuis la page de gestion des cartels (sélection + « Créer un atelier »).
                        </p>

                        {workshops.length === 0 ? (
                            <p style={{ color: '#bbb', textAlign: 'center', padding: '24px 0' }}>Aucun atelier.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {workshops.map(w => {
                                    const editing = editingWorkshop?.id === w.id;
                                    return (
                                        <div key={w.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            background: editing ? '#f6f4ff' : '#fafafa',
                                            border: `1px solid ${editing ? '#d9ccff' : '#eee'}`,
                                            borderRadius: '10px', padding: '10px 14px',
                                        }}>
                                            {editing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingWorkshop.name || ''}
                                                        onChange={e => setEditingWorkshop({ ...editingWorkshop, name: e.target.value })}
                                                        placeholder="Nom de l'atelier"
                                                        style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', fontFamily: 'inherit' }}
                                                    />
                                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#555' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!editingWorkshop.is_immersive}
                                                            onChange={e => setEditingWorkshop({ ...editingWorkshop, is_immersive: e.target.checked })}
                                                        />
                                                        Immersif
                                                    </label>
                                                    <button
                                                        onClick={handleSaveWorkshop}
                                                        title="Enregistrer"
                                                        style={{ background: '#6741d9', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingWorkshop(null)}
                                                        title="Annuler"
                                                        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {w.name}
                                                            {w.is_immersive ? (
                                                                <span style={{ background: '#f3efff', color: '#5327b5', fontSize: '0.7rem', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>
                                                                    IMMERSIF
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div style={{ color: '#aaa', fontSize: '0.78rem' }}>
                                                            {w.cartel_count ?? 0} cartel{(w.cartel_count ?? 0) > 1 ? 's' : ''}
                                                            {w.created_by_email ? ` · ${w.created_by_email}` : ''}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/app/admin/workshop/${w.id}`)}
                                                        title="Gérer les cartels"
                                                        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#555', fontSize: '0.78rem', fontFamily: 'inherit' }}
                                                    >
                                                        Cartels
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingWorkshop({ id: w.id, name: w.name, is_immersive: !!w.is_immersive })}
                                                        title="Modifier"
                                                        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWorkshop(w)}
                                                        title="Supprimer"
                                                        style={{ background: 'none', border: '1px solid #fcc', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#d32f2f', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Section>
                </>
            )}
        </div>
    );
};

export default AdminCategoriesWorkshops;
