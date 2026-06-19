'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Mic, Image, Video, File, Smile } from 'lucide-react';
import { FileUploadSheet } from './FileUploadSheet';
import { VoiceRecorder } from './VoiceRecorder';
import { GifPicker } from './GifPicker';
import { useIsDark } from '@/hooks/useIsDark';
import { getChatTheme } from '@/lib/chat/chatTheme';

interface MessageInputProps {
  conversationId: string;
  replyToMessageId?: string | null;
  replyToContent?: string | null;
  editingMessageId?: string | null;
  editingContent?: string | null;
  onSend: (content: string, files?: File[], replyToId?: string | null, editingId?: string | null) => Promise<void>;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  onTyping?: (typing: boolean) => void;
}

export function MessageInput({
  conversationId,
  replyToMessageId,
  replyToContent,
  editingMessageId,
  editingContent,
  onSend,
  onCancelReply,
  onCancelEdit,
  onTyping,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showFileSheet, setShowFileSheet] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDark = useIsDark();
  const theme = getChatTheme(isDark);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  useEffect(() => {
    if (content.trim()) {
      onTyping?.(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 3000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [content, onTyping]);

  const handleSend = async () => {
    if (!content.trim() && selectedFiles.length === 0) return;

    const messageContent = content.trim();
    const replyId = replyToMessageId || null;
    const editId = editingMessageId || null;

    setContent('');
    setSelectedFiles([]);
    onCancelReply?.();
    onCancelEdit?.();
    textareaRef.current?.focus();

    try {
      await onSend(messageContent, selectedFiles, replyId, editId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`خطا در ارسال پیام: ${message}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    try {
      await onSend(gifUrl, [], replyToMessageId || null, null)
      onCancelReply?.()
    } catch { /* silent */ }
  }

  return (
    <div
      className="p-3 sm:p-4 border-t backdrop-blur-xl relative"
      style={{
        backgroundColor: theme.inputBg,
        borderColor: theme.inputBorder,
        boxShadow: theme.inputShadow,
      }}
    >
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10">
                {file.type.startsWith('image/') ? (
                  <Image className="w-7 h-7 text-indigo-500" />
                ) : file.type.startsWith('video/') ? (
                  <Video className="w-7 h-7 text-violet-500" />
                ) : (
                  <File className="w-7 h-7" style={{ color: theme.icon }} />
                )}
              </div>
              <button
                onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                aria-label="حذف فایل"
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {replyToMessageId && (
        <div className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 bg-vista-primary/10 border-r-2 border-vista-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-vista-primary">{'پاسخ'}</p>
            {replyToContent && (
              <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">{replyToContent}</p>
            )}
          </div>
          <button onClick={onCancelReply} aria-label="لغو پاسخ" className="p-1 rounded-lg hover:bg-vista-primary/10 flex-shrink-0">
            <X className="w-4 h-4 text-vista-primary" />
          </button>
        </div>
      )}

      {editingMessageId && (
        <div className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 bg-amber-500/10 border-r-2 border-amber-500">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{'ویرایش پیام'}</p>
            {editingContent && (
              <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">{editingContent}</p>
            )}
          </div>
          <button onClick={onCancelEdit} aria-label="لغو ویرایش" className="p-1 rounded-lg hover:bg-amber-500/10 flex-shrink-0">
            <X className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </button>
        </div>
      )}

      {showGifPicker && (
        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowFileSheet(true)}
          aria-label="پیوست فایل"
          className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" style={{ color: theme.icon }} />
        </button>
        <button
          onClick={() => setShowGifPicker(g => !g)}
          aria-label="انتخاب GIF"
          className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0 text-xs font-bold"
          style={{ color: showGifPicker ? '#6366F1' : theme.icon }}
        >
          <Smile className="w-5 h-5" />
        </button>

        <div
          className="flex-1 rounded-2xl px-4 py-2 border backdrop-blur-md"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', borderColor: theme.inputBorder }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingMessageId ? 'پیام را ویرایش کنید...' : 'پیام خود را بنویسید...'}
            className="w-full bg-transparent outline-none resize-none max-h-[120px] text-[15px]"
            style={{ color: theme.text }}
            rows={1}
          />
        </div>

        {content.trim() || selectedFiles.length > 0 ? (
          <button
            onClick={() => void handleSend()}
            aria-label="ارسال پیام"
            className="p-2.5 rounded-full transition flex-shrink-0 shadow-md"
            style={{ background: theme.myBubbleGradient }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            onClick={() => setShowVoiceRecorder(true)}
            aria-label="ضبط صدا"
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0"
          >
            <Mic className="w-5 h-5" style={{ color: theme.icon }} />
          </button>
        )}
      </div>

      <FileUploadSheet
        isOpen={showFileSheet}
        onClose={() => setShowFileSheet(false)}
        onFilesSelect={files => {
          setSelectedFiles(prev => [...prev, ...files]);
          setShowFileSheet(false);
        }}
      />

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
