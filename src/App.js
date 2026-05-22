// src/App.js
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen }    from './components/auth/AuthScreen';
import { AppShell }      from './components/layout/AppShell';
import { RoleSelector }  from './pages/RoleSelector';
import { wsInit, wsDisconnect } from './services/wsClient';
import './styles/global.css';

function AppInner() {
  const { user, pendingRole } = useAuth();

  useEffect(() => {
    if (user && !pendingRole) {
      wsInit();
    } else {
      wsDisconnect();
    }
  }, [user, pendingRole]);

  if (!user)           return <AuthScreen />;
  if (pendingRole)     return <RoleSelector />;
  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
