'use client';

import { X, Music, Video, Image, Play, Pause } from 'lucide-react';
import { useState } from 'react';

interface FilePreviewProps {
    type: 'image' | 'video' | 'music';
    url: string;
    onRemove?: () => void;
    className?: string;
}

export function FilePreview({ type, url, onRemove, className = '' }: FilePreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

    const getIcon = () => {
        switch (type) {
            case 'image':
                return <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case 'video':
                return <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
            case 'music':
                return <Music className="w-5 h-5 text-green-600 dark:text-green-400" />;
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'image':
                return 'تصویر';
            case 'video':
                return 'ویدیو';
            case 'music':
                return 'موسیقی';
        }
    };

    const getTypeColor = () => {
        switch (type) {
            case 'image':
                return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800';
            case 'video':
                return 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800';
            case 'music':
                return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
        }
    };

    const handleAudioPlayPause = () => {
        if (audioRef) {
            if (isPlaying) {
                audioRef.pause();
            } else {
                audioRef.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    return (
        <div className={`relative group ${className}`}>
            {type === 'image' && (
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <img
                        src={url}
                        alt="uploaded"
                        className="w-full max-h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {type === 'video' && (
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <video
                        src={url}
                        controls
                        className="w-full max-h-48 object-cover"
                    >
                        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                    </video>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {type === 'music' && (
                <div className={`bg-gradient-to-r ${getTypeColor()} p-4 rounded-xl border transition-all duration-300 hover:shadow-lg`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                                {getIcon()}
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {getTypeLabel()} آپلود شد
                                </span>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    آماده برای پخش
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAudioPlayPause}
                                className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                            >
                                {isPlaying ? (
                                    <Pause className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Play className="w-4 h-4 text-green-600" />
                                )}
                            </button>
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <audio
                        ref={setAudioRef}
                        onEnded={handleAudioEnded}
                        className="w-full"
                        controls
                    >
                        <source src={url} type="audio/mpeg" />
                        مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                    </audio>
                </div>
            )}
        </div>
    );
} 