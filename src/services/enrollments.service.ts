import { supabase } from '../lib/supabase';
import type { EnrolledStudent } from '../types/database';
import { generateId } from '../types/database';

function mapEnrollment(row: {
  id: string;
  student_id: string | null;
  name: string;
  semester: number;
  subject: string;
  sessions_done: number;
  avatar: string;
  last_session: string | null;
}): EnrolledStudent {
  return {
    id: row.id,
    studentId: row.student_id,
    name: row.name,
    semester: row.semester,
    subject: row.subject,
    sessionsDone: row.sessions_done,
    avatar: row.avatar,
    lastSession: row.last_session ?? '—',
  };
}

export async function getEnrollmentsByTutor(tutorId: string): Promise<EnrolledStudent[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('name');

  if (error) throw error;
  return (data ?? []).map(mapEnrollment);
}

export async function createEnrollment(input: {
  tutorId: string;
  studentId?: string;
  name: string;
  semester: number;
  subject: string;
  avatar: string;
}): Promise<EnrolledStudent> {
  const id = generateId('e');
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      id,
      tutor_id: input.tutorId,
      student_id: input.studentId ?? null,
      name: input.name,
      semester: input.semester,
      subject: input.subject,
      sessions_done: 0,
      avatar: input.avatar,
    })
    .select()
    .single();

  if (error) throw error;
  return mapEnrollment(data);
}

export async function updateEnrollment(
  id: string,
  updates: Partial<{ sessionsDone: number; lastSession: string; subject: string }>,
): Promise<EnrolledStudent> {
  const payload: Record<string, string | number> = { updated_at: new Date().toISOString() };
  if (updates.sessionsDone !== undefined) payload.sessions_done = updates.sessionsDone;
  if (updates.lastSession) payload.last_session = updates.lastSession;
  if (updates.subject) payload.subject = updates.subject;

  const { data, error } = await supabase
    .from('enrollments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapEnrollment(data);
}

export async function deleteEnrollment(id: string): Promise<void> {
  const { error } = await supabase.from('enrollments').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementEnrollmentSession(
  tutorId: string,
  studentId: string,
  subject: string,
): Promise<void> {
  const { data } = await supabase
    .from('enrollments')
    .select('*')
    .eq('tutor_id', tutorId)
    .eq('student_id', studentId)
    .eq('subject', subject)
    .maybeSingle();

  const today = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (data) {
    await supabase
      .from('enrollments')
      .update({
        sessions_done: (data.sessions_done ?? 0) + 1,
        last_session: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
  } else {
    await createEnrollment({
      tutorId,
      studentId,
      name: 'Estudiante',
      semester: 1,
      subject,
      avatar: '??',
    });
  }
}
