// src/pages/LiveRoom.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useStream }   from '../hooks/useStream';
import { ChatBox }     from '../components/ui/ChatBox';
import { AlertBox }    from '../components/ui/AlertBox';
import { Spinner }     from '../components/ui/Spinner';
import { claimBadge, launchBadge } from '../services/badgeService';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { WS_TOPICS, WS_APP, API_URL } from '../config';

// Fallback ICE config (se sobreescribe con la respuesta del backend)
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  // TURN sobre UDP (puertos 80 y 443)
  { urls: 'turn:openrelay.metered.ca:80',               username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',              username: 'openrelayproject', credential: 'openrelayproject' },
  // TURN sobre TCP — traversa la mayoría de firewalls corporativos/universitarios
  { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp',username: 'openrelayproject', credential: 'openrelayproject' },
];

export function LiveRoom({ event, onExit }) {
  const { user }  = useAuth();
  const streamId  = `event-${event.id}`;
  const isOwner   = event.creatorId === user?.id;
  const isAdmin   = user?.roles?.includes('ROLE_ADMIN');
  const canManage = isOwner || isAdmin; // controles de gestión: badges + detener live

  const { status, start, stop } = useStream(streamId, user, isOwner, event.creatorId);

  // ICE servers — usa DEFAULT_ICE_SERVERS con openrelay.metered.ca
  // (el endpoint del backend aún no está sincronizado con las URLs correctas)
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);

  const localVideoRef  = useRef(null);
  const localStreamRef = useRef(null);
  const pcsRef         = useRef({});   // dueño: { viewerId -> RTCPeerConnection }

  const remoteVideoRef      = useRef(null);
  const pcRef               = useRef(null); // viewer: RTCPeerConnection con el dueño
  const pendingCandidates      = useRef([]);  // viewer: ICE del owner antes de setRemoteDescription (OFFER)
  const pendingCandidatesOwner = useRef({});  // owner:  ICE del viewer antes de setRemoteDescription (ANSWER)

  const [camReady,     setCamReady]     = useState(false);
  const [iceState,     setIceState]     = useState('new'); // visibilidad del estado ICE (viewer)
  const [camError,     setCamError]     = useState('');
  const [viewerCount,  setViewerCount]  = useState(0);
  const [rtcConnected, setRtcConnected] = useState(false);
  const [badgeClaimed, setBadgeClaimed] = useState(false);
  const [badgeMsg,     setBadgeMsg]     = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [activeBadge,  setActiveBadge]  = useState(null);   // medalla lanzada por streamer
  const [launchNombre, setLaunchNombre] = useState('');
  const [launchTipo,   setLaunchTipo]   = useState('MEDALLA_LIVE');
  const [launchLoading,setLaunchLoading]= useState(false);
  const [launchMsg,    setLaunchMsg]    = useState('');

  const isLive = status === 'STARTED' || status === 'ALIVE';

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      Object.values(pcsRef.current).forEach(pc => { try { pc.close(); } catch {} });
      try { pcRef.current?.close(); } catch {}
      if (!isOwner && user?.id) {
        wsSend(WS_APP.WEBRTC(streamId), {
          type: 'LEAVE', streamId, senderUserId: user.id,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── DUEÑO: crear RTCPeerConnection para un viewer ───────
  const createPeerForViewer = useCallback(async (viewerId) => {
    // No crear oferta si la cámara aún no está lista — el retry JOIN del viewer lo reintentará
    if (!localStreamRef.current) return;

    if (pcsRef.current[viewerId]) {
      try { pcsRef.current[viewerId].close(); } catch {}
    }
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current, iceCandidatePoolSize: 10 });
    pcsRef.current[viewerId] = pc;
    pendingCandidatesOwner.current[viewerId] = []; // inicializar cola ICE para este viewer

    localStreamRef.current.getTracks().forEach(t =>
      pc.addTrack(t, localStreamRef.current)
    );

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(`[ICE owner→${viewerId}] ${candidate.type} ${candidate.protocol} ${candidate.address}`);
        wsSend(WS_APP.WEBRTC(streamId), {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ICE owner→${viewerId}] iceConnectionState: ${pc.iceConnectionState}`);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected')     setViewerCount(v => v + 1);
      if (pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed') {
        delete pcsRef.current[viewerId];
        pendingCandidatesOwner.current[viewerId] = [];
        setViewerCount(v => Math.max(0, v - 1));
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    wsSend(WS_APP.WEBRTC(streamId), {
      type: 'OFFER', streamId,
      senderUserId: user.id,
      targetUserId: viewerId,
      sdp: offer.sdp,
    });
  }, [streamId, user?.id]);

  // ── VIEWER: inicializar RTCPeerConnection ────────────────
  const initViewerPC = useCallback(() => {
    // Only keep the existing PC if it's actively connected/connecting.
    // Otherwise close it and start fresh so retried OFFERs work correctly.
    if (pcRef.current) {
      const state = pcRef.current.connectionState;
      if (state === 'connected' || state === 'connecting') return;
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current, iceCandidatePoolSize: 10 });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      const stream = e.streams?.[0];
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
        // Llamar play() explícitamente — autoPlay no siempre dispara al asignar srcObject por JS
        remoteVideoRef.current.play().catch(() => {});
        setRtcConnected(true);
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(`[ICE viewer] ${candidate.type} ${candidate.protocol} ${candidate.address}`);
        wsSend(WS_APP.WEBRTC(streamId), {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ICE viewer] iceConnectionState: ${pc.iceConnectionState}`);
      setIceState(pc.iceConnectionState);
    };

    // Solo usar onconnectionstatechange para detectar desconexión/fallo.
    // NO poner rtcConnected=true aquí — puede dispararse antes de ontrack
    // y mostrar el video negro sin srcObject aún asignado.
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRtcConnected(false);
        setIceState('failed');
      }
    };
  }, [streamId, user?.id, event.creatorId]);

  // ── Escuchar señales WebRTC ──────────────────────────────
  useEffect(() => {
    if (!streamId || !user?.id) return;

    const unsub = wsSubscribe(WS_TOPICS.WEBRTC(streamId), async (signal) => {
      if (!signal || signal.senderUserId === user.id) return;
      if (signal.targetUserId && signal.targetUserId !== user.id) return;

      if (isOwner) {
        if (signal.type === 'JOIN') {
          await createPeerForViewer(signal.senderUserId);
        }
        if (signal.type === 'ANSWER') {
          const pc = pcsRef.current[signal.senderUserId];
          if (pc && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
              // Vaciar candidatos ICE encolados que llegaron antes del ANSWER
              const queued = (pendingCandidatesOwner.current[signal.senderUserId] || []).splice(0);
              for (const c of queued) {
                try { await pc.addIceCandidate(c); } catch (e) { console.warn('[ICE owner flush]', e.message); }
              }
            } catch (e) { console.error('[ANSWER owner]', e.message); }
          }
        }
        if (signal.type === 'ICE') {
          const pc = pcsRef.current[signal.senderUserId];
          if (pc) {
            const cand = { candidate: signal.candidate, sdpMid: signal.sdpMid, sdpMLineIndex: signal.sdpMLineIndex };
            if (!pc.remoteDescription) {
              // ANSWER aún no llegó — encolar para aplicar después
              if (!pendingCandidatesOwner.current[signal.senderUserId]) pendingCandidatesOwner.current[signal.senderUserId] = [];
              pendingCandidatesOwner.current[signal.senderUserId].push(cand);
            } else {
              try { await pc.addIceCandidate(cand); } catch (e) { console.warn('[ICE owner]', e.message); }
            }
          }
        }
      } else {
        if (signal.type === 'OFFER') {
          // Cerrar PC existente antes de procesar cada OFFER — maneja re-negociación
          // cuando el owner reenvía oferta con tracks de cámara tras un intento sin tracks
          if (pcRef.current) {
            try { pcRef.current.close(); } catch {}
            pcRef.current = null;
          }
          pendingCandidates.current = []; // limpiar cola al reiniciar PC
          initViewerPC();
          const pc = pcRef.current;
          try {
            await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
            // Vaciar candidatos ICE encolados que llegaron antes del OFFER
            const queued = pendingCandidates.current.splice(0);
            for (const c of queued) {
              try { await pc.addIceCandidate(c); } catch (e) { console.warn('[ICE viewer flush]', e.message); }
            }
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsSend(WS_APP.WEBRTC(streamId), {
              type: 'ANSWER', streamId,
              senderUserId: user.id,
              targetUserId: signal.senderUserId,
              sdp: answer.sdp,
            });
          } catch (err) {
            console.error('[LiveRoom] OFFER error:', err.message);
          }
        }
        if (signal.type === 'ICE') {
          const pc = pcRef.current;
          if (pc) {
            const cand = { candidate: signal.candidate, sdpMid: signal.sdpMid, sdpMLineIndex: signal.sdpMLineIndex };
            if (!pc.remoteDescription) {
              // OFFER aún no llegó — encolar para aplicar después
              pendingCandidates.current.push(cand);
            } else {
              try { await pc.addIceCandidate(cand); } catch (e) { console.warn('[ICE viewer]', e.message); }
            }
          }
        }
      }
    });

    return unsub;
  }, [streamId, user?.id, isOwner, createPeerForViewer, initViewerPC]);

  // Viewer: JOIN cuando el stream esté activo
  useEffect(() => {
    if (!isOwner && isLive && user?.id) {
      initViewerPC();
      wsSend(WS_APP.WEBRTC(streamId), {
        type: 'JOIN', streamId, senderUserId: user.id,
      });
    }
  }, [isLive, isOwner, streamId, user?.id, initViewerPC]);

  // Viewer: reenviar JOIN cada 6s mientras esté en vivo pero sin video aún
  useEffect(() => {
    if (isOwner || !isLive || !user?.id || rtcConnected) return;
    const id = setInterval(() => {
      wsSend(WS_APP.WEBRTC(streamId), {
        type: 'JOIN', streamId, senderUserId: user.id,
      });
    }, 6000);
    return () => clearInterval(id);
  }, [isOwner, isLive, user?.id, rtcConnected, streamId]);

  // ── Dueño: pedir cámara ──────────────────────────────────
  const requestCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCamReady(true);
    } catch (err) {
      setCamError(
        err.name === 'NotAllowedError'
          ? 'Permiso de cámara/micrófono denegado. Permite el acceso en tu navegador.'
          : err.name === 'NotFoundError'
            ? 'No se encontró cámara o micrófono.'
            : 'Error al acceder a la cámara: ' + err.message
      );
    }
  }, []);

  // Dueño: activar cámara automáticamente al entrar a la sala
  useEffect(() => {
    if (isOwner && status !== 'ENDED') {
      requestCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cám lista → iniciar stream
  useEffect(() => {
    if (camReady && isOwner && status === 'IDLE') {
      start();
    }
  }, [camReady, isOwner, status, start]);

  // ── Dueño: detener ───────────────────────────────────────
  const handleStop = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(pcsRef.current).forEach(pc => { try { pc.close(); } catch {} });
    pcsRef.current = {};
    setCamReady(false);
    setViewerCount(0);
    await stop();
  }, [stop]);

  // ── Escuchar medallas lanzadas (viewer) ─────────────────
  useEffect(() => {
    if (!streamId) return;
    const unsub = wsSubscribe(WS_TOPICS.BADGES(streamId), (msg) => {
      if (msg?.action === 'LAUNCHED') {
        setActiveBadge({ badgeId: msg.badgeId, tipo: msg.tipo, nombre: msg.nombre });
        setBadgeClaimed(false);
        setBadgeMsg('');
      }
    });
    return unsub;
  }, [streamId]);

  // ── Streamer: lanzar medalla ─────────────────────────────
  const handleLaunchBadge = useCallback(async () => {
    if (!user?.id || launchLoading || !launchNombre.trim()) return;
    setLaunchLoading(true);
    setLaunchMsg('');
    try {
      await launchBadge(streamId, launchTipo, launchNombre.trim());
      setLaunchMsg('¡Medalla lanzada! Los espectadores ya pueden atraparla.');
      setLaunchNombre('');
    } catch (err) {
      setLaunchMsg('Error: ' + (err?.message || 'No se pudo lanzar'));
    } finally {
      setLaunchLoading(false);
    }
  }, [user?.id, streamId, launchTipo, launchNombre, launchLoading]);

  // ── Medalla especial ─────────────────────────────────────
  const handleClaimBadge = useCallback(async () => {
    if (!user?.id || claimLoading || !activeBadge) return;
    setClaimLoading(true);
    try {
      const res = await claimBadge(
        activeBadge.badgeId, user.id, activeBadge.tipo, activeBadge.nombre
      );
      setBadgeMsg(res.claimed
        ? '🏅 ¡Felicidades! La medalla es tuya.'
        : '😔 La medalla ya fue reclamada por otro espectador.');
      setBadgeClaimed(true);
      setActiveBadge(null);
    } catch {
      setBadgeMsg('Error al reclamar la medalla.');
      setBadgeClaimed(true);
    } finally {
      setClaimLoading(false);
    }
  }, [user?.id, activeBadge, claimLoading]);

  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">
            {isLive
              ? <><span className="t-dot active" style={{ display: 'inline-block', marginRight: 8 }} />EN VIVO</>
              : status === 'ENDED' ? '⏹ Stream finalizado'
              : isOwner ? '🎙️ Sala del streamer' : '📺 Sala del evento'
            }
          </div>
          <div className="ps">{event.titulo}</div>
        </div>
        <button className="btn-logout" onClick={onExit} style={{ marginLeft: 'auto' }}>← Volver</button>
      </div>

      {camError && <AlertBox type="error" message={camError} />}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14,
        alignItems: 'start', marginBottom: 14,
      }}>
        <div>
          {/* Pantalla */}
          <div className="live-screen" style={{ position: 'relative' }}>
            {isOwner && (
              <video ref={localVideoRef} autoPlay muted playsInline
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: camReady ? 'block' : 'none', borderRadius: 'var(--r)',
                }} />
            )}
            {!isOwner && (
              <video ref={remoteVideoRef} autoPlay playsInline
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: rtcConnected ? 'block' : 'none', borderRadius: 'var(--r)',
                }} />
            )}
            {((isOwner && !camReady) || (!isOwner && !rtcConnected)) && (
              <div className="live-placeholder">
                {status === 'ENDED'
                  ? <span>⏹ El stream ha finalizado</span>
                  : isOwner
                    ? <div style={{ textAlign: 'center' }}>
                        <Spinner text="" />
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 8 }}>Activando cámara…</p>
                      </div>
                    : <div style={{ textAlign: 'center' }}>
                        <Spinner text="" />
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 8 }}>
                          Esperando video del streamer…
                        </p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 4 }}>
                          El chat ya está activo ➡
                        </p>
                        {iceState !== 'new' && iceState !== 'connected' && iceState !== 'completed' && (
                          <p style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'monospace' }}>
                            ICE: {iceState}
                          </p>
                        )}
                      </div>
                }
              </div>
            )}
            {isLive && (camReady || rtcConnected) && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(255,77,106,0.9)', color: '#fff',
                borderRadius: 8, padding: '4px 12px', fontSize: '0.72rem',
                fontWeight: 800, fontFamily: 'Space Mono,monospace', letterSpacing: 1,
              }}>🔴 EN VIVO</div>
            )}
            {canManage && isLive && viewerCount > 0 && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(60,245,180,0.85)', color: '#060a0f',
                borderRadius: 8, padding: '4px 12px', fontSize: '0.72rem',
                fontWeight: 800, fontFamily: 'Space Mono,monospace',
              }}>
                👥 {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Controles dueño */}
          {isOwner && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: 16, marginTop: 10,
            }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {!camReady && status !== 'ENDED' && camError && (
                  <button className="btn-main" style={{ maxWidth: 200 }} onClick={requestCamera}>
                    🔄 Reintentar cámara
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.73rem', color: 'var(--muted)', marginTop: 8 }}>
                Solo tú puedes iniciar y detener este live. Múltiples viewers pueden conectarse simultáneamente.
              </p>
            </div>
          )}

          {/* Detener live — dueño o admin */}
          {canManage && isLive && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: 16, marginTop: 10,
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <button className="btn-main"
                style={{ maxWidth: 200, background: 'var(--danger)', color: '#fff' }}
                onClick={handleStop}>
                ⏹ Detener Live
              </button>
              {isAdmin && !isOwner && (
                <p style={{ fontSize: '0.73rem', color: 'var(--muted)', margin: 0 }}>
                  Como admin puedes detener este live.
                </p>
              )}
            </div>
          )}

          {/* Panel lanzar medalla — dueño o admin durante el live */}
          {canManage && isLive && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: 16, marginTop: 10,
            }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>
                🏅 Lanzar medalla a espectadores
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={launchTipo}
                  onChange={e => setLaunchTipo(e.target.value)}
                  style={{
                    background: 'var(--bg)', color: 'var(--text)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '6px 10px', fontSize: '0.8rem',
                  }}>
                  <option value="MEDALLA_LIVE">🏅 Medalla Live</option>
                  <option value="MEDALLA_VELOCIDAD">⚡ Velocidad</option>
                  <option value="MEDALLA_RESISTENCIA">🔥 Resistencia</option>
                  <option value="MEDALLA_FUERZA">💪 Fuerza</option>
                  <option value="ESPECTADOR_VIP">👑 Espectador VIP</option>
                  <option value="MEDALLA_PRECISION">🎯 Precisión</option>
                  <option value="MEDALLA_LIDERAZGO">🥇 Liderazgo</option>
                  <option value="MEDALLA_ESPIRITU">✨ Espíritu deportivo</option>
                </select>
                <input
                  type="text"
                  placeholder="Nombre de la medalla…"
                  value={launchNombre}
                  onChange={e => setLaunchNombre(e.target.value)}
                  maxLength={40}
                  style={{
                    flex: 1, minWidth: 140,
                    background: 'var(--bg)', color: 'var(--text)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '6px 10px', fontSize: '0.8rem',
                  }}
                />
                <button className="btn-main" style={{ maxWidth: 140 }}
                  onClick={handleLaunchBadge}
                  disabled={launchLoading || !launchNombre.trim()}>
                  {launchLoading ? '⟳ Lanzando…' : '🚀 Lanzar'}
                </button>
              </div>
              {launchMsg && (
                <p style={{
                  fontSize: '0.78rem', marginTop: 8,
                  color: launchMsg.startsWith('Error') ? 'var(--danger)' : 'var(--accent)',
                }}>{launchMsg}</p>
              )}
            </div>
          )}

          {/* Medalla activa para viewer — aparece solo cuando el streamer lanza una */}
          {!isOwner && activeBadge && !badgeClaimed && (
            <div style={{
              background: 'var(--card)', border: '2px solid var(--accent)',
              borderRadius: 'var(--r)', padding: 16, marginTop: 10,
            }}>
              <p style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                🚨 <strong style={{ color: 'var(--accent)' }}>¡Medalla disponible!</strong>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 10 }}>
                <strong style={{ color: 'var(--text)' }}>{activeBadge.nombre}</strong> — ¡Solo uno la puede atrapar!
              </p>
              <button className="btn-main" style={{ maxWidth: 220 }}
                onClick={handleClaimBadge} disabled={claimLoading}>
                {claimLoading
                  ? <><span className="spin-anim">⟳</span> Reclamando…</>
                  : '🏅 ¡Atrapar medalla!'}
              </button>
            </div>
          )}

          {badgeMsg && (
            <AlertBox
              type={badgeMsg.includes('Felicidades') ? 'success' : 'error'}
              message={badgeMsg}
            />
          )}
        </div>

        {/* Chat siempre visible */}
        <ChatBox roomId={streamId} />
      </div>
    </div>
  );
}
