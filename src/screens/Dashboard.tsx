import { useMemo, useState } from 'react';
import { subjects, semesters, type Tutor } from '../data/mockData';
import { TutorProfileModal } from '../components/TutorProfileModal';
import { IconSearch, IconFilter, IconStar } from '../components/Icons';
import { useApp } from '../context/AppContext';
import './Screens.css';

export function Dashboard() {
  const { tutors, loading, requests, createRequest, openChat, navigate } = useApp();
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

  const requestByTutor = useMemo(() => {
    const map = new Map<string, (typeof requests)[number]>();
    for (const req of requests) map.set(req.tutorId, req);
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
          {filtered.map((tutor, i) => (
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
              <textarea
                className="request-note"
                rows={2}
                placeholder="Escribe una nota para tu solicitud..."
                value={noteByTutor[tutor.id] ?? ''}
                onChange={(e) => setNoteByTutor((prev) => ({ ...prev, [tutor.id]: e.target.value }))}
              />
              {requestByTutor.get(tutor.id)?.status === 'aceptada' ? (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => openChat(requestByTutor.get(tutor.id)!.id)}
                >
                  Enviar mensaje
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={sendingId === tutor.id || requestByTutor.get(tutor.id)?.status === 'pendiente'}
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
                  {requestByTutor.get(tutor.id)?.status === 'pendiente'
                    ? 'Solicitud enviada'
                    : sendingId === tutor.id
                      ? 'Enviando...'
                      : 'Solicitar asesoría'}
                </button>
              )}
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setSelectedTutor(tutor)}
              >
                Ver perfil
              </button>
            </article>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <p className="empty-state">No se encontraron tutores con esos filtros.</p>
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
