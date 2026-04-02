import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useWorkshops — CRUD des ateliers/branches Supabase.
 * 
 * Un workshop peut être de type 'workshop' ou 'branch' (ex: "Paléo H2O")
 * avec un parent_id pour la hiérarchie.
 * 
 * Usage :
 *   const { workshops, loading, fetchWorkshops, createWorkshop } = useWorkshops();
 */
export function useWorkshops() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setWorkshops(data || []);
      return data || [];
    } catch (e) {
      console.error('fetchWorkshops error:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkshop = useCallback(async (workshopData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const id = `workshop_${Date.now()}`;
    const { data, error } = await supabase
      .from('workshops')
      .insert([{ id, ...workshopData, created_by: user?.id }])
      .select()
      .single();
    if (error) throw error;
    setWorkshops(prev => [...prev, data]);
    return data;
  }, []);

  const updateWorkshop = useCallback(async (workshopId, updates) => {
    const { data, error } = await supabase
      .from('workshops')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', workshopId)
      .select()
      .single();
    if (error) throw error;
    setWorkshops(prev => prev.map(w => w.id === workshopId ? data : w));
    return data;
  }, []);

  const deleteWorkshop = useCallback(async (workshopId) => {
    const { error } = await supabase.from('workshops').delete().eq('id', workshopId);
    if (error) throw error;
    setWorkshops(prev => prev.filter(w => w.id !== workshopId));
  }, []);

  /**
   * Lie un cartel à un atelier (ajoute son id dans le tableau cartel_ids).
   */
  const linkCartelToWorkshop = useCallback(async (cartelId, workshopId) => {
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) throw new Error('Workshop introuvable');
    const ids = workshop.cartel_ids || [];
    if (ids.includes(cartelId)) return workshop;

    return updateWorkshop(workshopId, { cartel_ids: [...ids, cartelId] });
  }, [workshops, updateWorkshop]);

  return {
    workshops,
    loading,
    fetchWorkshops,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    linkCartelToWorkshop,
  };
}
