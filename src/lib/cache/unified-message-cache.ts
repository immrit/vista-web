import { apiClient } from '@/lib/apiClient';
import { cacheSystem } from '@/lib/cache/advanced-cache';
import type { Message } from '@/lib/models/message';

export class UnifiedMessageCacheService {
  private static instance: UnifiedMessageCacheService;
  private maxMessagesPerConversation = 100;

  private constructor() {}

  static getInstance(): UnifiedMessageCacheService {
    if (!this.instance) {
      this.instance = new UnifiedMessageCacheService();
    }
    return this.instance;
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const cacheKey = `messages:${conversationId}`;
    const cached = await cacheSystem.get<Message[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached.map(message => ({ ...message, isMe: message.senderId === userId }));
    }

    try {
      const response = await apiClient.get<{ messages?: any[] }>(
        `/v1/chat/conversations/${conversationId}/messages?limit=${this.maxMessagesPerConversation}`,
      );
      const messages: Message[] = (response.messages || []).map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content || '',
        attachmentUrl: msg.attachment_url || msg.media_url || null,
        attachmentType: msg.attachment_type || msg.message_type || null,
        replyToId: msg.reply_to_message_id || null,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at || msg.edited_at || null,
        isDelivered: msg.is_delivered ?? false,
        isRead: msg.is_read ?? msg.is_seen ?? false,
        isSent: true,
        isMe: msg.sender_id === userId,
        reactions: msg.reactions ?? [],
      })).reverse();

      await cacheSystem.set(cacheKey, messages, { ttl: 300 });
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async cacheMessage(message: Message): Promise<void> {
    const cacheKey = `messages:${message.conversationId}`;
    const cached = (await cacheSystem.get<Message[]>(cacheKey)) ?? [];
    await cacheSystem.set(cacheKey, [message, ...cached].slice(0, this.maxMessagesPerConversation), { ttl: 300 });
  }

  async updateMessageStatus(conversationId: string, messageId: string, updates: Partial<Message>): Promise<void> {
    const cacheKey = `messages:${conversationId}`;
    const cached = await cacheSystem.get<Message[]>(cacheKey);
    if (!cached) return;

    await cacheSystem.set(cacheKey, cached.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg), { ttl: 300 });
  }

  async clearConversationMessages(conversationId: string): Promise<void> {
    await cacheSystem.invalidate(`messages:${conversationId}`);
  }

  async clearAllCache(): Promise<void> {
    await cacheSystem.invalidatePattern('messages:');
  }
}

export const messageCache = UnifiedMessageCacheService.getInstance();
