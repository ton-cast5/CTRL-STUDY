import { useEffect, useMemo, useState } from 'react';
import { IconMessage } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { getLastMessagesForRequests } from '../services/messages.service';
import { supabase } from '../lib/supabase';
import type { ChatMessage, TutorRequest } from '../types/database';
import './Screens.css';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Mensajes() {
  const { role, profile, requests, setActiveRequestId } = useApp();
  const [previews, setPreviews] = useState<Map<string, ChatMessage>>(new Map());

  const accepted = useMemo(
    () => requests.filter((r) => r.status === 'aceptada'),
    [requests],
  );

  useEffect(() => {
    const load = () => {
      if (accepted.length === 0) {
        setPreviews(new Map());
        return;
      }
      getLastMessagesForRequests(accepted.map((r) => r.id))
        .then(setPreviews)
        .catch(() => undefined);
    };
    load();

    if (!profile) return;
    const channel = supabase
      .channel(`inbox-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [accepted, profile]);

  const labelFor = (req: TutorRequest) =>
    role === 'student' ? req.tutorName : req.studentName;

  const subtitleFor = (req: TutorRequest) =>
    role === 'student'
      ? `Tutor · ${req.subject}`
      : `${req.studentName} · ${req.subject}`;

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Comunicación</p>
          <h2>Mis mensajes</h2>
          <p className="screen-desc">
            {role === 'student'
              ? 'Aquí ves lo que te escriben tus tutores y puedes responder'
              : 'Conversaciones con alumnos que aceptaste'}
          </p>
        </div>
        <div className="header-icon">
          <IconMessage size={28} />
        </div>
      </header>

      <ul className="messages-inbox stagger-1">
        {accepted.map((req) => {
          const last = previews.get(req.id);
          const unread =
            last != null && last.toProfileId === profile?.id && last.fromProfileId !== profile?.id;

          return (
            <li key={req.id} className="message-thread-card">
              <div className="message-thread-top">
                <span className="mini-avatar">
                  {labelFor(req)
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="message-thread-info">
                  <strong>{labelFor(req)}</strong>
                  <span>{subtitleFor(req)}</span>
                  {last ? (
                    <p className={`message-preview ${unread ? 'unread' : ''}`}>
                      {last.fromProfileId === profile?.id ? 'Tú: ' : ''}
                      {last.body}
                    </p>
                  ) : (
                    <p className="message-preview muted">Sin mensajes aún — escribe primero</p>
                  )}
                </div>
                {last && <time className="message-time">{formatTime(last.createdAt)}</time>}
              </div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => setActiveRequestId(req.id)}
              >
                {unread ? 'Ver mensaje nuevo' : 'Abrir chat'}
              </button>
            </li>
          );
        })}
      </ul>

      {accepted.length === 0 && (
        <p className="empty-state">
          {role === 'student'
            ? 'Cuando un tutor acepte tu solicitud, la conversación aparecerá aquí.'
            : 'Acepta una solicitud de asesoría para habilitar el chat.'}
        </p>
      )}
    </div>
  );
}
