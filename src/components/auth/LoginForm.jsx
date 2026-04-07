// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { ProgressBar }   from '../ui/ProgressBar';
import { AlertBox }      from '../ui/AlertBox';
import { useAuth }       from '../../context/AuthContext';
import { validateLogin } from '../../utils/validators';

export function LoginForm() {
  const { login, loading, error, setError } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    setError('');
    const err = validateLogin(email, password);
    if (err) { setLocalErr(err); return; }
    await login(email, password);
  };

  const displayErr = localErr || error;

  return (
    <div>
      {displayErr && <AlertBox type="error" message={displayErr} />}
      <form onSubmit={handleSubmit}>
        <div className="fg">
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="atleta@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="fg">
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {loading && (
          <div style={{ marginBottom: 10 }}>
            <ProgressBar progress={66} />
          </div>
        )}

        <button className="btn-main" disabled={loading} type="submit">
          {loading
            ? <><span className="spin-anim">⟳</span> Verificando…</>
            : 'Entrar'}
        </button>

        {loading && (
          <div className="thread-pill">
            <div className="t-dot active" />
            <span>auth-worker · conectando con el servidor…</span>
          </div>
        )}
      </form>
    </div>
  );
}
