// src/pages/Retos.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getChallenges, createChallenge, unirseChallenge,
  salirChallenge, registrarProgreso, getProgreso,
} from '../services/challengeService';
import { registrarActividad } from '../services/dashboardService';
import { ContentCard } from '../components/ui/ContentCard';
import { Badge }       from '../components/ui/Badge';
import { Spinner }     from '../components/ui/Spinner';
import { AlertBox }    from '../components/ui/AlertBox';

const EMPTY_FORM = { nombre: '', descripcion: '', duracionDias: 30, dificultad: 'MEDIA' };

const DIF_STYLE = {
  FACIL:   { bg: 'rgba(60,245,180,0.1)',  border: 'rgba(60,245,180,0.3)',  color: 'var(--teal)',   label: '🟢 Fácil',   xp: 50  },
  MEDIA:   { bg: 'rgba(212,245,60,0.1)',  border: 'rgba(212,245,60,0.3)',  color: 'var(--accent)', label: '🟡 Media',   xp: 150 },
  DIFICIL: { bg: 'rgba(255,77,106,0.1)',  border: 'rgba(255,77,106,0.3)',  color: 'var(--danger)', label: '🔴 Difícil', xp: 300 },
};

const fechaHoy = () => new Date().toISOString().slice(0, 10);

export function Retos() {
  const { user } = useAuth();

  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState('success');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [creating,   setCreating]   = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [joining,    setJoining]    = useState(null);
  const [leaving,    setLeaving]    = useState(null);
  const [panel,      setPanel]      = useState(null);
  const [progresos,  setProgresos]  = useState({});
  const [proTexto,   setProTexto]   = useState('');
  const [savingPro,  setSavingPro]  = useState(false);
  const [loadingPro, setLoadingPro] = useState(false);

  const showMsg = (t, type = 'success') => {
    setMsg(t); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const load = useCallback(async () => {
    try {
      const data = await getChallenges();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Retos] Error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.nombre.trim()) { setFormErr('El nombre es obligatorio.'); return; }
    setCreating(true);
    try {
      await createChallenge({ ...form, creatorId: user.id });
      showMsg('✅ Reto creado.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setFormErr(err.message || 'Error al crear.');
    } finally {
      setCreating(false);
    }
  };

  const handleUnirse = async (id) => {
    if (!user?.id || joining) return;
    setJoining(id);
    try {
      await unirseChallenge(id, user.id);
      showMsg('✅ ¡Te uniste! Medalla otorgada (si es tu primer reto).');
      await load();
    } catch (err) {
      showMsg(err.message || 'Error al unirse.', 'error');
    } finally {
      setJoining(null);
    }
  };

  const handleSalir = async (c) => {
    if (!window.confirm(`¿Salir del reto "${c.nombre}"?\n\nPerderás la medalla asociada.`)) return;
    setLeaving(c.id);
    try {
      const res = await salirChallenge(c.id, user.id);
      showMsg(res.message || '✅ Saliste del reto.');
      if (panel?.id === c.id) setPanel(null);
      setProgresos(p => { const n = { ...p }; delete n[c.id]; return n; });
      await load();
    } catch (err) {
      showMsg(err.message || 'Error al salir.', 'error');
    } finally {
      setLeaving(null);
    }
  };

  const loadProgreso = useCallback(async (challengeId) => {
    if (!user?.id) return;
    setLoadingPro(true);
    try {
      const data = await getProgreso(challengeId, user.id);
      setProgresos(p => ({
        ...p,
        [challengeId]: typeof data === 'object' && data !== null ? data : {},
      }));
    } catch (err) {
      console.error('[Retos] Error cargando progreso:', err.message);
      setProgresos(p => ({ ...p, [challengeId]: {} }));
    } finally {
      setLoadingPro(false);
    }
  }, [user?.id]);

  const handleOpenPanel = async (c, tab = 'historial') => {
    if (panel?.id === c.id && panel?.tab === tab) { setPanel(null); return; }
    setPanel({ id: c.id, tab });
    setProTexto('');
    await loadProgreso(c.id);
  };

  const handleSavePro = async (c) => {
    if (!proTexto.trim()) { showMsg('Escribe tu progreso.', 'error'); return; }
    setSavingPro(true);
    try {
      const res = await registrarProgreso(c.id, user.id, proTexto.trim());
      setProgresos(p => ({
        ...p,
        [c.id]: { ...(p[c.id] || {}), [res.fecha]: proTexto.trim() },
      }));
      setProTexto('');
      await registrarActividad(user.id).catch(() => {});
      if (res.completado) {
        showMsg(`🏆 ¡Reto completado! Ganaste ${res.xpGanado} XP y una medalla.`);
      } else {
        showMsg(`✅ Progreso guardado. Día ${res.diasCompletados}/${res.diasRequeridos} (${res.porcentaje}%)`);
      }
      setPanel({ id: c.id, tab: 'historial' });
    } catch (err) {
      showMsg(err.message || 'Error al guardar.', 'error');
    } finally {
      setSavingPro(false);
    }
  };

  const unidos      = challenges.filter(c => c.participantes?.includes(user?.id));
  const disponibles = challenges.filter(c => !c.participantes?.includes(user?.id));

  if (loading) return <div className="page"><Spinner text="Cargando retos…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Retos</div>
          <div className="ps">1 avance por día · el reto requiere N días distintos</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge>⚔️ {unidos.length} ACTIVOS</Badge>
          <button className="btn-main"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.82rem',
              background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            onClick={load}>↻ Actualizar</button>
          <button className="btn-main"
            style={{ width: 'auto', padding: '9px 18px', fontSize: '0.85rem' }}
            onClick={() => { setShowForm(s => !s); setFormErr(''); }}>
            {showForm ? '✕ Cancelar' : '+ Crear reto'}
          </button>
        </div>
      </div>

      {msg && <AlertBox type={msgType === 'error' ? 'error' : 'success'} message={msg} />}

      {showForm && (
        <ContentCard title="Nuevo reto" icon="➕" style={{ marginBottom: 14 }}>
          <form onSubmit={handleCreate}>
            {formErr && <AlertBox type="error" message={formErr} />}
            <div className="fg">
              <label>Nombre <span className="req">*</span></label>
              <input type="text" placeholder="30 días corriendo"
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                disabled={creating} />
            </div>
            <div className="fg">
              <label>Descripción</label>
              <input type="text" placeholder="Descripción del reto"
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                disabled={creating} />
            </div>
            <div className="form-grid-2">
              <div className="fg">
                <label>Duración (días) <span className="req">*</span></label>
                <input type="number" min="1" max="365"
                  value={form.duracionDias}
                  onChange={e => setForm(p => ({ ...p, duracionDias: +e.target.value }))}
                  disabled={creating} />
              </div>
              <div className="fg">
                <label>Dificultad <span className="req">*</span></label>
                <select value={form.dificultad}
                  onChange={e => setForm(p => ({ ...p, dificultad: e.target.value }))}
                  disabled={creating}
                  style={{
                    width: '100%', background: 'var(--surface)',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    padding: '13px 15px', color: 'var(--text)',
                    fontFamily: 'DM Sans,sans-serif', fontSize: '0.92rem', outline: 'none',
                  }}>
                  <option value="FACIL">🟢 Fácil — 50 XP</option>
                  <option value="MEDIA">🟡 Media — 150 XP</option>
                  <option value="DIFICIL">🔴 Difícil — 300 XP</option>
                </select>
              </div>
            </div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 9, padding: '10px 14px', marginBottom: 14,
              fontSize: '0.82rem', color: 'var(--muted)',
            }}>
              ⚡ Recompensa: <strong style={{ color: 'var(--accent)' }}>
                {DIF_STYLE[form.dificultad]?.xp ?? 150} XP
              </strong>
              {' '}· Requiere marcar avance <strong style={{ color: 'var(--text)' }}>
                {form.duracionDias} días distintos
              </strong>.
            </div>
            <button className="btn-main" type="submit" disabled={creating} style={{ maxWidth: 180 }}>
              {creating ? <><span className="spin-anim">⟳</span> Creando…</> : 'Crear reto'}
            </button>
          </form>
        </ContentCard>
      )}

      {unidos.length > 0 && (
        <ContentCard title="Retos en los que participo" icon="🔥" style={{ marginBottom: 14 }}>
          {unidos.map(c => {
            const prog       = progresos[c.id] ?? (c.progresoDiario?.[user.id] || {});
            const diasComp   = Object.keys(prog).length;
            const pct        = Math.min(100, Math.round((diasComp / Math.max(c.duracionDias, 1)) * 100));
            const dif        = DIF_STYLE[c.dificultad] || DIF_STYLE.MEDIA;
            const yaHoy      = Boolean(prog[fechaHoy()]);
            const completado = diasComp >= c.duracionDias;

            return (
              <div key={c.id}>
                <div className="ch">
                  <div className="ch-ico">⚔️</div>
                  <div className="ch-inf">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className="ch-name" style={{ margin: 0 }}>{c.nombre}</span>
                      <span style={{
                        background: dif.bg, border: `1px solid ${dif.border}`,
                        color: dif.color, borderRadius: 6, padding: '2px 8px',
                        fontSize: '0.65rem', fontWeight: 800, flexShrink: 0,
                      }}>{dif.label}</span>
                      {completado && (
                        <span style={{
                          background: 'rgba(60,245,180,0.1)', border: '1px solid rgba(60,245,180,0.3)',
                          color: 'var(--teal)', borderRadius: 6, padding: '2px 8px',
                          fontSize: '0.65rem', fontWeight: 800, flexShrink: 0,
                        }}>✅ COMPLETADO</span>
                      )}
                    </div>
                    <div className="ch-meta">
                      {c.participantes?.length} participantes · {c.duracionDias} días · ⚡ {c.xpRecompensa} XP
                    </div>
                    {c.descripcion && <div className="ch-meta">{c.descripcion}</div>}
                    <div style={{ marginTop: 8 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.68rem', fontFamily: 'Space Mono,monospace',
                        color: 'var(--muted)', marginBottom: 3,
                      }}>
                        <span>{diasComp}/{c.duracionDias} días completados</span>
                        <span style={{ color: completado ? 'var(--teal)' : 'var(--accent)' }}>{pct}%</span>
                      </div>
                      <div className="pb"><div className="pf" style={{ width: `${pct}%` }} /></div>
                    </div>
                    {yaHoy && !completado && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--teal)', marginTop: 4, fontFamily: 'Space Mono,monospace' }}>
                        ✅ Ya marcaste avance hoy
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', flexShrink: 0 }}>
                    {!completado && (
                      <button onClick={() => handleOpenPanel(c, 'progreso')} style={{
                        background: yaHoy ? 'rgba(60,245,180,0.08)' : 'rgba(212,245,60,0.1)',
                        border: `1px solid ${yaHoy ? 'rgba(60,245,180,0.25)' : 'rgba(212,245,60,0.25)'}`,
                        borderRadius: 7, padding: '5px 11px', fontSize: '0.68rem',
                        color: yaHoy ? 'var(--teal)' : 'var(--accent)',
                        cursor: 'pointer', fontWeight: 700, fontFamily: 'Space Mono,monospace',
                      }}>
                        {yaHoy ? '✏️ Editar hoy' : '📝 Marcar avance'}
                      </button>
                    )}
                    <button onClick={() => handleOpenPanel(c, 'historial')} style={{
                      background: 'rgba(60,245,180,0.07)', border: '1px solid rgba(60,245,180,0.2)',
                      borderRadius: 7, padding: '5px 11px', fontSize: '0.68rem',
                      color: 'var(--teal)', cursor: 'pointer', fontWeight: 700, fontFamily: 'Space Mono,monospace',
                    }}>📋 Ver historial</button>
                    <button onClick={() => handleSalir(c)} disabled={leaving === c.id} style={{
                      background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.25)',
                      borderRadius: 7, padding: '5px 11px', fontSize: '0.68rem',
                      color: 'var(--danger)', cursor: leaving === c.id ? 'wait' : 'pointer',
                      fontWeight: 700, fontFamily: 'Space Mono,monospace', opacity: leaving === c.id ? 0.6 : 1,
                    }}>
                      {leaving === c.id ? '…' : '🚪 Salir'}
                    </button>
                  </div>
                </div>

                {panel?.id === c.id && (
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 11, padding: 16, marginBottom: 8,
                  }}>
                    {panel.tab === 'progreso' && !completado && (
                      <>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6 }}>
                          {yaHoy
                            ? <>✏️ Editar avance de hoy (<strong style={{ color: 'var(--accent)' }}>{fechaHoy()}</strong>):</>
                            : <>📝 Registrar avance de hoy (<strong style={{ color: 'var(--accent)' }}>{fechaHoy()}</strong>):</>
                          }
                        </p>
                        <p style={{
                          fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 10,
                          background: 'rgba(212,245,60,0.06)', border: '1px solid rgba(212,245,60,0.15)',
                          borderRadius: 7, padding: '8px 10px',
                        }}>
                          ⚠️ Solo puedes registrar <strong style={{ color: 'var(--text)' }}>1 entrada por día real</strong>.
                          Necesitas <strong style={{ color: 'var(--text)' }}>{c.duracionDias} días distintos</strong> para completar el reto.
                          {yaHoy && <><br />Puedes editar la entrada de hoy.</>}
                        </p>
                        {yaHoy && (progresos[c.id] || {})[fechaHoy()] && (
                          <div style={{
                            background: 'rgba(60,245,180,0.07)', border: '1px solid rgba(60,245,180,0.2)',
                            borderRadius: 8, padding: '8px 12px', marginBottom: 10,
                            fontSize: '0.78rem', color: 'var(--teal)',
                          }}>
                            Avance actual: <em style={{ color: 'var(--text)' }}>{(progresos[c.id] || {})[fechaHoy()]}</em>
                          </div>
                        )}
                        <textarea
                          style={{
                            width: '100%', minHeight: 80,
                            background: 'var(--card)', border: '1.5px solid var(--border)',
                            borderRadius: 9, padding: '10px 12px', color: 'var(--text)',
                            fontFamily: 'DM Sans,sans-serif', fontSize: '0.88rem',
                            resize: 'vertical', outline: 'none', marginBottom: 10,
                            transition: 'border-color 0.2s',
                          }}
                          placeholder={`Ej: Corrí 5km en 27 min. Día ${diasComp + (yaHoy ? 0 : 1)} de ${c.duracionDias}.`}
                          value={proTexto}
                          onChange={e => setProTexto(e.target.value)}
                          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                          onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button className="btn-main" style={{ maxWidth: 180 }}
                            disabled={savingPro || !proTexto.trim()}
                            onClick={() => handleSavePro(c)}>
                            {savingPro
                              ? <><span className="spin-anim">⟳</span> Guardando…</>
                              : yaHoy ? '✏️ Actualizar' : '💾 Guardar avance'}
                          </button>
                          <button onClick={() => setPanel({ id: c.id, tab: 'historial' })} style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 9, padding: '8px 14px', color: 'var(--muted)',
                            cursor: 'pointer', fontSize: '0.82rem',
                          }}>Ver historial</button>
                        </div>
                      </>
                    )}

                    {panel.tab === 'historial' && (
                      <>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8,
                        }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            Historial de avances — <strong style={{ color: 'var(--text)' }}>{c.nombre}</strong>
                          </p>
                          {!completado && (
                            <button onClick={() => setPanel({ id: c.id, tab: 'progreso' })} style={{
                              background: 'rgba(212,245,60,0.1)', border: '1px solid rgba(212,245,60,0.25)',
                              borderRadius: 7, padding: '4px 10px', fontSize: '0.68rem',
                              color: 'var(--accent)', cursor: 'pointer', fontWeight: 700,
                              fontFamily: 'Space Mono,monospace',
                            }}>
                              {yaHoy ? '✏️ Editar hoy' : '+ Nuevo avance'}
                            </button>
                          )}
                        </div>
                        {loadingPro && <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Cargando historial…</p>}
                        {!loadingPro && Object.keys(progresos[c.id] || {}).length === 0 && (
                          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                            Sin avances registrados aún. ¡Pulsa "Marcar avance" para empezar!
                          </p>
                        )}
                        {!loadingPro && Object.entries(progresos[c.id] || {})
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([fecha, texto]) => (
                            <div key={fecha} style={{
                              background: 'var(--card)',
                              border: `1px solid ${fecha === fechaHoy() ? 'rgba(212,245,60,0.35)' : 'var(--border)'}`,
                              borderRadius: 9, padding: '12px 14px', marginBottom: 8,
                            }}>
                              <div style={{
                                fontSize: '0.68rem',
                                color: fecha === fechaHoy() ? 'var(--accent)' : 'var(--muted)',
                                fontFamily: 'Space Mono,monospace', marginBottom: 5, fontWeight: 700,
                              }}>
                                {fecha === fechaHoy() ? '📅 HOY — ' : '📅 '}{fecha}
                              </div>
                              <div style={{ fontSize: '0.87rem', lineHeight: 1.5 }}>{texto}</div>
                            </div>
                          ))
                        }
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </ContentCard>
      )}

      <ContentCard title="Disponibles" icon="🎮">
        {disponibles.length === 0 && unidos.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No hay retos. ¡Crea el primero!</p>
        )}
        {disponibles.length === 0 && unidos.length > 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Ya estás en todos los retos disponibles.</p>
        )}
        {disponibles.map(c => {
          const dif = DIF_STYLE[c.dificultad] || DIF_STYLE.MEDIA;
          return (
            <div className="ch" key={c.id}>
              <div className="ch-ico">🏆</div>
              <div className="ch-inf">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="ch-name" style={{ margin: 0 }}>{c.nombre}</span>
                  <span style={{
                    background: dif.bg, border: `1px solid ${dif.border}`,
                    color: dif.color, borderRadius: 6, padding: '2px 8px',
                    fontSize: '0.65rem', fontWeight: 800, flexShrink: 0,
                  }}>{dif.label}</span>
                </div>
                <div className="ch-meta">
                  {c.participantes?.length} participantes · {c.duracionDias} días · ⚡ {c.xpRecompensa} XP
                </div>
                {c.descripcion && <div className="ch-meta">{c.descripcion}</div>}
              </div>
              <button className="ch-xp"
                style={{ cursor: joining === c.id ? 'wait' : 'pointer', border: '1px solid var(--accent)', opacity: joining === c.id ? 0.6 : 1 }}
                onClick={() => handleUnirse(c.id)}
                disabled={!!joining}>
                {joining === c.id ? '…' : 'UNIRSE'}
              </button>
            </div>
          );
        })}
      </ContentCard>
    </div>
  );
}
