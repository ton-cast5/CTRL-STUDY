import { supabase } from '../lib/supabase';
import type { Profile, Resource, CreateResourceInput } from '../types/database';
import { generateId } from '../types/database';
import {
  deleteDocument,
  formatFileSize,
  inferResourceType,
  uploadDocument,
} from './storage.service';

function mapResource(row: {
  id: string;
  tutor_id: string | null;
  title: string;
  subject: string;
  type: 'PDF' | 'Guía' | 'Código';
  size: string | null;
  uploaded_by: string;
  file_url: string | null;
  storage_path?: string | null;
  file_name?: string | null;
}): Resource {
  return {
    id: row.id,
    tutorId: row.tutor_id,
    title: row.title,
    subject: row.subject,
    type: row.type,
    size: row.size ?? '',
    uploadedBy: row.uploaded_by,
    fileUrl: row.file_url,
    storagePath: row.storage_path ?? null,
    fileName: row.file_name ?? null,
  };
}

async function getTutorIdsForStudent(studentId: string): Promise<string[]> {
  const [requestsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('tutor_requests')
      .select('tutor_id')
      .eq('student_id', studentId)
      .eq('status', 'aceptada'),
    supabase.from('enrollments').select('tutor_id').eq('student_id', studentId),
  ]);

  if (requestsRes.error) throw requestsRes.error;
  if (enrollmentsRes.error) throw enrollmentsRes.error;

  const ids = new Set<string>();
  for (const row of requestsRes.data ?? []) ids.add(row.tutor_id as string);
  for (const row of enrollmentsRes.data ?? []) ids.add(row.tutor_id as string);
  return [...ids];
}

export async function getResourcesForProfile(profile: Profile): Promise<Resource[]> {
  if (profile.role === 'tutor' && profile.tutor_id) {
    return getResourcesByTutor(profile.tutor_id);
  }
  if (profile.role === 'student') {
    return getResourcesForStudent(profile.id);
  }
  return getResources();
}

export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapResource);
}

export async function getResourcesByTutor(tutorId: string): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapResource);
}

export async function getResourcesForStudent(studentId: string): Promise<Resource[]> {
  const tutorIds = await getTutorIdsForStudent(studentId);
  if (tutorIds.length === 0) return [];

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .in('tutor_id', tutorIds)
    .not('file_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapResource);
}

export async function createResource(input: CreateResourceInput): Promise<Resource> {
  const id = generateId('res');
  const { data, error } = await supabase
    .from('resources')
    .insert({
      id,
      tutor_id: input.tutorId ?? null,
      title: input.title,
      subject: input.subject,
      type: input.type,
      size: input.size,
      uploaded_by: input.uploadedBy,
      file_url: input.fileUrl ?? null,
      storage_path: input.storagePath ?? null,
      file_name: input.fileName ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapResource(data);
}

export async function createResourceWithFile(input: {
  tutorId: string;
  file: File;
  title: string;
  subject: string;
  uploadedBy: string;
}): Promise<Resource> {
  const { publicUrl, storagePath } = await uploadDocument(input.file, input.tutorId);
  return createResource({
    tutorId: input.tutorId,
    title: input.title.trim(),
    subject: input.subject,
    type: inferResourceType(input.file.name),
    size: formatFileSize(input.file.size),
    uploadedBy: input.uploadedBy,
    fileUrl: publicUrl,
    storagePath,
    fileName: input.file.name,
  });
}

export async function updateResource(
  id: string,
  updates: Partial<{
    title: string;
    subject: string;
    type: 'PDF' | 'Guía' | 'Código';
    size: string;
    fileUrl: string | null;
    storagePath: string | null;
    fileName: string | null;
  }>,
): Promise<Resource> {
  const payload: Record<string, string | null> = { updated_at: new Date().toISOString() };
  if (updates.title) payload.title = updates.title;
  if (updates.subject) payload.subject = updates.subject;
  if (updates.type) payload.type = updates.type;
  if (updates.size) payload.size = updates.size;
  if (updates.fileUrl !== undefined) payload.file_url = updates.fileUrl;
  if (updates.storagePath !== undefined) payload.storage_path = updates.storagePath;
  if (updates.fileName !== undefined) payload.file_name = updates.fileName;

  const { data, error } = await supabase
    .from('resources')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapResource(data);
}

export async function replaceResourceFile(
  resourceId: string,
  tutorId: string,
  file: File,
): Promise<Resource> {
  const { data: existing, error: fetchError } = await supabase
    .from('resources')
    .select('storage_path')
    .eq('id', resourceId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const { publicUrl, storagePath } = await uploadDocument(file, tutorId);

  if (existing?.storage_path) {
    await deleteDocument(existing.storage_path).catch(() => undefined);
  }

  return updateResource(resourceId, {
    fileUrl: publicUrl,
    storagePath,
    fileName: file.name,
    type: inferResourceType(file.name),
    size: formatFileSize(file.size),
  });
}

export async function deleteResource(id: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('resources')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (data?.storage_path) {
    await deleteDocument(data.storage_path).catch(() => undefined);
  }

  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) throw error;
}
