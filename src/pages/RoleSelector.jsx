// src/pages/RoleSelector.jsx
import React, { useState } from 'react';
import { useAuth }      from '../context/AuthContext';
import { changeRole }   from '../services/userService';
import { TOKEN_KEY, USER_KEY } from '../config';

const ROLES = [
  {
    value: 'ROLE_USER',
    label: 'Participante',
    icon: '🏃',
    desc: 'Únete a eventos, sigue retos y disfruta en vivos. El camino perfecto para empezar.',
  },
  {
    value: 'ROLE_STREAMING',
    label: 'Streamer',
    icon: '🎙️',
    desc: 'Crea y gestiona eventos, lanza retos propios y transmite en vivo.',
  },
];

export function RoleSelector() {
  const { user, confirmRole } = useAuth();
  const [selected, setSelected] = useState('ROLE_USER');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      const data = await changeRole(selected);
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
      stored.roles = data.roles || [selected];
      confirmRole(stored);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: 16,
        padding: '36px 32px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>👋</div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)' }}>
            Bienvenido, {user?.username}
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: '0.9rem' }}>
            ¿Cómo quieres participar en SportStreamLive?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setSelected(r.value)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 12,
                border: `2px solid ${selected === r.value ? 'var(--teal)' : 'var(--border)'}`,
                background: selected === r.value ? 'rgba(0,210,200,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border 0.2s, background 0.2s',
              }}
            >
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>{r.desc}</div>
              </div>
              {selected === r.value && (
                <span style={{ marginLeft: 'auto', color: 'var(--teal)', fontSize: '1.2rem' }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255,80,80,0.1)',
            color: '#ff6b6b',
            fontSize: '0.85rem',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          className="btn-main"
          onClick={handleConfirm}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? <><span className="spin-anim">⟳</span> Guardando…</> : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
