import { supabase } from '../lib/supabase';
import type { UpcomingAppointment, CreateAppointmentInput } from '../types/database';
import { generateId } from '../types/database';

function mapAppointment(row: {
  id: string;
  tutor_id: string;
  student_id: string | null;
  student_name: string;
  student_avatar: string;
  subject: string;
  appointment_date: string;
  appointment_time: string;
  modality: 'Presencial' | 'En línea';
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
  completed_at?: string | null;
  duration_minutes?: number | null;
  session_notes?: string | null;
  request_id?: string | null;
}): UpcomingAppointment {
  const normalizedStatus =
    row.status === 'completada' ||
    row.status === 'confirmada' ||
    row.status === 'pendiente' ||
    row.status === 'cancelada'
      ? row.status
      : 'pendiente';

  return {
    id: row.id,
    tutorId: row.tutor_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentAvatar: row.student_avatar,
    subject: row.subject,
    date: row.appointment_date,
    time: row.appointment_time,
    modality: row.modality,
    status: normalizedStatus,
    completedAt: row.completed_at ?? null,
    durationMinutes: row.duration_minutes ?? null,
    sessionNotes: row.session_notes ?? null,
    requestId: row.request_id ?? null,
  };
}

export async function getAppointments(filters?: {
  tutorId?: string;
  studentId?: string;
  includeCompleted?: boolean;
}): Promise<UpcomingAppointment[]> {
  let query = supabase
    .from('appointments')
    .select('*')
    .neq('status', 'cancelada')
    .order('appointment_date')
    .order('appointment_time');

  if (filters?.tutorId) query = query.eq('tutor_id', filters.tutorId);
  if (filters?.studentId) query = query.eq('student_id', filters.studentId);
  if (!filters?.includeCompleted) query = query.neq('status', 'completada');

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function getCompletedAppointments(filters?: {
  tutorId?: string;
  studentId?: string;
  limit?: number;
}): Promise<UpcomingAppointment[]> {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('status', 'completada')
    .order('completed_at', { ascending: false });

  if (filters?.tutorId) query = query.eq('tutor_id', filters.tutorId);
  if (filters?.studentId) query = query.eq('student_id', filters.studentId);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function createAppointment(input: CreateAppointmentInput): Promise<UpcomingAppointment> {
  const id = generateId('a');
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      id,
      tutor_id: input.tutorId,
      student_id: input.studentId,
      student_name: input.studentName,
      student_avatar: input.studentAvatar,
      subject: input.subject,
      appointment_date: input.date,
      appointment_time: input.time,
      modality: input.modality,
      status: input.status ?? 'pendiente',
      request_id: input.requestId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAppointment(data);
}

export async function updateAppointmentStatus(
  id: string,
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'completada',
): Promise<UpcomingAppointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapAppointment(data);
}

export async function completeAppointment(
  id: string,
  input: { durationMinutes: number; sessionNotes?: string | null },
): Promise<UpcomingAppointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'completada',
      completed_at: new Date().toISOString(),
      duration_minutes: input.durationMinutes,
      session_notes: input.sessionNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapAppointment(data);
}

export async function updateAppointment(
  id: string,
  updates: Partial<{
    date: string;
    time: string;
    modality: 'Presencial' | 'En línea';
    subject: string;
  }>,
): Promise<UpcomingAppointment> {
  const payload: Record<string, string> = { updated_at: new Date().toISOString() };
  if (updates.date) payload.appointment_date = updates.date;
  if (updates.time) payload.appointment_time = updates.time;
  if (updates.modality) payload.modality = updates.modality;
  if (updates.subject) payload.subject = updates.subject;

  const { data, error } = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapAppointment(data);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}

export async function cancelAppointment(id: string): Promise<UpcomingAppointment> {
  return updateAppointmentStatus(id, 'cancelada');
}

export function countSessionsThisWeek(appointments: UpcomingAppointment[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return appointments.filter((a) => {
    if (a.status !== 'completada') return false;
    const ref = a.completedAt ?? `${a.date}T12:00:00`;
    const d = new Date(ref);
    return d >= start && d < end;
  }).length;
}

export function countCompletedSessions(appointments: UpcomingAppointment[]): number {
  return appointments.filter((a) => a.status === 'completada').length;
}
