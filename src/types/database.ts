export type UserRole = 'tutor' | 'student';

export interface Profile {
  id: string;
  matricula: string;
  name: string;
  role: UserRole;
  password?: string;
  semester: number | null;
  avatar: string;
  tutor_id: string | null;
  is_online?: boolean;
  last_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TutorRow {
  id: string;
  name: string;
  semester: number;
  specialty: string;
  rating: number;
  sessions: number;
  avatar: string;
  bio: string | null;
  availability: string | null;
}

export interface TutorReview {
  id: string;
  tutor_id: string;
  author: string;
  author_semester: number | null;
  rating: number;
  review_date: string;
  text: string;
  student_id?: string | null;
}

export interface Tutor {
  id: string;
  name: string;
  semester: number;
  subjects: string[];
  specialty: string;
  rating: number;
  sessions: number;
  avatar: string;
  bio: string;
  availability: string;
  isOnline: boolean;
  reviews: TutorReviewDisplay[];
}

export interface TutorRequest {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentSemester: number;
  subject: string;
  note: string;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  fromProfileId: string;
  toProfileId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export interface TutorReviewDisplay {
  id: string;
  author: string;
  semester: number;
  rating: number;
  date: string;
  text: string;
}

export interface EnrolledStudent {
  id: string;
  studentId: string | null;
  name: string;
  semester: number;
  subject: string;
  sessionsDone: number;
  avatar: string;
  lastSession: string;
}

export interface UpcomingAppointment {
  id: string;
  tutorId: string;
  studentId: string | null;
  studentName: string;
  studentAvatar: string;
  subject: string;
  date: string;
  time: string;
  modality: 'Presencial' | 'En línea';
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
  completedAt?: string | null;
  durationMinutes?: number | null;
  sessionNotes?: string | null;
  requestId?: string | null;
}

export interface Resource {
  id: string;
  tutorId: string | null;
  title: string;
  subject: string;
  type: 'PDF' | 'Guía' | 'Código';
  size: string;
  uploadedBy: string;
  fileUrl?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
}

export interface ProgressStats {
  hoursCompleted: number;
  hoursGoal: number;
  sessionsCompleted: number;
  sessionsGoal: number;
  objectivesMet: number;
  objectivesTotal: number;
  subjects: { name: string; progress: number }[];
}

export interface TutorPanelStats {
  activeStudents: number;
  sessionsThisWeek: number;
  completedSessions: number;
  pendingRequests: number;
  avgRating: number;
}

export interface CreateAppointmentInput {
  tutorId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  date: string;
  time: string;
  modality: 'Presencial' | 'En línea';
  requestId?: string;
  status?: 'pendiente' | 'confirmada';
}

export interface CreateResourceInput {
  tutorId?: string | null;
  title: string;
  subject: string;
  type: 'PDF' | 'Guía' | 'Código';
  size: string;
  uploadedBy: string;
  fileUrl?: string;
  storagePath?: string;
  fileName?: string;
}

export interface CreateReviewInput {
  tutorId: string;
  author: string;
  authorSemester: number;
  rating: number;
  text: string;
  studentId?: string;
}

export interface RegisterInput {
  matricula: string;
  password: string;
  name: string;
  role: UserRole;
  semester?: number;
  tutorInfo?: {
    specialty: string;
    bio: string;
    availability: string;
    subjects: string[];
  };
}

export const subjects = ['Todas', 'Python', 'MySQL', 'Java', 'Redes', 'JavaScript', 'Cálculo', 'Algoritmos', 'POO', 'Linux', 'Web', 'Matemáticas', 'Bases de Datos'];
export const semesters = ['Todos', '7', '8', '9'];
export const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function shortName(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}. ${parts[parts.length - 1]}.`;
  return name;
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
