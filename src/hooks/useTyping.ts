'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TypingUser } from '@/lib/types';
import { getChatWebSocket } from '@/lib/chat/chatWebSocket';

interface UseTypingOptions {
  conversationId: string;
  currentUserId: string;
  peerName?: string;
}

const TYPING_TTL_MS = 8000;

export function useTyping({ conversationId, currentUserId, peerName = 'کاربر' }: UseTypingOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!conversationId) return;

    const ws = getChatWebSocket();
    if (!ws) return;

    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const clearUser = (userId: string) => {
      const timer = timers.get(userId);
      if (timer) clearTimeout(timer);
      timers.delete(userId);
      setTypingUsers(prev => prev.filter(u => u.id !== userId));
    };

    const unsubscribe = ws.subscribe(event => {
      if (event.type !== 'typing') return;
      const payload = event.data ?? {};
      if (String(payload.conversation_id ?? '') !== conversationId) return;

      const userId = String(payload.user_id ?? '');
      if (!userId || userId === currentUserId) return;
      if (payload.is_typing === false) {
        clearUser(userId);
        return;
      }

      setTypingUsers(prev => {
        if (prev.some(u => u.id === userId)) return prev;
        return [...prev, { id: userId, name: peerName }];
      });

      const existing = timers.get(userId);
      if (existing) clearTimeout(existing);
      timers.set(
        userId,
        setTimeout(() => clearUser(userId), TYPING_TTL_MS),
      );
    });

    return () => {
      unsubscribe();
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
      setTypingUsers([]);
    };
  }, [conversationId, currentUserId, peerName]);

  const setTyping = useCallback(
    (typing: boolean) => {
      if (!typing || !conversationId) return;
      const now = Date.now();
      if (now - lastSentRef.current < 3000) return;
      lastSentRef.current = now;

      const ws = getChatWebSocket();
      if (ws) {
        ws.sendTyping(conversationId);
        return;
      }
    },
    [conversationId],
  );

  return {
    isTyping: typingUsers.length > 0,
    typingUsers,
    setTyping,
  };
}
