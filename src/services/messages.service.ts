import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types/database';
import { generateId } from '../types/database';

function mapMessage(row: {
  id: string;
  request_id: string;
  from_profile_id: string;
  to_profile_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
}): ChatMessage {
  return {
    id: row.id,
    requestId: row.request_id,
    fromProfileId: row.from_profile_id,
    toProfileId: row.to_profile_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}

export async function getMessagesByRequest(requestId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function getLastMessagesForRequests(
  requestIds: string[],
): Promise<Map<string, ChatMessage>> {
  const map = new Map<string, ChatMessage>();
  if (requestIds.length === 0) return map;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .in('request_id', requestIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  for (const row of data ?? []) {
    const msg = mapMessage(row);
    if (!map.has(msg.requestId)) map.set(msg.requestId, msg);
  }
  return map;
}

export async function getUnreadCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_profile_id', profileId)
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function getUnreadCountsByRequest(
  profileId: string,
  requestIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (requestIds.length === 0) return map;

  const { data, error } = await supabase
    .from('messages')
    .select('request_id')
    .eq('to_profile_id', profileId)
    .is('read_at', null)
    .in('request_id', requestIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const requestId = row.request_id as string;
    map.set(requestId, (map.get(requestId) ?? 0) + 1);
  }
  return map;
}

export async function markMessagesAsRead(
  requestId: string,
  profileId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('messages')
    .update({ read_at: now })
    .eq('request_id', requestId)
    .eq('to_profile_id', profileId)
    .is('read_at', null);

  if (error) throw error;
}

export async function sendMessage(input: {
  requestId: string;
  fromProfileId: string;
  toProfileId: string;
  body: string;
}): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: generateId('msg'),
      request_id: input.requestId,
      from_profile_id: input.fromProfileId,
      to_profile_id: input.toProfileId,
      body: input.body,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMessage(data);
}
