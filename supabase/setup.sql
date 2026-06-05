-- ============================================================
-- Ctrl+Study — Script único de configuración (Supabase SQL Editor)
-- Ejecutar UNA VEZ en: Dashboard → SQL → New query → Run
-- ============================================================

-- Limpiar tablas previas (solo si re-ejecutas en desarrollo)
DROP TABLE IF EXISTS subject_progress CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS tutor_subjects CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ── Perfiles de usuario (login por matrícula) ──
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  matricula TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tutor', 'student')),
  semester INTEGER,
  avatar TEXT NOT NULL DEFAULT '??',
  tutor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tutores DACYTI ──
CREATE TABLE tutors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  specialty TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  avatar TEXT NOT NULL,
  bio TEXT,
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tutor_subjects (
  id SERIAL PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  UNIQUE (tutor_id, subject)
);

-- ── Reseñas ──
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_semester INTEGER,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_date TEXT NOT NULL,
  text TEXT NOT NULL,
  student_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Inscripciones tutor-alumno ──
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  subject TEXT NOT NULL,
  sessions_done INTEGER NOT NULL DEFAULT 0,
  avatar TEXT NOT NULL,
  last_session TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Citas / asesorías ──
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_avatar TEXT NOT NULL,
  subject TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('Presencial', 'En línea')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('confirmada', 'pendiente', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Recursos compartidos ──
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  tutor_id TEXT REFERENCES tutors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PDF', 'Guía', 'Código')),
  size TEXT,
  uploaded_by TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Progreso del estudiante ──
CREATE TABLE student_progress (
  student_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  hours_completed NUMERIC(5,1) NOT NULL DEFAULT 0,
  hours_goal NUMERIC(5,1) NOT NULL DEFAULT 24,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  sessions_goal INTEGER NOT NULL DEFAULT 8,
  objectives_met INTEGER NOT NULL DEFAULT 0,
  objectives_total INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subject_progress (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  UNIQUE (student_id, subject)
);

-- FK tutor en profiles (después de crear tutors)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_tutor_id_fkey
  FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE SET NULL;

-- ── Índices ──
CREATE INDEX idx_appointments_tutor ON appointments(tutor_id);
CREATE INDEX idx_appointments_student ON appointments(student_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_reviews_tutor ON reviews(tutor_id);
CREATE INDEX idx_enrollments_tutor ON enrollments(tutor_id);
CREATE INDEX idx_resources_subject ON resources(subject);

-- ── RLS (acceso con anon key para prototipo) ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_profiles" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tutors" ON tutors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tutor_subjects" ON tutor_subjects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_reviews" ON reviews FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_enrollments" ON enrollments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_appointments" ON appointments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_resources" ON resources FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_student_progress" ON student_progress FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_subject_progress" ON subject_progress FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO tutors (id, name, semester, specialty, rating, sessions, avatar, bio, availability) VALUES
  ('1', 'María González', 8, 'Python', 4.9, 42, 'MG', 'Estudiante de 8° semestre en DACYTI. Me apasiona enseñar programación desde cero y preparar a compañeros para exámenes parciales.', 'Lun–Vie · 9:00–17:00'),
  ('2', 'Carlos Ruiz', 7, 'MySQL', 4.8, 35, 'CR', 'Especialista en bases de datos relacionales. Ayudo con modelado ER, consultas SQL y normalización.', 'Mar–Jue · 10:00–16:00'),
  ('3', 'Ana Torres', 9, 'Java', 5.0, 58, 'AT', 'Tutora senior en POO y Java. Enfoque en proyectos integradores y buenas prácticas de código.', 'Lun–Mié–Vie · 14:00–18:00'),
  ('4', 'Luis Méndez', 8, 'Redes', 4.7, 28, 'LM', 'Apoyo en redes de datos, configuración de servidores y laboratorios prácticos en Linux.', 'Mié–Vie · 11:00–15:00'),
  ('5', 'Sofía Herrera', 7, 'JavaScript', 4.9, 31, 'SH', 'Desarrollo web front-end. React, DOM y proyectos finales de la materia de aplicaciones web.', 'Lun–Jue · 9:00–13:00'),
  ('6', 'Diego Vargas', 9, 'Cálculo', 4.6, 22, 'DV', 'Refuerzo en cálculo diferencial e integral. Explicaciones claras con ejercicios tipo examen UJAT.', 'Mar–Sáb · 10:00–14:00');

INSERT INTO tutor_subjects (tutor_id, subject) VALUES
  ('1', 'Python'), ('1', 'Algoritmos'),
  ('2', 'MySQL'), ('2', 'Bases de Datos'),
  ('3', 'Java'), ('3', 'POO'),
  ('4', 'Redes'), ('4', 'Linux'),
  ('5', 'JavaScript'), ('5', 'Web'),
  ('6', 'Cálculo'), ('6', 'Matemáticas');

INSERT INTO profiles (id, matricula, name, role, semester, avatar, tutor_id) VALUES
  ('p-tutor-1', '2020001001', 'María González', 'tutor', 8, 'MG', '1'),
  ('p-student-demo', '2023001234', 'Estudiante Demo', 'student', 4, 'ED', NULL),
  ('s1', '2023002001', 'Juan Pérez', 'student', 4, 'JP', NULL),
  ('s2', '2023002002', 'Laura Sánchez', 'student', 3, 'LS', NULL),
  ('s3', '2023002003', 'Roberto Díaz', 'student', 5, 'RD', NULL),
  ('s4', '2023002004', 'Andrea Morales', 'student', 4, 'AM', NULL),
  ('s5', '2023002005', 'Patricia Luna', 'student', 2, 'PL', NULL);

INSERT INTO reviews (id, tutor_id, author, author_semester, rating, review_date, text) VALUES
  ('r1', '1', 'Juan Pérez', 4, 5, '12 may 2026', 'María explica Python con mucha claridad. Me ayudó a entender listas y diccionarios en una sola sesión.'),
  ('r2', '1', 'Laura Sánchez', 3, 5, '3 may 2026', 'Excelente tutoría. Paciente y siempre trae ejemplos prácticos del DACYTI.'),
  ('r3', '1', 'Roberto Díaz', 5, 4, '20 abr 2026', 'Muy buena experiencia. Recomendada para algoritmos básicos.'),
  ('r4', '2', 'Andrea Morales', 4, 5, '15 may 2026', 'Carlos domina MySQL. Me resolvió dudas de JOINs que llevaba semanas.'),
  ('r5', '2', 'Miguel Ríos', 3, 5, '1 may 2026', 'Las guías que comparte son oro. Sesiones muy organizadas.'),
  ('r6', '3', 'Patricia Luna', 5, 5, '18 may 2026', 'La mejor tutoría de Java que he tenido. POO explicado paso a paso.'),
  ('r7', '3', 'Fernando Cruz', 4, 5, '8 may 2026', 'Ana es increíble. Me preparó para el parcial de herencia y polimorfismo.'),
  ('r8', '4', 'Daniela Ortiz', 6, 4, '10 may 2026', 'Buen apoyo en redes. Configuramos un lab virtual juntos.'),
  ('r9', '4', 'Héctor Gil', 5, 5, '25 abr 2026', 'Luis sabe mucho de Linux. Muy práctico.'),
  ('r10', '5', 'Valeria Núñez', 3, 5, '14 may 2026', 'Sofía hace que JavaScript sea fácil. Proyecto web entregado a tiempo gracias a ella.'),
  ('r11', '6', 'Oscar Medina', 2, 4, '5 may 2026', 'Diego explica cálculo con paciencia. Buenas analogías.'),
  ('r12', '6', 'Camila Reyes', 3, 5, '22 abr 2026', 'Me subió el promedio en matemáticas. Muy recomendado.');

INSERT INTO enrollments (id, tutor_id, student_id, name, semester, subject, sessions_done, avatar, last_session) VALUES
  ('e1', '1', 's1', 'Juan Pérez', 4, 'Python', 5, 'JP', '20 may 2026'),
  ('e2', '1', 's2', 'Laura Sánchez', 3, 'Algoritmos', 3, 'LS', '18 may 2026'),
  ('e3', '1', 's3', 'Roberto Díaz', 5, 'Python', 2, 'RD', '12 may 2026'),
  ('e4', '1', 's4', 'Andrea Morales', 4, 'Algoritmos', 4, 'AM', '15 may 2026'),
  ('e5', '1', 's5', 'Patricia Luna', 2, 'Python', 1, 'PL', '8 may 2026');

INSERT INTO appointments (id, tutor_id, student_id, student_name, student_avatar, subject, appointment_date, appointment_time, modality, status) VALUES
  ('a1', '1', 's1', 'Juan Pérez', 'JP', 'Python', '2026-05-26', '10:00', 'Presencial', 'confirmada'),
  ('a2', '1', 's2', 'Laura Sánchez', 'LS', 'Algoritmos', '2026-05-26', '14:00', 'En línea', 'confirmada'),
  ('a3', '1', 's4', 'Andrea Morales', 'AM', 'Algoritmos', '2026-05-27', '11:00', 'Presencial', 'pendiente'),
  ('a4', '1', 's3', 'Roberto Díaz', 'RD', 'Python', '2026-05-28', '09:00', 'En línea', 'confirmada'),
  ('a5', '1', 's5', 'Patricia Luna', 'PL', 'Python', '2026-05-29', '16:00', 'Presencial', 'pendiente');

INSERT INTO resources (id, tutor_id, title, subject, type, size, uploaded_by) VALUES
  ('1', '1', 'Introducción a Python — Apuntes', 'Python', 'PDF', '2.4 MB', 'María G.'),
  ('2', '2', 'Guía de consultas SQL avanzadas', 'MySQL', 'Guía', '1.1 MB', 'Carlos R.'),
  ('3', '3', 'Ejercicios POO en Java', 'Java', 'Código', '856 KB', 'Ana T.'),
  ('4', '4', 'Configuración de servidores Linux', 'Redes', 'PDF', '3.2 MB', 'Luis M.'),
  ('5', '5', 'React Hooks — Cheat Sheet', 'JavaScript', 'Guía', '540 KB', 'Sofía H.'),
  ('6', '6', 'Derivadas e integrales — Resumen', 'Cálculo', 'PDF', '1.8 MB', 'Diego V.');

INSERT INTO student_progress (student_id, hours_completed, hours_goal, sessions_completed, sessions_goal, objectives_met, objectives_total) VALUES
  ('p-student-demo', 18, 24, 6, 8, 4, 5);

INSERT INTO subject_progress (student_id, subject, progress) VALUES
  ('p-student-demo', 'Python', 85),
  ('p-student-demo', 'MySQL', 62),
  ('p-student-demo', 'Algoritmos', 45);

-- Función para recalcular rating de tutor
CREATE OR REPLACE FUNCTION refresh_tutor_rating(p_tutor_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE tutors SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews WHERE tutor_id = p_tutor_id
    ), 0),
    updated_at = NOW()
  WHERE id = p_tutor_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_refresh_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_tutor_rating(COALESCE(NEW.tutor_id, OLD.tutor_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_rating_refresh
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trg_refresh_tutor_rating();

-- Confirmación
SELECT 'Ctrl+Study: base de datos lista ✓' AS status,
       (SELECT COUNT(*) FROM tutors) AS tutores,
       (SELECT COUNT(*) FROM appointments) AS citas,
       (SELECT COUNT(*) FROM resources) AS recursos;
