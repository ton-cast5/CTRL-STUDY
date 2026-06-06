import { useEffect, useMemo, useState } from 'react';
import { timeSlots, type UserRole } from '../data/mockData';
import { IconCalendar, IconCheck, IconClock, IconX } from '../components/Icons';
import { CompleteSessionModal } from '../components/CompleteSessionModal';
import { useApp } from '../context/AppContext';
import { updateAppointmentStatus, cancelAppointment } from '../services/appointments.service';
import type { UpcomingAppointment } from '../types/database';
import { getTutorBookingState } from '../utils/booking';
import {
  formatAvailabilitySummary,
  getAvailableDayLabels,
  getAvailableTimeSlots,
  isDateAvailable,
} from '../utils/availability';
import { formatTimeLabel } from '../utils/schedule';
import './Screens.css';
import './TutorDashboard.css';

interface AgendaProps {
  role: UserRole;
}

function statusLabel(status: UpcomingAppointment['status']) {
  if (status === 'completada') return 'Completada';
  if (status === 'confirmada') return 'Confirmada';
  if (status === 'pendiente') return 'Pendiente';
  return status;
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatShortDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function Agenda({ role }: AgendaProps) {
  if (role === 'tutor') {
    return <TutorAgendaView />;
  }
  return <StudentAgendaView />;
}

function AppointmentCard({
  apt,
  actionId,
  onConfirm,
  onCancel,
  onComplete,
  showComplete,
}: {
  apt: UpcomingAppointment;
  actionId: string | null;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (apt: UpcomingAppointment) => void;
  showComplete?: boolean;
}) {
  return (
    <li className={`appointment-card status-${apt.status} animate-in`}>
      <div className="appointment-date-block">
        <span className="apt-day">{formatShortDate(apt.date)}</span>
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
          <span className={`status-tag ${apt.status === 'completada' ? 'completada' : apt.status}`}>
            {statusLabel(apt.status)}
          </span>
          {apt.status === 'completada' && apt.durationMinutes && (
            <span className="duration-tag">{apt.durationMinutes} min</span>
          )}
        </div>
        {apt.sessionNotes && apt.status === 'completada' && (
          <p className="session-notes-preview">{apt.sessionNotes}</p>
        )}
      </div>
      <div className="appointment-actions">
        {apt.status === 'pendiente' && onConfirm && (
          <button
            type="button"
            className="btn-primary btn-sm-confirm"
            disabled={actionId === apt.id}
            onClick={() => onConfirm(apt.id)}
          >
            {actionId === apt.id ? '...' : 'Confirmar'}
          </button>
        )}
        {showComplete && apt.status === 'confirmada' && onComplete && (
          <button
            type="button"
            className="btn-primary btn-sm-complete"
            disabled={actionId === apt.id}
            onClick={() => onComplete(apt)}
          >
            Finalizar sesión
          </button>
        )}
        {apt.status !== 'completada' && onCancel && (
          <button
            type="button"
            className="btn-icon-msg"
            aria-label={`Cancelar cita con ${apt.studentName}`}
            disabled={actionId === apt.id}
            onClick={() => onCancel(apt.id)}
          >
            <IconX size={18} />
          </button>
        )}
      </div>
    </li>
  );
}

function TutorAgendaView() {
  const { appointments, refreshAppointments, completeSession } = useApp();
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'activas' | 'completadas'>('activas');
  const [completeTarget, setCompleteTarget] = useState<UpcomingAppointment | null>(null);

  const active = useMemo(
    () => appointments.filter((a) => a.status === 'pendiente' || a.status === 'confirmada'),
    [appointments],
  );
  const completed = useMemo(
    () => appointments.filter((a) => a.status === 'completada'),
    [appointments],
  );
  const list = tab === 'activas' ? active : completed;

  const handleConfirm = async (id: string) => {
    setActionId(id);
    try {
      await updateAppointmentStatus(id, 'confirmada');
      await refreshAppointments();
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
          <p className="screen-desc">
            Confirma citas y finaliza sesiones para registrar estadísticas
          </p>
        </div>
        <div className="header-icon">
          <IconCalendar size={28} />
        </div>
      </header>

      <div className="agenda-tabs stagger-1">
        <button
          type="button"
          className={`agenda-tab ${tab === 'activas' ? 'active' : ''}`}
          onClick={() => setTab('activas')}
        >
          Activas
          {active.length > 0 && <span className="agenda-tab-badge">{active.length}</span>}
        </button>
        <button
          type="button"
          className={`agenda-tab ${tab === 'completadas' ? 'active' : ''}`}
          onClick={() => setTab('completadas')}
        >
          Completadas
          {completed.length > 0 && <span className="agenda-tab-badge muted">{completed.length}</span>}
        </button>
      </div>

      <ul className="appointments-list stagger-2">
        {list.map((apt) => (
          <AppointmentCard
            key={apt.id}
            apt={apt}
            actionId={actionId}
            onConfirm={tab === 'activas' ? handleConfirm : undefined}
            onCancel={tab === 'activas' ? handleCancel : undefined}
            onComplete={tab === 'activas' ? setCompleteTarget : undefined}
            showComplete={tab === 'activas'}
          />
        ))}
      </ul>

      {list.length === 0 && (
        <p className="empty-state">
          {tab === 'activas'
            ? 'No tienes citas activas. Acepta solicitudes para generar citas automáticamente.'
            : 'Aún no has finalizado sesiones. Usa "Finalizar sesión" después de cada asesoría.'}
        </p>
      )}

      {completeTarget && (
        <CompleteSessionModal
          appointment={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onComplete={async (input) => {
            await completeSession(completeTarget, input);
            setCompleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

function StudentAgendaView() {
  const { tutors, agendaTutorId, requests, appointments, createRequest } = useApp();
  const [selectedTutor, setSelectedTutor] = useState(tutors[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [modality, setModality] = useState<'Presencial' | 'En línea'>('Presencial');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [studentTab, setStudentTab] = useState<'solicitar' | 'citas'>('solicitar');

  useEffect(() => {
    if (agendaTutorId && tutors.some((t) => t.id === agendaTutorId)) {
      setSelectedTutor(agendaTutorId);
    }
  }, [agendaTutorId, tutors]);

  const tutor = tutors.find((t) => t.id === selectedTutor);
  const booking = useMemo(
    () => getTutorBookingState(selectedTutor, requests, appointments),
    [selectedTutor, requests, appointments],
  );

  const availableSlots = useMemo(() => {
    if (!tutor || !selectedDate) return [];
    return getAvailableTimeSlots(selectedDate, tutor.availability, timeSlots);
  }, [tutor, selectedDate]);

  useEffect(() => {
    setSelectedDate('');
    setSelectedTime('');
    setNote('');
  }, [selectedTutor]);

  useEffect(() => {
    if (selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [availableSlots, selectedTime]);

  const myAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      ),
    [appointments],
  );
  const activeAppts = myAppointments.filter(
    (a) => a.status === 'pendiente' || a.status === 'confirmada',
  );
  const completedAppts = myAppointments.filter((a) => a.status === 'completada');

  const handleSubmitRequest = async () => {
    if (!selectedDate || !selectedTime || !tutor) return;
    if (!booking.canScheduleNew) {
      setFormError(booking.blockReason ?? 'No puedes enviar una solicitud en este momento.');
      return;
    }
    if (!isDateAvailable(selectedDate, tutor.availability)) {
      setFormError('El tutor no atiende ese día. Elige una fecha dentro de su disponibilidad.');
      return;
    }
    if (!availableSlots.includes(selectedTime)) {
      setFormError('Elige un horario dentro de la disponibilidad del tutor.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const scheduleNote = [
        note.trim(),
        `Fecha preferida: ${selectedDate}`,
        `Hora: ${selectedTime}`,
        `Modalidad: ${modality}`,
      ]
        .filter(Boolean)
        .join(' · ');

      await createRequest({
        tutorId: tutor.id,
        tutorName: tutor.name,
        subject: tutor.specialty,
        note: scheduleNote,
      });
      setConfirmed(true);
      setSelectedDate('');
      setSelectedTime('');
      setNote('');
      setStudentTab('citas');
      setTimeout(() => setConfirmed(false), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
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
          <p className="screen-desc">Solicita asesorías y consulta tus citas programadas</p>
        </div>
        <div className="header-icon">
          <IconCalendar size={28} />
        </div>
      </header>

      <div className="agenda-tabs stagger-1">
        <button
          type="button"
          className={`agenda-tab ${studentTab === 'solicitar' ? 'active' : ''}`}
          onClick={() => setStudentTab('solicitar')}
        >
          Nueva solicitud
        </button>
        <button
          type="button"
          className={`agenda-tab ${studentTab === 'citas' ? 'active' : ''}`}
          onClick={() => setStudentTab('citas')}
        >
          Mis citas
          {activeAppts.length > 0 && <span className="agenda-tab-badge">{activeAppts.length}</span>}
        </button>
      </div>

      {studentTab === 'citas' ? (
        <div className="student-appointments stagger-2">
          {activeAppts.length > 0 && (
            <section className="card-panel">
              <h3>Próximas citas</h3>
              <ul className="appointments-list compact">
                {activeAppts.map((apt) => (
                  <li key={apt.id} className={`appointment-card status-${apt.status}`}>
                    <div className="appointment-details">
                      <strong>{apt.subject}</strong>
                      <span>{formatDate(apt.date)} · {apt.time} · {apt.modality}</span>
                      <span className={`status-tag ${apt.status}`}>{statusLabel(apt.status)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {completedAppts.length > 0 && (
            <section className="card-panel">
              <div className="section-title-row">
                <h3>Sesiones completadas</h3>
                {booking.canScheduleNew && (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => setStudentTab('solicitar')}
                  >
                    + Nueva asesoría
                  </button>
                )}
              </div>
              <ul className="appointments-list compact">
                {completedAppts.map((apt) => (
                  <li key={apt.id} className="appointment-card status-completada">
                    <div className="appointment-details">
                      <strong>{apt.subject}</strong>
                      <span>{formatShortDate(apt.date)} · {apt.durationMinutes ?? 90} min</span>
                      {apt.sessionNotes && <p className="session-notes-preview">{apt.sessionNotes}</p>}
                    </div>
                    <span className="status-tag completada">Completada</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {activeAppts.length === 0 && completedAppts.length === 0 && (
            <p className="empty-state">
              Cuando un tutor acepte tu solicitud, aquí aparecerá tu cita programada.
            </p>
          )}
        </div>
      ) : (
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
            <h3>Detalles de la solicitud</h3>

            {tutor && (
              <div className="availability-banner animate-in">
                <IconClock size={18} />
                <div>
                  <strong>Disponibilidad de {tutor.name.split(' ')[0]}</strong>
                  <p>{formatAvailabilitySummary(tutor.availability)}</p>
                  <p className="availability-days">Días: {getAvailableDayLabels(tutor.availability)}</p>
                </div>
              </div>
            )}

            {booking.blockReason && (
              <p className="status-banner status-pendiente">{booking.blockReason}</p>
            )}

            {booking.canScheduleNew && booking.warnMessage && (
              <p className="status-banner status-aceptada">{booking.warnMessage}</p>
            )}

            {booking.pendingRequest && (
              <p className="status-banner status-pendiente">
                Solicitud pendiente enviada el{' '}
                {new Date(booking.pendingRequest.createdAt).toLocaleDateString('es-MX')}
              </p>
            )}

            <label className="field-inline">
              <span>Fecha preferida</span>
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                disabled={!booking.canScheduleNew}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setFormError(null);
                }}
              />
              {selectedDate && tutor && !isDateAvailable(selectedDate, tutor.availability) && (
                <span className="field-hint error">El tutor no atiende este día.</span>
              )}
            </label>

            <label className="field-inline">
              <span>Modalidad</span>
              <select
                value={modality}
                disabled={!booking.canScheduleNew}
                onChange={(e) => setModality(e.target.value as 'Presencial' | 'En línea')}
              >
                <option value="Presencial">Presencial</option>
                <option value="En línea">En línea</option>
              </select>
            </label>

            <p className="slots-label">Horario preferido</p>
            {!selectedDate ? (
              <p className="field-hint">Selecciona una fecha para ver horarios disponibles.</p>
            ) : availableSlots.length === 0 ? (
              <p className="field-hint error">No hay horarios disponibles para este día según la agenda del tutor.</p>
            ) : (
              <div className="time-slots">
                {timeSlots.map((slot) => {
                  const enabled = availableSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!booking.canScheduleNew || !enabled}
                      className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${!enabled ? 'disabled' : ''}`}
                      onClick={() => enabled && setSelectedTime(slot)}
                      title={enabled ? formatTimeLabel(slot) : 'Fuera de horario del tutor'}
                    >
                      {formatTimeLabel(slot)}
                    </button>
                  );
                })}
              </div>
            )}

            <label className="field-inline">
              <span>Nota para el tutor (opcional)</span>
              <textarea
                rows={2}
                value={note}
                disabled={!booking.canScheduleNew}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Cuéntale al tutor qué necesitas..."
              />
            </label>

            <div className="booking-summary">
              <p>
                <strong>Tutor:</strong> {tutor.name} · {tutor.specialty}
              </p>
              {selectedDate && selectedTime && (
                <p>
                  <strong>Preferencia:</strong>{' '}
                  {formatDate(selectedDate)} a las {formatTimeLabel(selectedTime)} ({modality})
                </p>
              )}
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <button
              type="button"
              className="btn-primary btn-agendar"
              disabled={
                !booking.canScheduleNew ||
                !selectedDate ||
                !selectedTime ||
                submitting
              }
              onClick={handleSubmitRequest}
            >
              {submitting
                ? 'Enviando...'
                : !booking.canScheduleNew
                  ? 'Agenda no disponible'
                  : 'Enviar solicitud de asesoría'}
            </button>

            {confirmed && (
              <div className="toast-success animate-in">
                <IconCheck size={20} />
                <span>¡Solicitud enviada a {tutor.name}!</span>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
