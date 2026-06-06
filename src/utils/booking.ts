import type { TutorRequest, UpcomingAppointment } from '../types/database';

export interface TutorBookingState {
  pendingRequest: TutorRequest | null;
  activeAppointment: UpcomingAppointment | null;
  lastCompleted: UpcomingAppointment | null;
  canScheduleNew: boolean;
  blockReason: string | null;
  warnMessage: string | null;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function getCompletedSortKey(apt: UpcomingAppointment): string {
  return apt.completedAt ?? `${apt.date}T23:59:59`;
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

  const openAppointments = tutorAppts.filter(
    (a) => a.status === 'pendiente' || a.status === 'confirmada',
  );

  const completedAppointments = tutorAppts
    .filter((a) => a.status === 'completada')
    .sort((a, b) => getCompletedSortKey(b).localeCompare(getCompletedSortKey(a)));

  const lastCompleted = completedAppointments[0] ?? null;

  let blockingAppointment: UpcomingAppointment | null = null;

  if (lastCompleted) {
    const completedDate = toDateKey(getCompletedSortKey(lastCompleted));
    blockingAppointment =
      openAppointments.find((apt) => toDateKey(apt.date) >= completedDate) ?? null;
  } else {
    blockingAppointment = openAppointments[0] ?? null;
  }

  let canScheduleNew = !pendingRequest && !blockingAppointment;
  let blockReason: string | null = null;
  let warnMessage: string | null = null;

  if (pendingRequest) {
    canScheduleNew = false;
    blockReason = 'Espera a que el tutor responda tu solicitud pendiente.';
  } else if (blockingAppointment) {
    canScheduleNew = false;
    blockReason =
      blockingAppointment.status === 'confirmada'
        ? 'Tienes una cita confirmada en curso. Cuando el tutor finalice esa sesión, podrás agendar otra.'
        : 'Tienes una cita pendiente de confirmación. Cuando termine ese ciclo, podrás solicitar otra fecha.';
  } else if (openAppointments.length > 0 && lastCompleted) {
    warnMessage =
      'Tienes citas anteriores cerradas. Puedes solicitar una nueva asesoría en otra fecha.';
  } else if (lastCompleted) {
    warnMessage = 'Tu última sesión con este tutor ya finalizó. Elige una nueva fecha y hora.';
  }

  return {
    pendingRequest,
    activeAppointment: blockingAppointment ?? openAppointments[0] ?? null,
    lastCompleted,
    canScheduleNew,
    blockReason,
    warnMessage,
  };
}
