import type { TutorRequest, UpcomingAppointment } from '../types/database';

export interface TutorBookingState {
  pendingRequest: TutorRequest | null;
  activeAppointment: UpcomingAppointment | null;
  lastCompleted: UpcomingAppointment | null;
  canScheduleNew: boolean;
  blockReason: string | null;
}

export function getTutorBookingState(
  tutorId: string,
  requests: TutorRequest[],
  appointments: UpcomingAppointment[],
): TutorBookingState {
  const tutorRequests = requests
    .filter((r) => r.tutorId === tutorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const pendingRequest = tutorRequests.find((r) => r.status === 'pendiente') ?? null;

  const tutorAppts = appointments
    .filter((a) => a.tutorId === tutorId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const activeAppointment =
    tutorAppts.find((a) => a.status === 'pendiente' || a.status === 'confirmada') ?? null;

  const lastCompleted = tutorAppts.find((a) => a.status === 'completada') ?? null;

  let canScheduleNew = !pendingRequest && !activeAppointment;
  let blockReason: string | null = null;

  if (pendingRequest) {
    canScheduleNew = false;
    blockReason = 'Espera a que el tutor responda tu solicitud pendiente.';
  } else if (activeAppointment) {
    canScheduleNew = false;
    blockReason =
      activeAppointment.status === 'confirmada'
        ? 'Tienes una cita confirmada. Cuando el tutor finalice la sesión, podrás agendar otra.'
        : 'Tienes una cita pendiente de confirmación. Cuando termine, podrás solicitar otra fecha.';
  }

  return {
    pendingRequest,
    activeAppointment,
    lastCompleted,
    canScheduleNew,
    blockReason,
  };
}
