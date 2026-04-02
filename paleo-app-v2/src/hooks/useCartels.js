import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCartels — CRUD complet sur les cartels Supabase.
 * 
 * Remplace : fetchData + addCartel + updateCartel + deleteCartel dans AppContext
 * + les 3 services (github/local/php) = 1 seul service propre.
 * 
 * RLS Supabase s'occupe des permissions : lecture publique, écriture admin.
 * 
 * Usage :
 *   const { cartels, loading, fetchCartels, addCartel, ... } = useCartels();
 */
export function useCartels() {
  const [cartels, setCartels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Récupère les cartels publiés (ou tous si admin).
   * @param {string|null} categoryId - Filtrer par catégorie (optionnel)
   */
  const fetchCartels = useCallback(async (categoryId = null) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('cartels')
        .select(`
          *,
          cartel_categories(
            category_id,
            category:categories(id, name, color, icon)
          )
        `)
        .eq('status', 'published')
        .eq('visible', true)
        .order('annee', { ascending: true });

      if (categoryId) {
        // Filtre via la table de jointure
        query = query.contains('cartel_categories.category_id', [categoryId]);
      }

      const { data, error } = await query;
      if (error) throw error;

      const normalized = (data || []).map(cartel => ({
        ...cartel,
        categories: cartel.cartel_categories?.map(cc => cc.category).filter(Boolean) || [],
      }));

      setCartels(normalized);
      return normalized;
    } catch (e) {
      setError(e.message);
      console.error('fetchCartels error:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère tous les cartels (admin : drafts, pending, rejected inclus).
   */
  const fetchAllCartels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cartels')
        .select(`
          *,
          cartel_categories(
            category_id,
            category:categories(id, name, color, icon)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map(cartel => ({
        ...cartel,
        categories: cartel.cartel_categories?.map(cc => cc.category).filter(Boolean) || [],
      }));

      setCartels(normalized);
      return normalized;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crée un nouveau cartel (draft par défaut).
   */
  const addCartel = useCallback(async (cartelData, categoryIds = []) => {
    const { data: { user } } = await supabase.auth.getUser();
    const id = `cartel_${Date.now()}`;

    const { categories: _ignored, cartel_categories: _ignored2, ...rest } = cartelData;

    const { data: cartel, error: cartelError } = await supabase
      .from('cartels')
      .insert([{ id, ...rest, created_by: user.id, status: 'draft' }])
      .select()
      .single();
    if (cartelError) throw cartelError;

    if (categoryIds.length > 0) {
      const { error: catError } = await supabase
        .from('cartel_categories')
        .insert(categoryIds.map(catId => ({ cartel_id: cartel.id, category_id: catId })));
      if (catError) throw catError;
    }

    return cartel;
  }, []);

  /**
   * Met à jour un cartel existant.
   */
  const updateCartel = useCallback(async (cartelId, updates, categoryIds = null) => {
    const { categories: _c, cartel_categories: _cc, ...rest } = updates;

    const { data: cartel, error } = await supabase
      .from('cartels')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', cartelId)
      .select()
      .single();
    if (error) throw error;

    if (categoryIds !== null) {
      await supabase.from('cartel_categories').delete().eq('cartel_id', cartelId);
      if (categoryIds.length > 0) {
        const { error: catError } = await supabase
          .from('cartel_categories')
          .insert(categoryIds.map(catId => ({ cartel_id: cartelId, category_id: catId })));
        if (catError) throw catError;
      }
    }

    setCartels(prev => prev.map(c => c.id === cartelId ? { ...c, ...cartel } : c));
    return cartel;
  }, []);

  /**
   * Publie un cartel (admin seulement, enforced par RLS).
   */
  const publishCartel = useCallback(async (cartelId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('cartels')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: user.id,
      })
      .eq('id', cartelId)
      .select()
      .single();
    if (error) throw error;
    setCartels(prev => prev.map(c => c.id === cartelId ? { ...c, ...data } : c));
    return data;
  }, []);

  /**
   * Supprime un cartel.
   */
  const deleteCartel = useCallback(async (cartelId) => {
    const { error } = await supabase.from('cartels').delete().eq('id', cartelId);
    if (error) throw error;
    setCartels(prev => prev.filter(c => c.id !== cartelId));
  }, []);

  /**
   * Upload d'image vers Supabase Storage.
   * Retourne le path public.
   */
  const uploadImage = useCallback(async (file) => {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage
      .from('assets')
      .upload(`images/${fileName}`, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(`images/${fileName}`);
    return publicUrl;
  }, []);

  /**
   * Soumission publique (sans compte) — enregistré en status 'pending_review'.
   */
  const submitProposal = useCallback(async (cartelData, categoryIds = []) => {
    const id = `proposal_${Date.now()}`;
    const { categories: _c, cartel_categories: _cc, ...rest } = cartelData;

    const { data: cartel, error } = await supabase
      .from('cartels')
      .insert([{
        id,
        ...rest,
        status: 'pending_review',
        // Pas de created_by : public proposal (RLS doit le permettre via policy séparée)
      }])
      .select()
      .single();
    if (error) throw error;

    if (categoryIds.length > 0) {
      await supabase
        .from('cartel_categories')
        .insert(categoryIds.map(catId => ({ cartel_id: cartel.id, category_id: catId })));
    }

    return cartel;
  }, []);

  return {
    cartels,
    loading,
    error,
    fetchCartels,
    fetchAllCartels,
    addCartel,
    updateCartel,
    publishCartel,
    deleteCartel,
    uploadImage,
    submitProposal,
  };
}
