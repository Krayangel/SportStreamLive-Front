// src/pages/Eventos.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth }        from '../context/AuthContext';
import { getEvents, createEvent, inscribirEvent } from '../services/eventService';
import { isStreamActive } from '../services/streamService';
import { ContentCard }    from '../components/ui/ContentCard';
import { Badge }          from '../components/ui/Badge';
import { Spinner }        from '../components/ui/Spinner';
import { AlertBox }       from '../components/ui/AlertBox';
import { LiveRoom }       from './LiveRoom';
import { formatDateTime } from '../utils/formatters';

const EMPTY_FORM = { titulo: '', descripcion: '', tipo: 'PRESENCIAL', fecha: '' };

export function Eventos() {
  const { user } = useAuth();

  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [liveEvt,  setLiveEvt]  = useState(null);
  const [actives,  setActives]  = useState({});
  const [msg,      setMsg]      = useState('');
  const [msgType,  setMsgType]  = useState('success');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [joining,  setJoining]  = useState(null);

  const showMsg = (text, type = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const setField = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const loadEvents = useCallback(async () => {
    try {
      const evts = await getEvents();
      setEvents(Array.isArray(evts) ? evts : []);
      if (evts?.length > 0) {
        const checks = await Promise.allSettled(
          evts.map(e =>
            isStreamActive(`event-${e.id}`)
              .then(r => [e.id, r.active])
              .catch(() => [e.id, false])
          )
        );
        const map = {};
        checks.forEach(c => {
          if (c.status === 'fulfilled') map[c.value[0]] = c.value[1];
        });
        setActives(map);
      }
    } catch (err) {
      console.error('[Eventos]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.titulo.trim())      { setFormErr('El título es obligatorio.');         return; }
    if (!form.descripcion.trim()) { setFormErr('La descripción es obligatoria.');    return; }
    if (!form.fecha)              { setFormErr('La fecha y hora son obligatorias.'); return; }
    setCreating(true);
    try {
      await createEvent({
        titulo: form.titulo.trim(), descripcion: form.descripcion.trim(),
        tipo: form.tipo, fecha: form.fecha, creatorId: user.id,
      });
      showMsg('✅ Evento creado.');
      setShowForm(false); setForm(EMPTY_FORM);
      await loadEvents();
    } catch (err) {
      setFormErr(err.message || 'Error al crear.');
    } finally {
      setCreating(false);
    }
  };

  const handleInscribir = async (eventId) => {
    if (!user?.id || joining) return;
    setJoining(eventId);
    try {
      await inscribirEvent(eventId, user.id);
      showMsg('✅ ¡Inscrito! Medalla otorgada.');
      await loadEvents();
    } catch (err) {
      showMsg(err.message || 'Error al inscribirse.', 'error');
    } finally {
      setJoining(null);
    }
  };

  if (liveEvt) {
    return (
      <LiveRoom
        event={liveEvt}
        onExit={() => { setLiveEvt(null); loadEvents(); }}
      />
    );
  }

  if (loading) return <div className="page"><Spinner text="Cargando eventos…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Eventos</div>
          <div className="ps">Deportivos en SportStreamLive</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge>📅 {events.length} EVENTOS</Badge>
          <button className="btn-main"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.82rem',
              background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            onClick={loadEvents}>↻ Actualizar</button>
          <button className="btn-main"
            style={{ width: 'auto', padding: '9px 18px', fontSize: '0.85rem' }}
            onClick={() => { setShowForm(s => !s); setFormErr(''); }}>
            {showForm ? '✕ Cancelar' : '+ Crear evento'}
          </button>
        </div>
      </div>

      {msg && <AlertBox type={msgType === 'error' ? 'error' : 'success'} message={msg} />}

      {showForm && (
        <ContentCard title="Nuevo evento" icon="➕" style={{ marginBottom: 18 }}>
          <form onSubmit={handleCreate}>
            {formErr && <AlertBox type="error" message={formErr} />}
            <div className="fg">
              <label>Título <span className="req">*</span></label>
              <input type="text" placeholder="Maratón Ciudad 10K"
                value={form.titulo} onChange={setField('titulo')} disabled={creating} />
            </div>
            <div className="fg">
              <label>Descripción <span className="req">*</span></label>
              <input type="text" placeholder="Describe el evento"
                value={form.descripcion} onChange={setField('descripcion')} disabled={creating} />
            </div>
            <div className="form-grid-2">
              <div className="fg">
                <label>Tipo <span className="req">*</span></label>
                <select value={form.tipo} onChange={setField('tipo')} disabled={creating}
                  style={{
                    width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)',
                    borderRadius: 10, padding: '13px 15px', color: 'var(--text)',
                    fontFamily: 'DM Sans,sans-serif', fontSize: '0.92rem', outline: 'none',
                  }}>
                  <option value="PRESENCIAL">🏟️ Presencial</option>
                  <option value="VIRTUAL">💻 Virtual</option>
                </select>
              </div>
              <div className="fg">
                <label>Fecha y hora <span className="req">*</span></label>
                <input type="datetime-local" value={form.fecha}
                  onChange={setField('fecha')} disabled={creating}
                  style={{ colorScheme: 'dark' }} />
              </div>
            </div>
            <button className="btn-main" type="submit" disabled={creating}
              style={{ maxWidth: 200, marginTop: 6 }}>
              {creating ? <><span className="spin-anim">⟳</span> Creando…</> : '✅ Crear evento'}
            </button>
          </form>
        </ContentCard>
      )}

      <ContentCard title="Calendario deportivo" icon="🗓️">
        {events.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            No hay eventos aún. ¡Crea el primero!
          </p>
        )}
        {events.map(e => {
          const inscrito    = e.asistentes?.includes(user?.id);
          const streamOn    = actives[e.id];
          const esCreador   = e.creatorId === user?.id;
          const puedeEntrar = esCreador || inscrito;

          return (
            <div className="ev" key={e.id}>
              <div className="ev-dt">
                {e.tipo} · {formatDateTime(e.fecha)}
                {esCreador && (
                  <span style={{
                    marginLeft: 10, background: 'rgba(212,245,60,0.12)',
                    color: 'var(--accent)', borderRadius: 6, padding: '2px 8px',
                    fontSize: '0.65rem', fontWeight: 800,
                  }}>TU EVENTO</span>
                )}
                {streamOn && (
                  <span style={{
                    marginLeft: 8, background: 'rgba(255,77,106,0.15)',
                    color: 'var(--danger)', borderRadius: 6, padding: '2px 8px',
                    fontSize: '0.65rem', fontWeight: 800, animation: 'pulse 2s infinite',
                  }}>🔴 EN VIVO</span>
                )}
              </div>
              <div className="ev-name">{e.titulo}</div>
              <div className="ev-det">{e.descripcion}</div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {!esCreador && !inscrito && (
                  <button className="btn-main"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem',
                      opacity: joining === e.id ? 0.6 : 1 }}
                    onClick={() => handleInscribir(e.id)}
                    disabled={!!joining}>
                    {joining === e.id ? <><span className="spin-anim">⟳</span> Inscribiendo…</> : '📋 Inscribirme'}
                  </button>
                )}
                {!esCreador && inscrito && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 700 }}>
                    ✅ Inscrito
                  </span>
                )}
                {puedeEntrar && streamOn && (
                  <button className="btn-main"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem',
                      background: 'var(--danger)', color: '#fff' }}
                    onClick={() => setLiveEvt(e)}>
                    🔴 Entrar al Live
                  </button>
                )}
                {esCreador && !streamOn && (
                  <button className="btn-main"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}
                    onClick={() => setLiveEvt(e)}>
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
