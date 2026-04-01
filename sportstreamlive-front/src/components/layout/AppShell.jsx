// src/components/layout/AppShell.jsx
import React, { useState } from 'react';
import { Sidebar }   from './Sidebar';
import { Dashboard } from '../../pages/Dashboard';
import { Metas }     from '../../pages/Metas';
import { Logros }    from '../../pages/Logros';
import { Retos }     from '../../pages/Retos';
import { Eventos }   from '../../pages/Eventos';
import { Perfil }    from '../../pages/Perfil';

const PAGES = {
  dashboard: Dashboard,
  metas:     Metas,
  logros:    Logros,
  retos:     Retos,
  eventos:   Eventos,
  perfil:    Perfil,
};

export function AppShell() {
  const [page,    setPage]    = useState('dashboard');
  const [mobOpen, setMobOpen] = useState(false);

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="app-shell">
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
        <PageComponent />
      </main>
    </div>
  );
}
