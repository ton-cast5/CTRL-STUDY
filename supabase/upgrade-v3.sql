-- Ctrl+Study v3 — mensajes leídos
-- Ejecutar en SQL Editor después de upgrade-v2.sql

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(to_profile_id, read_at);
