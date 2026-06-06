-- Ctrl+Study v6 · Permitir nuevas solicitudes tras sesión completada
-- Ejecutar en SQL Editor después de upgrade-v5.sql

-- La restricción global impedía insertar otra solicitud con el mismo tutor/materia
-- aunque la anterior ya estuviera aceptada o la sesión completada.
ALTER TABLE tutor_requests
  DROP CONSTRAINT IF EXISTS tutor_requests_tutor_id_student_id_subject_key;

-- Solo una solicitud pendiente por tutor + estudiante + materia
DROP INDEX IF EXISTS idx_tutor_requests_one_pending;
CREATE UNIQUE INDEX idx_tutor_requests_one_pending
  ON tutor_requests (tutor_id, student_id, subject)
  WHERE status = 'pendiente';
