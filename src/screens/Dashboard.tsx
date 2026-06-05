import { useMemo, useState } from 'react';
import { subjects, semesters, type Tutor } from '../data/mockData';
import { TutorProfileModal } from '../components/TutorProfileModal';
import { IconSearch, IconFilter, IconStar } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { getTutorBookingState } from '../utils/booking';
import './Screens.css';

export function Dashboard() {
  const { tutors, loading, requests, appointments, createRequest, openChat, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('Todas');
  const [semester, setSemester] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [noteByTutor, setNoteByTutor] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tutors.filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.specialty.toLowerCase().includes(search.toLowerCase());
      const matchSubject = subject === 'Todas' || t.subjects.includes(subject) || t.specialty === subject;
      const matchSemester = semester === 'Todos' || t.semester.toString() === semester;
      return matchSearch && matchSubject && matchSemester;
    });
  }, [tutors, search, subject, semester]);

  const acceptedChatByTutor = useMemo(() => {
    const map = new Map<string, (typeof requests)[number]>();
    for (const req of requests) {
      if (req.status === 'aceptada') map.set(req.tutorId, req);
    }
    return map;
  }, [requests]);

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">DACYTI · Tutores destacados</p>
          <h2>Dashboard de Conexión</h2>
          <p className="screen-desc">Encuentra apoyo de estudiantes de semestres avanzados</p>
        </div>
      </header>

      <div className="toolbar stagger-1">
        <div className="search-box">
          <IconSearch size={18} />
          <input
            type="search"
            placeholder="Buscar por nombre o materia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <IconFilter size={18} />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel animate-in">
          <label>
            Materia
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Semestre
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {semesters.map((s) => (
                <option key={s} value={s}>{s === 'Todos' ? 'Todos' : `${s}° semestre`}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {loading && tutors.length === 0 ? (
        <p className="empty-state">Cargando tutores...</p>
      ) : (
        <div className="tutor-grid">
          {filtered.map((tutor, i) => {
            const booking = getTutorBookingState(tutor.id, requests, appointments);
            const chatReq = acceptedChatByTutor.get(tutor.id);

            return (
              <article
                key={tutor.id}
                className={`tutor-card animate-in stagger-${Math.min(i + 1, 4)}`}
              >
                <div className="tutor-card-top">
                  <div className="tutor-avatar">{tutor.avatar}</div>
                  <div className="tutor-rating">
                    <IconStar size={14} />
                    <span>{tutor.rating.toFixed(1)}</span>
                  </div>
                </div>
                <h3>{tutor.name}</h3>
                <p className="tutor-specialty">{tutor.specialty}</p>
                <p className="tutor-availability-snippet">{tutor.availability}</p>
                <p className={`presence-badge ${tutor.isOnline ? 'online' : 'offline'}`}>
                  {tutor.isOnline ? 'En línea' : 'Desconectado'}
                </p>
                <div className="tutor-tags">
                  <span className="tag">{tutor.semester}° sem</span>
                  {tutor.subjects.slice(0, 2).map((s) => (
                    <span key={s} className="tag tag-outline">{s}</span>
                  ))}
                </div>
                <p className="tutor-sessions">{tutor.sessions} sesiones impartidas</p>

                {booking.blockReason && !booking.canScheduleNew && (
                  <p className="tutor-card-notice">{booking.blockReason}</p>
                )}

                {booking.canScheduleNew && booking.lastCompleted && (
                  <p className="tutor-card-notice success">
                    Sesión anterior completada — puedes agendar otra.
                  </p>
                )}

                <textarea
                  className="request-note"
                  rows={2}
                  placeholder="Escribe una nota para tu solicitud..."
                  value={noteByTutor[tutor.id] ?? ''}
                  disabled={!booking.canScheduleNew}
                  onChange={(e) => setNoteByTutor((prev) => ({ ...prev, [tutor.id]: e.target.value }))}
                />

                <div className="tutor-card-actions">
                  {chatReq ? (
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => openChat(chatReq.id)}
                    >
                      Mensaje
                    </button>
                  ) : null}

                  {booking.canScheduleNew ? (
                    <>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        disabled={sendingId === tutor.id}
                        onClick={async () => {
                          setSendingId(tutor.id);
                          try {
                            await createRequest({
                              tutorId: tutor.id,
                              tutorName: tutor.name,
                              subject: tutor.specialty,
                              note: noteByTutor[tutor.id] ?? '',
                            });
                          } finally {
                            setSendingId(null);
                          }
                        }}
                      >
                        {sendingId === tutor.id ? 'Enviando...' : 'Solicitud rápida'}
                      </button>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => navigate('agenda', { agendaTutorId: tutor.id })}
                      >
                        Agendar con fecha
                      </button>
                    </>
                  ) : booking.pendingRequest ? (
                    <button type="button" className="btn-primary btn-sm" disabled>
                      Solicitud pendiente
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => navigate('agenda', { agendaTutorId: tutor.id })}
                    >
                      Ver mi cita
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-outline btn-sm btn-block"
                  onClick={() => setSelectedTutor(tutor)}
                >
                  Ver perfil
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selectedTutor && (
        <TutorProfileModal
          tutor={selectedTutor}
          onClose={() => setSelectedTutor(null)}
          onAgendar={() => navigate('agenda', { agendaTutorId: selectedTutor.id })}
        />
      )}
    </div>
  );
}
