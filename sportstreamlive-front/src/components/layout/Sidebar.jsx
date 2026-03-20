// src/components/layout/Sidebar.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ page, onNavigate, mobOpen, setMobOpen }) {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const navItems = [
    { id: 'dashboard', ico: '📊', label: 'Dashboard',   section: 'Principal' },
    { id: 'metas',     ico: '🎯', label: 'Mis Metas',   section: null },
    { id: 'logros',    ico: '🏆', label: 'Logros',      section: null },
    { id: 'retos',     ico: '⚔️', label: 'Retos',       section: 'Comunidad' },
    { id: 'eventos',   ico: '📅', label: 'Eventos',     section: null },
    { id: 'perfil',    ico: '👤', label: 'Mi Perfil',   section: 'Cuenta' },
  ];

  return (
    <aside className={`sidebar${mobOpen ? ' mob-open' : ''}`}>
      <div className="sb-logo">AthleteX</div>

      <div className="sb-user">
        <div className="sb-avatar">{initials}</div>
        <div>
          <div className="sb-name">{user?.username || 'Usuario'}</div>
          <div className="sb-lvl">⚡ SportStreamLive</div>
        </div>
      </div>

      {navItems.map((item, i) => (
        <React.Fragment key={item.id}>
          {item.section && (
            <div className="sb-sec" style={i > 0 ? { marginTop: 14 } : {}}>
              {item.section}
            </div>
          )}
          <button
            className={`nav-btn${page === item.id ? ' on' : ''}`}
            onClick={() => { onNavigate(item.id); setMobOpen(false); }}
          >
            <span>{item.ico}</span>{item.label}
          </button>
        </React.Fragment>
      ))}

      <div className="sb-spacer" />
      <button className="btn-logout" onClick={logout}>
        <span>⏏</span>Cerrar sesión
      </button>
    </aside>
  );
}
