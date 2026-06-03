'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { TypingUser } from '@/lib/types';

interface UseTypingOptions {
  conversationId: string;
  currentUserId: string;
}

export function useTyping({ conversationId }: UseTypingOptions) {
  const [isTyping] = useState(false);
  const [typingUsers] = useState<TypingUser[]>([]);

  const setTyping = useCallback(
    (typing: boolean) => {
      if (!typing || !conversationId) return;
      apiClient.post(`/v1/chat/conversations/${conversationId}/typing`).catch(error => {
        console.debug('Failed to send typing indicator:', error);
      });
    },
    [conversationId],
  );

  return {
    isTyping,
    typingUsers,
    setTyping,
  };
}
