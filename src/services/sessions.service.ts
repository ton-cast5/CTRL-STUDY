import { completeAppointment } from './appointments.service';
import { incrementEnrollmentSession } from './enrollments.service';
import { addSessionProgress } from './progress.service';
import { incrementTutorSessions } from './tutors.service';
import type { UpcomingAppointment } from '../types/database';

export interface CompleteSessionInput {
  appointment: UpcomingAppointment;
  tutorId: string;
  durationMinutes: number;
  sessionNotes?: string;
  objectiveMet?: boolean;
}

export async function completeSession(input: CompleteSessionInput): Promise<void> {
  const { appointment, tutorId, durationMinutes, sessionNotes, objectiveMet } = input;

  if (appointment.status === 'completada') {
    throw new Error('Esta sesión ya fue finalizada.');
  }

  if (appointment.status !== 'confirmada' && appointment.status !== 'pendiente') {
    throw new Error('Solo puedes finalizar citas activas.');
  }

  const hours = durationMinutes / 60;

  await completeAppointment(appointment.id, {
    durationMinutes,
    sessionNotes: sessionNotes?.trim() || null,
  });

  if (appointment.studentId) {
    await incrementEnrollmentSession(tutorId, appointment.studentId, appointment.subject);
    await addSessionProgress(appointment.studentId, appointment.subject, hours, objectiveMet ?? false);
  }

  await incrementTutorSessions(tutorId);
}
