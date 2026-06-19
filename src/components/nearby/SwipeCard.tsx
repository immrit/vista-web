'use client';

import { useRef, useState, useCallback } from 'react';
import { NearbyCandidate, getDistanceLabel } from '@/lib/nearbyApi';
import { MapPin, CheckCircle, Heart, X } from 'lucide-react';
import { cn } from '@/lib/theme/cn';

interface SwipeCardProps {
  candidate: NearbyCandidate;
  onSwipe: (candidate: NearbyCandidate, action: 'like' | 'pass') => void;
  isTop: boolean;
  stackIndex: number;
}

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.08;

export function SwipeCard({ candidate, onSwipe, isTop, stackIndex }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [decision, setDecision] = useState<'like' | 'pass' | null>(null);

  const getPoint = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isTop) return;
    startPos.current = getPoint(e);
    setIsDragging(true);
  }, [isTop]);

  const onMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPos.current || !isDragging) return;
    const pt = getPoint(e);
    const dx = pt.x - startPos.current.x;
    const dy = pt.y - startPos.current.y;
    setOffset({ x: dx, y: dy });
    if (Math.abs(dx) > 30) {
      setDecision(dx > 0 ? 'like' : 'pass');
    } else {
      setDecision(null);
    }
  }, [isDragging]);

  const onEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(offset.x) > SWIPE_THRESHOLD) {
      const action = offset.x > 0 ? 'like' : 'pass';
      const exitX = action === 'like' ? 600 : -600;
      setOffset({ x: exitX, y: offset.y });
      setTimeout(() => onSwipe(candidate, action), 200);
    } else {
      setOffset({ x: 0, y: 0 });
      setDecision(null);
    }
    startPos.current = null;
  }, [isDragging, offset, candidate, onSwipe]);

  const rotate = isDragging ? offset.x * ROTATION_FACTOR : 0;
  const scale = isTop ? 1 : Math.max(0.9, 1 - stackIndex * 0.05);
  const translateY = isTop ? 0 : stackIndex * -8;

  const likeOpacity = Math.min(1, Math.max(0, offset.x / SWIPE_THRESHOLD));
  const passOpacity = Math.min(1, Math.max(0, -offset.x / SWIPE_THRESHOLD));

  const genderLabel = candidate.gender === 'male' ? 'مرد' : candidate.gender === 'female' ? 'زن' : '';
  const maritalLabel =
    candidate.marital_status === 'single' ? 'مجرد' :
    candidate.marital_status === 'married' ? 'متأهل' : '';

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute inset-0 cursor-grab active:cursor-grabbing select-none touch-none',
        !isTop && 'pointer-events-none'
      )}
      style={{
        transform: `translateX(${offset.x}px) translateY(${translateY + offset.y * 0.3}px) rotate(${rotate}deg) scale(${scale})`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 10 - stackIndex,
      }}
      onMouseDown={onStart}
      onMouseMove={onMove}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
        {/* Avatar / background */}
        {candidate.avatar_url ? (
          <img
            src={candidate.avatar_url}
            alt={candidate.full_name}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-vista-gradient flex items-center justify-center">
            <span className="text-white text-8xl font-bold opacity-30">
              {(candidate.full_name || candidate.username || '؟').charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Like / Pass overlays */}
        {isTop && (
          <>
            <div
              className="absolute top-8 right-8 bg-vista-success/90 text-white font-black text-3xl px-5 py-2 rounded-2xl border-4 border-vista-success rotate-[-15deg] shadow-lg"
              style={{ opacity: likeOpacity }}
            >
              لایک ❤️
            </div>
            <div
              className="absolute top-8 left-8 bg-vista-error/90 text-white font-black text-3xl px-5 py-2 rounded-2xl border-4 border-vista-error rotate-[15deg] shadow-lg"
              style={{ opacity: passOpacity }}
            >
              رد ✕
            </div>
          </>
        )}

        {/* Info */}
        <div className="absolute bottom-0 inset-x-0 p-6 text-white">
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-2xl font-bold leading-tight">
              {candidate.full_name || candidate.username}
            </h2>
            {candidate.age > 0 && (
              <span className="text-xl text-white/80 mb-0.5">{candidate.age}</span>
            )}
            {candidate.is_verified && (
              <CheckCircle className="w-5 h-5 text-vista-primary mb-0.5 flex-shrink-0" />
            )}
          </div>

          {(genderLabel || maritalLabel) && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {genderLabel && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  {genderLabel}
                </span>
              )}
              {maritalLabel && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  {maritalLabel}
                </span>
              )}
            </div>
          )}

          {candidate.bio && (
            <p className="text-white/80 text-sm line-clamp-2 mb-2">{candidate.bio}</p>
          )}

          {candidate.distance_km > 0 && (
            <div className="flex items-center gap-1 text-white/70 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{getDistanceLabel(candidate.distance_km)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (only on top card when not dragging) */}
      {isTop && !isDragging && (
        <div className="absolute -bottom-16 inset-x-0 flex justify-center gap-6">
          <button
            onClick={() => onSwipe(candidate, 'pass')}
            className="w-14 h-14 rounded-full bg-white dark:bg-vista-surface-dark shadow-xl flex items-center justify-center text-vista-error hover:scale-110 transition-transform active:scale-95"
            aria-label="رد"
          >
            <X className="w-7 h-7" strokeWidth={3} />
          </button>
          <button
            onClick={() => onSwipe(candidate, 'like')}
            className="w-16 h-16 rounded-full bg-vista-gradient shadow-xl shadow-vista-primary/40 flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
            aria-label="لایک"
          >
            <Heart className="w-8 h-8 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
}
