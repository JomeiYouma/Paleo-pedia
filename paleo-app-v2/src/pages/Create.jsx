import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCartels } from '../hooks/useCartels';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Upload, X, Send, Save, Check } from 'lucide-react';
import './Create.css';

/**
 * Create — Formulaire de création/édition de cartel.
 * 
 * - Utilisateurs connectés (admin/contributor) : créent en 'draft'
 * - Public (non connecté) : soumettent en 'pending_review'
 * - ?edit=cartelId : mode édition (admin only)
 */
export default function Create() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { user, isAdmin, canCreate } = useAuth();
  const { addCartel, updateCartel, submitProposal, uploadImage } = useCartels();
  const { categories } = useCategories();

  const isPublicMode = !user; // Soumission publique sans compte
  const isEditMode = !!editId && isAdmin;

  const [form, setForm] = useState({
    titre: '',
    description: '',
    location: '',
    annee: '',
    exhume_par: '',
    url_qr: '',
    visible: true,
  });

  const [selectedCats, setSelectedCats] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Si mode édition, charger le cartel existant
  useEffect(() => {
    if (!isEditMode) return;
    const loadCartel = async () => {
      const { data } = await supabase
        .from('cartels')
        .select('*, cartel_categories(category_id)')
        .eq('id', editId)
        .single();

      if (data) {
        const { cartel_categories: _, ...rest } = data;
        setForm({
          titre: rest.titre || '',
          description: rest.description || '',
          location: rest.location || '',
          annee: rest.annee || '',
          exhume_par: rest.exhume_par || '',
          url_qr: rest.url_qr || '',
          visible: rest.visible !== false,
        });
        if (data.image_path) setImagePreview(data.image_path);
        setSelectedCats(data.cartel_categories?.map(cc => cc.category_id) || []);
      }
    };
    loadCartel();
  }, [editId, isEditMode]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.checked }));

  const toggleCat = (catId) => {
    setSelectedCats(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) { setError('Le titre est obligatoire.'); return; }

    setSaving(true);
    setError('');

    try {
      let imagePath = imagePreview;

      // Upload image si nécessaire
      if (imageFile) {
        setUploading(true);
        imagePath = await uploadImage(imageFile);
        setUploading(false);
      }

      const payload = { ...form, image_path: imagePath || null };

      if (isEditMode) {
        await updateCartel(editId, payload, selectedCats);
      } else if (isPublicMode) {
        await submitProposal(payload, selectedCats);
      } else {
        await addCartel(payload, selectedCats);
      }

      setSaved(true);
      setTimeout(() => {
        navigate(isPublicMode ? '/' : '/admin');
      }, 1500);
    } catch (e) {
      setError(e.message || 'Une erreur est survenue.');
      console.error(e);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="create-page page-enter">
      <div className="container">
        <div className="create-header">
          <h1 className="create-title">
            {isEditMode ? 'Modifier le cartel' : isPublicMode ? 'Proposer une invention' : 'Créer un cartel'}
          </h1>
          {isPublicMode && (
            <p className="create-public-notice">
              Votre proposition sera soumise à validation avant publication.
              Pas besoin de compte pour contribuer.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          {error && <div className="create-error" role="alert">{error}</div>}
          {saved && (
            <div className="create-success" role="status">
              <Check size={16} />
              {isPublicMode ? 'Proposition envoyée, merci !' : 'Cartel sauvegardé !'}
            </div>
          )}

          <div className="create-cols">
            {/* Colonne principale */}
            <div className="create-main">
              <div className="form-group">
                <label htmlFor="create-titre" className="form-label">Titre *</label>
                <input
                  id="create-titre"
                  type="text"
                  className="form-input"
                  value={form.titre}
                  onChange={set('titre')}
                  placeholder="Ex: Moulin à vent de Lescure"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-desc" className="form-label">Description</label>
                <textarea
                  id="create-desc"
                  className="form-textarea"
                  value={form.description}
                  onChange={set('description')}
                  rows={6}
                  placeholder="Décrivez l'invention, son contexte historique, son fonctionnement…"
                />
              </div>

              <div className="create-row-2">
                <div className="form-group">
                  <label htmlFor="create-annee" className="form-label">Année / Période</label>
                  <input
                    id="create-annee"
                    type="text"
                    className="form-input"
                    value={form.annee}
                    onChange={set('annee')}
                    placeholder="Ex: 1350, XIVe s., 1200-1350"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-location" className="form-label">Lieu</label>
                  <input
                    id="create-location"
                    type="text"
                    className="form-input"
                    value={form.location}
                    onChange={set('location')}
                    placeholder="Ex: Bretagne, France"
                  />
                </div>
              </div>

              <div className="create-row-2">
                <div className="form-group">
                  <label htmlFor="create-auteur" className="form-label">Exhumé par</label>
                  <input
                    id="create-auteur"
                    type="text"
                    className="form-input"
                    value={form.exhume_par}
                    onChange={set('exhume_par')}
                    placeholder="Votre nom ou pseudonyme"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-url" className="form-label">Lien source / QR</label>
                  <input
                    id="create-url"
                    type="url"
                    className="form-input"
                    value={form.url_qr}
                    onChange={set('url_qr')}
                    placeholder="https://…"
                  />
                </div>
              </div>

              {/* Catégories */}
              <div className="form-group">
                <span className="form-label">Catégories</span>
                <div className="create-cats">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`create-cat-btn ${selectedCats.includes(cat.id) ? 'active' : ''}`}
                      style={selectedCats.includes(cat.id) ? {
                        background: `${cat.color}20`,
                        color: cat.color,
                        borderColor: `${cat.color}60`
                      } : {}}
                      onClick={() => toggleCat(cat.id)}
                      id={`cat-select-${cat.id}`}
                    >
                      {selectedCats.includes(cat.id) && <Check size={12} />}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibilité (admin only) */}
              {isAdmin && (
                <div className="form-group">
                  <label className="create-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.visible}
                      onChange={setCheck('visible')}
                      id="create-visible"
                    />
                    <span>Visible publiquement</span>
                  </label>
                </div>
              )}
            </div>

            {/* Colonne image */}
            <div className="create-sidebar">
              <div className="form-group">
                <span className="form-label">Image</span>
                <div className="create-image-zone">
                  {imagePreview ? (
                    <div className="create-image-preview">
                      <img src={imagePreview} alt="Aperçu" />
                      <button
                        type="button"
                        className="create-image-remove"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        aria-label="Supprimer l'image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="create-image-input" className="create-image-placeholder">
                      <Upload size={28} />
                      <span>Cliquez pour ajouter une image</span>
                      <span className="create-image-hint">PNG, JPG — max 5 Mo</span>
                      <input
                        id="create-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="create-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || saved}
              id="create-submit"
            >
              {saving ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  {uploading ? 'Upload…' : 'Sauvegarde…'}</>
              ) : saved ? (
                <><Check size={16} /> Sauvegardé !</>
              ) : isPublicMode ? (
                <><Send size={16} /> Envoyer la proposition</>
              ) : isEditMode ? (
                <><Save size={16} /> Enregistrer</>
              ) : (
                <><Save size={16} /> Créer le cartel</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
