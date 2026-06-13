'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '@/lib/models/message';
import { soundManager } from '@/lib/audio/NotificationSounds';
import { apiClient } from '@/lib/apiClient';
import { UploadService } from '@/lib/uploadService';
import {
  fetchConversation,
  fetchConversationMessages,
  formatChatMessage,
  markConversationRead,
} from '@/lib/chat/chatApi';
import { sanitizeChatMessage } from '@/lib/chat/sanitizeMessage';
import { assertValidConversationId, assertValidMessageId } from '@/lib/chat/security';
import { getChatWebSocket } from '@/lib/chat/chatWebSocket';
import { useSecretChat } from '@/hooks/useSecretChat';

interface UseMessagesOptions {
  conversationId: string;
  currentUserId: string;
}

export function useMessages({ conversationId, currentUserId }: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isInitialLoadRef = useRef(true);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSecret = Boolean(conversation?.is_secret);
  const secretChat = useSecretChat({
    conversationId,
    userId: currentUserId,
    isSecret,
    messages,
  });

  useEffect(() => {
    if (!conversationId) return;

    fetchConversation(conversationId)
      .then(data => {
        let participants: Record<string, unknown>[] = [];
        if (data.peer_id) {
          participants = [{
            user_id: data.peer_id,
            profile: {
              id: data.peer_id,
              full_name: data.name,
              avatar_url: data.image,
            },
          }];
        }
        setConversation({ ...data, participants });
      })
      .catch(error => {
        console.error('Error fetching conversation:', error?.message || error);
      });
  }, [conversationId]);

  const scheduleMarkRead = useCallback(() => {
    if (!conversationId) return;
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      markConversationRead(conversationId).catch(() => {});
    }, 400);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    let cancelled = false;
    isInitialLoadRef.current = true;
    setIsLoading(true);
    setHasMore(true);

    fetchConversationMessages(conversationId, currentUserId, { limit: 50 })
      .then(rows => {
        if (cancelled) return;
        setMessages(rows);
        setHasMore(rows.length >= 50);
        isInitialLoadRef.current = false;
        scheduleMarkRead();
      })
      .catch(error => {
        console.error('Error fetching messages:', error?.message || error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const ws = getChatWebSocket();
    if (!ws) return () => { cancelled = true; };

    const unsubscribe = ws.subscribe(event => {
      const payload = event.data ?? {};
      const eventConversationId = String(payload.conversation_id ?? '');

      if (event.type === 'new_message' && eventConversationId === conversationId) {
        const newMessage = formatChatMessage(payload, currentUserId);

        if (newMessage.senderId === currentUserId) {
          setMessages(prev => {
            const filtered = prev.filter(
              msg => !(msg.id.startsWith('temp_') && msg.content === newMessage.content && msg.isMe),
            );
            if (filtered.some(msg => msg.id === newMessage.id)) {
              return filtered.map(msg => (msg.id === newMessage.id ? newMessage : msg));
            }
            return [...filtered, newMessage];
          });
        } else {
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            if (!isInitialLoadRef.current) {
              soundManager.playReceived();
              if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
              if (document.hidden && Notification.permission === 'granted') {
                new Notification('پیام جدید', {
                  body: newMessage.content.substring(0, 100),
                  icon: '/favicon.ico',
                  tag: newMessage.id,
                });
              }
            }
            scheduleMarkRead();
            return [...prev, newMessage];
          });
        }
      }

      if (event.type === 'message_updated' && eventConversationId === conversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === String(payload.id ?? '')
              ? { ...msg, content: String(payload.content ?? msg.content), updatedAt: String(payload.updated_at ?? msg.updatedAt) }
              : msg,
          ),
        );
      }

      if (event.type === 'message_deleted' && eventConversationId === conversationId) {
        const messageId = String(payload.message_id ?? payload.id ?? '');
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }

      if (event.type === 'read_receipt' && eventConversationId === conversationId) {
        const readerId = String(payload.user_id ?? '');
        if (readerId && readerId !== currentUserId) {
          setMessages(prev =>
            prev.map(msg => (msg.isMe ? { ...msg, isRead: true, isDelivered: true } : msg)),
          );
        }
      }

      if (event.type === 'reaction_updated' && eventConversationId === conversationId) {
        const messageId = String(payload.message_id ?? '');
        if (!messageId) return;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: Array.isArray(payload.reactions)
                    ? payload.reactions.map((r: Record<string, unknown>) => ({
                        userId: String(r.user_id ?? ''),
                        emoji: String(r.emoji ?? ''),
                        createdAt: String(r.created_at ?? ''),
                      }))
                    : msg.reactions,
                }
              : msg,
          ),
        );
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [conversationId, currentUserId, scheduleMarkRead]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !currentUserId || isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0];
      const older = await fetchConversationMessages(conversationId, currentUserId, {
        limit: 50,
        before: oldest.createdAt,
      });
      setHasMore(older.length >= 50);
      setMessages(prev => {
        const existing = new Set(prev.map(m => m.id));
        const unique = older.filter(m => !existing.has(m.id));
        return [...unique, ...prev];
      });
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, currentUserId, hasMore, isLoadingMore, messages]);

  const sendMessage = useCallback(
    async (content: string, files?: File[], replyToId?: string | null) => {
      assertValidConversationId(conversationId);
      if (replyToId) assertValidMessageId(replyToId);

      const normalized = sanitizeChatMessage(content);
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;

      if (files && files.length > 0) {
        const file = files[0];
        attachmentType = file.type.split('/')[0];
        try {
          if (attachmentType === 'image') {
            attachmentUrl = await UploadService.uploadImage(file, currentUserId);
          } else if (attachmentType === 'video') {
            attachmentUrl = await UploadService.uploadVideo(file, currentUserId);
          } else if (attachmentType === 'audio') {
            attachmentUrl = await UploadService.uploadMusic(file, currentUserId);
          } else {
            attachmentUrl = await UploadService.uploadImage(file, currentUserId);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'upload failed';
          throw new Error(`آپلود فایل با خطا مواجه شد: ${message}`);
        }
      }

      if (!normalized && !attachmentUrl) return;
      if (isSecret && !files?.length && !secretChat.isReady) {
        throw new Error('در حال تبادل کلید امنیتی با مخاطب هستیم. لطفاً کمی صبر کنید.');
      }

      const outboundContent = isSecret && !files?.length
        ? await secretChat.encryptIfNeeded(normalized)
        : normalized;

      const clientMessageId = crypto.randomUUID();
      const optimisticMessage: Message = {
        id: `temp_${clientMessageId}`,
        conversationId,
        senderId: currentUserId,
        content: normalized,
        attachmentUrl,
        attachmentType: attachmentType as Message['attachmentType'],
        replyToId: replyToId || null,
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
        const data = await apiClient.post<Record<string, unknown>>(
          `/v1/chat/conversations/${conversationId}/messages`,
          {
            id: clientMessageId,
            content: outboundContent,
            message_type: attachmentType || 'text',
            ...(replyToId ? { reply_to_message_id: replyToId } : {}),
            ...(attachmentUrl ? { media_url: attachmentUrl } : {}),
          },
        );

        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMessage.id
                              ? {
                                  ...msg,
                                  id: String(data.id ?? msg.id),
                                  createdAt: String(data.created_at ?? msg.createdAt),
                                  content: outboundContent,
                                  isSent: true,
                                  isDelivered: true,
                                }
              : msg,
          ),
        );

        soundManager.playSent();
        return data;
      } catch (error: unknown) {
        setMessages(prev =>
          prev.map(msg => (msg.id === optimisticMessage.id ? { ...msg, isSent: false } : msg)),
        );
        if (error instanceof Error) {
          if (error.message.includes('internal server error')) {
            throw new Error('ارسال پیام ناموفق بود. اتصال را بررسی کنید و دوباره تلاش کنید.');
          }
          throw error;
        }
        throw new Error('ارسال پیام ناموفق بود');
      }
    },
    [conversationId, currentUserId, isSecret, secretChat.encryptIfNeeded, secretChat.isReady],
  );

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    assertValidMessageId(messageId);
    const normalized = sanitizeChatMessage(newContent);
    const outbound = isSecret ? await secretChat.encryptIfNeeded(normalized) : normalized;
    await apiClient.put(`/v1/chat/messages/${messageId}`, { content: outbound });
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, content: normalized, updatedAt: new Date().toISOString() } : msg)),
    );
  }, [isSecret, secretChat.encryptIfNeeded]);

  const deleteMessage = useCallback(async (messageId: string) => {
    assertValidMessageId(messageId);
    await apiClient.delete(`/v1/chat/messages/${messageId}?for_everyone=true`);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    messages,
    conversation,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markRead: scheduleMarkRead,
    isSecret,
    secretChatReady: secretChat.isReady,
    secretNotices: secretChat.notices,
    getDisplayContent: secretChat.getDisplayContent,
  };
}
