// src/pages/Logros.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }     from '../context/AuthContext';
import { getBadges }   from '../services/badgeService';
import { ContentCard } from '../components/ui/ContentCard';
import { Badge }       from '../components/ui/Badge';
import { Spinner }     from '../components/ui/Spinner';
import { formatDate }  from '../utils/formatters';

const TIPO_ICON = {
  PRIMER_LOGRO:       '🌟',
  INSCRIPCION_EVENTO: '📅',
  UNIRSE_RETO:        '⚔️',
  COMPLETAR_RETO:     '🏆',
  ESPECTADOR_VIP:     '🏅',
};

export function Logros() {
  const { user }  = useAuth();
  const [badges,  setBadges]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getBadges(user.id)
      .then(data => setBadges(Array.isArray(data) ? data : []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="page"><Spinner text="Cargando logros…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Mis Logros</div>
          <div className="ps">Calculados en tiempo real desde el servidor</div>
        </div>
        <Badge>🏆 {badges.length} DESBLOQUEADOS</Badge>
      </div>

      <ContentCard title="Medallas obtenidas" icon="✨">
        {badges.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Aún no tienes logros. Inscríbete a eventos, únete a retos o ve un live para ganar medallas.
          </p>
        )}
        <div className="ag">
          {badges.map(b => (
            <div className="ai" key={b.id}>
              <div className="ai-ico">{TIPO_ICON[b.tipo] || '🥇'}</div>
              <div className="ai-name">{b.nombre}</div>
              <div className="ai-date">{formatDate(b.fechaObtenida)}</div>
            </div>
          ))}
        </div>
      </ContentCard>

      <ContentCard title="Cómo ganar medallas" icon="💡" style={{ marginTop: 14 }}>
        {[
          ['🌟', 'Registrarte en la app',    'Se otorga automáticamente'],
          ['📅', 'Inscribirte a un evento',  'Por cada evento nuevo'],
          ['⚔️', 'Unirte a un reto',         'Por cada reto que aceptes'],
          ['🏆', 'Completar un reto',        'Al cumplir todos los días requeridos'],
          ['🏅', 'Ser el primero en un live','¡Solo uno por evento! Sé rápido'],
        ].map(([ico, n, d]) => (
          <div className="ch" key={n} style={{ cursor: 'default' }}>
            <div className="ch-ico">{ico}</div>
            <div className="ch-inf">
              <div className="ch-name">{n}</div>
              <div className="ch-meta">{d}</div>
            </div>
          </div>
        ))}
      </ContentCard>
    </div>
  );
}
