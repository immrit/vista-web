'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, getBackendWebSocketUrl } from '@/lib/apiClient';
import type { Message } from '@/lib/models/message';

interface UseRealtimeMessagesOptions {
  conversationId: string;
  userId: string;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onMessageDelete?: (messageId: string) => void;
}

function normalizeMessage(row: any, userId: string): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content || '',
    attachmentUrl: row.attachment_url || row.media_url || null,
    attachmentType: row.attachment_type || row.message_type || null,
    replyToId: row.reply_to_message_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.edited_at || null,
    isDelivered: row.is_delivered ?? false,
    isRead: row.is_read ?? row.is_seen ?? false,
    isSent: true,
    isMe: row.sender_id === userId,
    reactions: row.reactions ?? [],
  };
}

export function useRealtimeMessages({
  conversationId,
  userId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!conversationId || !userId) {
      setMessages([]);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    async function fetchMessages() {
      setIsLoading(true);
      try {
        const response = await apiClient.get<{ messages?: any[] }>(
          `/v1/chat/conversations/${conversationId}/messages?limit=50`,
        );
        if (!isMounted) return;
        setMessages((response.messages || []).map(row => normalizeMessage(row, userId)).reverse());
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const ws = new WebSocket(getBackendWebSocketUrl('/v1/chat/ws'));

    ws.onmessage = event => {
      try {
        const envelope = JSON.parse(event.data);
        const data = envelope.data || envelope;

        if ((envelope.type === 'new_message' || envelope.type === 'message') && data.conversation_id === conversationId) {
          const message = normalizeMessage(data, userId);
          setMessages(prev => {
            const filtered = prev.filter(item => item.id !== message.id);
            return [...filtered, message];
          });
          onNewMessage?.(message);
        }

        if (envelope.type === 'message_updated' && data.conversation_id === conversationId) {
          const message = normalizeMessage(data, userId);
          setMessages(prev => prev.map(item => item.id === message.id ? message : item));
          onMessageUpdate?.(message);
        }

        if (envelope.type === 'message_deleted' && data.conversation_id === conversationId) {
          const messageId = data.message_id || data.id;
          setMessages(prev => prev.filter(item => item.id !== messageId));
          onMessageDelete?.(messageId);
        }
      } catch (error) {
        console.error('Failed to parse chat event:', error);
      }
    };

    return () => ws.close();
  }, [conversationId, onMessageDelete, onMessageUpdate, onNewMessage, userId]);

  const sendMessage = useCallback(
    async (
      content: string,
      replyToId?: string | null,
      editingId?: string | null,
      attachmentUrl?: string,
      attachmentType?: Message['attachmentType'],
    ) => {
      if (editingId) {
        await apiClient.put(`/v1/chat/messages/${editingId}`, { content });
        setMessages(prev => prev.map(msg => msg.id === editingId ? { ...msg, content, updatedAt: new Date().toISOString() } : msg));
        return { id: editingId, content };
      }

      const optimisticMessage: Message = {
        id: `temp_${Date.now()}`,
        conversationId,
        senderId: userId,
        content,
        attachmentUrl,
        attachmentType: attachmentType ?? null,
        replyToId: replyToId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        isDelivered: false,
        isRead: false,
        isSent: false,
        isMe: true,
        reactions: [],
      };

      setMessages(prev => [...prev, optimisticMessage]);

      try {
        const data = await apiClient.post<any>(`/v1/chat/conversations/${conversationId}/messages`, {
          content,
          media_url: attachmentUrl,
          message_type: attachmentType,
          reply_to_message_id: replyToId || undefined,
        });
        const saved = normalizeMessage(data, userId);
        setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id ? saved : msg));
        return data;
      } catch (error) {
        setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id ? { ...msg, isSent: false } : msg));
        throw error;
      }
    },
    [conversationId, userId],
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
