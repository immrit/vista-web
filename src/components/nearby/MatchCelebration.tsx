'use client';

import { NearbyMatch } from '@/lib/nearbyApi';
import { MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOpenMatchChat } from '@/hooks/useNearby';
import { toast } from 'sonner';

interface MatchCelebrationProps {
  match: NearbyMatch;
  myAvatarUrl?: string;
  onDismiss: () => void;
}

export function MatchCelebration({ match, myAvatarUrl, onDismiss }: MatchCelebrationProps) {
  const router = useRouter();
  const openChat = useOpenMatchChat();

  const handleChat = async () => {
    try {
      const res = await openChat.mutateAsync(match.match_id);
      onDismiss();
      router.push(`/messages?id=${res.conversation_id}`);
    } catch {
      toast.error('خطا در باز کردن چت');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 animate-pop">
        {/* Floating hearts */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 80}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${0.8 + Math.random() * 0.8}s`,
                opacity: 0.7,
              }}
            >
              ❤️
            </span>
          ))}
        </div>

        <h1 className="text-white text-4xl font-black text-center drop-shadow-lg">
          🎉 متچ شدید!
        </h1>

        {/* Avatars */}
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-2xl overflow-hidden">
            {myAvatarUrl ? (
              <img src={myAvatarUrl} alt="شما" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-vista-gradient" />
            )}
          </div>
          <span className="text-4xl">💝</span>
          <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-2xl overflow-hidden">
            {match.avatar_url ? (
              <img src={match.avatar_url} alt={match.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-vista-gradient flex items-center justify-center text-white text-3xl font-bold">
                {(match.full_name || match.username || '؟').charAt(0)}
              </div>
            )}
          </div>
        </div>

        <p className="text-white/90 text-xl text-center">
          شما و <span className="font-bold">{match.full_name || match.username}</span> به هم علاقه‌مندید!
        </p>

        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={handleChat}
            disabled={openChat.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-vista-primary font-bold py-3.5 rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>شروع مکالمه</span>
          </button>
          <button
            onClick={onDismiss}
            className="w-14 flex items-center justify-center bg-white/20 text-white rounded-2xl hover:bg-white/30 transition-colors"
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
