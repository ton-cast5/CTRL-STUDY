import { supabase } from '../lib/supabase';

export const DOCUMENTS_BUCKET = 'documentos';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function inferResourceType(fileName: string): 'PDF' | 'Guía' | 'Código' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'zip', 'rar', 'sql', 'html', 'css', 'json'].includes(
      ext,
    )
  ) {
    return 'Código';
  }
  return 'Guía';
}

export async function uploadDocument(
  file: File,
  tutorId: string,
): Promise<{ publicUrl: string; storagePath: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${tutorId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);

  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}

export async function deleteDocument(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
  if (error) throw new Error(`No se pudo eliminar el archivo: ${error.message}`);
}

export function getDocumentDownloadUrl(fileUrl: string, fileName?: string | null): string {
  if (!fileName) return fileUrl;
  const separator = fileUrl.includes('?') ? '&' : '?';
  return `${fileUrl}${separator}download=${encodeURIComponent(fileName)}`;
}
