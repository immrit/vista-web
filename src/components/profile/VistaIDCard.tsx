'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { Profile } from '@/lib/types';
import { toast } from 'sonner';

interface VistaIDCardProps {
  profile: Profile;
  onClose: () => void;
}

export function VistaIDCard({ profile, onClose }: VistaIDCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://cafevista.ir'}/profile/${profile.username}`;

  useEffect(() => {
    const encoded = encodeURIComponent(profileUrl);
    setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&color=6366F1&bgcolor=ffffff&margin=2`);
  }, [profileUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('لینک کپی شد');
    } catch {
      toast.error('خطا در کپی');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `پروفایل ${profile.full_name || profile.username} در ویستا`,
          url: profileUrl,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Card */}
        <div ref={cardRef}>
          {/* Gradient header */}
          <div className="bg-vista-gradient pt-8 pb-16 px-6 text-white text-center relative">
            <p className="text-xs font-bold tracking-widest opacity-80 mb-3">VISTA</p>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-white/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold mx-auto ring-4 ring-white/30">
                {(profile.full_name || profile.username || '?').charAt(0)}
              </div>
            )}
            <h2 className="mt-3 text-lg font-bold">{profile.full_name || profile.username}</h2>
            <p className="text-white/70 text-sm">@{profile.username}</p>
            {profile.is_verified && (
              <span className="mt-1 inline-block text-xs bg-white/20 px-2 py-0.5 rounded-full">✓ تأیید شده</span>
            )}
          </div>

          {/* White card bottom with QR */}
          <div className="relative -mt-10 mx-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5 text-center">
            {/* Stats row */}
            <div className="flex justify-center gap-8 mb-4">
              {[
                { n: profile.posts_count ?? 0, l: 'پست' },
                { n: profile.followers_count ?? 0, l: 'دنبال‌کننده' },
                { n: profile.following_count ?? 0, l: 'دنبال‌شونده' },
              ].map(({ n, l }) => (
                <div key={l} className="text-center">
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">{n.toLocaleString('fa-IR')}</p>
                  <p className="text-[10px] text-zinc-500">{l}</p>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-center mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  width={140}
                  height={140}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-[140px] h-[140px] rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 mb-1 font-mono break-all" dir="ltr">{profileUrl}</p>
          </div>

          <div className="px-4 py-4 mb-2" />
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-5 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-vista-border dark:border-vista-border-dark text-sm font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'کپی شد' : 'کپی لینک'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-vista-gradient text-white text-sm font-medium transition-opacity hover:opacity-90"
          >
            <Share2 className="w-4 h-4" />
            اشتراک‌گذاری
          </button>
        </div>
      </div>
    </div>
  );
}
