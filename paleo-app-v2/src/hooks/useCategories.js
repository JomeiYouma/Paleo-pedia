import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCategories — Charge les catégories depuis Supabase.
 * 
 * Les catégories sont stockées dans la table `categories` et sont
 * entièrement paramétrables (nom, description, couleur, icône) via l'admin.
 * 
 * Usage :
 *   const { categories, loading, refetch } = useCategories();
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      setError(e.message);
      console.error('useCategories error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createCategory = useCallback(async (categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    if (error) throw error;
    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }, []);

  const updateCategory = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return { categories, loading, error, refetch: fetch, createCategory, updateCategory, deleteCategory };
}
