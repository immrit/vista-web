'use client';

import { useCallback, useEffect, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

interface UseTypingIndicatorOptions {
  conversationId: string;
  userId: string;
  onTypingChange?: (isTyping: boolean, userId: string) => void;
}

export function useTypingIndicator({
  conversationId,
  userId,
  onTypingChange,
}: UseTypingIndicatorOptions) {
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload.userId !== userId) {
          onTypingChange?.(payload.payload.isTyping, payload.payload.userId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onTypingChange, supabase, userId]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      supabase.channel(`typing:${conversationId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          isTyping,
        },
      });

      if (isTyping) {
        timeoutRef.current = setTimeout(() => {
          supabase.channel(`typing:${conversationId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId,
              isTyping: false,
            },
          });
        }, 3000);
      }
    },
    [conversationId, supabase, userId],
  );

  return { setTyping };
}

