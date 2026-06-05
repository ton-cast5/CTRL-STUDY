import { useEffect, useMemo, useState } from 'react';
import { IconMessage } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { getLastMessagesForRequests, getUnreadCountsByRequest } from '../services/messages.service';
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
  const { role, profile, requests, openChat, refreshUnreadCount } = useApp();
  const [previews, setPreviews] = useState<Map<string, ChatMessage>>(new Map());
  const [unreadByRequest, setUnreadByRequest] = useState<Map<string, number>>(new Map());

  const accepted = useMemo(
    () => requests.filter((r) => r.status === 'aceptada'),
    [requests],
  );

  useEffect(() => {
    const load = async () => {
      if (accepted.length === 0) {
        setPreviews(new Map());
        setUnreadByRequest(new Map());
        return;
      }
      const ids = accepted.map((r) => r.id);
      try {
        const [lastMessages, unreadCounts] = await Promise.all([
          getLastMessagesForRequests(ids),
          profile ? getUnreadCountsByRequest(profile.id, ids) : Promise.resolve(new Map()),
        ]);
        setPreviews(lastMessages);
        setUnreadByRequest(unreadCounts);
      } catch {
        /* ignore */
      }
    };
    load();

    if (!profile) return;
    const channel = supabase
      .channel(`inbox-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        load();
        refreshUnreadCount().catch(() => undefined);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [accepted, profile, refreshUnreadCount]);

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
          const unreadCount = unreadByRequest.get(req.id) ?? 0;
          const hasUnread = unreadCount > 0;

          return (
            <li key={req.id} className={`message-thread-card ${hasUnread ? 'has-unread' : ''}`}>
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
                  <div className="message-thread-title-row">
                    <strong>{labelFor(req)}</strong>
                    {hasUnread && (
                      <span className="thread-unread-badge" aria-label={`${unreadCount} no leídos`}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span>{subtitleFor(req)}</span>
                  {last ? (
                    <p className={`message-preview ${hasUnread ? 'unread' : ''}`}>
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
                onClick={() => openChat(req.id)}
              >
                {hasUnread
                  ? `Ver ${unreadCount} mensaje${unreadCount === 1 ? '' : 's'} nuevo${unreadCount === 1 ? '' : 's'}`
                  : 'Abrir chat'}
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
