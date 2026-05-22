// src/components/auth/RegisterForm.jsx
import React, { useState } from 'react';
import { ProgressBar }      from '../ui/ProgressBar';
import { AlertBox }         from '../ui/AlertBox';
import { useAuth }          from '../../context/AuthContext';
import { validateRegister } from '../../utils/validators';

const ROLES = [
  {
    value: 'ROLE_USER',
    label: 'Participante',
    icon: '🏃',
    desc: 'Únete a eventos, retos y sigue en vivos. Ideal para empezar.',
  },
  {
    value: 'ROLE_STREAMING',
    label: 'Streamer',
    icon: '🎙️',
    desc: 'Crea eventos, retos propios y transmite en vivo.',
  },
];

export function RegisterForm({ onSuccess }) {
  const { register, loading, error, setError } = useAuth();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '', role: 'ROLE_USER',
  });
  const [localErr, setLocalErr] = useState('');

  const set = (field) => (e) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr(''); setError('');
    const err = validateRegister(form);
    if (err) { setLocalErr(err); return; }
    const ok = await register(form);
    if (ok && onSuccess) onSuccess();
  };

  const displayErr = localErr || error;

  return (
    <div>
      {displayErr && <AlertBox type="error" message={displayErr} />}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem', color: 'var(--muted)' }}>
          Tipo de cuenta
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm(p => ({ ...p, role: r.value }))}
              style={{
                padding: '12px 10px',
                borderRadius: 10,
                border: `2px solid ${form.role === r.value ? 'var(--teal)' : 'var(--border)'}`,
                background: form.role === r.value ? 'rgba(0,210,200,0.08)' : 'var(--card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border 0.2s',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{r.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="fg">
          <label>Nombre de usuario <span className="req">*</span></label>
          <input
            type="text"
            placeholder="carloslopez"
            value={form.username}
            onChange={set('username')}
            disabled={loading}
          />
        </div>
        <div className="fg">
          <label>Correo electrónico <span className="req">*</span></label>
          <input
            type="email"
            placeholder="atleta@ejemplo.com"
            value={form.email}
            onChange={set('email')}
            disabled={loading}
          />
        </div>
        <div className="form-grid-2">
          <div className="fg">
            <label>Contraseña <span className="req">*</span></label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              disabled={loading}
            />
          </div>
          <div className="fg">
            <label>Confirmar <span className="req">*</span></label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={set('confirm')}
              disabled={loading}
            />
          </div>
        </div>

        {loading && (
          <div style={{ marginBottom: 10 }}>
            <ProgressBar progress={66} />
          </div>
        )}

        <button className="btn-main" disabled={loading} type="submit">
          {loading
            ? <><span className="spin-anim">⟳</span> Creando cuenta…</>
            : 'Crear cuenta'}
        </button>

        {loading && (
          <div className="thread-pill">
            <div className="t-dot active" />
            <span>auth-worker · registrando usuario…</span>
          </div>
        )}
      </form>
    </div>
  );
}
