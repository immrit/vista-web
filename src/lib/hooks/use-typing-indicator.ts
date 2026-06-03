'use client';

import { useCallback, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

interface UseTypingIndicatorOptions {
  conversationId: string;
  userId: string;
  onTypingChange?: (isTyping: boolean, userId: string) => void;
}

export function useTypingIndicator({ conversationId }: UseTypingIndicatorOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (isTyping && conversationId) {
        apiClient.post(`/v1/chat/conversations/${conversationId}/typing`).catch(error => {
          console.debug('Failed to send typing indicator:', error);
        });

        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
        }, 3000);
      }
    },
    [conversationId],
  );

  return { setTyping };
}
