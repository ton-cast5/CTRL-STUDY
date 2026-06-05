import { useState } from 'react';
import { timeSlots, type UserRole } from '../data/mockData';
import { IconCalendar, IconCheck, IconClock, IconX } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { createAppointment, updateAppointmentStatus, cancelAppointment } from '../services/appointments.service';
import { addSessionProgress } from '../services/progress.service';
import { incrementEnrollmentSession } from '../services/enrollments.service';
import { incrementTutorSessions } from '../services/tutors.service';
import './Screens.css';
import './TutorDashboard.css';

interface AgendaProps {
  role: UserRole;
}

export function Agenda({ role }: AgendaProps) {
  if (role === 'tutor') {
    return <TutorAgendaView />;
  }
  return <StudentAgendaView />;
}

function TutorAgendaView() {
  const { appointments, refreshAppointments, refreshEnrollments, refreshProgress, tutorId } = useApp();
  const [actionId, setActionId] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const handleConfirm = async (id: string, apt: typeof appointments[0]) => {
    setActionId(id);
    try {
      await updateAppointmentStatus(id, 'confirmada');
      if (tutorId && apt.studentId) {
        await incrementEnrollmentSession(tutorId, apt.studentId, apt.subject);
        await incrementTutorSessions(tutorId);
        if (apt.studentId) await addSessionProgress(apt.studentId, apt.subject);
      }
      await Promise.all([refreshAppointments(), refreshEnrollments(), refreshProgress()]);
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    setActionId(id);
    try {
      await cancelAppointment(id);
      await refreshAppointments();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Tu calendario</p>
          <h2>Mis citas programadas</h2>
          <p className="screen-desc">Gestiona y confirma las asesorías con tus alumnos</p>
        </div>
        <div className="header-icon">
          <IconCalendar size={28} />
        </div>
      </header>

      <ul className="appointments-list stagger-1">
        {appointments.map((apt) => (
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
            <div className="appointment-actions">
              {apt.status === 'pendiente' && (
                <button
                  type="button"
                  className="btn-primary btn-sm-confirm"
                  disabled={actionId === apt.id}
                  onClick={() => handleConfirm(apt.id, apt)}
                >
                  {actionId === apt.id ? '...' : 'Confirmar'}
                </button>
              )}
              <button
                type="button"
                className="btn-icon-msg"
                aria-label={`Cancelar cita con ${apt.studentName}`}
                disabled={actionId === apt.id}
                onClick={() => handleCancel(apt.id)}
              >
                <IconX size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {appointments.length === 0 && (
        <p className="empty-state">No tienes citas programadas.</p>
      )}
    </div>
  );
}

function StudentAgendaView() {
  const { tutors, profile, refreshAppointments } = useApp();
  const [selectedTutor, setSelectedTutor] = useState(tutors[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [modality, setModality] = useState<'Presencial' | 'En línea'>('Presencial');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tutor = tutors.find((t) => t.id === selectedTutor);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !tutor || !profile) return;
    setSubmitting(true);
    try {
      await createAppointment({
        tutorId: tutor.id,
        studentId: profile.id,
        studentName: profile.name,
        studentAvatar: profile.avatar,
        subject: tutor.specialty,
        date: selectedDate,
        time: selectedTime,
        modality,
      });
      await refreshAppointments();
      setConfirmed(true);
      setSelectedDate('');
      setSelectedTime('');
      setTimeout(() => setConfirmed(false), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!tutor) {
    return <p className="empty-state">No hay tutores disponibles.</p>;
  }

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Programación</p>
          <h2>Agenda de Asesorías</h2>
          <p className="screen-desc">Programa sesiones de tutoría 1 a 1</p>
        </div>
        <div className="header-icon">
          <IconCalendar size={28} />
        </div>
      </header>

      <div className="agenda-layout">
        <section className="card-panel stagger-1">
          <h3>Selecciona tu tutor</h3>
          <div className="tutor-select-list">
            {tutors.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tutor-select-item ${selectedTutor === t.id ? 'selected' : ''}`}
                onClick={() => setSelectedTutor(t.id)}
              >
                <span className="mini-avatar">{t.avatar}</span>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.specialty}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card-panel stagger-2">
          <h3>Fecha y hora</h3>

          <label className="field-inline">
            <span>Fecha</span>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>

          <label className="field-inline">
            <span>Modalidad</span>
            <select value={modality} onChange={(e) => setModality(e.target.value as 'Presencial' | 'En línea')}>
              <option value="Presencial">Presencial</option>
              <option value="En línea">En línea</option>
            </select>
          </label>

          <p className="slots-label">Horarios disponibles</p>
          <div className="time-slots">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>

          <div className="booking-summary">
            <p>
              <strong>Tutor:</strong> {tutor.name} · {tutor.specialty}
            </p>
            {selectedDate && selectedTime && (
              <p>
                <strong>Sesión:</strong>{' '}
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                a las {selectedTime} ({modality})
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn-primary btn-agendar"
            disabled={!selectedDate || !selectedTime || submitting}
            onClick={handleConfirm}
          >
            {submitting ? 'Agendando...' : 'Agendar Sesión'}
          </button>

          {confirmed && (
            <div className="toast-success animate-in">
              <IconCheck size={20} />
              <span>¡Sesión agendada con {tutor.name}!</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
