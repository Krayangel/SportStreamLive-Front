// src/pages/Eventos.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }        from '../context/AuthContext';
import { getEvents, inscribirEvent } from '../services/eventService';
import { isStreamActive } from '../services/streamService';
import { ContentCard }    from '../components/ui/ContentCard';
import { Badge }          from '../components/ui/Badge';
import { Spinner }        from '../components/ui/Spinner';
import { LiveRoom }       from './LiveRoom';
import { formatDateTime } from '../utils/formatters';

export function Eventos({ setThread }) {
  const { user }  = useAuth();
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [liveEvt,  setLiveEvt]  = useState(null);   // evento cuyo live está abierto
  const [actives,  setActives]  = useState({});      // { [eventId]: boolean }
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    setThread?.('sync', 'running');
    getEvents()
      .then(async (evts) => {
        setEvents(evts);
        // Verificar cuáles tienen stream activo
        const checks = await Promise.allSettled(
          evts.map(e => isStreamActive(`event-${e.id}`).then(r => [e.id, r.active]))
        );
        const map = {};
        checks.forEach(c => { if (c.status === 'fulfilled') map[c.value[0]] = c.value[1]; });
        setActives(map);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setThread?.('sync', 'idle'); });
  }, [setThread]);

  const handleInscribir = async (eventId) => {
    if (!user?.id) return;
    try {
      await inscribirEvent(eventId, user.id);
      setMsg('✅ ¡Inscrito correctamente!');
      // Refrescar lista
      const evts = await getEvents();
      setEvents(evts);
    } catch {
      setMsg('❌ Error al inscribirse.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  if (liveEvt) {
    return <LiveRoom event={liveEvt} onExit={() => setLiveEvt(null)} setThread={setThread} />;
  }

  if (loading) return <div className="page"><Spinner text="Cargando eventos…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Eventos</div>
          <div className="ps">Deportivos en SportStreamLive</div>
        </div>
        <Badge>📅 {events.length} EVENTOS</Badge>
      </div>

      {msg && (
        <div className={`alert-box ${msg.startsWith('✅') ? 'alert-ok' : 'alert-err'}`}
          style={{ marginBottom: 14 }}>
          {msg}
        </div>
      )}

      <ContentCard title="Calendario deportivo" icon="🗓️">
        {events.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No hay eventos disponibles.</p>
        )}
        {events.map(e => {
          const inscrito  = e.asistentes?.includes(user?.id);
          const streamOn  = actives[e.id];
          const esCreador = e.creatorId === user?.id;

          return (
            <div className="ev" key={e.id}>
              <div className="ev-dt">{e.tipo} · {formatDateTime(e.fecha)}</div>
              <div className="ev-name">{e.titulo}</div>
              <div className="ev-det">{e.descripcion}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {/* Inscribirse */}
                {!inscrito && !esCreador && (
                  <button
                    className="btn-main"
                    style={{ maxWidth: 160, padding: '8px 14px', fontSize: '0.82rem' }}
                    onClick={() => handleInscribir(e.id)}
                  >
                    Inscribirme
                  </button>
                )}
                {inscrito && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 700 }}>
                    ✅ Inscrito
                  </span>
                )}
                {/* Ver live */}
                {(inscrito || esCreador) && streamOn && (
                  <button
                    className="btn-main"
                    style={{ maxWidth: 160, padding: '8px 14px', fontSize: '0.82rem',
                             background: 'var(--danger)', color: '#fff' }}
                    onClick={() => setLiveEvt(e)}
                  >
                    🔴 Ver Live
                  </button>
                )}
                {/* El creador puede iniciar el live aunque no esté "activo" aún */}
                {esCreador && !streamOn && (
                  <button
                    className="btn-main"
                    style={{ maxWidth: 180, padding: '8px 14px', fontSize: '0.82rem' }}
                    onClick={() => setLiveEvt(e)}
                  >
                    🎙️ Iniciar Live
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </ContentCard>
    </div>
  );
}