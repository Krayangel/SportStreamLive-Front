// src/pages/Metas.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }       from '../context/AuthContext';
import { getDashboard, updateMetas } from '../services/dashboardService';
import { ContentCard }   from '../components/ui/ContentCard';
import { Badge }         from '../components/ui/Badge';
import { Spinner }       from '../components/ui/Spinner';
import { AlertBox }      from '../components/ui/AlertBox';

export function Metas() {
  const { user }  = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [text,    setText]    = useState('');
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    if (!user?.id) return;
    getDashboard(user.id)
      .then(p => { setProfile(p); setText(p?.metas || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    try {
      const updated = await updateMetas(user.id, text);
      setProfile(updated);
      setEditing(false);
      setMsg('✅ Metas guardadas.');
    } catch {
      setMsg('❌ Error al guardar.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  if (loading) return <div className="page"><Spinner text="Cargando metas…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Mis Metas</div>
          <div className="ps">Guardadas en el servidor</div>
        </div>
        <Badge>🎯 RACHA {profile?.racha ?? 0} DÍAS</Badge>
      </div>

      {msg && <AlertBox type={msg.startsWith('✅') ? 'success' : 'error'} message={msg} />}

      <ContentCard title="Mis metas personales" icon="🎯">
        {!editing ? (
          <>
            <p style={{ color: profile?.metas ? 'var(--text)' : 'var(--muted)',
              fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 16 }}>
              {profile?.metas || 'Sin metas registradas aún. Haz clic en "Editar" para agregar.'}
            </p>
            <button
              className="btn-main"
              style={{ maxWidth: 140 }}
              onClick={() => setEditing(true)}
            >
              ✏️ Editar
            </button>
          </>
        ) : (
          <>
            <textarea
              style={{
                width: '100%', minHeight: 140,
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '12px 14px', color: 'var(--text)',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
                resize: 'vertical', outline: 'none', marginBottom: 14,
              }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe tus metas deportivas…"
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-main" style={{ maxWidth: 130 }} onClick={handleSave}>
                💾 Guardar
              </button>
              <button
                className="btn-main"
                style={{ maxWidth: 130, background: 'var(--surface)',
                  color: 'var(--muted)', border: '1px solid var(--border)' }}
                onClick={() => { setEditing(false); setText(profile?.metas || ''); }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </ContentCard>

      <ContentCard title="Estadísticas" icon="📊" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            ['🔥', 'Racha',  `${profile?.racha ?? 0} días`],
            ['⚡', 'Puntos', `${profile?.puntosTotales ?? 0} XP`],
          ].map(([ico, l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem' }}>{ico}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem',
                color: 'var(--accent)' }}>{v}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </ContentCard>
    </div>
  );
}