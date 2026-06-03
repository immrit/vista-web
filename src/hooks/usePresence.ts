'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const touchPresence = () => {
      apiClient.post('/v1/presence/update', { status: 'online' }).catch(error => {
        console.debug('Failed to update presence:', error);
      });
      setOnlineUsers(prev => new Set(prev).add(user.id));
    };

    touchPresence();
    const interval = setInterval(touchPresence, 30000);

    return () => {
      clearInterval(interval);
      apiClient.post('/v1/presence/update', { status: 'offline' }).catch(() => undefined);
    };
  }, [user]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.size,
  };
}
