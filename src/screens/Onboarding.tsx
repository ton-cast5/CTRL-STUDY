import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { subjects } from '../data/mockData';
import './Onboarding.css';

export function Onboarding() {
  const { login, register, loading, error } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'tutor' | 'student' | null>(null);
  const [matricula, setMatricula] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState('1');
  const [specialty, setSpecialty] = useState('Python');
  const [availability, setAvailability] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !matricula.trim() || !password.trim()) return;
    setLocalError(null);
    try {
      if (mode === 'login') {
        await login(matricula.trim(), password, role);
      } else {
        const displayName = name.trim() || (role === 'tutor' ? 'Tutor DACYTI' : 'Estudiante UJAT');
        await register({
          matricula: matricula.trim(),
          password,
          name: displayName,
          role,
          semester: Number(semester),
          tutorInfo:
            role === 'tutor'
              ? {
                  specialty,
                  availability,
                  bio,
                  subjects: selectedSubjects.length > 0 ? selectedSubjects : [specialty],
                }
              : undefined,
        });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo conectar con Supabase.');
    }
  };

  const displayError = localError ?? error;

  return (
    <div className="onboarding">
      <div className="onboarding-card animate-in">
        <div className="onboarding-header">
          <img src="/logo.png" alt="Ctrl+Study" className="onboarding-logo" />
          <h1>
            <span className="brand-ctrl">Ctrl+</span>
            <span className="brand-study">Study</span>
          </h1>
          <p className="tagline">Tu agenda digital de estudio</p>
          <p className="subtitle">
            Plataforma de tutoría académica DACYTI — Universidad Juárez Autónoma de Tabasco
          </p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="mode-switch">
            <button
              type="button"
              className={`btn-outline btn-sm ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`btn-outline btn-sm ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Darme de alta
            </button>
          </div>

          <fieldset className="role-selector">
            <legend>¿Cómo deseas ingresar?</legend>
            <div className="role-options">
              <button
                type="button"
                className={`role-card ${role === 'student' ? 'selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <span className="role-icon">🎓</span>
                <span className="role-title">Estudiante</span>
                <span className="role-desc">Busco apoyo académico</span>
              </button>
              <button
                type="button"
                className={`role-card ${role === 'tutor' ? 'selected' : ''}`}
                onClick={() => setRole('tutor')}
              >
                <span className="role-icon">📚</span>
                <span className="role-title">Tutor</span>
                <span className="role-desc">Ofrezco asesorías DACYTI</span>
              </button>
            </div>
          </fieldset>

          <label className="field">
            <span>Matrícula UJAT</span>
            <input
              type="text"
              placeholder="Ej. 2023001234 (tutor demo: 2020001001)"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {mode === 'register' && (
            <>
              <label className="field">
                <span>Nombre</span>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Semestre</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </label>

              {role === 'tutor' && (
                <>
                  <label className="field">
                    <span>Especialidad principal</span>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Disponibilidad</span>
                    <input
                      type="text"
                      placeholder="Ej. Lun-Vie 9:00-14:00"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Bio</span>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntanos qué asesoras"
                    />
                  </label>
                  <label className="field">
                    <span>Materias que asesoras</span>
                    <select
                      multiple
                      value={selectedSubjects}
                      onChange={(e) =>
                        setSelectedSubjects(
                          Array.from(e.target.selectedOptions).map((opt) => opt.value),
                        )
                      }
                    >
                      {subjects.filter((s) => s !== 'Todos' && s !== 'Todas').map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </>
          )}

          {displayError && <p className="onboarding-error">{displayError}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={!role || !matricula.trim() || !password.trim() || loading}
          >
            {loading ? 'Conectando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="onboarding-footer">
          Acceso exclusivo para la comunidad UJAT · DACYTI
        </p>
      </div>
    </div>
  );
}
