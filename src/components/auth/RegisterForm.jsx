// src/components/auth/RegisterForm.jsx
import React, { useState } from 'react';
import { ProgressBar }      from '../ui/ProgressBar';
import { AlertBox }         from '../ui/AlertBox';
import { useAuth }          from '../../context/AuthContext';
import { validateRegister } from '../../utils/validators';

export function RegisterForm({ onSuccess }) {
  const { register, loading, error, setError } = useAuth();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '',
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
