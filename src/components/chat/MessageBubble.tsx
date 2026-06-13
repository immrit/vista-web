'use client';

import { useMemo, useState } from 'react';
import { Check, CheckCheck, Clock, Reply, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Message } from '@/lib/models/message';
import { formatTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils';
import { useIsDark } from '@/hooks/useIsDark';
import { bubbleBorderRadius, getChatTheme } from '@/lib/chat/chatTheme';
import { escapeForPlainTextDisplay } from '@/lib/chat/security';
import { MessageReactions } from './MessageReactions';

interface MessageBubbleProps {
  message: Message;
  displayContent?: string;
  replyToMessage?: Message | null;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  conversationId: string;
  currentUserId: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

function ReadReceiptIcon({ message, color }: { message: Message; color: string }) {
  if (!message.isMe) return null;

  if (message.id.startsWith('temp_') || !message.isSent) {
    return <Clock className="w-3.5 h-3.5 opacity-70" style={{ color }} />;
  }

  if (!message.isSent && message.id.startsWith('temp_')) {
    return <AlertCircle className="w-3.5 h-3.5" style={{ color: '#F87171' }} />;
  }

  if (message.isRead) {
    return <CheckCheck className="w-3.5 h-3.5" style={{ color }} />;
  }

  if (message.isDelivered) {
    return <CheckCheck className="w-3.5 h-3.5 opacity-70" style={{ color }} />;
  }

  return <Check className="w-3.5 h-3.5 opacity-70" style={{ color }} />;
}

export function MessageBubble({
  message,
  displayContent,
  replyToMessage,
  onReply,
  onEdit,
  onDelete,
  conversationId,
  currentUserId,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isDark = useIsDark();
  const theme = getChatTheme(isDark);
  const isOwnMessage = message.senderId === currentUserId;

  const bodyText = displayContent ?? message.content;

  const radius = useMemo(
    () => bubbleBorderRadius(isOwnMessage, isFirstInGroup, isLastInGroup, theme.bubbleRadius, theme.bubbleMergedRadius),
    [isOwnMessage, isFirstInGroup, isLastInGroup, theme.bubbleRadius, theme.bubbleMergedRadius],
  );

  const reactionPayload = useMemo(
    () =>
      (message.reactions ?? []).reduce<Array<{ emoji: string; user_ids: string[] }>>((acc, reaction) => {
        const existing = acc.find(item => item.emoji === reaction.emoji);
        if (existing) {
          existing.user_ids.push(reaction.userId);
        } else {
          acc.push({ emoji: reaction.emoji, user_ids: [reaction.userId] });
        }
        return acc;
      }, []),
    [message.reactions],
  );

  return (
    <div
      className={cn('group flex w-full', isOwnMessage ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative max-w-[88%] sm:max-w-[78%] md:max-w-[68%]">
        {replyToMessage && (
          <div
            className={cn(
              'mb-1 px-3 py-2 rounded-xl text-xs border-r-[3px]',
              isOwnMessage ? 'mr-1 bg-white/15 border-white/40' : 'ml-1 bg-black/5 dark:bg-white/5 border-indigo-400',
            )}
          >
            <p className="font-semibold truncate opacity-90">
              {replyToMessage.senderId === currentUserId ? 'شما' : 'کاربر'}
            </p>
            <p className="truncate opacity-75">{escapeForPlainTextDisplay(replyToMessage.content)}</p>
          </div>
        )}

        <div
          className="px-3.5 py-2.5 break-words shadow-sm"
          style={{
            borderRadius: radius,
            background: isOwnMessage ? theme.myBubbleGradient : theme.otherBubble,
            color: isOwnMessage ? theme.myBubbleText : theme.otherBubbleText,
            boxShadow: isOwnMessage ? theme.myBubbleShadow : theme.otherBubbleShadow,
          }}
        >
          {message.attachmentUrl && (
            <div className="mb-2">
              {message.attachmentType === 'image' ? (
                <img
                  src={message.attachmentUrl}
                  alt=""
                  className="rounded-xl max-w-full h-auto max-h-72 object-cover"
                  loading="lazy"
                />
              ) : message.attachmentType === 'video' ? (
                <video src={message.attachmentUrl} controls className="rounded-xl max-w-full max-h-72" />
              ) : message.attachmentType === 'audio' ? (
                <audio src={message.attachmentUrl} controls className="max-w-full min-w-[220px]" />
              ) : (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sm"
                >
                  📎 دانلود فایل
                </a>
              )}
            </div>
          )}

          {bodyText && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{escapeForPlainTextDisplay(bodyText)}</p>
          )}

          <div
            className={cn(
              'flex items-center gap-1.5 mt-1.5 text-[11px]',
              isOwnMessage ? 'justify-end' : 'justify-start',
            )}
            style={{ color: isOwnMessage ? 'rgba(255,255,255,0.75)' : theme.secondaryText }}
          >
            {message.updatedAt && message.updatedAt !== message.createdAt && (
              <span className="opacity-70">ویرایش‌شده</span>
            )}
            <span>{formatTime(message.createdAt)}</span>
            <ReadReceiptIcon message={message} color={isOwnMessage ? theme.read : theme.secondaryText} />
          </div>
        </div>

        {reactionPayload.length > 0 && (
          <div className={cn('mt-1', isOwnMessage ? 'flex justify-end' : 'flex justify-start')}>
            <MessageReactions
              reactions={reactionPayload}
              messageId={message.id}
              conversationId={conversationId}
              currentUserId={currentUserId}
              isOwnMessage={isOwnMessage}
            />
          </div>
        )}

        {showActions && (
          <div
            className={cn(
              'absolute top-0 flex items-center gap-0.5 rounded-xl border p-0.5 z-20',
              'bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-700 shadow-lg backdrop-blur-sm',
              isOwnMessage ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2',
            )}
          >
            {onReply && (
              <button
                onClick={() => onReply(message.id)}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="پاسخ"
              >
                <Reply className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              </button>
            )}
            {isOwnMessage && onEdit && message.content && (
              <button
                onClick={() => onEdit(message.id)}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="ویرایش"
              >
                <Edit2 className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              </button>
            )}
            {isOwnMessage && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                title="حذف"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
