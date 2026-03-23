// src/pages/LiveRoom.jsx
// Soporte para N viewers simultáneos via WebRTC.
// Cada viewer tiene su propio RTCPeerConnection con el dueño.
// El dueño crea un OFFER dirigido a cada viewer que hace JOIN.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth }      from '../context/AuthContext';
import { useStream }    from '../hooks/useStream';
import { ChatBox }      from '../components/ui/ChatBox';
import { AlertBox }     from '../components/ui/AlertBox';
import { Spinner }      from '../components/ui/Spinner';
import { claimBadge }   from '../services/badgeService';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { WS_TOPICS, WS_APP }   from '../config';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function LiveRoom({ event, onExit }) {
  const { user }  = useAuth();
  const streamId  = `event-${event.id}`;
  const isOwner   = event.creatorId === user?.id;

  const { status, start, stop } = useStream(streamId, user, isOwner);

  // Dueño: stream local
  const localVideoRef  = useRef(null);
  const localStreamRef = useRef(null);
  // Dueño: Map<viewerUserId, RTCPeerConnection>
  const pcsRef         = useRef({});

  // Viewer: conexión con el dueño
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);

  const [camReady,     setCamReady]     = useState(false);
  const [camError,     setCamError]     = useState('');
  const [viewerCount,  setViewerCount]  = useState(0);
  const [rtcConnected, setRtcConnected] = useState(false);
  const [badgeClaimed, setBadgeClaimed] = useState(false);
  const [badgeMsg,     setBadgeMsg]     = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  const isLive = status === 'STARTED' || status === 'ALIVE';

  // Limpiar al salir
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcRef.current?.close();
      // Notificar al back que el viewer salió
      if (!isOwner) {
        wsSend(WS_APP.WEBRTC(streamId), { type:'LEAVE', streamId, senderUserId: user.id });
      }
    };
  }, [streamId, isOwner, user.id]);

  // ── DUEÑO: crear PC para un viewer específico ────────────
  const createPeerForViewer = useCallback(async (viewerId) => {
    if (pcsRef.current[viewerId]) {
      pcsRef.current[viewerId].close();
    }
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcsRef.current[viewerId] = pc;

    // Agregar tracks del stream local
    localStreamRef.current?.getTracks().forEach(t =>
      pc.addTrack(t, localStreamRef.current)
    );

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        wsSend(WS_APP.WEBRTC(streamId), {
          type: 'ICE', streamId,
          senderUserId: user.id,
          targetUserId: viewerId,       // ← dirigido solo a ese viewer
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setViewerCount(v => v + 1);
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        delete pcsRef.current[viewerId];
        setViewerCount(v => Math.max(0, v - 1));
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    wsSend(WS_APP.WEBRTC(streamId), {
      type: 'OFFER', streamId,
      senderUserId: user.id,
      targetUserId: viewerId,           // ← solo ese viewer responde
      sdp: offer.sdp,
    });
  }, [streamId, user.id]);

  // ── VIEWER: crear PC para conectarse al dueño ────────────
  const initViewerPC = useCallback(() => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setRtcConnected(true);
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        wsSend(WS_APP.WEBRTC(streamId), {
          type: 'ICE', streamId,
          senderUserId: user.id,
          targetUserId: event.creatorId, // ← dirigido al dueño
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setRtcConnected(pc.connectionState === 'connected');
    };
  }, [streamId, user.id, event.creatorId]);

  // ── Escuchar señales WebRTC ──────────────────────────────
  useEffect(() => {
    if (!streamId || !user) return;

    const unsub = wsSubscribe(WS_TOPICS.WEBRTC(streamId), async (signal) => {
      // Ignorar mensajes propios
      if (signal.senderUserId === user.id) return;
      // Si tiene targetUserId y no es para nosotros, ignorar
      if (signal.targetUserId && signal.targetUserId !== user.id) return;

      if (isOwner) {
        // ── Lógica del DUEÑO ──
        if (signal.type === 'JOIN') {
          // Un viewer se unió → crear conexión con él
          await createPeerForViewer(signal.senderUserId);
        }
        if (signal.type === 'ANSWER') {
          const pc = pcsRef.current[signal.senderUserId];
          if (pc) await pc.setRemoteDescription({ type:'answer', sdp: signal.sdp });
        }
        if (signal.type === 'ICE') {
          const pc = pcsRef.current[signal.senderUserId];
          if (pc) {
            try { await pc.addIceCandidate({
              candidate: signal.candidate,
              sdpMid: signal.sdpMid,
              sdpMLineIndex: signal.sdpMLineIndex,
            }); } catch {}
          }
        }
      } else {
        // ── Lógica del VIEWER ──
        if (signal.type === 'OFFER') {
          initViewerPC();
          const pc = pcRef.current;
          await pc.setRemoteDescription({ type:'offer', sdp: signal.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsSend(WS_APP.WEBRTC(streamId), {
            type: 'ANSWER', streamId,
            senderUserId: user.id,
            targetUserId: signal.senderUserId,
            sdp: answer.sdp,
          });
        }
        if (signal.type === 'ICE') {
          const pc = pcRef.current;
          if (pc) {
            try { await pc.addIceCandidate({
              candidate: signal.candidate,
              sdpMid: signal.sdpMid,
              sdpMLineIndex: signal.sdpMLineIndex,
            }); } catch {}
          }
        }
      }
    });

    return unsub;
  }, [streamId, user, isOwner, createPeerForViewer, initViewerPC]);

  // Viewer: notificar JOIN cuando el stream esté activo
  useEffect(() => {
    if (!isOwner && isLive) {
      initViewerPC();
      wsSend(WS_APP.WEBRTC(streamId), {
        type: 'JOIN', streamId, senderUserId: user.id,
      });
    }
  }, [isLive, isOwner, streamId, user.id, initViewerPC]);

  // ── Dueño: pedir cámara ──────────────────────────────────
  const requestCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
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

  // Cuando cám lista → iniciar stream
  useEffect(() => {
    if (camReady && isOwner && status === 'IDLE') {
      start();
    }
  }, [camReady, isOwner, status, start]);

  // ── Dueño: detener ───────────────────────────────────────
  const handleStop = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(pcsRef.current).forEach(pc => pc.close());
    pcsRef.current = {};
    setCamReady(false);
    setViewerCount(0);
    await stop();
  }, [stop]);

  // ── Medalla especial ─────────────────────────────────────
  const handleClaimBadge = useCallback(async () => {
    if (!user || claimLoading) return;
    setClaimLoading(true);
    try {
      const res = await claimBadge(
        `evento-${event.id}-primero`, user.id, 'ESPECTADOR_VIP', 'Espectador VIP'
      );
      setBadgeMsg(res.claimed
        ? '🏅 ¡Felicidades! La medalla es tuya.'
        : '😔 La medalla ya fue reclamada por otro espectador.');
      setBadgeClaimed(true);
    } catch {
      setBadgeMsg('Error al reclamar la medalla.');
    } finally {
      setClaimLoading(false);
    }
  }, [user, event.id, claimLoading]);

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="page">
      <div className="ph">
        <div>
          <div className="pt">
            {isLive
              ? <><span className="t-dot active" style={{ display:'inline-block', marginRight:8 }} />EN VIVO</>
              : status === 'ENDED' ? '⏹ Stream finalizado'
              : isOwner ? '🎙️ Sala del streamer' : '📺 Sala del evento'
            }
          </div>
          <div className="ps">{event.titulo}</div>
        </div>
        <button className="btn-logout" onClick={onExit} style={{ marginLeft:'auto' }}>← Volver</button>
      </div>

      {camError && <AlertBox type="error" message={camError} />}

      {/* Layout video + chat */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14,
        alignItems:'start', marginBottom:14 }}>

        <div>
          {/* Pantalla */}
          <div className="live-screen" style={{ position:'relative' }}>
            {isOwner && (
              <video ref={localVideoRef} autoPlay muted playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover',
                  display: camReady ? 'block' : 'none', borderRadius:'var(--r)' }} />
            )}
            {!isOwner && (
              <video ref={remoteVideoRef} autoPlay playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover',
                  display: rtcConnected ? 'block' : 'none', borderRadius:'var(--r)' }} />
            )}
            {((isOwner && !camReady) || (!isOwner && !rtcConnected)) && (
              <div className="live-placeholder">
                {status === 'ENDED'
                  ? <span>⏹ El stream ha finalizado</span>
                  : isOwner
                    ? <span style={{ color:'var(--muted)', fontSize:'0.9rem', textAlign:'center', padding:'0 20px' }}>
                        Pulsa <strong style={{ color:'var(--accent)' }}>Iniciar Live</strong> para activar tu cámara
                      </span>
                    : <div style={{ textAlign:'center' }}>
                        <Spinner text="" />
                        <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:8 }}>
                          Esperando video del streamer…
                        </p>
                        <p style={{ color:'var(--muted)', fontSize:'0.75rem', marginTop:4 }}>
                          El chat ya está activo ➡
                        </p>
                      </div>
                }
              </div>
            )}
            {isLive && (camReady || rtcConnected) && (
              <div style={{ position:'absolute', top:12, left:12,
                background:'rgba(255,77,106,0.9)', color:'#fff',
                borderRadius:8, padding:'4px 12px', fontSize:'0.72rem',
                fontWeight:800, fontFamily:'Space Mono,monospace', letterSpacing:1 }}>
                🔴 EN VIVO
              </div>
            )}
            {isOwner && isLive && viewerCount > 0 && (
              <div style={{ position:'absolute', top:12, right:12,
                background:'rgba(60,245,180,0.85)', color:'#060a0f',
                borderRadius:8, padding:'4px 12px', fontSize:'0.72rem',
                fontWeight:800, fontFamily:'Space Mono,monospace' }}>
                👥 {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Controles dueño */}
          {isOwner && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)',
              borderRadius:'var(--r)', padding:16, marginTop:10 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                {!camReady && status !== 'ENDED' && (
                  <button className="btn-main" style={{ maxWidth:200 }} onClick={requestCamera}>
                    🎙️ Iniciar Live
                  </button>
                )}
                {camReady && isLive && (
                  <button className="btn-main"
                    style={{ maxWidth:200, background:'var(--danger)', color:'#fff' }}
                    onClick={handleStop}>
                    ⏹ Detener Live
                  </button>
                )}
              </div>
              <p style={{ fontSize:'0.73rem', color:'var(--muted)', marginTop:8 }}>
                Solo tú puedes iniciar y detener este live. Múltiples viewers pueden conectarse simultáneamente.
              </p>
            </div>
          )}

          {/* Medalla especial viewer */}
          {!isOwner && !badgeClaimed && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)',
              borderRadius:'var(--r)', padding:16, marginTop:10 }}>
              <p style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:10 }}>
                🏅 <strong style={{ color:'var(--text)' }}>Medalla única:</strong> solo UN espectador puede reclamarla. ¡Sé el primero!
              </p>
              <button className="btn-main" style={{ maxWidth:220 }}
                onClick={handleClaimBadge} disabled={claimLoading}>
                {claimLoading
                  ? <><span className="spin-anim">⟳</span> Reclamando…</>
                  : '🏅 Atrapar medalla'}
              </button>
            </div>
          )}

          {badgeMsg && (
            <AlertBox type={badgeMsg.includes('Felicidades') ? 'success' : 'error'}
              message={badgeMsg} />
          )}
        </div>

        {/* Chat siempre visible */}
        <ChatBox roomId={streamId} />
      </div>
    </div>
  );
}
