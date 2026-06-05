-- Ctrl+Study · Sesiones completadas + campos de cierre de tutoría
-- Ejecutar en Supabase SQL Editor después de upgrade-v4

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS session_notes TEXT,
  ADD COLUMN IF NOT EXISTS request_id TEXT REFERENCES tutor_requests(id) ON DELETE SET NULL;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pendiente', 'confirmada', 'cancelada', 'completada'));

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_completed ON appointments(completed_at);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
