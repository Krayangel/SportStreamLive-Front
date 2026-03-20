// src/pages/Perfil.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }      from '../context/AuthContext';
import { getDashboard } from '../services/dashboardService';
import { getBadges }    from '../services/badgeService';
import { ContentCard }  from '../components/ui/ContentCard';
import { Spinner }      from '../components/ui/Spinner';

export function Perfil() {
  const { user }  = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges,  setBadges]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getDashboard(user.id).catch(() => null),
      getBadges(user.id).catch(() => []),
    ]).then(([p, b]) => {
      setProfile(p);
      setBadges(b);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="page"><Spinner text="Cargando perfil…" /></div>;

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

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
          <div className="prof-sp">⚡ SportStreamLive</div>
          <div className="prof-row">
            {[
              [profile?.racha ?? 0,        'Racha'],
              [profile?.puntosTotales ?? 0, 'XP'],
              [badges.length,               'Logros'],
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
            ['Usuario',  user?.username],
            ['Correo',   user?.email],
            ['Racha',    `${profile?.racha ?? 0} días`],
            ['Puntos',   `${profile?.puntosTotales ?? 0} XP`],
          ].map(([l, v]) => (
            <div className="info-row" key={l}>
              <div className="info-lbl">{l}</div>
              <div className="info-val"
                style={l === 'Correo' ? { color: 'var(--teal)' } : {}}>
                {v}
              </div>
            </div>
          ))}
        </ContentCard>

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
