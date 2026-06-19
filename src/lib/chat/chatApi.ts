import { apiClient } from '@/lib/apiClient';
import type { Message, MessageReaction } from '@/lib/models/message';

export type RawChatMessage = Record<string, unknown>;

export function formatChatMessage(raw: RawChatMessage, currentUserId: string): Message {
  const senderId = String(raw.sender_id ?? raw.senderId ?? '');
  return {
    id: String(raw.id ?? raw.message_id ?? ''),
    conversationId: String(raw.conversation_id ?? raw.conversationId ?? ''),
    senderId,
    content: String(raw.content ?? ''),
    attachmentUrl: (raw.media_url ?? raw.attachment_url ?? null) as string | null,
    attachmentType: (raw.message_type ?? raw.attachment_type ?? null) as Message['attachmentType'],
    replyToId: (raw.reply_to_message_id ?? raw.reply_to_id ?? null) as string | null,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    updatedAt: (raw.updated_at ?? raw.edited_at ?? null) as string | null,
    isDelivered: Boolean(raw.is_delivered ?? true),
    isRead: Boolean(raw.is_read ?? false),
    isSent: raw.is_sent !== undefined ? Boolean(raw.is_sent) : true,
    isMe: senderId === currentUserId,
    reactions: normalizeReactions(raw.reactions),
  };
}

function normalizeReactions(raw: unknown): MessageReaction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    const r = item as Record<string, unknown>;
    return {
      userId: String(r.user_id ?? r.userId ?? ''),
      emoji: String(r.emoji ?? ''),
      createdAt: String(r.created_at ?? r.createdAt ?? ''),
    };
  });
}

export async function fetchConversationMessages(
  conversationId: string,
  currentUserId: string,
  options?: { limit?: number; before?: string },
): Promise<Message[]> {
  const params = new URLSearchParams();
  params.set('limit', String(options?.limit ?? 50));
  if (options?.before) params.set('before', options.before);

  const response = await apiClient.get<{ messages?: RawChatMessage[] }>(
    `/v1/chat/conversations/${conversationId}/messages?${params.toString()}`,
  );

  const rows = response.messages ?? [];
  return rows.map(row => formatChatMessage(row, currentUserId)).reverse();
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(`/v1/chat/conversations/${conversationId}/read`);
}

export async function sendTypingIndicator(conversationId: string): Promise<void> {
  await apiClient.post(`/v1/chat/conversations/${conversationId}/typing`);
}

export async function fetchConversation(conversationId: string) {
  return apiClient.get<Record<string, unknown>>(`/v1/chat/conversations/${conversationId}`);
}

import { sanitizeUuid } from '@/lib/validation/sanitize';

export interface ChatWsConnection {
  url: string;
  protocols: string[];
}

export async function fetchChatWebSocketConnection(): Promise<ChatWsConnection> {
  const res = await fetch('/api/auth/ws-token', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('ws_token_unavailable');

  const { token } = (await res.json()) as { token?: string };
  if (!token || typeof token !== 'string') throw new Error('ws_token_missing');

  const base = (process.env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir').replace(/\/+$/, '');
  const wsBase = base.replace(/^http/i, 'ws');
  const urlObj = new URL('/v1/chat/ws', wsBase);
  urlObj.searchParams.set('token', token);
  const url = urlObj.toString();

  // Token in query params instead of subprotocols to prevent strict protocol matching failures
  return { url, protocols: [] };
}

export async function fetchChatWebSocketUrl(): Promise<string> {
  const { url } = await fetchChatWebSocketConnection();
  return url;
}
