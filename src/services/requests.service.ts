import { supabase } from '../lib/supabase';
import type { TutorRequest } from '../types/database';
import { createEnrollment } from './enrollments.service';
import { generateId } from '../types/database';

function mapRequest(row: any): TutorRequest {
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
    status: row.status,
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
