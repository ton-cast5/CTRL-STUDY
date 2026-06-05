-- Ctrl+Study v2 upgrade
-- Ejecutar en SQL Editor si ya corriste setup.sql anteriormente.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '123456',
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS tutor_requests (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  tutor_name TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_avatar TEXT NOT NULL,
  student_semester INTEGER NOT NULL,
  subject TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aceptada', 'rechazada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, student_id, subject)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES tutor_requests(id) ON DELETE CASCADE,
  from_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_requests_tutor ON tutor_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_requests_student ON tutor_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);

ALTER TABLE tutor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_tutor_requests" ON tutor_requests;
DROP POLICY IF EXISTS "anon_all_messages" ON messages;
CREATE POLICY "anon_all_tutor_requests" ON tutor_requests FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);

-- Datos demo de contraseña para perfiles existentes
UPDATE profiles
SET password = '123456'
WHERE password IS NULL OR password = '';

-- Habilitar Realtime (mensajes en vivo)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tutor_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
