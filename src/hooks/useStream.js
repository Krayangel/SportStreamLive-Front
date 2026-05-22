// src/hooks/useStream.js
import { useState, useEffect, useCallback } from 'react';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { startStream, stopStream, isStreamActive } from '../services/streamService';
import { WS_TOPICS, WS_APP } from '../config';

// ownerId: userId del creador del stream (para que admin pueda detenerlo)
export function useStream(streamId, user, isOwner, ownerId) {
  const [status, setStatus] = useState('IDLE');

  // Verificar estado actual al montar — cubre el caso de viewer/admin
  // que entra cuando el stream ya está activo (el evento STARTED ya fue emitido)
  useEffect(() => {
    if (!streamId) return;
    isStreamActive(streamId)
      .then(r => { if (r.active) setStatus(s => s === 'IDLE' ? 'STARTED' : s); })
      .catch(() => {});
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;
    const unsub = wsSubscribe(WS_TOPICS.STREAM(streamId), (event) => {
      // El back emite StreamEvent con campo "tipo" (STARTED, ALIVE, ENDED)
      const tipo = event?.tipo || event?.type || '';
      if (tipo === 'STARTED') setStatus('STARTED');
      if (tipo === 'ALIVE')   setStatus('ALIVE');
      if (tipo === 'ENDED')   setStatus('ENDED');
    });
    return unsub;
  }, [streamId]);

  const start = useCallback(async () => {
    if (!user?.id || !streamId) return;
    try {
      await startStream(streamId, user.id);
      setStatus('STARTED');
      // Pequeño delay para dejar que el back registre la sesión
      setTimeout(() => {
        wsSend(WS_APP.STREAM_START(streamId), {
          streamId,
          userId: user.id,
          tipo: 'START',
        });
      }, 600);
    } catch (err) {
      console.error('[useStream] start error:', err.message);
    }
  }, [streamId, user]);

  const stop = useCallback(async () => {
    // ownerId: cuando el admin detiene un live, el backend valida que el userId
    // coincida con el creador del stream → usar ownerId en vez del user.id del admin
    const stopUserId = ownerId ?? user?.id;
    if (!stopUserId || !streamId) return;
    try {
      await stopStream(streamId, stopUserId);
      setStatus('ENDED');
      wsSend(WS_APP.STREAM_STOP(streamId), {
        streamId,
        userId: stopUserId,
        tipo: 'STOP',
      });
    } catch (err) {
      console.error('[useStream] stop error:', err.message);
    }
  }, [streamId, user, ownerId]);

  return { status, start, stop };
}
