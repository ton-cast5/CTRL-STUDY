import { useApp } from '../context/AppContext';
import type { UserRole } from '../data/mockData';
import './Screens.css';

interface ProgresoProps {
  role: UserRole;
}

function CircularProgress({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="circular-progress">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle className="circle-bg" cx="60" cy="60" r={r} />
        <circle
          className="circle-fill"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="circular-label">
        <span className="circular-value">{value}%</span>
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
  const { enrollments, tutorStats } = useApp();
  const totalSessions = enrollments.reduce((acc, s) => acc + s.sessionsDone, 0);

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Impacto como tutor</p>
          <h2>Estadísticas de tutoría</h2>
          <p className="screen-desc">Resumen de tu labor de apoyo académico en DACYTI</p>
        </div>
      </header>

      <div className="stats-row stagger-1">
        <div className="stat-card">
          <span className="stat-value">{totalSessions}</span>
          <span className="stat-label">Sesiones impartidas</span>
        </div>
        <div className="stat-card stat-gold">
          <span className="stat-value">{tutorStats.avgRating.toFixed(1)}</span>
          <span className="stat-label">Calificación promedio</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{tutorStats.activeStudents}</span>
          <span className="stat-label">Alumnos activos</span>
        </div>
      </div>

      <section className="card-panel stagger-2">
        <h3>Sesiones por alumno</h3>
        <div className="bar-list">
          {enrollments.map((s) => (
            <div key={s.id} className="bar-item">
              <div className="bar-header">
                <span>{s.name} · {s.subject}</span>
                <span className="bar-pct">{s.sessionsDone}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.min(s.sessionsDone * 20, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {enrollments.length === 0 && (
          <p className="empty-state">Aún no tienes alumnos inscritos.</p>
        )}
      </section>
    </div>
  );
}

function StudentProgresoView() {
  const { progress } = useApp();

  if (!progress) {
    return <p className="empty-state">Cargando progreso...</p>;
  }

  const hoursPct = Math.round((progress.hoursCompleted / progress.hoursGoal) * 100);
  const sessionsPct = Math.round(
    (progress.sessionsCompleted / progress.sessionsGoal) * 100,
  );
  const objectivesPct = Math.round(
    (progress.objectivesMet / progress.objectivesTotal) * 100,
  );

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Tu avance académico</p>
          <h2>Seguimiento de Progreso</h2>
          <p className="screen-desc">Monitorea horas de tutoría y objetivos alcanzados</p>
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
          {progress.subjects.map((s) => (
            <div key={s.name} className="bar-item">
              <div className="bar-header">
                <span>{s.name}</span>
                <span className="bar-pct">{s.progress}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
        {progress.subjects.length === 0 && (
          <p className="empty-state">Agenda tu primera sesión para empezar a registrar progreso.</p>
        )}
      </section>

      <div className="stats-row stagger-3">
        <div className="stat-card">
          <span className="stat-value">{progress.hoursCompleted}</span>
          <span className="stat-label">Horas completadas</span>
        </div>
        <div className="stat-card stat-gold">
          <span className="stat-value">{progress.objectivesMet}</span>
          <span className="stat-label">Objetivos logrados</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{progress.sessionsCompleted}</span>
          <span className="stat-label">Sesiones completadas</span>
        </div>
      </div>
    </div>
  );
}
