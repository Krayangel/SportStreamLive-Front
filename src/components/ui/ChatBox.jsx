// src/components/ui/ChatBox.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';

export function ChatBox({ roomId }) {
  const { user }  = useAuth();
  const { messages, loading, sendMessage } = useChat(roomId, user);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  return (
    <div className="chatbox">
      <div className="chatbox-head">
        <div className="t-dot active" />
        <span>Chat en vivo</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.5 }}>
          {messages.length} mensajes
        </span>
      </div>

      <div className="chatbox-msgs">
        {loading && (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
            Cargando historial…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
            Sin mensajes aún. ¡Sé el primero en escribir!
          </p>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender === user?.username;
          return (
            <div key={m.id || i} className={`chat-msg ${isMe ? 'mine' : ''}`}>
              <span className="chat-sender">{isMe ? 'Tú' : m.sender}</span>
              <span className="chat-content">{m.content}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chatbox-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={300}
          autoComplete="off"
        />
        <button type="submit" className="btn-send" disabled={!text.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
