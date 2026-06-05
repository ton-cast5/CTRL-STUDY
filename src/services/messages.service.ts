import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types/database';
import { generateId } from '../types/database';

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    requestId: row.request_id,
    fromProfileId: row.from_profile_id,
    toProfileId: row.to_profile_id,
    body: row.body,
    createdAt: row.created_at,
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
