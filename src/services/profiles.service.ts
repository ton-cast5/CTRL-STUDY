import { supabase } from '../lib/supabase';
import type { Profile, RegisterInput } from '../types/database';
import { generateId, initials } from '../types/database';
import { createTutor } from './tutors.service';

export async function getProfileByMatricula(matricula: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('matricula', matricula.trim())
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function loginWithCredentials(
  matricula: string,
  password: string,
  role: 'tutor' | 'student',
): Promise<Profile> {
  const profile = await getProfileByMatricula(matricula);
  if (!profile) throw new Error('No existe una cuenta con esa matrícula.');
  if (profile.role !== role) throw new Error('Esta matrícula no coincide con el rol seleccionado.');
  if ((profile.password ?? '') !== password) throw new Error('Contraseña incorrecta.');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_online: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function registerProfile(input: RegisterInput): Promise<Profile> {
  const existing = await getProfileByMatricula(input.matricula);
  if (existing) throw new Error('Esta matrícula ya está registrada.');

  let tutorId: string | null = null;
  if (input.role === 'tutor') {
    if (!input.tutorInfo) throw new Error('Faltan datos para registrar tutor.');
    const tutor = await createTutor({
      name: input.name,
      semester: input.semester ?? 1,
      specialty: input.tutorInfo.specialty,
      avatar: initials(input.name),
      bio: input.tutorInfo.bio,
      availability: input.tutorInfo.availability,
      subjects: input.tutorInfo.subjects,
    });
    tutorId = tutor.id;
  }

  const id = generateId('p');
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      matricula: input.matricula.trim(),
      password: input.password,
      name: input.name,
      role: input.role,
      semester: input.semester ?? null,
      avatar: initials(input.name),
      tutor_id: tutorId,
      is_online: true,
      last_seen_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;

  if (input.role === 'student') {
    await supabase.from('student_progress').upsert({
      student_id: id,
      hours_completed: 0,
      hours_goal: 24,
      sessions_completed: 0,
      sessions_goal: 8,
      objectives_met: 0,
      objectives_total: 5,
    });
  }

  return data as Profile;
}

export async function setProfileOnlineStatus(id: string, online: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_online: online,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'semester' | 'avatar'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
