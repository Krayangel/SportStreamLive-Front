// src/components/auth/AuthScreen.jsx
import React, { useState } from 'react';
import { LoginForm }    from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthScreen() {
  const [tab, setTab] = useState('login');

  return (
    <div className="auth-wrap">
      <div className="auth-box fadeUp">
        <div className="auth-logo">AthleteX</div>
        <div className="auth-sub">Tu rendimiento · Tu legado</div>
        <div className="auth-card">
          <div className="tab-bar">
            <button
              className={`tab-btn${tab === 'login' ? ' on' : ''}`}
              onClick={() => setTab('login')}
            >
              Iniciar sesión
            </button>
            <button
              className={`tab-btn${tab === 'register' ? ' on' : ''}`}
              onClick={() => setTab('register')}
            >
              Registrarse
            </button>
          </div>

          {tab === 'login'
            ? <LoginForm />
            : <RegisterForm onSuccess={() => setTab('login')} />
          }
        </div>
      </div>
    </div>
  );
}
