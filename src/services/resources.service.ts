import { supabase } from '../lib/supabase';
import type { Resource, CreateResourceInput } from '../types/database';
import { generateId } from '../types/database';

function mapResource(row: {
  id: string;
  tutor_id: string | null;
  title: string;
  subject: string;
  type: 'PDF' | 'Guía' | 'Código';
  size: string | null;
  uploaded_by: string;
  file_url: string | null;
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
  };
}

export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
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
    })
    .select()
    .single();

  if (error) throw error;
  return mapResource(data);
}

export async function updateResource(
  id: string,
  updates: Partial<{
    title: string;
    subject: string;
    type: 'PDF' | 'Guía' | 'Código';
    size: string;
    fileUrl: string;
  }>,
): Promise<Resource> {
  const payload: Record<string, string | null> = { updated_at: new Date().toISOString() };
  if (updates.title) payload.title = updates.title;
  if (updates.subject) payload.subject = updates.subject;
  if (updates.type) payload.type = updates.type;
  if (updates.size) payload.size = updates.size;
  if (updates.fileUrl !== undefined) payload.file_url = updates.fileUrl;

  const { data, error } = await supabase
    .from('resources')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapResource(data);
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) throw error;
}
