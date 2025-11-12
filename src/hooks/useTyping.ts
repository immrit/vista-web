'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseTypingOptions {
    conversationId: string;
    currentUserId: string;
}

interface TypingUser {
    id: string;
    name: string;
    avatar?: string;
}

export function useTyping({ conversationId, currentUserId }: UseTypingOptions) {
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const supabase = createClient();
    const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`typing:${conversationId}`)
            .on(
                'broadcast',
                { event: 'typing' },
                payload => {
                    const { userId, isTyping: userIsTyping, userName, userAvatar } = payload.payload;

                    if (userId === currentUserId) return;

                    // Clear existing timeout
                    const existingTimeout = typingTimeoutRef.current.get(userId);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                    }

                    if (userIsTyping) {
                        setTypingUsers(prev => {
                            const exists = prev.find(u => u.id === userId);
                            if (exists) return prev;
                            return [...prev, { id: userId, name: userName || 'کاربر', avatar: userAvatar }];
                        });
                        setIsTyping(true);

                        // Auto-remove after 3 seconds
                        const timeout = setTimeout(() => {
                            setTypingUsers(prev => prev.filter(u => u.id !== userId));
                            if (typingUsers.length === 1) {
                                setIsTyping(false);
                            }
                            typingTimeoutRef.current.delete(userId);
                        }, 3000);

                        typingTimeoutRef.current.set(userId, timeout);
                    } else {
                        setTypingUsers(prev => {
                            const filtered = prev.filter(u => u.id !== userId);
                            if (filtered.length === 0) {
                                setIsTyping(false);
                            }
                            return filtered;
                        });
                        typingTimeoutRef.current.delete(userId);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            // Clear all timeouts
            typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
            typingTimeoutRef.current.clear();
        };
    }, [conversationId, currentUserId, supabase, typingUsers.length]);

    const setTyping = useCallback(
        (typing: boolean, userName?: string, userAvatar?: string) => {
            supabase.channel(`typing:${conversationId}`).send({
                type: 'broadcast',
                event: 'typing',
                payload: {
                    userId: currentUserId,
                    isTyping: typing,
                    userName,
                    userAvatar,
                },
            });
        },
        [conversationId, currentUserId, supabase]
    );

    return {
        isTyping,
        typingUsers,
        setTyping,
    };
}


