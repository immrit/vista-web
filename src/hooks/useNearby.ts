'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nearbyApi, NearbyCandidate, NearbyMatch, NearbyPreferences } from '@/lib/nearbyApi';
import { toast } from 'sonner';

export function useNearbyPreferences() {
  return useQuery({
    queryKey: ['nearby', 'preferences'],
    queryFn: () => nearbyApi.getPreferences(),
    staleTime: 60_000,
  });
}

export function useUpdateNearbyPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Omit<NearbyPreferences, 'is_enabled' | 'has_location'>) =>
      nearbyApi.updatePreferences(prefs),
    onSuccess: (data) => {
      qc.setQueryData(['nearby', 'preferences'], data);
    },
  });
}

export function useNearbyMatches() {
  return useQuery({
    queryKey: ['nearby', 'matches'],
    queryFn: async () => {
      const res = await nearbyApi.getMatches();
      return res.matches;
    },
    staleTime: 30_000,
  });
}

export function useNearbyDiscover() {
  const [cards, setCards] = useState<NearbyCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<NearbyMatch | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (useLocation = true) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = useLocation
        ? await nearbyApi.discover()
        : await nearbyApi.discoverRandomOnline();
      setCards(res.candidates);
    } catch {
      setError('خطا در دریافت کاربران');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const swipe = useCallback(
    async (candidate: NearbyCandidate, action: 'like' | 'pass') => {
      setCards(prev => prev.filter(c => c.user_id !== candidate.user_id));
      try {
        const result = await nearbyApi.like(candidate.user_id, action);
        if (result.matched && result.match) {
          setMatchResult(result.match);
        }
      } catch {
        // silent — card already removed from stack
      }
    },
    []
  );

  const dismissMatch = useCallback(() => setMatchResult(null), []);

  return { cards, loading, error, load, swipe, matchResult, dismissMatch };
}

export function useNearbyLocation() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'sending'>('idle');

  const requestAndSend = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند');
      setStatus('denied');
      return false;
    }
    setStatus('requesting');
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setStatus('sending');
          try {
            await nearbyApi.updateLocation(pos.coords.latitude, pos.coords.longitude);
            setStatus('granted');
            resolve(true);
          } catch {
            toast.error('خطا در ارسال موقعیت');
            setStatus('denied');
            resolve(false);
          }
        },
        (err) => {
          console.error('Geolocation error code:', err.code, 'message:', err.message);
          
          // Fallback for local development without HTTPS
          if (err.code === 1 && process.env.NODE_ENV === 'development') {
            console.warn('Dev mode: mocking location (Tehran) since permission was denied or blocked by HTTP');
            nearbyApi.updateLocation(35.6892, 51.3890).then(() => {
              setStatus('granted');
              resolve(true);
            }).catch(() => {
              setStatus('denied');
              resolve(false);
            });
            return;
          }

          if (err.code === 1) { // PERMISSION_DENIED
            toast.error('دسترسی رد شد. لطفاً از تنظیمات مرورگر اجازه دهید');
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            toast.error('موقعیت مکانی در دسترس نیست');
          } else if (err.code === 3) { // TIMEOUT
            toast.error('درخواست موقعیت مکانی زمان‌بر شد');
          } else {
            toast.error(`خطا در موقعیت: ${err.message}`);
          }
          setStatus('denied');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
      );
    });
  }, []);

  const disable = useCallback(async () => {
    await nearbyApi.disableLocation();
    setStatus('idle');
  }, []);

  return { status, requestAndSend, disable };
}

export function useOpenMatchChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => nearbyApi.openChat(matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => nearbyApi.unmatch(matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nearby', 'matches'] });
    },
  });
}
