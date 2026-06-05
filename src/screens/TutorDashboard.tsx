import { useApp } from '../context/AppContext';
import { IconCalendar, IconClock, IconMessage, IconStar, IconUsers } from '../components/Icons';
import './Screens.css';
import './TutorDashboard.css';

export function TutorDashboard() {
  const { appointments, enrollments, tutorStats, requests, respondRequest, setActiveRequestId } = useApp();

  const sortedAppointments = [...appointments].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );

  const formatDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <div className="screen animate-in tutor-panel">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Panel del tutor · DACYTI</p>
          <h2>Mi espacio de tutoría</h2>
          <p className="screen-desc">Alumnos inscritos, citas próximas y solicitudes pendientes</p>
        </div>
      </header>

      <div className="tutor-stats-row stagger-1">
        <div className="tutor-stat-card">
          <IconUsers size={22} />
          <span className="tutor-stat-value">{tutorStats.activeStudents}</span>
          <span className="tutor-stat-label">Alumnos activos</span>
        </div>
        <div className="tutor-stat-card">
          <IconCalendar size={22} />
          <span className="tutor-stat-value">{tutorStats.sessionsThisWeek}</span>
          <span className="tutor-stat-label">Sesiones esta semana</span>
        </div>
        <div className="tutor-stat-card tutor-stat-gold">
          <IconStar size={22} />
          <span className="tutor-stat-value">{tutorStats.avgRating.toFixed(1)}</span>
          <span className="tutor-stat-label">Tu calificación</span>
        </div>
        <div className="tutor-stat-card tutor-stat-alert">
          <span className="tutor-stat-badge">{tutorStats.pendingRequests}</span>
          <span className="tutor-stat-value">{tutorStats.pendingRequests}</span>
          <span className="tutor-stat-label">Solicitudes pendientes</span>
        </div>
      </div>

      <section className="tutor-section stagger-2">
        <div className="section-title-row">
          <h3>
            <IconCalendar size={18} />
            Citas próximas
          </h3>
          <span className="section-count">{sortedAppointments.length} programadas</span>
        </div>
        <ul className="appointments-list">
          {sortedAppointments.map((apt) => (
            <li key={apt.id} className={`appointment-card status-${apt.status}`}>
              <div className="appointment-date-block">
                <span className="apt-day">{formatDate(apt.date)}</span>
                <span className="apt-time">
                  <IconClock size={14} />
                  {apt.time}
                </span>
              </div>
              <div className="appointment-details">
                <div className="appointment-student">
                  <span className="mini-avatar">{apt.studentAvatar}</span>
                  <div>
                    <strong>{apt.studentName}</strong>
                    <span>{apt.subject}</span>
                  </div>
                </div>
                <div className="appointment-meta">
                  <span className={`modality-tag ${apt.modality === 'En línea' ? 'online' : ''}`}>
                    {apt.modality}
                  </span>
                  <span className={`status-tag ${apt.status}`}>
                    {apt.status === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
              </div>
              <button type="button" className="btn-icon-msg" aria-label={`Mensaje a ${apt.studentName}`}>
                <IconMessage size={18} />
              </button>
            </li>
          ))}
        </ul>
        {sortedAppointments.length === 0 && (
          <p className="empty-state">No hay citas programadas.</p>
        )}
      </section>

      <section className="tutor-section stagger-3">
        <div className="section-title-row">
          <h3>
            <IconUsers size={18} />
            Solicitudes de asesoría
          </h3>
        </div>
        <ul className="appointments-list">
          {requests.map((req) => (
            <li key={req.id} className={`appointment-card status-${req.status === 'aceptada' ? 'confirmada' : 'pendiente'}`}>
              <div className="appointment-details">
                <div className="appointment-student">
                  <span className="mini-avatar">{req.studentAvatar}</span>
                  <div>
                    <strong>{req.studentName}</strong>
                    <span>{req.subject} · {req.studentSemester}° semestre</span>
                  </div>
                </div>
                <div className="appointment-meta">
                  <span className={`status-tag ${req.status === 'aceptada' ? 'confirmada' : 'pendiente'}`}>
                    {req.status}
                  </span>
                </div>
              </div>
              {req.status === 'pendiente' ? (
                <div className="appointment-actions">
                  <button type="button" className="btn-primary btn-sm" onClick={() => respondRequest(req, 'aceptada')}>
                    Aceptar
                  </button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => respondRequest(req, 'rechazada')}>
                    Rechazar
                  </button>
                </div>
              ) : req.status === 'aceptada' ? (
                <button type="button" className="btn-icon-msg" onClick={() => setActiveRequestId(req.id)}>
                  <IconMessage size={18} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {requests.length === 0 && (
          <p className="empty-state">Aún no recibes solicitudes.</p>
        )}
      </section>

      <section className="tutor-section stagger-4">
        <div className="section-title-row">
          <h3>
            <IconUsers size={18} />
            Alumnos inscritos contigo
          </h3>
        </div>
        <div className="enrolled-grid">
          {enrollments.map((student) => (
            <article key={student.id} className="enrolled-card">
              <div className="enrolled-top">
                <span className="mini-avatar">{student.avatar}</span>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.semester}° semestre</span>
                </div>
              </div>
              <p className="enrolled-subject">{student.subject}</p>
              <div className="enrolled-progress">
                <div className="enrolled-progress-label">
                  <span>{student.sessionsDone} sesiones</span>
                  <span>Última: {student.lastSession}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.min(student.sessionsDone * 20, 100)}%` }}
                  />
                </div>
              </div>
              <button type="button" className="btn-outline btn-sm">
                Ver historial
              </button>
            </article>
          ))}
        </div>
        {enrollments.length === 0 && (
          <p className="empty-state">Confirma citas para registrar alumnos.</p>
        )}
      </section>

      <div className="tutor-tip card-panel stagger-4">
        <p>
          <strong>Tip:</strong> Confirma las citas pendientes antes de 24 h para que tus alumnos reciban
          la notificación en Ctrl+Study.
        </p>
      </div>
    </div>
  );
}
