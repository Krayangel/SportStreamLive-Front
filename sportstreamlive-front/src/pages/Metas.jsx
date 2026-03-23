// src/pages/Metas.jsx
// Metas 100% privadas — solo las ve el dueño, nadie más.
// Son distintas a los retos: son objetivos personales sin duración ni XP.
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth }   from '../context/AuthContext';
import { getMetas, addMeta, deleteMeta } from '../services/dashboardService';
import { ContentCard } from '../components/ui/ContentCard';
import { AlertBox }    from '../components/ui/AlertBox';
import { Spinner }     from '../components/ui/Spinner';

export function Metas() {
  const { user }  = useAuth();
  const [metas,   setMetas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto,   setTexto]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(null);
  const [msg,     setMsg]     = useState('');
  const [msgType, setMsgType] = useState('success');

  const showMsg = (t, type = 'success') => {
    setMsg(t); setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getMetas(user.id);
      setMetas(Array.isArray(data) ? data : []);
    } catch { setMetas([]); }
    finally  { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setSaving(true);
    try {
      await addMeta(user.id, texto.trim());
      setTexto('');
      showMsg('✅ Meta agregada.');
      await load();
    } catch (err) {
      showMsg(err.message || 'Error al agregar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('¿Eliminar esta meta?')) return;
    setDeleting(index);
    try {
      await deleteMeta(user.id, index);
      showMsg('✅ Meta eliminada.');
      await load();
    } catch (err) {
      showMsg(err.message || 'Error al eliminar.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="page"><Spinner text="Cargando metas…" /></div>;

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">Mis Metas</div>
          <div className="ps">Solo tú puedes ver estas metas · 100% privadas</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8,
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:999, padding:'6px 14px', fontSize:'0.7rem',
          fontFamily:'Space Mono,monospace', color:'var(--muted)' }}>
          🔒 privadas
        </div>
      </div>

      {msg && <AlertBox type={msgType === 'error' ? 'error' : 'success'} message={msg} />}

      {/* Agregar meta */}
      <ContentCard title="Agregar meta" icon="➕" style={{ marginBottom:16 }}>
        <p style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:12 }}>
          Las metas son objetivos personales que solo tú puedes ver. Son diferentes a los retos.
        </p>
        <form onSubmit={handleAdd} style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <input
            type="text"
            placeholder="Ej: Correr 5km sin parar…"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            disabled={saving}
            style={{ flex:1, minWidth:200, background:'var(--surface)',
              border:'1.5px solid var(--border)', borderRadius:10,
              padding:'12px 14px', color:'var(--text)',
              fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', outline:'none' }}
            onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
          <button className="btn-main" type="submit"
            disabled={saving || !texto.trim()}
            style={{ width:'auto', padding:'12px 20px' }}>
            {saving ? <><span className="spin-anim">⟳</span> Guardando…</> : '+ Agregar'}
          </button>
        </form>
      </ContentCard>

      {/* Lista de metas */}
      <ContentCard title={`Mis metas (${metas.length})`} icon="🎯">
        {metas.length === 0 && (
          <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>
            Sin metas aún. Agrega tu primera meta arriba.
          </p>
        )}
        {metas.map((m, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:12,
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:11, padding:'14px 16px', marginBottom:8,
            transition:'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,245,60,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ color:'var(--accent)', fontSize:'0.9rem',
              marginTop:1, flexShrink:0, fontWeight:800 }}>
              {i + 1}.
            </span>
            <span style={{ flex:1, fontSize:'0.9rem', lineHeight:1.5 }}>{m}</span>
            <button
              onClick={() => handleDelete(i)}
              disabled={deleting === i}
              style={{ background:'transparent', border:'none',
                color: deleting === i ? 'var(--muted)' : 'var(--danger)',
                cursor: deleting === i ? 'wait' : 'pointer',
                fontSize:'1rem', padding:'2px 4px', flexShrink:0,
                opacity: deleting === i ? 0.5 : 1, transition:'opacity 0.2s' }}
              title="Eliminar meta">
              {deleting === i ? '…' : '✕'}
            </button>
          </div>
        ))}
      </ContentCard>
    </div>
  );
}
