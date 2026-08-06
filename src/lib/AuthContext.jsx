import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, api } from '@/api/supabaseClient';

const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'user'
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const applySession = useCallback((session) => {
    const currentUser = normalizeUser(session?.user || null);
    setUser(currentUser);
    setIsAuthenticated(Boolean(currentUser));
    setAuthError(null);
    setAuthChecked(true);
    setIsLoadingAuth(false);
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      applySession(data.session);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error.message || 'Authentication check failed' });
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, [applySession]);

  useEffect(() => {
    checkUserAuth();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
    return () => data.subscription.unsubscribe();
  }, [applySession, checkUserAuth]);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await api.auth.logout();
    if (shouldRedirect) window.location.href = '/';
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

