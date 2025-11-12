'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
    isOpen: boolean;
    onClose: () => void;
    onRecordComplete: (file: File) => void;
}

export function VoiceRecorder({ isOpen, onClose, onRecordComplete }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout>();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (isRecording && !isPaused) {
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording, isPaused]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = e => {
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                chunksRef.current = [];
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setDuration(0);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('خطا در دسترسی به میکروفون');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSend = async () => {
        if (!audioUrl) return;

        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

        onRecordComplete(file);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setDuration(0);
        setIsPlaying(false);
        setIsRecording(false);
        setIsPaused(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 animate-fadeIn" onClick={onClose} />

            {/* Modal */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 md:bottom-1/2 md:left-1/2 md:-translate-x-1/2 md:translate-y-1/2 md:max-w-md md:rounded-3xl',
                    'bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-3xl z-50 shadow-2xl',
                    'transform transition-transform duration-300',
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ضبط صدا</h3>
                    <button
                        onClick={() => {
                            handleReset();
                            onClose();
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Timer Display */}
                    <div className="text-center">
                        <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                            {formatTime(duration)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isRecording ? 'در حال ضبط...' : audioUrl ? 'ضبط شده' : 'آماده ضبط'}
                        </p>
                    </div>

                    {/* Waveform Animation (Simple) */}
                    {isRecording && (
                        <div className="flex items-center justify-center gap-1 h-20">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.random() * 60 + 20}px`,
                                        animationDelay: `${i * 50}ms`,
                                        animationDuration: '0.8s',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Playback Controls (when recording is done) */}
                    {audioUrl && !isRecording && (
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={togglePlayback}
                                className="w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition"
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 text-white" />
                                ) : (
                                    <Play className="w-8 h-8 text-white ml-1" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        {!audioUrl && !isRecording && (
                            <button
                                onClick={startRecording}
                                className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition shadow-lg"
                            >
                                <Mic className="w-10 h-10 text-white" />
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition shadow-lg"
                            >
                                <Square className="w-10 h-10 text-white" />
                            </button>
                        )}

                        {audioUrl && !isRecording && (
                            <>
                                <button
                                    onClick={handleReset}
                                    className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition"
                                >
                                    <Trash2 className="w-6 h-6 text-white" />
                                </button>

                                <button
                                    onClick={handleSend}
                                    className="w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition"
                                >
                                    <Send className="w-6 h-6 text-white" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Tips */}
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        {isRecording
                            ? 'برای توقف ضبط، دکمه توقف را بزنید'
                            : audioUrl
                              ? 'پیام صوتی را پخش کنید یا ارسال کنید'
                              : 'برای شروع ضبط، دکمه میکروفون را بزنید'}
                    </p>
                </div>

                {/* Hidden Audio Element for Playback */}
                {audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />
                )}
            </div>
        </>
    );
}


