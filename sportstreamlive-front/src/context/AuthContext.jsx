// src/context/AuthContext.jsx
// Provee el usuario autenticado a toda la app.
// Lee localStorage al arrancar para mantener la sesión entre recargas.

import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as svcLogin, register as svcRegister, logout as svcLogout, getStoredUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

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
