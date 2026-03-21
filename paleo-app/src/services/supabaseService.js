// ============================================================
// SUPABASE SERVICE
// ============================================================
// Remplace phpService, local, et github.
// Intègre les sécurités : RLS, Audit, RLS role en JWT (demain),
// Edge Functions (demain).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_KEY manquant dans .env.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// HEALTH CHECK
// ============================================================

export const supabaseService = {
  async checkHealth() {
    try {
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
      return !error;
    } catch (e) {
      return false;
    }
  },

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    
    // ✅ FIX 🔴 #1 : Charger le rôle depuis users_metadata
    // (Demain, ce sera dans le JWT token via trigger)
    const { data: metadata } = await supabase
      .from('users_metadata')
      .select('role, can_create_cartels, can_publish_cartels, can_manage_admin')
      .eq('id', data.user.id)
      .single();

    return {
      user: data.user,
      session: data.session,
      metadata: metadata || {}
    };
  },

  async signup(email, password, fullName = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    if (error) throw error;

    // Trigger on_auth_user_created créera users_metadata automatique
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Charger la metadata
    const { data: metadata } = await supabase
      .from('users_metadata')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      user,
      metadata: metadata || {}
    };
  },

  // ============================================================
  // CARTELS (Opérations principales)
  // ============================================================

  async getCartels() {
    // RLS filtre automatique par status (public) ou owned + admin (voir tout)
    const { data, error } = await supabase
      .from('cartels')
      .select(`
        *,
        cartel_categories(category_id, category:categories(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformer structure : cartel_categories -> categories array
    return data.map(cartel => ({
      ...cartel,
      categories: cartel.cartel_categories?.map(cc => cc.category) || []
    }));
  },

  async getPublishedCartels() {
    // Optimisé pour frise publique : index partiel (status='published', visible=true)
    const { data, error } = await supabase
      .from('cartels')
      .select(`
        *,
        cartel_categories(category_id, category:categories(*))
      `)
      .eq('status', 'published')
      .eq('visible', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    return data.map(cartel => ({
      ...cartel,
      categories: cartel.cartel_categories?.map(cc => cc.category) || []
    }));
  },

  async getCartelsByStatus(status) {
    // Pour admin : voir les brouillons, en review, etc
    const { data, error } = await supabase
      .from('cartels')
      .select(`
        *,
        cartel_categories(category_id, category:categories(*))
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(cartel => ({
      ...cartel,
      categories: cartel.cartel_categories?.map(cc => cc.category) || []
    }));
  },

  async createCartel(cartelData) {
    const { id, categories, ...rest } = cartelData;

    // Insérer le cartel
    const { data: cartel, error: cartelError } = await supabase
      .from('cartels')
      .insert([{
        id: id || `cartel_${Date.now()}`,
        ...rest,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (cartelError) throw cartelError;

    // Insérer les catégories (M2M)
    if (categories && categories.length > 0) {
      const { error: catError } = await supabase
        .from('cartel_categories')
        .insert(
          categories.map(catId => ({
            cartel_id: cartel.id,
            category_id: catId
          }))
        );

      if (catError) throw catError;
    }

    return cartel;
  },

  async updateCartel(cartelId, updates) {
    const { categories, ...rest } = updates;

    // ✅ Updater le cartel
    const { data: cartel, error: cartelError } = await supabase
      .from('cartels')
      .update({
        ...rest,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartelId)
      .select()
      .single();

    if (cartelError) throw cartelError;

    // ✅ Updater les catégories (supprimer les anciennes, insérer les nouvelles)
    if (categories) {
      // Supprimer les anciennes
      await supabase
        .from('cartel_categories')
        .delete()
        .eq('cartel_id', cartelId);

      // Insérer les nouvelles
      if (categories.length > 0) {
        const { error: catError } = await supabase
          .from('cartel_categories')
          .insert(
            categories.map(catId => ({
              cartel_id: cartelId,
              category_id: catId
            }))
          );

        if (catError) throw catError;
      }
    }

    return cartel;
  },

  async publishCartel(cartelId, appliedBy = null) {
    // Passer status: draft → published
    const { data, error } = await supabase
      .from('cartels')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: appliedBy || (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', cartelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCartel(cartelId) {
    // Cascade delete via constraint on delete cascade
    const { error } = await supabase
      .from('cartels')
      .delete()
      .eq('id', cartelId);

    if (error) throw error;
  },

  // ============================================================
  // CATEGORIES (Référence)
  // ============================================================

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================
  // WORKSHOPS (Collections)
  // ============================================================

  async getWorkshops() {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createWorkshop(workshopData) {
    const { data, error } = await supabase
      .from('workshops')
      .insert([{
        id: `workshop_${Date.now()}`,
        ...workshopData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkshop(workshopId, updates) {
    const { data, error } = await supabase
      .from('workshops')
      .update(updates)
      .eq('id', workshopId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================
  // IMAGES (Upload Storage)
  // ============================================================

  async uploadImage(file) {
    if (!file) throw new Error('No file provided');

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(`images/${fileName}`, file);

    if (error) throw error;

    // Retourner path public
    return `images/${fileName}`;
  },

  async deleteImage(imagePath) {
    const { error } = await supabase.storage
      .from('assets')
      .remove([imagePath]);

    if (error) throw error;
  },

  // ============================================================
  // CONFIG (Secrets Globales)
  // ============================================================

  async getConfig() {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 404 is ok
    return data || {};
  },

  async updateConfig(updates) {
    const { data, error } = await supabase
      .from('app_config')
      .upsert({
        id: 'global',
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================
  // AUDIT LOGS (Traçabilité Historique)
  // ============================================================

  async getAuditLogs(filters = {}) {
    // Admin only (RLS enforced)
    let query = supabase
      .from('audit_logs')
      .select('*');

    if (filters.tableeName) query = query.eq('table_name', filters.tableName);
    if (filters.userId) query = query.eq('user_id', filters.userId);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // ============================================================
  // REALTIME (Bonus pour future)
  // ============================================================

  subscribeToCartels(callback) {
    return supabase
      .channel('cartels_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cartels' },
        (payload) => callback(payload)
      )
      .subscribe();
  },

  // ============================================================
  // ADMIN UTILITIES
  // ============================================================

  async promoteUserToAdmin(userId) {
    const { error } = await supabase
      .from('users_metadata')
      .update({ can_manage_admin: true, role: 'admin' })
      .eq('id', userId);

    if (error) throw error;
  },

  async setUserRole(userId, role) {
    const { error } = await supabase
      .from('users_metadata')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  }
};

// ============================================================
// 🚀 FIX 🔴 #2 : EDGE FUNCTION PATTERN (À IMPLÉMENTER)
// ============================================================
// 
// Pour appels API (OpenAI, DeepL, etc) :
// 
// export async function callEdgeFunction(functionName, payload) {
//   const { data, error } = await supabase.functions.invoke(functionName, {
//     body: payload
//   });
//   if (error) throw error;
//   return data;
// }
//
// Clés API jamais côté client, toujours en .env du serveur Supabase.
//
// ============================================================

export default supabaseService;
