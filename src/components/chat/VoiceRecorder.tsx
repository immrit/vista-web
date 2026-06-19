'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface VoiceRecorderProps {
    isOpen: boolean;
    onClose: () => void;
    onRecordComplete: (file: File) => void;
}

const BAR_COUNT = 40;

export function VoiceRecorder({ isOpen, onClose, onRecordComplete }: VoiceRecorderProps) {
    const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playProgress, setPlayProgress] = useState(0);
    const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(4));
    const [staticBars, setStaticBars] = useState<number[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const recordedBarsRef = useRef<number[]>([]);
    const sampleCountRef = useRef(0);

    const animateWaveform = useCallback(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(data);
        // RMS amplitude
        const rms = Math.sqrt(data.reduce((s, v) => s + (v - 128) ** 2, 0) / data.length);
        const normalized = Math.min(100, rms * 3);

        recordedBarsRef.current.push(normalized);
        sampleCountRef.current++;

        setBars(prev => {
            const next = [...prev.slice(1), normalized];
            return next;
        });

        animFrameRef.current = requestAnimationFrame(animateWaveform);
    }, []);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtxRef.current = new AudioContext();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            const src = audioCtxRef.current.createMediaStreamSource(stream);
            src.connect(analyserRef.current);

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = e => { chunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioUrl(URL.createObjectURL(blob));
                chunksRef.current = [];
                // Downsample recorded bars to BAR_COUNT
                const rec = recordedBarsRef.current;
                if (rec.length > BAR_COUNT) {
                    const step = rec.length / BAR_COUNT;
                    const sampled = Array.from({ length: BAR_COUNT }, (_, i) => rec[Math.floor(i * step)] ?? 4);
                    setStaticBars(sampled);
                } else {
                    setStaticBars([...Array(BAR_COUNT - rec.length).fill(4), ...rec]);
                }
                recordedBarsRef.current = [];
                sampleCountRef.current = 0;
            };
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            recordedBarsRef.current = [];
            setIsRecording(true);
            setDuration(0);
            setBars(Array(BAR_COUNT).fill(4));
            animFrameRef.current = requestAnimationFrame(animateWaveform);
        } catch {
            alert('دسترسی به میکروفون ممکن نیست');
        }
    };

    const stopRecording = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        audioCtxRef.current?.close();
        setIsRecording(false);
    };

    const togglePlayback = () => {
        if (!audioRef.current || !audioUrl) return;
        if (isPlaying) { audioRef.current.pause(); }
        else { void audioRef.current.play(); }
        setIsPlaying(p => !p);
    };

    const handleSend = async () => {
        if (!audioUrl) return;
        const blob = await fetch(audioUrl).then(r => r.blob());
        onRecordComplete(new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
        handleReset();
        onClose();
    };

    const handleReset = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setDuration(0);
        setIsPlaying(false);
        setIsRecording(false);
        setPlayProgress(0);
        setBars(Array(BAR_COUNT).fill(4));
        setStaticBars([]);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const displayBars = isRecording ? bars : (staticBars.length ? staticBars : Array(BAR_COUNT).fill(4));

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { handleReset(); onClose(); }} />
            <div
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                aria-label="ضبط صدا"
                className={cn(
                'fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:max-w-sm',
                'bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-3xl z-50 shadow-2xl',
            )}>
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold">ضبط صدا</h3>
                    <button onClick={() => { handleReset(); onClose(); }} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Timer */}
                    <div className="text-center">
                        <div className="text-4xl font-mono font-bold tabular-nums">{formatTime(duration)}</div>
                        <p className="text-sm text-zinc-500 mt-1">
                            {isRecording ? 'در حال ضبط...' : audioUrl ? 'پیام صوتی ضبط شد' : 'آماده ضبط'}
                        </p>
                    </div>

                    {/* Waveform */}
                    <div className="flex items-center justify-center gap-0.5 h-16 px-2">
                        {displayBars.map((h, i) => {
                            const height = Math.max(4, Math.min(100, h));
                            const isActive = audioUrl && !isRecording
                                ? i <= Math.floor(playProgress * BAR_COUNT)
                                : isRecording;
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex-1 rounded-full transition-all',
                                        isActive ? 'bg-vista-primary' : 'bg-zinc-300 dark:bg-zinc-600',
                                    )}
                                    style={{ height: `${height}%` }}
                                />
                            );
                        })}
                    </div>

                    {/* Playback bar */}
                    {audioUrl && !isRecording && audioRef.current && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{formatTime(Math.floor((audioRef.current.currentTime || 0)))}</span>
                            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div className="h-full bg-vista-primary rounded-full" style={{ width: `${playProgress * 100}%` }} />
                            </div>
                            <span>{formatTime(duration)}</span>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-5">
                        {!audioUrl && !isRecording && (
                            <button
                                onClick={startRecording}
                                className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition"
                            >
                                <Mic className="w-9 h-9 text-white" />
                            </button>
                        )}
                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 bg-zinc-700 hover:bg-zinc-800 rounded-full flex items-center justify-center shadow-lg transition animate-pulse"
                            >
                                <Square className="w-8 h-8 text-white" />
                            </button>
                        )}
                        {audioUrl && !isRecording && (
                            <>
                                <button onClick={handleReset} className="w-14 h-14 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 rounded-full flex items-center justify-center transition">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </button>
                                <button onClick={togglePlayback} className="w-16 h-16 bg-vista-primary hover:bg-vista-secondary rounded-full flex items-center justify-center transition shadow-md">
                                    {isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white mr-0.5" />}
                                </button>
                                <button onClick={handleSend} className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition shadow-md">
                                    <Send className="w-6 h-6 text-white" />
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-xs text-center text-zinc-400">
                        {isRecording ? 'برای توقف، دکمه را بزنید' : audioUrl ? 'ارسال کنید یا دوباره ضبط کنید' : 'برای شروع ضبط، میکروفون را بزنید'}
                    </p>
                </div>

                {audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => { setIsPlaying(false); setPlayProgress(1); }}
                        onTimeUpdate={() => {
                            if (!audioRef.current) return;
                            const { currentTime, duration: d } = audioRef.current;
                            if (d > 0) setPlayProgress(currentTime / d);
                        }}
                        className="hidden"
                    />
                )}
            </div>
        </>
    );
}
