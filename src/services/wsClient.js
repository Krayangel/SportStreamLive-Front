// src/services/wsClient.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../config';
import { getToken } from './authService';

let client = null;
// topic -> { stompSub, callbacks: Set<fn> }
const topicMap = {};
const queued   = [];
let ready      = false;

function buildClient() {
  if (client) return client;

  const tok = getToken();

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: tok ? { Authorization: `Bearer ${tok}` } : {},
    reconnectDelay: 5000,

    onConnect: () => {
      ready = true;
      console.log('[WS] Conectado');

      // Re-suscribir topics que tenían callbacks registrados
      Object.entries(topicMap).forEach(([topic, entry]) => {
        if (entry.callbacks.size === 0) return;
        // Si ya hay una sub STOMP activa no duplicar
        if (entry.stompSub) return;
        entry.stompSub = client.subscribe(topic, (msg) => {
          let parsed;
          try { parsed = JSON.parse(msg.body); } catch { parsed = msg.body; }
          topicMap[topic]?.callbacks.forEach(fn => fn(parsed));
        });
      });

      // Despachar mensajes encolados
      queued.splice(0).forEach(({ destination, body }) => {
        client.publish({ destination, body: JSON.stringify(body) });
      });
    },

    onDisconnect: () => {
      ready = false;
      // Marcar subs STOMP como nulas para que onConnect las rehaga
      Object.values(topicMap).forEach(e => { e.stompSub = null; });
      console.log('[WS] Desconectado');
    },

    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame.headers?.message);
    },
  });

  client.activate();
  return client;
}

export function wsSubscribe(topic, callback) {
  if (!topicMap[topic]) topicMap[topic] = { stompSub: null, callbacks: new Set() };
  const entry = topicMap[topic];

  if (entry.callbacks.has(callback)) return () => {};
  entry.callbacks.add(callback);

  const c = buildClient();

  // Si ya conectado y sin sub STOMP para este topic, crearla
  if (c.connected && ready && !entry.stompSub) {
    entry.stompSub = c.subscribe(topic, (msg) => {
      let parsed;
      try { parsed = JSON.parse(msg.body); } catch { parsed = msg.body; }
      topicMap[topic]?.callbacks.forEach(fn => fn(parsed));
    });
  }

  return () => {
    entry.callbacks.delete(callback);
    if (entry.callbacks.size === 0 && entry.stompSub) {
      try { entry.stompSub.unsubscribe(); } catch {}
      entry.stompSub = null;
      delete topicMap[topic];
    }
  };
}

export function wsSend(destination, body) {
  const c = buildClient();
  if (c.connected && ready) {
    c.publish({ destination, body: JSON.stringify(body) });
  } else {
    console.log('[WS] Encolando:', destination);
    queued.push({ destination, body });
  }
}

export function wsInit() { buildClient(); }

export function wsDisconnect() {
  if (client) {
    try { client.deactivate(); } catch {}
    client = null;
    ready  = false;
    Object.keys(topicMap).forEach(k => delete topicMap[k]);
    queued.length = 0;
  }
}