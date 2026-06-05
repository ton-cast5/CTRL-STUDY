import { supabase } from '../lib/supabase';
import type { ProgressStats } from '../types/database';

const DEFAULT_PROGRESS: ProgressStats = {
  hoursCompleted: 0,
  hoursGoal: 24,
  sessionsCompleted: 0,
  sessionsGoal: 8,
  objectivesMet: 0,
  objectivesTotal: 5,
  subjects: [],
};

export async function getStudentProgress(studentId: string): Promise<ProgressStats> {
  const { data: progress, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) throw error;

  const { data: subjects, error: subErr } = await supabase
    .from('subject_progress')
    .select('subject, progress')
    .eq('student_id', studentId);

  if (subErr) throw subErr;

  if (!progress) return DEFAULT_PROGRESS;

  return {
    hoursCompleted: Number(progress.hours_completed),
    hoursGoal: Number(progress.hours_goal),
    sessionsCompleted: progress.sessions_completed,
    sessionsGoal: progress.sessions_goal,
    objectivesMet: progress.objectives_met,
    objectivesTotal: progress.objectives_total,
    subjects: (subjects ?? []).map((s) => ({ name: s.subject, progress: s.progress })),
  };
}

export async function updateStudentProgress(
  studentId: string,
  updates: Partial<{
    hoursCompleted: number;
    sessionsCompleted: number;
    objectivesMet: number;
  }>,
): Promise<void> {
  const payload: Record<string, number | string> = { updated_at: new Date().toISOString() };
  if (updates.hoursCompleted !== undefined) payload.hours_completed = updates.hoursCompleted;
  if (updates.sessionsCompleted !== undefined) payload.sessions_completed = updates.sessionsCompleted;
  if (updates.objectivesMet !== undefined) payload.objectives_met = updates.objectivesMet;

  const { error } = await supabase
    .from('student_progress')
    .upsert({ student_id: studentId, ...payload });

  if (error) throw error;
}

export async function updateSubjectProgress(
  studentId: string,
  subject: string,
  progress: number,
): Promise<void> {
  const { error } = await supabase.from('subject_progress').upsert(
    { student_id: studentId, subject, progress },
    { onConflict: 'student_id,subject' },
  );
  if (error) throw error;
}

export async function addSessionProgress(studentId: string, subject: string, hours = 1.5): Promise<void> {
  const current = await getStudentProgress(studentId);
  await updateStudentProgress(studentId, {
    hoursCompleted: current.hoursCompleted + hours,
    sessionsCompleted: current.sessionsCompleted + 1,
  });

  const existing = current.subjects.find((s) => s.name === subject);
  const newProgress = Math.min((existing?.progress ?? 0) + 10, 100);
  await updateSubjectProgress(studentId, subject, newProgress);
}
