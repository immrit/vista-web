'use client';

import { NearbyMatch } from '@/lib/nearbyApi';
import { useNearbyMatches, useOpenMatchChat, useUnmatch } from '@/hooks/useNearby';
import { useRouter } from 'next/navigation';
import { MessageCircle, Trash2, CheckCircle, Loader2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/theme/cn';

export function NearbyMatchesList() {
  const { data: matches, isLoading, refetch } = useNearbyMatches();
  const openChat = useOpenMatchChat();
  const unmatch = useUnmatch();
  const router = useRouter();
  const [confirmUnmatch, setConfirmUnmatch] = useState<string | null>(null);

  const handleChat = async (match: NearbyMatch) => {
    try {
      const res = await openChat.mutateAsync(match.match_id);
      router.push(`/messages?id=${res.conversation_id}`);
    } catch {
      toast.error('خطا در باز کردن چت');
    }
  };

  const handleUnmatch = async (matchId: string) => {
    try {
      await unmatch.mutateAsync(matchId);
      setConfirmUnmatch(null);
      toast.success('آن‌متچ شد');
      refetch();
    } catch {
      toast.error('خطا');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-vista-primary" />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-8">
        <UserX className="w-16 h-16 text-vista-text-secondary/30 mb-4" />
        <p className="text-vista-text-secondary dark:text-vista-text-secondary-dark">
          هنوز متچی ندارید. شروع به سوایپ کنید!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {matches.map(match => (
        <div
          key={match.match_id}
          className="relative bg-vista-surface dark:bg-vista-surface-dark rounded-2xl overflow-hidden shadow-sm border border-vista-border dark:border-vista-border-dark"
        >
          {match.avatar_url ? (
            <img src={match.avatar_url} alt={match.full_name} className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-vista-gradient flex items-center justify-center">
              <span className="text-white text-4xl font-bold">
                {(match.full_name || match.username || '؟').charAt(0)}
              </span>
            </div>
          )}

          {match.is_verified && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-vista-primary drop-shadow" />
            </div>
          )}

          <div className="p-3">
            <p className="font-semibold text-sm truncate">{match.full_name || match.username}</p>
            <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate mb-3">
              @{match.username}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleChat(match)}
                className="flex-1 flex items-center justify-center gap-1 bg-vista-gradient text-white text-xs font-semibold py-2 rounded-xl shadow-sm shadow-vista-primary/25 hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>چت</span>
              </button>
              <button
                onClick={() => setConfirmUnmatch(match.match_id)}
                className="w-8 flex items-center justify-center rounded-xl bg-vista-error/10 text-vista-error hover:bg-vista-error/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Confirm unmatch */}
          {confirmUnmatch === match.match_id && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl">
              <p className="text-white text-sm text-center font-medium">آن‌متچ شوید؟</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUnmatch(match.match_id)}
                  className="bg-vista-error text-white text-xs px-3 py-1.5 rounded-xl font-semibold"
                >
                  بله
                </button>
                <button
                  onClick={() => setConfirmUnmatch(null)}
                  className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-xl"
                >
                  خیر
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
