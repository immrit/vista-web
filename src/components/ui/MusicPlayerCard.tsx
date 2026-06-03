'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Music } from 'lucide-react';

interface MusicPlayerCardProps {
    src: string;
    title?: string;
    artist?: string;
    coverUrl?: string;
    postId: string;
    onPlayStateChange?: (isPlaying: boolean, src: string) => void;
    externalIsPlaying?: boolean; // controlled from outside (mini player)
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTrackInfo(src: string, title?: string, artist?: string) {
    let resolvedTitle = title?.trim() || '';
    let resolvedArtist = artist?.trim() || '';

    if (!resolvedTitle) {
        try {
            const url = new URL(src);
            const lastSegment = url.pathname.split('/').pop() || '';
            const withoutExt = lastSegment.replace(/\.[^.]+$/, '');
            const normalized = withoutExt
                .replace(/^[^_]+_[0-9]+_/, '')
                .replace(/_/g, ' ')
                .trim();
            resolvedTitle = normalized || 'موزیک';
        } catch {
            resolvedTitle = 'موزیک';
        }
    }

    // Try to split "Artist - Title" from title
    if (!resolvedArtist && resolvedTitle) {
        const separators = [' - ', ' | ', ' / '];
        for (const sep of separators) {
            const idx = resolvedTitle.indexOf(sep);
            if (idx > 0) {
                resolvedArtist = resolvedTitle.substring(0, idx).trim();
                resolvedTitle = resolvedTitle.substring(idx + sep.length).trim();
                break;
            }
        }
    }

    return { title: resolvedTitle || 'موزیک', artist: resolvedArtist };
}

// Waveform bars component
function WaveformBars({ progress, isPlaying }: { progress: number; isPlaying: boolean }) {
    const bars = 40;
    return (
        <div className="flex items-end gap-[2px] h-10 w-full cursor-pointer">
            {Array.from({ length: bars }).map((_, i) => {
                const filled = i / bars <= progress;
                // Random-ish but stable heights for visual effect
                const heights = [60, 80, 45, 90, 55, 70, 40, 85, 65, 75, 50, 95, 60, 70, 45, 80, 55, 90, 65, 75, 50, 85, 60, 70, 45, 95, 55, 80, 65, 75, 40, 90, 60, 70, 50, 85, 55, 80, 65, 75];
                const height = heights[i % heights.length];
                return (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-100 ${
                            filled 
                                ? 'bg-orange-500' 
                                : 'bg-white/25 dark:bg-white/15'
                        } ${isPlaying && filled ? 'animate-[waveform_0.6s_ease-in-out_infinite_alternate]' : ''}`}
                        style={{
                            height: `${height}%`,
                            animationDelay: `${i * 15}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}

export function MusicPlayerCard({
    src,
    title,
    artist,
    coverUrl,
    postId,
    onPlayStateChange,
    externalIsPlaying,
}: MusicPlayerCardProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const seekRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { title: resolvedTitle, artist: resolvedArtist } = parseTrackInfo(src, title, artist);

    const progress = duration > 0 ? currentTime / duration : 0;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            onPlayStateChange?.(false, src);
        };
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('loadedmetadata', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('loadedmetadata', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [src, onPlayStateChange]);

    // Handle external pause (e.g. another track started)
    useEffect(() => {
        if (externalIsPlaying === false && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    }, [externalIsPlaying]);

    const togglePlay = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            onPlayStateChange?.(false, src);
        } else {
            setIsLoading(true);
            try {
                await audio.play();
                setIsPlaying(true);
                onPlayStateChange?.(true, src);
            } catch (e) {
                console.error('Audio play failed:', e);
            } finally {
                setIsLoading(false);
            }
        }
    }, [isPlaying, src, onPlayStateChange]);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const bar = seekRef.current;
        if (!audio || !bar || !duration) return;

        const rect = bar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = pct * duration;
        setCurrentTime(pct * duration);
    }, [duration]);

    const toggleMute = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    const skipBackward = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    };

    const skipForward = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-rose-600 to-purple-700 dark:from-orange-700 dark:via-rose-700 dark:to-purple-800 p-0.5 shadow-xl shadow-orange-500/20">
            <div className="rounded-[14px] bg-zinc-900/95 backdrop-blur-sm">
                {/* Hidden audio element */}
                <audio ref={audioRef} src={src} preload="metadata" />

                {/* Main content */}
                <div className="flex gap-4 p-4">
                    {/* Cover art */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center ${isPlaying ? 'ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-900' : ''}`}>
                            {coverUrl ? (
                                <img
                                    src={coverUrl}
                                    alt={resolvedTitle}
                                    className={`w-full h-full object-cover transition-all duration-300 ${isPlaying ? 'scale-110' : 'scale-100'}`}
                                />
                            ) : (
                                <div className={`flex items-center justify-center w-full h-full ${isPlaying ? 'animate-spin-slow' : ''}`}>
                                    <Music className="w-8 h-8 text-white/80" />
                                </div>
                            )}
                        </div>
                        {isPlaying && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                        )}
                    </div>

                    {/* Track info + controls */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-2">
                            <h4 className="text-white font-semibold text-sm truncate leading-tight">{resolvedTitle}</h4>
                            {resolvedArtist && (
                                <p className="text-white/60 text-xs mt-0.5 truncate">{resolvedArtist}</p>
                            )}
                        </div>

                        {/* Waveform / seek area */}
                        <div
                            ref={seekRef}
                            onClick={handleSeek}
                            className="mb-2 cursor-pointer"
                        >
                            <WaveformBars progress={progress} isPlaying={isPlaying} />
                        </div>

                        {/* Time row */}
                        <div className="flex items-center justify-between text-[10px] text-white/50 mb-2">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>

                {/* Controls bar */}
                <div className="flex items-center justify-between px-4 pb-3">
                    {/* Left: mute */}
                    <button
                        onClick={toggleMute}
                        className="p-1.5 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    >
                        {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                        ) : (
                            <Volume2 className="w-4 h-4" />
                        )}
                    </button>

                    {/* Center: skip back, play/pause, skip forward */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={skipBackward}
                            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            title="۱۰ ثانیه به عقب"
                        >
                            <SkipBack className="w-4 h-4" />
                        </button>

                        <button
                            onClick={togglePlay}
                            disabled={isLoading}
                            className="w-11 h-11 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 flex items-center justify-center text-white hover:from-orange-400 hover:to-rose-400 transition-all duration-200 shadow-lg shadow-orange-500/40 active:scale-95 disabled:opacity-60"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={skipForward}
                            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            title="۱۰ ثانیه به جلو"
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right: soundcloud-style badge */}
                    <div className="text-[9px] font-bold text-orange-400/70 tracking-wider uppercase">
                        Vista
                    </div>
                </div>

                {/* Progress bar (thin) */}
                <div className="h-0.5 bg-white/10 mx-0">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
