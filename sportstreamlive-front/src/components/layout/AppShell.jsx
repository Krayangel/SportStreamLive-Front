// src/components/layout/AppShell.jsx
import React, { useState } from 'react';
import { Sidebar }       from './Sidebar';
import { ThreadMonitor } from './ThreadMonitor';
import { Dashboard }     from '../../pages/Dashboard';
import { Metas }         from '../../pages/Metas';
import { Logros }        from '../../pages/Logros';
import { Retos }         from '../../pages/Retos';
import { Eventos }       from '../../pages/Eventos';
import { Perfil }        from '../../pages/Perfil';

export function AppShell() {
  const [page,     setPage]     = useState('dashboard');
  const [mobOpen,  setMobOpen]  = useState(false);
  const [threads,  setThreads]  = useState({
    ws: 'idle', stream: 'idle', chat: 'idle', sync: 'running',
  });

  // Las páginas actualizan el estado de hilos vía esta función
  const setThread = (key, val) =>
    setThreads(p => ({ ...p, [key]: val }));

  const pages = {
    dashboard: <Dashboard setThread={setThread} />,
    metas:     <Metas />,
    logros:    <Logros />,
    retos:     <Retos setThread={setThread} />,
    eventos:   <Eventos setThread={setThread} />,
    perfil:    <Perfil />,
  };

  return (
    <div className="app-shell">
      {/* Botón hamburguesa en móvil */}
      <button
        className="mob-menu-btn"
        onClick={() => setMobOpen(o => !o)}
        aria-label="Menú"
      >
        ☰
      </button>

      <Sidebar
        page={page}
        onNavigate={setPage}
        mobOpen={mobOpen}
        setMobOpen={setMobOpen}
      />

      <main className="main" key={page}>
        {pages[page]}
      </main>

      <ThreadMonitor threads={threads} />
    </div>
  );
}