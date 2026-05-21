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
  const [user,    setUser]    = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Maneja el token que llega por URL tras OAuth2 Google
  // El back redirige a: /oauth2/callback?token=<jwt>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    if (!token) return;

    // Limpiar la URL sin recargar
    window.history.replaceState({}, document.title, window.location.pathname);

    // Decodificar el JWT para extraer email (no se verifica, solo se lee)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email   = payload.sub;
      const username = email.split('@')[0];
      localStorage.setItem(TOKEN_KEY, token);
      const userData = { id: payload.userId || email, username, email };
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error('[AuthContext] Error procesando token OAuth2:', e);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true); setError('');
    try {
      const data = await svcLogin(email, password);
      setUser({ id: data.userId, username: data.username, email });
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
      const data = await svcRegister(formData);
      setUser({ id: data.userId, username: data.username, email: formData.email });
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);