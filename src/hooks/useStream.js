// src/hooks/useStream.js
import { useState, useEffect, useCallback } from 'react';
import { wsSubscribe, wsSend } from '../services/wsClient';
import { startStream, stopStream } from '../services/streamService';
import { WS_TOPICS, WS_APP } from '../config';

export function useStream(streamId, user, isOwner) {
  const [status, setStatus] = useState('IDLE');

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
    if (!user?.id || !streamId) return;
    try {
      await stopStream(streamId, user.id);
      setStatus('ENDED');
      wsSend(WS_APP.STREAM_STOP(streamId), {
        streamId,
        userId: user.id,
        tipo: 'STOP',
      });
    } catch (err) {
      console.error('[useStream] stop error:', err.message);
    }
  }, [streamId, user]);

  return { status, start, stop };
}
