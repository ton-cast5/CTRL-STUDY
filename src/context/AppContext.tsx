import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ChatMessage,
  Profile,
  Tutor,
  TutorRequest,
  UpcomingAppointment,
  Resource,
  EnrolledStudent,
  ProgressStats,
  TutorPanelStats,
  RegisterInput,
  UserRole,
} from '../types/database';
import type { Screen } from '../types/navigation';
import { loginWithCredentials, registerProfile, setProfileOnlineStatus } from '../services/profiles.service';
import { getTutors } from '../services/tutors.service';
import { getAppointments, countSessionsThisWeek } from '../services/appointments.service';
import { getResources } from '../services/resources.service';
import { getEnrollmentsByTutor } from '../services/enrollments.service';
import { getStudentProgress } from '../services/progress.service';
import {
  getMessagesByRequest,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
} from '../services/messages.service';
import {
  createTutorRequest,
  getRequestsForStudent,
  getRequestsForTutor,
  updateTutorRequestStatus,
} from '../services/requests.service';
import { isSupabaseConfigured } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface AppContextValue {
  profile: Profile | null;
  role: UserRole;
  userName: string;
  tutorId: string | null;
  loading: boolean;
  error: string | null;
  screen: Screen;
  agendaTutorId: string | null;
  unreadCount: number;
  tutors: Tutor[];
  appointments: UpcomingAppointment[];
  resources: Resource[];
  enrollments: EnrolledStudent[];
  progress: ProgressStats | null;
  requests: TutorRequest[];
  messages: ChatMessage[];
  activeRequestId: string | null;
  tutorStats: TutorPanelStats;
  login: (matricula: string, password: string, role: UserRole) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  navigate: (to: Screen, options?: { agendaTutorId?: string }) => void;
  openChat: (requestId: string) => Promise<void>;
  closeChat: () => void;
  createRequest: (input: { tutorId: string; tutorName: string; subject: string; note: string }) => Promise<void>;
  respondRequest: (request: TutorRequest, status: 'aceptada' | 'rechazada') => Promise<void>;
  sendChatMessage: (request: TutorRequest, body: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshTutors: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshResources: () => Promise<void>;
  refreshEnrollments: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshMessages: (requestId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [agendaTutorId, setAgendaTutorId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [enrollments, setEnrollments] = useState<EnrolledStudent[]>([]);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const role = profile?.role ?? 'student';
  const userName = profile?.name ?? '';
  const tutorId = profile?.tutor_id ?? null;

  const tutorStats = useMemo((): TutorPanelStats => {
    const tutorAppts = tutorId
      ? appointments.filter((a) => a.tutorId === tutorId)
      : appointments;
    const tutor = tutorId ? tutors.find((t) => t.id === tutorId) : null;

    return {
      activeStudents: enrollments.length,
      sessionsThisWeek: countSessionsThisWeek(tutorAppts),
      pendingRequests: requests.filter((r) => r.status === 'pendiente').length,
      avgRating: tutor?.rating ?? 0,
    };
  }, [appointments, enrollments, tutorId, tutors, requests]);

  const refreshUnreadCount = useCallback(async () => {
    if (!profile?.id) {
      setUnreadCount(0);
      return;
    }
    const count = await getUnreadCount(profile.id);
    setUnreadCount(count);
  }, [profile?.id]);

  const refreshTutors = useCallback(async () => {
    const data = await getTutors();
    setTutors(data);
  }, []);

  const refreshAppointments = useCallback(async () => {
    const filters =
      role === 'tutor' && tutorId
        ? { tutorId }
        : role === 'student' && profile?.id
          ? { studentId: profile.id }
          : undefined;
    const data = await getAppointments(filters);
    setAppointments(data);
  }, [role, tutorId, profile?.id]);

  const refreshResources = useCallback(async () => {
    const data = await getResources();
    setResources(data);
  }, []);

  const refreshEnrollments = useCallback(async () => {
    if (!tutorId) {
      setEnrollments([]);
      return;
    }
    const data = await getEnrollmentsByTutor(tutorId);
    setEnrollments(data);
  }, [tutorId]);

  const refreshProgress = useCallback(async () => {
    if (!profile?.id || role !== 'student') {
      setProgress(null);
      return;
    }
    const data = await getStudentProgress(profile.id);
    setProgress(data);
  }, [profile?.id, role]);

  const refreshRequests = useCallback(async () => {
    if (!profile) {
      setRequests([]);
      return;
    }
    if (role === 'tutor' && tutorId) {
      setRequests(await getRequestsForTutor(tutorId));
      return;
    }
    if (role === 'student') {
      setRequests(await getRequestsForStudent(profile.id));
      return;
    }
    setRequests([]);
  }, [profile, role, tutorId]);

  const refreshMessages = useCallback(async (requestId: string) => {
    const data = await getMessagesByRequest(requestId);
    setMessages(data);
  }, []);

  const refreshAll = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado. Revisa .env.local');
      return;
    }
    setLoading(true);
    setError(null);
    const tasks = await Promise.allSettled([
      refreshTutors(),
      refreshAppointments(),
      refreshResources(),
      refreshEnrollments(),
      refreshProgress(),
      refreshRequests(),
      refreshUnreadCount(),
    ]);

    const failed = tasks.filter((t): t is PromiseRejectedResult => t.status === 'rejected');
    if (failed.length > 0) {
      const details = failed
        .map((f) => (f.reason instanceof Error ? f.reason.message : String(f.reason)))
        .join(' | ');
      setError(`Algunos datos no se pudieron cargar: ${details}`);
    }
    setLoading(false);
  }, [
    refreshTutors,
    refreshAppointments,
    refreshResources,
    refreshEnrollments,
    refreshProgress,
    refreshRequests,
    refreshUnreadCount,
  ]);

  const navigate = useCallback((to: Screen, options?: { agendaTutorId?: string }) => {
    setScreen(to);
    if (options?.agendaTutorId) setAgendaTutorId(options.agendaTutorId);
    if (to === 'mensajes') refreshUnreadCount().catch(() => undefined);
  }, [refreshUnreadCount]);

  const openChat = useCallback(
    async (requestId: string) => {
      if (profile) {
        await markMessagesAsRead(requestId, profile.id);
        await refreshUnreadCount();
      }
      setActiveRequestId(requestId);
    },
    [profile, refreshUnreadCount],
  );

  const closeChat = useCallback(() => {
    setActiveRequestId(null);
  }, []);

  useEffect(() => {
    if (profile) refreshAll();
  }, [profile, refreshAll]);

  useEffect(() => {
    if (!activeRequestId || !profile) {
      setMessages([]);
      return;
    }
    markMessagesAsRead(activeRequestId, profile.id)
      .then(() => refreshMessages(activeRequestId))
      .then(() => refreshUnreadCount())
      .catch(() => undefined);
  }, [activeRequestId, profile, refreshMessages, refreshUnreadCount]);

  useEffect(() => {
    if (!profile) return;
    const acceptedIds = requests.filter((r) => r.status === 'aceptada').map((r) => r.id);

    const requestsChannel = supabase
      .channel(`tutor-requests-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tutor_requests' }, () => {
        refreshRequests().catch(() => undefined);
      })
      .subscribe();

    const messagesChannel = supabase
      .channel(`messages-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as { request_id?: string } | null;
        const requestId = row?.request_id ?? activeRequestId;
        refreshUnreadCount().catch(() => undefined);
        if (requestId && (requestId === activeRequestId || acceptedIds.includes(requestId))) {
          if (requestId === activeRequestId) {
            refreshMessages(activeRequestId).catch(() => undefined);
          }
          refreshRequests().catch(() => undefined);
        }
      })
      .subscribe();

    const presenceChannel = supabase
      .channel('profiles-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshTutors().catch(() => undefined);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [
    profile,
    activeRequestId,
    requests,
    refreshRequests,
    refreshMessages,
    refreshTutors,
    refreshUnreadCount,
  ]);

  const login = useCallback(
    async (matricula: string, password: string, userRole: UserRole) => {
      setLoading(true);
      setError(null);
      try {
        const p = await loginWithCredentials(matricula, password, userRole);
        setProfile(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(async (input: RegisterInput) => {
    setLoading(true);
    setError(null);
    try {
      const p = await registerProfile(input);
      setProfile(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar cuenta');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = useCallback(
    async (input: { tutorId: string; tutorName: string; subject: string; note: string }) => {
      if (!profile) return;
      await createTutorRequest({
        tutorId: input.tutorId,
        tutorName: input.tutorName,
        studentId: profile.id,
        studentName: profile.name,
        studentAvatar: profile.avatar,
        studentSemester: profile.semester ?? 1,
        subject: input.subject,
        note: input.note,
      });
      await refreshRequests();
    },
    [profile, refreshRequests],
  );

  const respondRequest = useCallback(
    async (request: TutorRequest, status: 'aceptada' | 'rechazada') => {
      await updateTutorRequestStatus(request, status);
      await Promise.all([refreshRequests(), refreshEnrollments()]);
    },
    [refreshRequests, refreshEnrollments],
  );

  const sendChatMessageSafe = useCallback(
    async (request: TutorRequest, body: string) => {
      if (!profile || !body.trim()) return;

      let toProfileId = request.studentId;
      if (role === 'student') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('tutor_id', request.tutorId)
          .eq('role', 'tutor')
          .maybeSingle();
        if (error) throw error;
        if (!data?.id) throw new Error('No se encontró cuenta del tutor.');
        toProfileId = data.id;
      }

      await sendMessage({
        requestId: request.id,
        fromProfileId: profile.id,
        toProfileId,
        body: body.trim(),
      });
      await refreshMessages(request.id);
    },
    [profile, refreshMessages, role],
  );

  const logout = useCallback(() => {
    if (profile) setProfileOnlineStatus(profile.id, false).catch(() => undefined);
    setProfile(null);
    setScreen('dashboard');
    setAgendaTutorId(null);
    setUnreadCount(0);
    setTutors([]);
    setAppointments([]);
    setResources([]);
    setEnrollments([]);
    setProgress(null);
    setRequests([]);
    setMessages([]);
    setActiveRequestId(null);
  }, [profile]);

  const value: AppContextValue = {
    profile,
    role,
    userName,
    tutorId,
    loading,
    error,
    screen,
    agendaTutorId,
    unreadCount,
    tutors,
    appointments,
    resources,
    enrollments,
    progress,
    requests,
    messages,
    activeRequestId,
    tutorStats,
    login,
    register,
    logout,
    navigate,
    openChat,
    closeChat,
    createRequest,
    respondRequest,
    sendChatMessage: sendChatMessageSafe,
    refreshAll,
    refreshTutors,
    refreshAppointments,
    refreshResources,
    refreshEnrollments,
    refreshProgress,
    refreshRequests,
    refreshMessages,
    refreshUnreadCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
