import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    FolderOpen, Hammer, Edit, Trash2, Save, X, Plus,
} from 'lucide-react';
import api from '../services/apiClient';
import {
    AdminPageHeader, AdminSection, AdminToast, useAdminToast,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// ── Sous-section avec en-tête iconisé ─────────────────────────
const SubSection = ({ icon: Icon, title, children }) => (
    <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
    }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
        }}>
            <div style={{
                width: '34px', height: '34px',
                background: 'var(--color-accent)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={16} color="var(--color-primary)" />
            </div>
            <h3 style={{
                margin: 0, fontSize: '1rem', flex: 1,
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{title}</h3>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
    </div>
);

const AdminCategoriesWorkshops = () => {
    const { t } = useTranslation();
    const { isAdmin, fetchData } = useApp();
    const navigate = useNavigate();
    const { toast, showToast } = useAdminToast(3500);

    const [categories, setCategories] = useState([]);
    const [workshops, setWorkshops]   = useState([]);
    const [loading, setLoading]       = useState(true);

    const [editingCategory, setEditingCategory] = useState(null);
    const [editingWorkshop, setEditingWorkshop] = useState(null);

    const [newCatName, setNewCatName]     = useState('');
    const [newCatNameEn, setNewCatNameEn] = useState('');
    const [newCatColor, setNewCatColor]   = useState('#888888');

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
            showToast('error', e.message || t('adminTaxo.errorLoad', 'Erreur de chargement'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

    // ── Catégories ────────────────────────────────────────────
    const handleCreateCategory = async () => {
        const name = newCatName.trim();
        if (!name) return showToast('error', t('adminTaxo.nameRequired', 'Nom requis'));
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
            showToast('success', t('adminTaxo.categoryCreated', 'Catégorie créée'));
        } catch (e) {
            showToast('error', e.message || t('adminTaxo.errorCreate', 'Erreur de création'));
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
            showToast('success', t('adminTaxo.categoryUpdated', 'Catégorie mise à jour'));
        } catch (e) {
            showToast('error', e.message || t('adminTaxo.errorUpdate', 'Erreur de mise à jour'));
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!confirm(t('adminTaxo.confirmDeleteCategory', { name: cat.name, defaultValue: `Supprimer la catégorie « ${cat.name} » ? Les cartels qui la portent la perdront.` }))) return;
        try {
            await api.categories.delete(cat.id);
            await load();
            fetchData?.();
            showToast('success', t('adminTaxo.categoryDeleted', 'Catégorie supprimée'));
        } catch (e) {
            showToast('error', e.message || t('adminTaxo.errorDelete', 'Erreur de suppression'));
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
            showToast('success', t('adminTaxo.workshopUpdated', 'Atelier mis à jour'));
        } catch (e) {
            showToast('error', e.message || t('adminTaxo.errorUpdate', 'Erreur de mise à jour'));
        }
    };

    const handleDeleteWorkshop = async (w) => {
        if (!confirm(t('adminTaxo.confirmDeleteWorkshop', { name: w.name, defaultValue: `Supprimer l'atelier « ${w.name} » ? Les cartels associés ne seront pas supprimés mais ne seront plus liés.` }))) return;
        try {
            await api.workshops.delete(w.id);
            await load();
            fetchData?.();
            showToast('success', t('adminTaxo.workshopDeleted', 'Atelier supprimé'));
        } catch (e) {
            showToast('error', e.message || t('adminTaxo.errorDelete', 'Erreur de suppression'));
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-subtle)' }}>
                {t('adminTaxo.accessAdminOnly', "Accès réservé à l'administration.")}
            </div>
        );
    }

    const colorInputStyle = {
        width: '42px', height: '36px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        cursor: 'pointer',
        padding: '2px',
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={FolderOpen} title={t('adminTaxo.pageTitle', 'Catégories & ateliers')} />

            <p style={{
                background: 'var(--color-surface-2)',
                borderLeft: '3px solid var(--color-accent)',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                margin: '0 0 20px',
            }}>
                {t('adminTaxo.pageIntro', 'Modifier ou supprimer les catégories et ateliers existants.')}
            </p>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-subtle)' }}>{t('adminTaxo.loading', 'Chargement…')}</p>
            ) : (
                <>
                    {/* ── Catégories ──────────────────────────── */}
                    <SubSection icon={FolderOpen} title={t('adminTaxo.categoriesTitle', 'Catégories')}>
                        {/* Création rapide */}
                        <div style={{
                            background: 'var(--color-accent-soft)',
                            border: '1px solid var(--color-accent)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            marginBottom: '16px',
                            display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end',
                        }}>
                            <div style={{ flex: '1 1 180px' }}>
                                <label style={labelStyle}>{t('adminTaxo.nameFr', 'Nom (FR)')}</label>
                                <input
                                    type="text"
                                    placeholder={t('adminTaxo.exMobilite', 'Ex : Mobilité')}
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ flex: '1 1 180px' }}>
                                <label style={labelStyle}>{t('adminTaxo.nameEn', 'Name (EN)')}</label>
                                <input
                                    type="text"
                                    placeholder={t('adminTaxo.exMobility', 'Ex : Mobility')}
                                    value={newCatNameEn}
                                    onChange={e => setNewCatNameEn(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>{t('adminTaxo.color', 'Couleur')}</label>
                                <input
                                    type="color"
                                    value={newCatColor}
                                    onChange={e => setNewCatColor(e.target.value)}
                                    title={t('adminTaxo.color', 'Couleur')}
                                    style={colorInputStyle}
                                />
                            </div>
                            <button onClick={handleCreateCategory} style={primaryBtnStyle}>
                                <Plus size={14} /> {t('adminTaxo.add', 'Ajouter')}
                            </button>
                        </div>

                        {categories.length === 0 ? (
                            <p style={{ color: 'var(--color-text-subtle)', textAlign: 'center', padding: '24px 0' }}>{t('adminTaxo.noCategory', 'Aucune catégorie.')}</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {categories.map(cat => {
                                    const editing = editingCategory?.id === cat.id;
                                    return (
                                        <div key={cat.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            background: 'var(--color-surface-2)',
                                            border: `1px solid ${editing ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-md)', padding: '10px 14px',
                                        }}>
                                            {editing ? (
                                                <>
                                                    <input
                                                        type="color"
                                                        value={editingCategory.color || '#888888'}
                                                        onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                                        style={{ ...colorInputStyle, width: '32px', height: '32px' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingCategory.name || ''}
                                                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                        placeholder={t('adminTaxo.nameFr', 'Nom (FR)')}
                                                        style={{ ...inputStyle, flex: 1 }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingCategory.name_en || ''}
                                                        onChange={e => setEditingCategory({ ...editingCategory, name_en: e.target.value })}
                                                        placeholder={t('adminTaxo.nameEn', 'Name (EN)')}
                                                        style={{ ...inputStyle, flex: 1 }}
                                                    />
                                                    <button
                                                        onClick={handleSaveCategory}
                                                        title={t('adminTaxo.save', 'Enregistrer')}
                                                        style={{ ...primaryBtnStyle, padding: '7px 10px' }}
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCategory(null)}
                                                        title={t('adminTaxo.cancel', 'Annuler')}
                                                        style={{ ...ghostBtnStyle, padding: '7px 10px' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: cat.color || 'var(--color-text-subtle)', flexShrink: 0 }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)' }}>{cat.name}</div>
                                                        <div style={{ color: 'var(--color-text-subtle)', fontSize: '0.78rem' }}>
                                                            {cat.id}{cat.name_en ? ` · ${cat.name_en}` : ''}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingCategory({ id: cat.id, name: cat.name, name_en: cat.name_en || '', color: cat.color || '#888888', icon: cat.icon || '' })}
                                                        title={t('adminTaxo.edit', 'Modifier')}
                                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat)}
                                                        title={t('adminTaxo.delete', 'Supprimer')}
                                                        style={{ ...dangerBtnStyle, padding: '5px 10px' }}
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
                    </SubSection>

                    {/* ── Ateliers ────────────────────────────── */}
                    <SubSection icon={Hammer} title={t('adminTaxo.workshopsTitle', 'Ateliers')}>
                        <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {t('adminTaxo.workshopsHint', 'Créez les ateliers depuis la page de gestion des cartels (sélection + « Créer un atelier »).')}
                        </p>

                        {workshops.length === 0 ? (
                            <p style={{ color: 'var(--color-text-subtle)', textAlign: 'center', padding: '24px 0' }}>{t('adminTaxo.noWorkshop', 'Aucun atelier.')}</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {workshops.map(w => {
                                    const editing = editingWorkshop?.id === w.id;
                                    return (
                                        <div key={w.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            background: 'var(--color-surface-2)',
                                            border: `1px solid ${editing ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-md)', padding: '10px 14px',
                                        }}>
                                            {editing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingWorkshop.name || ''}
                                                        onChange={e => setEditingWorkshop({ ...editingWorkshop, name: e.target.value })}
                                                        placeholder={t('adminTaxo.workshopName', "Nom de l'atelier")}
                                                        style={{ ...inputStyle, flex: 1 }}
                                                    />
                                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!editingWorkshop.is_immersive}
                                                            onChange={e => setEditingWorkshop({ ...editingWorkshop, is_immersive: e.target.checked })}
                                                        />
                                                        {t('adminTaxo.immersive', 'Immersif')}
                                                    </label>
                                                    <button
                                                        onClick={handleSaveWorkshop}
                                                        title={t('adminTaxo.save', 'Enregistrer')}
                                                        style={{ ...primaryBtnStyle, padding: '7px 10px' }}
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingWorkshop(null)}
                                                        title={t('adminTaxo.cancel', 'Annuler')}
                                                        style={{ ...ghostBtnStyle, padding: '7px 10px' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {w.name}
                                                            {w.is_immersive && (
                                                                <span style={{
                                                                    background: 'var(--color-accent)',
                                                                    color: 'var(--color-primary)',
                                                                    fontSize: '0.68rem',
                                                                    padding: '2px 8px',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    fontWeight: '700',
                                                                    fontFamily: 'var(--font-heading)',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px',
                                                                }}>
                                                                    {t('adminTaxo.immersive', 'Immersif')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ color: 'var(--color-text-subtle)', fontSize: '0.78rem' }}>
                                                            {t('adminTaxo.cartelsCount', { count: w.cartel_count ?? 0, defaultValue: `${w.cartel_count ?? 0} cartel${(w.cartel_count ?? 0) > 1 ? 's' : ''}` })}
                                                            {w.created_by_email ? ` · ${w.created_by_email}` : ''}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/app/admin/workshop/${w.id}`)}
                                                        title={t('adminTaxo.manageCartelsTitle', 'Gérer les cartels')}
                                                        style={{ ...ghostBtnStyle, padding: '6px 12px', fontSize: '0.74rem' }}
                                                    >
                                                        {t('adminTaxo.cartels', 'Cartels')}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingWorkshop({ id: w.id, name: w.name, is_immersive: !!w.is_immersive })}
                                                        title={t('adminTaxo.edit', 'Modifier')}
                                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWorkshop(w)}
                                                        title={t('adminTaxo.delete', 'Supprimer')}
                                                        style={{ ...dangerBtnStyle, padding: '5px 10px' }}
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
                    </SubSection>
                </>
            )}
        </div>
    );
};

export default AdminCategoriesWorkshops;
