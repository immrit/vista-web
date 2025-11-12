'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '@/lib/audio/NotificationSounds';

export function SoundToggle() {
  const [isMuted, setIsMuted] = useState(soundManager.muted);

  // Sync state with soundManager
  useEffect(() => {
    setIsMuted(soundManager.muted);
  }, []);

  const handleToggle = () => {
    const newState = soundManager.toggleMute();
    setIsMuted(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title={isMuted ? 'فعال کردن صدا' : 'خاموش کردن صدا'}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-zinc-500" />
      ) : (
        <Volume2 className="w-5 h-5 text-blue-600" />
      )}
    </button>
  );
}



