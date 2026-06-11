'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile, X, Mic, Image, Video, File } from 'lucide-react';
import { FileUploadSheet } from './FileUploadSheet';
import { VoiceRecorder } from './VoiceRecorder';
import { useTypingIndicator } from '@/lib/hooks/use-typing-indicator';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MessageInputProps {
    conversationId: string;
    replyToMessageId?: string | null;
    editingMessageId?: string | null;
    onSend: (content: string, files?: File[], replyToId?: string | null, editingId?: string | null) => Promise<void>;
    onCancelReply?: () => void;
    onCancelEdit?: () => void;
}

export function MessageInput({
    conversationId,
    replyToMessageId,
    editingMessageId,
    onSend,
    onCancelReply,
    onCancelEdit,
}: MessageInputProps) {
    const [content, setContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showFileSheet, setShowFileSheet] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { profile } = useAuth();
    const { setTyping } = useTypingIndicator({ conversationId, userId: profile?.id || '' });

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }, [content]);

    // Send typing indicator
    useEffect(() => {
        if (content.trim() && !isTyping) {
            setIsTyping(true);
            setTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [content, isTyping, setTyping]);

    const handleSend = async () => {
        if (!content.trim() && selectedFiles.length === 0) return;

        const messageContent = content.trim();
        const replyId = replyToMessageId || null;
        const editId = editingMessageId || null;

        // Clear input immediately for better UX (optimistic update handles the message display)
        setContent('');
        setSelectedFiles([]);
        if (replyId) onCancelReply?.();
        if (editId) onCancelEdit?.();
        textareaRef.current?.focus();

        try {
            await onSend(messageContent, selectedFiles, replyId, editId);
        } catch (error: any) {
            const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
            console.error('Error sending message:', errorMessage);
            alert(`خطا در ارسال پیام: ${errorMessage}`);
            // Optionally restore content on error
            // setContent(messageContent);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative flex-shrink-0">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                                {file.type.startsWith('image/') ? (
                                    <Image className="w-8 h-8 text-blue-500" />
                                ) : file.type.startsWith('video/') ? (
                                    <Video className="w-8 h-8 text-purple-500" />
                                ) : (
                                    <File className="w-8 h-8 text-gray-500" />
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Preview */}
            {replyToMessageId && (
                <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                    <div className="text-xs text-blue-600 dark:text-blue-400">در حال پاسخ به پیام...</div>
                    <button onClick={onCancelReply} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Edit Preview */}
            {editingMessageId && (
                <div className="mb-2 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">در حال ویرایش پیام...</div>
                    <button onClick={onCancelEdit} className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input Container */}
            <div className="flex items-end gap-2">
                {/* Attachment Button */}
                <button
                    onClick={() => setShowFileSheet(true)}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition flex-shrink-0"
                >
                    <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Textarea */}
                <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl px-4 py-2">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={editingMessageId ? 'پیام را ویرایش کنید...' : 'پیام خود را بنویسید...'}
                        className="w-full bg-transparent outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 max-h-[120px]"
                        rows={1}
                    />
                </div>

                {/* Send/Voice Button */}
                {content.trim() || selectedFiles.length > 0 ? (
                    <button
                        onClick={handleSend}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-full transition flex-shrink-0"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                ) : (
                    <button
                        onClick={() => setShowVoiceRecorder(true)}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition flex-shrink-0"
                    >
                        <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                )}
            </div>

            {/* File Upload Sheet */}
            <FileUploadSheet
                isOpen={showFileSheet}
                onClose={() => setShowFileSheet(false)}
                onFilesSelect={files => {
                    setSelectedFiles(prev => [...prev, ...files]);
                    setShowFileSheet(false);
                }}
            />

            {/* Voice Recorder */}
            <VoiceRecorder
                isOpen={showVoiceRecorder}
                onClose={() => setShowVoiceRecorder(false)}
                onRecordComplete={audioFile => {
                    setSelectedFiles(prev => [...prev, audioFile]);
                    setShowVoiceRecorder(false);
                }}
            />
        </div>
    );
}
