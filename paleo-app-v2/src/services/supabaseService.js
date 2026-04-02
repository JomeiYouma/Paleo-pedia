// src/services/supabaseService.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase URL or Key is missing. Please check .env.local");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const authService = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: metadata } = await supabase
      .from('users_metadata')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { user: data.user, session: data.session, metadata: metadata || {} };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: metadata } = await supabase
      .from('users_metadata')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, metadata: metadata || {} };
  }
};

export const cartelsService = {
  async getPublishedCartels() {
    const { data, error } = await supabase
      .from('cartels')
      .select('*, cartel_categories(category:categories(*))')
      .eq('status', 'published')
      .eq('visible', true)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data.map(cartel => ({
      ...cartel,
      categories: cartel.cartel_categories?.map(cc => cc.category) || []
    }));
  },

  async getAllCartels() {
    const { data, error } = await supabase
      .from('cartels')
      .select('*, cartel_categories(category:categories(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(cartel => ({
      ...cartel,
      categories: cartel.cartel_categories?.map(cc => cc.category) || []
    }));
  }
};
