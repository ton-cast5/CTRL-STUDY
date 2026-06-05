import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../data/mockData';
import { IconCalendar, IconChart, IconCheck, IconClock, IconStar, IconUsers } from '../components/Icons';
import './Screens.css';
import './Progreso.css';

interface ProgresoProps {
  role: UserRole;
}

function CircularProgress({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;

  return (
    <div className="circular-progress progress-animate">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle className="circle-bg" cx="60" cy="60" r={r} />
        <circle
          className="circle-fill"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="circular-label">
        <span className="circular-value">{Math.min(value, 100)}%</span>
        <span className="circular-text">{label}</span>
        <span className="circular-sub">{sublabel}</span>
      </div>
    </div>
  );
}

export function Progreso({ role }: ProgresoProps) {
  if (role === 'tutor') {
    return <TutorProgresoView />;
  }
  return <StudentProgresoView />;
}

function TutorProgresoView() {
  const { enrollments, tutorStats, appointments } = useApp();
  const totalSessions = enrollments.reduce((acc, s) => acc + s.sessionsDone, 0);
  const maxStudentSessions = Math.max(...enrollments.map((s) => s.sessionsDone), 1);

  const recentCompleted = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'completada')
        .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date))
        .slice(0, 6),
    [appointments],
  );

  return (
    <div className="screen animate-in progreso-screen">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Impacto como tutor</p>
          <h2>Estadísticas de tutoría</h2>
          <p className="screen-desc">Métricas en tiempo real de tus sesiones finalizadas</p>
        </div>
        <div className="header-icon">
          <IconChart size={28} />
        </div>
      </header>

      <div className="stats-row stats-row-animated stagger-1">
        <div className="stat-card stat-card-hover">
          <IconCheck size={20} className="stat-icon" />
          <span className="stat-value">{tutorStats.completedSessions}</span>
          <span className="stat-label">Sesiones completadas</span>
        </div>
        <div className="stat-card stat-card-hover stat-gold">
          <IconCalendar size={20} className="stat-icon" />
          <span className="stat-value">{tutorStats.sessionsThisWeek}</span>
          <span className="stat-label">Esta semana</span>
        </div>
        <div className="stat-card stat-card-hover">
          <IconStar size={20} className="stat-icon" />
          <span className="stat-value">{tutorStats.avgRating.toFixed(1)}</span>
          <span className="stat-label">Calificación</span>
        </div>
        <div className="stat-card stat-card-hover">
          <IconUsers size={20} className="stat-icon" />
          <span className="stat-value">{tutorStats.activeStudents}</span>
          <span className="stat-label">Alumnos activos</span>
        </div>
      </div>

      <section className="card-panel stagger-2">
        <h3>Sesiones por alumno</h3>
        <div className="bar-list">
          {enrollments.map((s, i) => (
            <div key={s.id} className="bar-item bar-item-animate" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="bar-header">
                <span>{s.name} · {s.subject}</span>
                <span className="bar-pct">{s.sessionsDone}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-fill-animate"
                  style={{ width: `${Math.min((s.sessionsDone / maxStudentSessions) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {enrollments.length === 0 && (
          <p className="empty-state">Acepta solicitudes y finaliza sesiones para ver estadísticas.</p>
        )}
      </section>

      <section className="card-panel stagger-3">
        <h3>Sesiones recientes</h3>
        <ul className="recent-sessions-list">
          {recentCompleted.map((apt) => (
            <li key={apt.id} className="recent-session-item">
              <div className="recent-session-icon">
                <IconCheck size={16} />
              </div>
              <div>
                <strong>{apt.studentName}</strong>
                <span>{apt.subject} · {apt.durationMinutes ?? 90} min</span>
              </div>
              <time>
                {new Date((apt.completedAt ?? apt.date).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                })}
              </time>
            </li>
          ))}
        </ul>
        {recentCompleted.length === 0 && (
          <p className="empty-state">Finaliza una sesión desde Agenda para registrar tu impacto.</p>
        )}
      </section>

      <div className="stats-row stagger-4">
        <div className="stat-card stat-card-wide">
          <span className="stat-value">{totalSessions}</span>
          <span className="stat-label">Total acumulado en inscripciones</span>
        </div>
      </div>
    </div>
  );
}

function StudentProgresoView() {
  const { progress, appointments } = useApp();

  const completedSessions = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'completada')
        .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date))
        .slice(0, 5),
    [appointments],
  );

  if (!progress) {
    return (
      <div className="screen animate-in">
        <p className="empty-state">Cargando progreso...</p>
      </div>
    );
  }

  const hoursPct = Math.round((progress.hoursCompleted / progress.hoursGoal) * 100);
  const sessionsPct = Math.round((progress.sessionsCompleted / progress.sessionsGoal) * 100);
  const objectivesPct = Math.round((progress.objectivesMet / progress.objectivesTotal) * 100);

  return (
    <div className="screen animate-in progreso-screen">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Tu avance académico</p>
          <h2>Seguimiento de Progreso</h2>
          <p className="screen-desc">Actualizado al finalizar cada sesión con tu tutor</p>
        </div>
        <div className="header-icon">
          <IconChart size={28} />
        </div>
      </header>

      <div className="progress-circles stagger-1">
        <CircularProgress
          value={hoursPct}
          label="Horas"
          sublabel={`${progress.hoursCompleted}/${progress.hoursGoal} h`}
        />
        <CircularProgress
          value={sessionsPct}
          label="Sesiones"
          sublabel={`${progress.sessionsCompleted}/${progress.sessionsGoal}`}
        />
        <CircularProgress
          value={objectivesPct}
          label="Objetivos"
          sublabel={`${progress.objectivesMet}/${progress.objectivesTotal}`}
        />
      </div>

      <section className="card-panel stagger-2">
        <h3>Progreso por materia</h3>
        <div className="bar-list">
          {progress.subjects.map((s, i) => (
            <div key={s.name} className="bar-item bar-item-animate" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="bar-header">
                <span>{s.name}</span>
                <span className="bar-pct">{s.progress}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bar-fill-animate" style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
        {progress.subjects.length === 0 && (
          <p className="empty-state">Completa tu primera sesión para empezar a registrar progreso.</p>
        )}
      </section>

      {completedSessions.length > 0 && (
        <section className="card-panel stagger-3">
          <h3>Últimas sesiones completadas</h3>
          <ul className="recent-sessions-list">
            {completedSessions.map((apt) => (
              <li key={apt.id} className="recent-session-item">
                <div className="recent-session-icon student">
                  <IconClock size={16} />
                </div>
                <div>
                  <strong>{apt.subject}</strong>
                  <span>{apt.durationMinutes ?? 90} min · {apt.modality}</span>
                </div>
                <time>
                  {new Date((apt.completedAt ?? apt.date).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="stats-row stats-row-animated stagger-4">
        <div className="stat-card stat-card-hover">
          <span className="stat-value">{progress.hoursCompleted}</span>
          <span className="stat-label">Horas completadas</span>
        </div>
        <div className="stat-card stat-card-hover stat-gold">
          <span className="stat-value">{progress.objectivesMet}</span>
          <span className="stat-label">Objetivos logrados</span>
        </div>
        <div className="stat-card stat-card-hover">
          <span className="stat-value">{progress.sessionsCompleted}</span>
          <span className="stat-label">Sesiones completadas</span>
        </div>
      </div>
    </div>
  );
}
