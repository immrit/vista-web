import { cacheSystem } from '@/lib/cache/advanced-cache';
import { createClient } from '@/lib/supabase/server';
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
      return cached.map(message => ({
        ...message,
        isMe: message.senderId === userId,
      }));
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(this.maxMessagesPerConversation);

      if (error || !data) {
        return [];
      }

      const messages: Message[] = data.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        attachmentUrl: msg.attachment_url,
        attachmentType: msg.attachment_type,
        replyToId: msg.reply_to_message_id,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        isDelivered: msg.is_delivered ?? false,
        isRead: msg.is_read ?? false,
        isSent: true,
        isMe: msg.sender_id === userId,
        reactions: msg.reactions ?? [],
      }));

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
    const updated = [message, ...cached].slice(0, this.maxMessagesPerConversation);
    await cacheSystem.set(cacheKey, updated, { ttl: 300 });
  }

  async updateMessageStatus(
    conversationId: string,
    messageId: string,
    updates: Partial<Message>,
  ): Promise<void> {
    const cacheKey = `messages:${conversationId}`;
    const cached = await cacheSystem.get<Message[]>(cacheKey);
    if (!cached) {
      return;
    }

    const updated = cached.map(msg => (msg.id === messageId ? { ...msg, ...updates } : msg));
    await cacheSystem.set(cacheKey, updated, { ttl: 300 });
  }

  async clearConversationMessages(conversationId: string): Promise<void> {
    await cacheSystem.invalidate(`messages:${conversationId}`);
  }

  async clearAllCache(): Promise<void> {
    await cacheSystem.invalidatePattern('messages:');
  }
}

export const messageCache = UnifiedMessageCacheService.getInstance();

