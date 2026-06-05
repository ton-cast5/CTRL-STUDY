import { supabase } from '../lib/supabase';
import type { TutorRequest } from '../types/database';
import { createEnrollment, getEnrollmentsByTutor } from './enrollments.service';
import { createAppointment } from './appointments.service';
import { generateId } from '../types/database';
import {
  defaultScheduleDate,
  defaultScheduleTime,
  parseScheduleFromNote,
} from '../utils/schedule';

function mapRequest(row: {
  id: string;
  tutor_id: string;
  tutor_name: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  student_semester: number;
  subject: string;
  note?: string | null;
  status: string;
  created_at: string;
}): TutorRequest {
  return {
    id: row.id,
    tutorId: row.tutor_id,
    tutorName: row.tutor_name,
    studentId: row.student_id,
    studentName: row.student_name,
    studentAvatar: row.student_avatar,
    studentSemester: row.student_semester,
    subject: row.subject,
    note: row.note ?? '',
    status: row.status as TutorRequest['status'],
    createdAt: row.created_at,
  };
}

export async function getRequestsForTutor(tutorId: string): Promise<TutorRequest[]> {
  const { data, error } = await supabase
    .from('tutor_requests')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRequest);
}

export async function getRequestsForStudent(studentId: string): Promise<TutorRequest[]> {
  const { data, error } = await supabase
    .from('tutor_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRequest);
}

export async function createTutorRequest(input: {
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentSemester: number;
  subject: string;
  note?: string;
}): Promise<TutorRequest> {
  const id = generateId('req');
  const { data, error } = await supabase
    .from('tutor_requests')
    .insert({
      id,
      tutor_id: input.tutorId,
      tutor_name: input.tutorName,
      student_id: input.studentId,
      student_name: input.studentName,
      student_avatar: input.studentAvatar,
      student_semester: input.studentSemester,
      subject: input.subject,
      note: input.note ?? '',
      status: 'pendiente',
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRequest(data);
}

async function ensureEnrollment(request: TutorRequest): Promise<void> {
  const existing = await getEnrollmentsByTutor(request.tutorId);
  const already = existing.some(
    (e) => e.studentId === request.studentId && e.subject === request.subject,
  );
  if (!already) {
    await createEnrollment({
      tutorId: request.tutorId,
      studentId: request.studentId,
      name: request.studentName,
      semester: request.studentSemester,
      subject: request.subject,
      avatar: request.studentAvatar,
    });
  }
}

async function ensureAppointmentFromRequest(request: TutorRequest): Promise<void> {
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('request_id', request.id)
    .maybeSingle();

  if (existing) return;

  const schedule = parseScheduleFromNote(request.note);
  await createAppointment({
    tutorId: request.tutorId,
    studentId: request.studentId,
    studentName: request.studentName,
    studentAvatar: request.studentAvatar,
    subject: request.subject,
    date: schedule.date ?? defaultScheduleDate(),
    time: schedule.time ?? defaultScheduleTime(),
    modality: schedule.modality ?? 'Presencial',
    requestId: request.id,
    status: 'pendiente',
  });
}

export async function updateTutorRequestStatus(
  request: TutorRequest,
  status: 'aceptada' | 'rechazada',
): Promise<void> {
  const { error } = await supabase
    .from('tutor_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', request.id);
  if (error) throw error;

  if (status === 'aceptada') {
    await ensureEnrollment(request);
    await ensureAppointmentFromRequest(request);
  }
}
