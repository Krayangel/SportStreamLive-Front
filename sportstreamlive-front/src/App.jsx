import React, { useState } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppShell } from './components/layout/AppShell';
import './styles/global.css';

export default function App() {
  const [user, setUser] = useState(null);
  return user ? (
    <AppShell user={user} onLogout={() => setUser(null)} />
  ) : (
    <AuthScreen onLogin={setUser} />
  );
}