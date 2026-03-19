// src/components/ui/ChatBox.jsx
// Chat en vivo usando STOMP. Se usa dentro de LiveRoom.
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from './Spinner';

export function ChatBox({ roomId }) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChat(roomId, user);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll al último mensaje
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
      </div>

      <div className="chatbox-msgs">
        {loading && <Spinner text="Cargando historial…" />}
        {messages.map((m, i) => (
          <div
            key={m.id || i}
            className={`chat-msg ${m.sender === user?.username ? 'mine' : ''}`}
          >
            <span className="chat-sender">{m.sender}</span>
            <span className="chat-content">{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chatbox-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={300}
        />
        <button type="submit" className="btn-send" disabled={!text.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}