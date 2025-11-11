'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/models/message';

interface UseRealtimeMessagesOptions {
  conversationId: string;
  userId: string;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onMessageDelete?: (messageId: string) => void;
}

export function useRealtimeMessages({
  conversationId,
  userId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
}: UseRealtimeMessagesOptions) {
  const supabase = createClient();
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
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const formatted: Message[] = (data ?? [])
          .map(msg => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            content: msg.content,
            attachmentUrl: msg.attachment_url,
            attachmentType: msg.attachment_type,
            replyToId: msg.reply_to_message_id,
            createdAt: msg.created_at,
            updatedAt: msg.updated_at,
            isDelivered: msg.is_delivered ?? false,
            isRead: msg.is_read ?? false,
            isSent: true,
            isMe: msg.sender_id === userId,
            reactions: msg.reactions ?? [],
          }))
          .reverse(); // Reverse to show oldest to newest

        setMessages(formatted);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null
              ? JSON.stringify(error)
              : 'خطا در بارگذاری پیام‌ها';
        console.error('Error fetching messages:', message, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [conversationId, supabase, userId]);

  useEffect(() => {
    if (!conversationId) {
      return () => undefined;
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const newMessage: Message = {
            id: payload.new.id,
            conversationId: payload.new.conversation_id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            attachmentUrl: payload.new.attachment_url,
            attachmentType: payload.new.attachment_type,
            replyToId: payload.new.reply_to_message_id,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
            isDelivered: payload.new.is_delivered ?? false,
            isRead: payload.new.is_read ?? false,
            isSent: true,
            isMe: payload.new.sender_id === userId,
            reactions: payload.new.reactions ?? [],
          };

          setMessages(prev => [...prev, newMessage]); // Add to end (newest at bottom)
          onNewMessage?.(newMessage);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const updatedMessage: Message = {
            id: payload.new.id,
            conversationId: payload.new.conversation_id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            attachmentUrl: payload.new.attachment_url,
            attachmentType: payload.new.attachment_type,
            replyToId: payload.new.reply_to_message_id,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
            isDelivered: payload.new.is_delivered ?? false,
            isRead: payload.new.is_read ?? false,
            isSent: true,
            isMe: payload.new.sender_id === userId,
            reactions: payload.new.reactions ?? [],
          };

          setMessages(prev => prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg)));
          onMessageUpdate?.(updatedMessage);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          onMessageDelete?.(payload.old.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, userId, onMessageDelete, onMessageUpdate, onNewMessage]);

  const sendMessage = useCallback(
    async (
      content: string,
      replyToId?: string | null,
      editingId?: string | null,
      attachmentUrl?: string,
      attachmentType?: Message['attachmentType']
    ) => {
      // If editing, update existing message
      if (editingId) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .update({
              content,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingId)
            .select()
            .single();

          if (error) throw error;

          setMessages(prev =>
            prev.map(msg =>
              msg.id === editingId
                ? {
                    ...msg,
                    content: data.content,
                    updatedAt: data.updated_at,
                  }
                : msg
            )
          );

          return data;
        } catch (error) {
          console.error('Error updating message:', error);
          throw error;
        }
      }

      // Otherwise, send new message
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

      setMessages(prev => [...prev, optimisticMessage]); // Add to end (newest at bottom)

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
            reply_to_message_id: replyToId || null,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMessage.id
              ? {
                  ...msg,
                  id: data.id,
                  createdAt: data.created_at,
                  isSent: true,
                }
              : msg,
          ),
        );

        return data;
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMessage.id
              ? {
                  ...msg,
                  isSent: false,
                }
              : msg,
          ),
        );
        throw error;
      }
    },
    [conversationId, supabase, userId],
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}

