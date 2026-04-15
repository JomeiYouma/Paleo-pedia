import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { geocodingService } from '../services/geocoding';
import { Save, ArrowLeft, MapPin, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../utils/imageProcessor';

const Create = () => {
    const { t, i18n } = useTranslation();
    const context = useApp() || {};
    const {
        cartels = [],
        addCartel,
        updateCartel,
        deleteCartel,
        uploadImage,
        categories: globalCats = [],
        addLocalCategory,
        isAdmin,
        currentWorkshop,
    } = context;

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const editId = searchParams.get('edit');
    const workshopIdParam = searchParams.get('workshopId');
    const returnTo = location.state?.returnTo || '/app';

    const isEn = i18n.language === 'en';

    const [form, setForm] = useState({
        titre: '',
        titre_en: '',
        annee: '2025',
        description: '',
        description_en: '',
        exhume_par: '',
        categories: [],
        categories_en: [],
        url_qr: '',
        location: '',
        location_en: '',
        lat: null,
        lng: null,
        image_path: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [geoStatus, setGeoStatus] = useState('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Load existing data
    useEffect(() => {
        if (editId) {
            const existing = cartels.find(c => c.id === editId);
            if (existing) {
                setForm(prev => ({
                    ...prev,
                    ...existing,
                    imageUrl: existing.image_path || '',
                    categories: existing.categories || [],
                    categories_en: existing.categories_en || []
                }));
                if (existing.lat != null && existing.lng != null) setGeoStatus('success');
            }
        }
    }, [editId, cartels]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'title_input') {
            setForm(prev => ({ ...prev, [isEn ? 'titre_en' : 'titre']: value }));
        } else if (name === 'desc_input') {
            setForm(prev => ({ ...prev, [isEn ? 'description_en' : 'description']: value }));
        } else if (name === 'location') {
            setForm(prev => ({ ...prev, [isEn ? 'location_en' : 'location']: value }));
            setGeoStatus('idle');
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGeocode = async () => {
        const loc = isEn ? form.location_en : form.location;
        if (!loc) return;
        setGeoStatus('loading');
        const result = await geocodingService.search(loc);
        if (result) {
            setForm(prev => ({ ...prev, coords: { lat: result.lat, lng: result.lng }, lat: result.lat, lng: result.lng }));
            setGeoStatus('success');
        } else {
            setGeoStatus('error');
            setForm(prev => ({ ...prev, coords: null, lat: null, lng: null }));
        }
    };

    const handleCategoryToggle = (cat) => {
        setForm(prev => {
            const cats = prev.categories || [];
            if (cats.includes(cat)) return { ...prev, categories: cats.filter(c => c !== cat) };
            return { ...prev, categories: [...cats, cat] };
        });
    };

    const handleAddCategory = () => {
        if (newCategory) {
            addLocalCategory(newCategory);
            if (!form.categories.includes(newCategory)) {
                setForm(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
            }
            setNewCategory('');
        }
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setForm(prev => ({ ...prev, imageUrl: url }));
            try {
                setStatusMsg("Optimisation image...");
                const compressed = await compressImage(file);
                setImageFile(compressed);
                setStatusMsg("");
            } catch (err) {
                console.error("Compression failed", err);
                setImageFile(file);
            }
        }
    };

    const handleBack = () => {
        navigate(returnTo);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMsg("Traitement en cours...");
        await new Promise(r => setTimeout(r, 100));

        let data = { ...form };
        const action = e.nativeEvent.submitter.name;

        // IMAGE UPLOAD
        setStatusMsg(t('create.uploading', "Sauvegarde..."));
        let finalImagePath = form.image_path;
        if (imageFile) {
            try {
                finalImagePath = await uploadImage(imageFile);
            } catch (err) {
                alert("Erreur upload image: " + err.message);
                setIsSaving(false);
                return;
            }
        }

        // Atelier
        const activeWorkshopCtx = currentWorkshop || null;

        const entry = {
            id: editId || String(Date.now()),
            ...data,
            annee: data.annee || '2025',
            image_path: finalImagePath,
            date: data.date || new Date().toISOString().split('T')[0],
            created_at: data.created_at || new Date().toISOString()
        };
        delete entry.imageUrl;
        delete entry.coords;

        if (activeWorkshopCtx) {
            entry.origin = activeWorkshopCtx.name;
            entry.workshopId = activeWorkshopCtx.id;
        }

        if (editId) {
            // Mise à jour d'un cartel existant
            if (isAdmin && action === 'publish') {
                entry.status = 'published';
            } else if (isAdmin) {
                // Admin garde le statut actuel ou force draft
                entry.status = entry.status || 'draft';
            } else {
                // Visiteur : propose ou sauvegarde
                entry.status = action === 'save_draft' ? 'draft' : 'pending_review';
            }
            await updateCartel(entry);
        } else {
            // Nouveau cartel
            if (isAdmin) {
                entry.status = action === 'publish' ? 'published' : 'draft';
            } else {
                entry.status = action === 'save_draft' ? 'draft' : 'pending_review';
                if (action !== 'save_draft') {
                    setStatusMsg(t('messages.proposalSaved', "Proposition envoyée !"));
                }
            }
            await addCartel(entry);
        }

        setIsSaving(false);
        navigate(returnTo);
    };

    return (
        <div className="container" style={{ paddingBottom: '100px', maxWidth: '720px', margin: '0 auto' }}>
            {isSaving && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <h3>{statusMsg || t('common.loading', 'Chargement...')}</h3>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={handleBack} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}>
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> {t('common.back')}
                </button>
            </div>

            <h2>{editId ? t('messages.editCartel', 'Modifier le cartel') : t('create.pageTitle', 'Nouveau cartel')}</h2>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* Title */}
                <div>
                    <label>{t('create.fieldTitle')} *</label>
                    <input
                        name="title_input"
                        value={isEn ? form.titre_en : form.titre}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label>{t('create.fieldYear')}</label>
                        <input name="annee" value={form.annee} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div>
                        <label>{t('create.fieldExhume')}</label>
                        <input name="exhume_par" value={form.exhume_par} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }} />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label>{t('create.fieldLocation')}</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                name="location"
                                value={isEn ? (form.location_en || '') : (form.location || '')}
                                onChange={handleInputChange}
                                placeholder={t('create.fieldLocationPlaceholder')}
                                style={{ width: '100%', padding: '8px', paddingRight: '30px' }}
                                onBlur={handleGeocode}
                            />
                            {geoStatus === 'success' && <Check size={16} color="green" style={{ position: 'absolute', right: 8, top: 10 }} />}
                            {geoStatus === 'error' && <X size={16} color="red" style={{ position: 'absolute', right: 8, top: 10 }} />}
                        </div>
                        <button type="button" onClick={handleGeocode} disabled={geoStatus === 'loading'} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', background: '#f0f0f0' }}>
                            <MapPin size={20} />
                        </button>
                    </div>
                    {geoStatus === 'success' && form.lat != null && <small style={{ color: 'green' }}>{t('create.located')} : {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</small>}
                    {geoStatus === 'error' && <small style={{ color: 'red' }}>{t('create.notFound')}</small>}
                </div>

                {/* Description */}
                <div>
                    <label>{t('create.fieldDesc')}</label>
                    <textarea
                        name="desc_input"
                        value={isEn ? form.description_en : form.description}
                        onChange={handleInputChange}
                        maxLength={1500}
                        rows={10}
                        style={{ width: '100%', padding: '8px' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                        {1500 - ((isEn ? form.description_en : form.description)?.length || 0)} / 1500
                    </div>
                </div>

                {/* Image */}
                <div style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '10px', background: '#f9f9f9', textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>{t('create.fieldImage')}</label>
                    <input type="file" onChange={handleImageChange} accept="image/*" style={{ margin: '0 auto', display: 'block' }} />
                    {form.imageUrl && (
                        <div style={{ marginTop: '15px', maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img src={form.imageUrl} alt="Previsu" style={{ maxWidth: '300px', maxHeight: '300px', width: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                        </div>
                    )}
                    <div style={{ marginTop: '10px', textAlign: 'left' }}>
                        <label style={{ fontSize: '0.9em', color: '#666' }}>{t('create.imageCredit', "Crédit Image")}</label>
                        <input
                            name="imageCredit"
                            value={form.imageCredit || ''}
                            onChange={handleInputChange}
                            placeholder="ex: Wikimedia Commons, Auteur Inconnu..."
                            style={{ width: '100%', padding: '5px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <label>{t('create.fieldCategories')}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                        {Array.from(new Set([
                            // Les catégories globales sont des objets {id, name, ...} → on extrait .name
                            ...(globalCats || []).map(c => (typeof c === 'object' ? c.name : c)),
                            ...(form.categories || [])
                        ])).map(catName => (
                            <button
                                type="button"
                                key={catName}
                                onClick={() => handleCategoryToggle(catName)}
                                style={{
                                    backgroundColor: (form.categories || []).includes(catName) ? 'var(--color-pink-darker)' : 'transparent',
                                    border: '1px solid #ccc', borderRadius: '15px', fontSize: '0.8rem', padding: '4px 8px'
                                }}
                            >
                                {catName}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input placeholder={t('common.otherCategory')} value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ flex: 1, padding: '4px' }} />
                        <button type="button" onClick={handleAddCategory}>{t('common.add')}</button>
                    </div>
                </div>

                <div>
                    <label>{t('create.fieldUrlQR')}</label>
                    <input name="url_qr" value={form.url_qr} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }} />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {isAdmin && (
                        <>
                            <button type="submit" name="save" disabled={isSaving} style={{ flex: 1, backgroundColor: '#555', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                                <Save /> {isSaving ? statusMsg : 'Sauvegarder brouillon'}
                            </button>
                            <button type="submit" name="publish" disabled={isSaving} style={{ flex: 1, backgroundColor: 'black', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                                <Save /> {isSaving ? statusMsg : (editId ? t('create.btnSave') : 'Publier')}
                            </button>
                        </>
                    )}
                    {!isAdmin && (
                        <>
                            <button type="submit" name="save_draft" disabled={isSaving} style={{ flex: 1, backgroundColor: '#555', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                                <Save /> {t('create.saveDraft')}
                            </button>
                            <button type="submit" name="propose" disabled={isSaving} style={{ flex: 1, backgroundColor: 'var(--color-pink-darker, #C2185B)', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                                <Check /> {t('create.sendProposal')}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Create;
