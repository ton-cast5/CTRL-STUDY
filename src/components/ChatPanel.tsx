import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconMessage, IconX } from './Icons';

export function ChatPanel() {
  const {
    activeRequestId,
    requests,
    messages,
    profile,
    role,
    sendChatMessage,
    closeChat,
  } = useApp();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const request = useMemo(
    () => requests.find((r) => r.id === activeRequestId) ?? null,
    [requests, activeRequestId],
  );

  const chatTitle =
    role === 'student'
      ? request?.tutorName ?? 'Tutor'
      : request?.studentName ?? 'Alumno';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRequestId]);

  if (!activeRequestId || !request) return null;

  return (
    <div className="chat-overlay" onClick={closeChat} role="presentation">
      <div className="chat-panel" onClick={(e) => e.stopPropagation()}>
        <header className="chat-header">
          <div>
            <p className="screen-eyebrow">Mensajería</p>
            <h3>
              <IconMessage size={16} /> Chat con {chatTitle}
            </h3>
            <p className="chat-subtitle">{request.subject}</p>
          </div>
          <button type="button" className="btn-icon-msg" onClick={closeChat}>
            <IconX size={16} />
          </button>
        </header>

        <div className="chat-messages">
          {messages.map((m) => {
            const mine = m.fromProfileId === profile?.id;
            return (
              <div key={m.id} className={`chat-bubble-wrap ${mine ? 'me' : 'other'}`}>
                {!mine && (
                  <span className="chat-sender">
                    {role === 'student' ? request.tutorName : request.studentName}
                  </span>
                )}
                <div className={`chat-bubble ${mine ? 'me' : 'other'}`}>{m.body}</div>
                <time className="chat-time">
                  {new Date(m.createdAt).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="empty-state">Sin mensajes aún. Escribe para iniciar la conversación.</p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="chat-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            setSending(true);
            try {
              await sendChatMessage(request, text);
              setText('');
            } finally {
              setSending(false);
            }
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Escribe a ${chatTitle}...`}
          />
          <button type="submit" className="btn-primary btn-sm" disabled={sending || !text.trim()}>
            {sending ? '...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
