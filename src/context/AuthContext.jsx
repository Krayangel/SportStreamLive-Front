// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  login    as svcLogin,
  register as svcRegister,
  logout   as svcLogout,
  getStoredUser,
} from '../services/authService';
import { TOKEN_KEY, USER_KEY } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(() => getStoredUser());
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [pendingRole, setPendingRole] = useState(false);

  // Maneja el token que llega por URL tras OAuth2 Google
  // El back redirige a: /oauth2/callback?token=<jwt>[&new=true]
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const isNew   = params.get('new') === 'true';
    if (!token) return;

    window.history.replaceState({}, document.title, '/');

    try {
      const b64     = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      const email   = payload.sub;
      const username = email.split('@')[0];
      localStorage.setItem(TOKEN_KEY, token);
      const userData = {
        id: payload.userId || email, username, email,
        roles: payload.roles || [],
      };
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      if (isNew) setPendingRole(true);
    } catch (e) {
      console.error('[AuthContext] Error procesando token OAuth2:', e);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true); setError('');
    try {
      await svcLogin(email, password);
      setUser(getStoredUser());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true); setError('');
    try {
      await svcRegister(formData);
      setUser(getStoredUser());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    svcLogout();
    setUser(null);
    setPendingRole(false);
  }, []);

  // Llamado desde RoleSelector tras elegir rol post-Google
  const confirmRole = useCallback((updatedUser) => {
    if (updatedUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    setPendingRole(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, error, setError,
      login, register, logout,
      pendingRole, confirmRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);