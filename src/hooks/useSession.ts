'use client';

import { useState, useEffect } from 'react';
import { ActiveSession, SessionService, sessionManager } from '@/lib/services/sessionService';

export function useSession() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const fetched = await SessionService.getUserActiveSessions();
      setActiveSessions(fetched);
      const current = fetched.find(s => s.is_current);
      if (current) {
        setCurrentSession(current);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const logoutSession = async (sessionId: string) => {
    const success = await SessionService.logoutSession(sessionId);
    if (success) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    }
    return success;
  };

  const logoutOtherSessions = async () => {
    const success = await SessionService.logoutOtherSessions();
    if (success) {
      setActiveSessions(prev => prev.filter(s => s.is_current));
    }
    return success;
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    activeSessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    logoutSession,
    logoutOtherSessions,
  };
}
