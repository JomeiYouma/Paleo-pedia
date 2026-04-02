import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, supabase } from '../services/supabaseService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    authService.getCurrentUser().then(data => {
      if (data) {
        setUser(data.user);
        setMetadata(data.metadata);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        authService.getCurrentUser().then(data => setMetadata(data?.metadata || null));
      } else {
        setUser(null);
        setMetadata(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setMetadata(data.metadata);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setMetadata(null);
  };

  const isAdmin = metadata?.role === 'admin' || metadata?.can_manage_admin;

  return (
    <AuthContext.Provider value={{ user, metadata, isAdmin, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
