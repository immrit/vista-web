'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailSrc?: string;
  onLoad?: () => void;
}

export function ProgressiveImage({ 
  src, 
  alt, 
  className = '', 
  thumbnailSrc,
  onLoad 
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setCurrentSrc(null);

    // اگر thumbnail داریم، ابتدا thumbnail رو لود کن
    if (thumbnailSrc) {
      const thumbImg = new Image();
      thumbImg.onload = () => {
        setCurrentSrc(thumbnailSrc);
        
        // حالا original رو لود کن
        const fullImg = new Image();
        fullImg.onload = () => {
          setCurrentSrc(src);
          setLoading(false);
          onLoad?.();
        };
        fullImg.onerror = () => {
          setError(true);
          setLoading(false);
        };
        fullImg.src = src;
      };
      thumbImg.onerror = () => {
        // اگه thumbnail لود نشد، مستقیم original رو لود کن
        const fullImg = new Image();
        fullImg.onload = () => {
          setCurrentSrc(src);
          setLoading(false);
          onLoad?.();
        };
        fullImg.onerror = () => {
          setError(true);
          setLoading(false);
        };
        fullImg.src = src;
      };
      thumbImg.src = thumbnailSrc;
    } else {
      // اگه thumbnail نداریم، مستقیم original رو لود کن
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setLoading(false);
        onLoad?.();
      };
      img.onerror = () => {
        setError(true);
        setLoading(false);
      };
      img.src = src;
    }
  }, [src, thumbnailSrc, onLoad]);

  if (error) {
    return (
      <div className={cn('bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center', className)}>
        <div className="text-center p-4">
          <svg
            className="w-8 h-8 text-gray-400 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-gray-500 dark:text-gray-400">خطا در بارگذاری تصویر</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            'w-full h-auto transition-all duration-300',
            loading ? 'blur-sm scale-105' : 'blur-0 scale-100'
          )}
          loading="lazy"
        />
      )}
      {loading && (
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}


