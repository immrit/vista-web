'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isWebAuthnSupported,
  registerWebAuthn,
  authenticateWebAuthn,
  hasRegisteredCredential,
  removeCredential,
} from '@/lib/webAuthn';
import { toast } from 'sonner';

export function useWebAuthn() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = isWebAuthnSupported();
    setIsSupported(supported);
    if (supported) setIsRegistered(hasRegisteredCredential());
  }, []);

  const register = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      await registerWebAuthn();
      setIsRegistered(true);
      toast.success('ورود بیومتریک فعال شد');
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'خطا در فعال‌سازی';
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const ok = await authenticateWebAuthn();
      return ok;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'احراز هویت ناموفق';
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(() => {
    removeCredential();
    setIsRegistered(false);
    toast.success('ورود بیومتریک غیرفعال شد');
  }, []);

  return { isSupported, isRegistered, loading, register, authenticate, disable };
}
