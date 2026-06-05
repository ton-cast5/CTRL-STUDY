import type { EnrolledStudent, UpcomingAppointment, TutorRequest } from '../types/database';
import { IconCalendar, IconClock, IconX } from './Icons';
import './TutorProfileModal.css';
import '../screens/Screens.css';

interface StudentHistoryModalProps {
  student: EnrolledStudent;
  appointments: UpcomingAppointment[];
  requests: TutorRequest[];
  onClose: () => void;
}

export function StudentHistoryModal({
  student,
  appointments,
  requests,
  onClose,
}: StudentHistoryModalProps) {
  const studentAppointments = appointments
    .filter((a) => a.studentId === student.studentId || a.studentName === student.name)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const studentRequests = requests
    .filter((r) => r.studentId === student.studentId || r.studentName === student.name)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const formatDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-panel animate-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="student-history-title"
        aria-modal="true"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          <IconX size={20} />
        </button>

        <header className="modal-profile-header">
          <div className="modal-avatar-lg">{student.avatar}</div>
          <div>
            <h2 id="student-history-title">{student.name}</h2>
            <p className="modal-specialty">
              {student.semester}° semestre · {student.subject}
            </p>
            <p className="modal-availability">
              <strong>{student.sessionsDone}</strong> sesiones · Última: {student.lastSession}
            </p>
          </div>
        </header>

        <section className="modal-section">
          <h3>Solicitudes de asesoría</h3>
          <ul className="history-list">
            {studentRequests.map((req) => (
              <li key={req.id} className="history-item">
                <div>
                  <strong>{req.subject}</strong>
                  <span className={`status-tag ${req.status === 'aceptada' ? 'confirmada' : req.status}`}>
                    {req.status}
                  </span>
                </div>
                {req.note && <p className="history-note">{req.note}</p>}
                <time>{new Date(req.createdAt).toLocaleDateString('es-MX')}</time>
              </li>
            ))}
            {studentRequests.length === 0 && (
              <p className="empty-state">Sin solicitudes registradas.</p>
            )}
          </ul>
        </section>

        <section className="modal-section">
          <h3>Citas y sesiones</h3>
          <ul className="history-list">
            {studentAppointments.map((apt) => (
              <li key={apt.id} className="history-item">
                <div>
                  <strong>{apt.subject}</strong>
                  <span className={`status-tag ${apt.status}`}>{apt.status}</span>
                </div>
                <p className="history-note">
                  <IconCalendar size={14} /> {formatDate(apt.date)}{' '}
                  <IconClock size={14} /> {apt.time} · {apt.modality}
                </p>
              </li>
            ))}
            {studentAppointments.length === 0 && (
              <p className="empty-state">Sin citas registradas.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
