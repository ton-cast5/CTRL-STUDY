import { supabase } from '../lib/supabase';
import type {
  Tutor,
  TutorReviewDisplay,
  TutorRow,
  CreateReviewInput,
} from '../types/database';
import { generateId } from '../types/database';

function mapReview(r: {
  id: string;
  author: string;
  author_semester: number | null;
  rating: number;
  review_date: string;
  text: string;
}): TutorReviewDisplay {
  return {
    id: r.id,
    author: r.author,
    semester: r.author_semester ?? 0,
    rating: r.rating,
    date: r.review_date,
    text: r.text,
  };
}

async function fetchSubjectsByTutorIds(tutorIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (tutorIds.length === 0) return map;

  const { data, error } = await supabase
    .from('tutor_subjects')
    .select('tutor_id, subject')
    .in('tutor_id', tutorIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const list = map.get(row.tutor_id) ?? [];
    list.push(row.subject);
    map.set(row.tutor_id, list);
  }
  return map;
}

async function fetchReviewsByTutorIds(tutorIds: string[]): Promise<Map<string, TutorReviewDisplay[]>> {
  const map = new Map<string, TutorReviewDisplay[]>();
  if (tutorIds.length === 0) return map;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .in('tutor_id', tutorIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  for (const row of data ?? []) {
    const list = map.get(row.tutor_id) ?? [];
    list.push(mapReview(row));
    map.set(row.tutor_id, list);
  }
  return map;
}

function mapTutorRow(
  row: TutorRow,
  subjects: string[],
  reviews: TutorReviewDisplay[],
  onlineMap: Map<string, boolean>,
): Tutor {
  return {
    id: row.id,
    name: row.name,
    semester: row.semester,
    subjects,
    specialty: row.specialty,
    rating: Number(row.rating),
    sessions: row.sessions,
    avatar: row.avatar,
    bio: row.bio ?? '',
    availability: row.availability ?? '',
    isOnline: onlineMap.get(row.id) ?? false,
    reviews,
  };
}

async function fetchTutorOnlineMap(): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const { data, error } = await supabase
    .from('profiles')
    .select('tutor_id, is_online')
    .eq('role', 'tutor');
  if (error) throw error;
  for (const row of data ?? []) {
    if (row.tutor_id) map.set(row.tutor_id, Boolean(row.is_online));
  }
  return map;
}

export async function getTutors(): Promise<Tutor[]> {
  const { data: rows, error } = await supabase
    .from('tutors')
    .select('*')
    .order('rating', { ascending: false });

  if (error) throw error;
  const tutorRows = (rows ?? []) as TutorRow[];
  const ids = tutorRows.map((t) => t.id);
  const [subjectsMap, reviewsMap, onlineMap] = await Promise.all([
    fetchSubjectsByTutorIds(ids),
    fetchReviewsByTutorIds(ids),
    fetchTutorOnlineMap(),
  ]);

  return tutorRows.map((row) =>
    mapTutorRow(row, subjectsMap.get(row.id) ?? [], reviewsMap.get(row.id) ?? [], onlineMap),
  );
}

export async function getTutorById(id: string): Promise<Tutor | null> {
  const { data: row, error } = await supabase.from('tutors').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const [subjectsMap, reviewsMap, onlineMap] = await Promise.all([
    fetchSubjectsByTutorIds([id]),
    fetchReviewsByTutorIds([id]),
    fetchTutorOnlineMap(),
  ]);

  return mapTutorRow(row as TutorRow, subjectsMap.get(id) ?? [], reviewsMap.get(id) ?? [], onlineMap);
}

export async function createTutor(input: {
  name: string;
  semester: number;
  specialty: string;
  avatar: string;
  bio: string;
  availability: string;
  subjects: string[];
}): Promise<Tutor> {
  const id = generateId('t');
  const { error } = await supabase
    .from('tutors')
    .insert({
      id,
      name: input.name,
      semester: input.semester,
      specialty: input.specialty,
      avatar: input.avatar,
      bio: input.bio,
      availability: input.availability,
      rating: 0,
      sessions: 0,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.subjects.length > 0) {
    const { error: subErr } = await supabase.from('tutor_subjects').insert(
      input.subjects.map((subject) => ({ tutor_id: id, subject })),
    );
    if (subErr) throw subErr;
  }

  return (await getTutorById(id))!;
}

export async function updateTutor(
  id: string,
  updates: Partial<{
    name: string;
    semester: number;
    specialty: string;
    bio: string;
    availability: string;
    subjects: string[];
  }>,
): Promise<Tutor> {
  const { subjects, ...tutorFields } = updates;

  if (Object.keys(tutorFields).length > 0) {
    const { error } = await supabase
      .from('tutors')
      .update({ ...tutorFields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  if (subjects) {
    await supabase.from('tutor_subjects').delete().eq('tutor_id', id);
    if (subjects.length > 0) {
      const { error } = await supabase.from('tutor_subjects').insert(
        subjects.map((subject) => ({ tutor_id: id, subject })),
      );
      if (error) throw error;
    }
  }

  return (await getTutorById(id))!;
}

export async function deleteTutor(id: string): Promise<void> {
  const { error } = await supabase.from('tutors').delete().eq('id', id);
  if (error) throw error;
}

export async function createReview(input: CreateReviewInput): Promise<TutorReviewDisplay> {
  const id = generateId('r');
  const reviewDate = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      id,
      tutor_id: input.tutorId,
      author: input.author,
      author_semester: input.authorSemester,
      rating: input.rating,
      review_date: reviewDate,
      text: input.text,
      student_id: input.studentId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapReview(data);
}

export async function updateReview(
  id: string,
  updates: Partial<{ rating: number; text: string }>,
): Promise<void> {
  const { error } = await supabase.from('reviews').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementTutorSessions(tutorId: string): Promise<void> {
  const { data } = await supabase.from('tutors').select('sessions').eq('id', tutorId).single();
  const sessions = (data?.sessions ?? 0) + 1;
  await supabase.from('tutors').update({ sessions, updated_at: new Date().toISOString() }).eq('id', tutorId);
}
