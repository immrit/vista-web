'use client';

import { useEffect } from 'react';
import { sessionManager } from '@/lib/services/sessionService';

export default function SessionInitializer() {
  useEffect(() => {
    sessionManager.initialize().catch(error => {
      console.error('[SessionInitializer] Failed to initialize session:', error);
    });
  }, []);

  return null;
}
