export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: 'image' | 'video' | 'audio' | 'file' | null;
  replyToId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isDelivered: boolean;
  isRead: boolean;
  isSent: boolean;
  isMe: boolean;
  reactions?: MessageReaction[];
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  isTyping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: string;
}





