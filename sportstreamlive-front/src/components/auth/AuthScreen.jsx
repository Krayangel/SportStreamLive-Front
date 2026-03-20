// src/components/auth/AuthScreen.jsx
import React, { useState } from 'react';
import { LoginForm }    from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthScreen() {
  const [tab, setTab] = useState('login');

  const switchTab = (t) => setTab(t);

  return (
    <div className="auth-wrap">
      <div className="auth-box fadeUp">
        <div className="auth-logo">AthleteX</div>
        <div className="auth-sub">Tu rendimiento · Tu legado</div>
        <div className="auth-card">
          <div className="tab-bar">
            <button
              className={`tab-btn${tab === 'login' ? ' on' : ''}`}
              onClick={() => switchTab('login')}
            >
              Iniciar sesión
            </button>
            <button
              className={`tab-btn${tab === 'register' ? ' on' : ''}`}
              onClick={() => switchTab('register')}
            >
              Registrarse
            </button>
          </div>

          {tab === 'login'
            ? <LoginForm />
            : <RegisterForm onSuccess={() => switchTab('login')} />
          }
        </div>
      </div>
    </div>
  );
}
