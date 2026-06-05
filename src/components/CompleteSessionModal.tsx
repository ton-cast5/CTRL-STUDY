import { useState } from 'react';
import type { UpcomingAppointment } from '../types/database';
import { IconCheck, IconClock, IconX } from './Icons';
import './CompleteSessionModal.css';

const DURATION_OPTIONS = [
  { minutes: 60, label: '1 hora' },
  { minutes: 90, label: '1.5 horas' },
  { minutes: 120, label: '2 horas' },
];

interface CompleteSessionModalProps {
  appointment: UpcomingAppointment;
  onClose: () => void;
  onComplete: (input: {
    durationMinutes: number;
    sessionNotes: string;
    objectiveMet: boolean;
  }) => Promise<void>;
}

export function CompleteSessionModal({
  appointment,
  onClose,
  onComplete,
}: CompleteSessionModalProps) {
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [sessionNotes, setSessionNotes] = useState('');
  const [objectiveMet, setObjectiveMet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onComplete({ durationMinutes, sessionNotes, objectiveMet });
      setDone(true);
      setTimeout(onClose, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay session-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`session-modal animate-in ${done ? 'session-modal-success' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="complete-session-title"
        aria-modal="true"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          <IconX size={20} />
        </button>

        {done ? (
          <div className="session-success-state animate-in">
            <div className="session-success-icon">
              <IconCheck size={32} />
            </div>
            <h2 id="complete-session-title">¡Sesión finalizada!</h2>
            <p>Estadísticas y progreso actualizados.</p>
          </div>
        ) : (
          <>
            <header className="session-modal-header">
              <p className="screen-eyebrow">Cierre de tutoría</p>
              <h2 id="complete-session-title">Finalizar sesión</h2>
              <p className="session-modal-sub">
                Registra la asesoría con <strong>{appointment.studentName}</strong>
              </p>
            </header>

            <div className="session-summary-card">
              <div>
                <strong>{appointment.subject}</strong>
                <span>{formatDate(appointment.date)} · {appointment.time}</span>
              </div>
              <span className={`modality-tag ${appointment.modality === 'En línea' ? 'online' : ''}`}>
                {appointment.modality}
              </span>
            </div>

            <form className="session-form" onSubmit={handleSubmit}>
              <fieldset className="session-fieldset">
                <legend>
                  <IconClock size={16} /> Duración de la sesión
                </legend>
                <div className="duration-options">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.minutes}
                      type="button"
                      className={`duration-chip ${durationMinutes === opt.minutes ? 'selected' : ''}`}
                      onClick={() => setDurationMinutes(opt.minutes)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="field-inline">
                <span>Notas de la sesión (opcional)</span>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Temas cubiertos, tareas asignadas, observaciones..."
                />
              </label>

              <label className="objective-check">
                <input
                  type="checkbox"
                  checked={objectiveMet}
                  onChange={(e) => setObjectiveMet(e.target.checked)}
                />
                <span>El alumno cumplió el objetivo de la sesión</span>
              </label>

              <div className="session-form-actions">
                <button type="button" className="btn-outline btn-sm" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary btn-sm session-submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Finalizar y registrar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
