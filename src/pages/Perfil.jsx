// src/pages/Perfil.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth }           from '../context/AuthContext';
import { getDashboard }      from '../services/dashboardService';
import { getBadges }         from '../services/badgeService';
import { getEligibility, changeRole } from '../services/userService';
import { ContentCard }       from '../components/ui/ContentCard';
import { Spinner }           from '../components/ui/Spinner';
import { USER_KEY }          from '../config';

const ROLE_LABELS = {
  ROLE_ADMIN:     { label: 'Admin',       color: '#ff6b6b', icon: '🛡️' },
  ROLE_STREAMING: { label: 'Streamer',    color: '#00d2c8', icon: '🎙️' },
  ROLE_USER:      { label: 'Participante',color: '#a0a0b0', icon: '🏃' },
};

function primaryRole(roles = []) {
  if (roles.includes('ROLE_ADMIN'))     return 'ROLE_ADMIN';
  if (roles.includes('ROLE_STREAMING')) return 'ROLE_STREAMING';
  return 'ROLE_USER';
}

export function Perfil() {
  const { user, confirmRole } = useAuth();
  const [profile,     setProfile]     = useState(null);
  const [badges,      setBadges]      = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError,   setRoleError]   = useState('');
  const [roleMsg,     setRoleMsg]     = useState('');

  const loadData = useCallback(() => {
    if (!user?.id) return;
    Promise.all([
      getDashboard(user.id).catch(() => null),
      getBadges(user.id).catch(() => []),
      getEligibility().catch(() => null),
    ]).then(([p, b, e]) => {
      setProfile(p);
      setBadges(Array.isArray(b) ? b : []);
      setEligibility(e);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRoleChange = async (target) => {
    setRoleLoading(true); setRoleError(''); setRoleMsg('');
    try {
      const data = await changeRole(target);
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
      stored.roles = data.roles || [target];
      confirmRole(stored);
      setRoleMsg('Rol actualizado. Recarga si los cambios no se reflejan.');
      getEligibility().catch(() => null).then(e => setEligibility(e));
    } catch (e) {
      setRoleError(e.message);
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading) return <div className="page"><Spinner text="Cargando perfil…" /></div>;

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';
  const racha    = profile?.rachaActual ?? profile?.racha ?? 0;
  const xp       = profile?.xpTotal    ?? profile?.puntosTotales ?? 0;
  const role     = primaryRole(user?.roles);
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.ROLE_USER;
  const isAdmin  = role === 'ROLE_ADMIN';
  const isStream = role === 'ROLE_STREAMING';

  const conditions = eligibility ? [
    { label: 'Inscribirse a un evento',  done: eligibility.inscripcionEvento },
    { label: 'Unirse a un reto',         done: eligibility.unirseReto        },
    { label: 'Completar un reto',        done: eligibility.completarReto     },
  ] : [];

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Mi Perfil</div>
          <div className="ps">Datos sincronizados con el servidor</div>
        </div>
      </div>

      <div className="prof-head">
        <div className="prof-av">{initials}</div>
        <div>
          <div className="prof-name">{user?.username?.toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div className="prof-sp">⚡ SportStreamLive</div>
            <span style={{
              padding: '2px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: `${roleInfo.color}22`,
              color: roleInfo.color,
              border: `1px solid ${roleInfo.color}55`,
            }}>
              {roleInfo.icon} {roleInfo.label}
            </span>
          </div>
          <div className="prof-row">
            {[
              [racha,         'Racha'],
              [xp,            'XP'],
              [badges.length, 'Logros'],
            ].map(([v, l]) => (
              <div className="pstat" key={l}>
                <div className="pv">{v}</div>
                <div className="pl">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cg">
        <ContentCard title="Información de cuenta" icon="👤">
          {[
            ['Usuario', user?.username],
            ['Correo',  user?.email],
            ['Rol',     `${roleInfo.icon} ${roleInfo.label}`],
            ['Racha',   `${racha} días`],
            ['XP',      `${xp} puntos`],
          ].map(([l, v]) => (
            <div className="info-row" key={l}>
              <div className="info-lbl">{l}</div>
              <div className="info-val" style={l === 'Correo' ? { color: 'var(--teal)' } : {}}>
                {v}
              </div>
            </div>
          ))}
        </ContentCard>

        {!isAdmin && (
          <ContentCard title="Cambiar rol" icon="🔄">
            {isStream ? (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                  Actualmente eres <strong style={{ color: 'var(--teal)' }}>Streamer</strong>. Puedes volver a Participante en cualquier momento.
                </p>
                {roleMsg && <p style={{ color: 'var(--teal)', fontSize: '0.82rem', marginBottom: 8 }}>{roleMsg}</p>}
                {roleError && <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: 8 }}>{roleError}</p>}
                <button className="btn-main" disabled={roleLoading} onClick={() => handleRoleChange('ROLE_USER')}
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  {roleLoading ? <><span className="spin-anim">⟳</span> Cambiando…</> : 'Volver a Participante'}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                  Para convertirte en <strong style={{ color: 'var(--teal)' }}>Streamer</strong> debes cumplir:
                </p>
                {conditions.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '1.1rem', color: c.done ? '#4caf50' : 'var(--muted)' }}>
                      {c.done ? '✅' : '⬜'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: c.done ? 'var(--text)' : 'var(--muted)' }}>
                      {c.label}
                    </span>
                  </div>
                ))}
                {roleMsg   && <p style={{ color: 'var(--teal)', fontSize: '0.82rem', marginTop: 8 }}>{roleMsg}</p>}
                {roleError && <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginTop: 8 }}>{roleError}</p>}
                <button
                  className="btn-main"
                  disabled={roleLoading || (eligibility && !eligibility.eligible)}
                  onClick={() => handleRoleChange('ROLE_STREAMING')}
                  style={{ marginTop: 12 }}
                >
                  {roleLoading ? <><span className="spin-anim">⟳</span> Cambiando…</> : 'Convertirme en Streamer'}
                </button>
                {eligibility && !eligibility.eligible && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 6 }}>
                    Completa los 3 requisitos para desbloquear el upgrade.
                  </p>
                )}
              </>
            )}
          </ContentCard>
        )}

        <ContentCard title="Últimas medallas" icon="🏅">
          {badges.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Sin medallas aún.</p>
            : badges.slice(0, 6).map(b => (
                <div className="ch" key={b.id} style={{ cursor: 'default' }}>
                  <div className="ch-ico">🥇</div>
                  <div className="ch-inf">
                    <div className="ch-name">{b.nombre}</div>
                    <div className="ch-meta">{b.descripcion}</div>
                  </div>
                </div>
              ))
          }
        </ContentCard>
      </div>
    </div>
  );
}
