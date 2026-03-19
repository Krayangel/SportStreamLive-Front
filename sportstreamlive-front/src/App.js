// src/App.js
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen }  from './components/auth/AuthScreen';
import { AppShell }    from './components/layout/AppShell';
import './styles/global.css';

function AppInner() {
  const { user } = useAuth();
  return user ? <AppShell /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}