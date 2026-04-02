import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useAuth — Gère l'authentification Supabase.
 * 
 * Remplace : login/logout/isAdmin dans AppContext + sessionStorage hack
 * Sécurité : auth réelle via JWT Supabase, plus de mot de passe hardcodé.
 * 
 * Usage :
 *   const { user, isAdmin, loading, login, logout } = useAuth();
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetadata = useCallback(async (userId) => {
    if (!userId) { setMetadata(null); return; }
    const { data } = await supabase
      .from('users_metadata')
      .select('role, can_create_cartels, can_publish_cartels, can_manage_admin')
      .eq('id', userId)
      .single();
    setMetadata(data || {});
  }, []);

  useEffect(() => {
    // Récupère la session courante au montage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadMetadata(session?.user?.id);
      setLoading(false);
    });

    // Écoute les changements d'auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        await loadMetadata(session?.user?.id);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadMetadata]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    user,
    loading,
    isAdmin: metadata?.can_manage_admin === true,
    canCreate: metadata?.can_create_cartels === true || metadata?.can_manage_admin === true,
    canPublish: metadata?.can_publish_cartels === true || metadata?.can_manage_admin === true,
    login,
    logout,
  };
}
