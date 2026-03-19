// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }      from '../context/AuthContext';
import { getDashboard } from '../services/dashboardService';
import { StatCard }     from '../components/ui/StatCard';
import { ContentCard }  from '../components/ui/ContentCard';
import { Badge }        from '../components/ui/Badge';
import { Spinner }      from '../components/ui/Spinner';

export function Dashboard({ setThread }) {
  const { user }  = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const h = new Date().getHours();
  const greet = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    if (!user?.id) return;
    setThread?.('sync', 'running');
    getDashboard(user.id)
      .then(setProfile)
      .catch(() => {})
      .finally(() => { setLoading(false); setThread?.('sync', 'idle'); });
  }, [user?.id, setThread]);

  if (loading) return <div className="page"><Spinner text="Cargando dashboard…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">{greet}, {user?.username} 👋</div>
          <div className="ps" style={{ textTransform: 'capitalize' }}>{dateStr}</div>
        </div>
        <Badge>
          <div className="t-dot active" style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />
          EN LÍNEA
        </Badge>
      </div>

      <div className="sg">
        <StatCard icon="🔥" label="Racha actual"    value={profile?.racha ?? 0}           change="días seguidos" />
        <StatCard icon="⚡" label="Puntos totales"  value={profile?.puntosTotales ?? 0}    change="XP acumulados" />
        <StatCard icon="🏅" label="Logros"          value="—"                              change="Ver en Logros" />
        <StatCard icon="🎯" label="Metas activas"   value="—"                              change="Ver en Metas" />
      </div>

      <div className="cg">
        <ContentCard title="Mis metas" icon="🎯">
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {profile?.metas || 'Sin metas registradas aún. Ve a "Mis Metas" para agregar.'}
          </p>
        </ContentCard>
        <ContentCard title="Bienvenido a SportStreamLive" icon="🏆">
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Únete a retos, inscríbete en eventos, ve streams en vivo y gana medallas.
            ¡Solo el primero en cada live se lleva la medalla especial!
          </p>
        </ContentCard>
      </div>
    </div>
  );
}