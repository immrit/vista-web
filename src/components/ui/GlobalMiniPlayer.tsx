'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, ChevronUp, Music } from 'lucide-react';

interface TrackInfo {
    src: string;
    title: string;
    artist?: string;
    coverUrl?: string;
}

// Global state via module-level event target
const miniPlayerEvents = new EventTarget();

export function useMusicPlayer() {
    const startTrack = (track: TrackInfo) => {
        miniPlayerEvents.dispatchEvent(new CustomEvent('play', { detail: track }));
    };
    const stopTrack = () => {
        miniPlayerEvents.dispatchEvent(new CustomEvent('stop'));
    };
    return { startTrack, stopTrack };
}

export function GlobalMiniPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [track, setTrack] = useState<TrackInfo | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent).detail as TrackInfo;
            setTrack(detail);
            setCurrentTime(0);
            setTimeout(() => {
                audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
            }, 100);
        };
        const handleStop = () => {
            audioRef.current?.pause();
            setIsPlaying(false);
            setTrack(null);
        };

        miniPlayerEvents.addEventListener('play', handlePlay);
        miniPlayerEvents.addEventListener('stop', handleStop);
        return () => {
            miniPlayerEvents.removeEventListener('play', handlePlay);
            miniPlayerEvents.removeEventListener('stop', handleStop);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('loadedmetadata', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('loadedmetadata', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch {}
        }
    }, [isPlaying]);

    const progress = duration > 0 ? currentTime / duration : 0;

    const formatTime = (sec: number) => {
        if (isNaN(sec) || !isFinite(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!track) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${isExpanded ? 'bottom-0' : 'bottom-16 sm:bottom-0'}`}>
            <audio ref={audioRef} src={track.src} preload="auto" />

            {/* Progress bar at top */}
            <div className="h-0.5 bg-zinc-700">
                <div
                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-200"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>

            <div className="bg-zinc-900/95 backdrop-blur-md border-t border-white/10 px-4 py-2">
                <div className="max-w-screen-md mx-auto flex items-center gap-3">
                    {/* Cover */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                        {track.coverUrl ? (
                            <img src={track.coverUrl} alt={track.title} className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
                        ) : (
                            <Music className={`w-5 h-5 text-white ${isPlaying ? 'animate-pulse' : ''}`} />
                        )}
                    </div>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{track.title}</p>
                        {track.artist && (
                            <p className="text-white/50 text-xs truncate">{track.artist}</p>
                        )}
                    </div>

                    {/* Time */}
                    <div className="text-[11px] text-white/40 tabular-nums hidden sm:block">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePlay}
                            className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 hover:from-orange-400 hover:to-rose-400 transition-all active:scale-90"
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <button
                            onClick={() => {
                                audioRef.current?.pause();
                                setIsPlaying(false);
                                setTrack(null);
                            }}
                            className="p-1.5 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
