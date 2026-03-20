// src/App.js
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen }  from './components/auth/AuthScreen';
import { AppShell }    from './components/layout/AppShell';
import { wsInit, wsDisconnect } from './services/wsClient';
import './styles/global.css';

function AppInner() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Iniciar conexión WebSocket cuando el usuario está autenticado
      wsInit();
    } else {
      // Desconectar al cerrar sesión
      wsDisconnect();
    }
  }, [user]);

  return user ? <AppShell /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
