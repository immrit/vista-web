import { apiClient } from '@/lib/apiClient';
import { cacheSystem } from '@/lib/cache/advanced-cache';
import type { Conversation } from '@/lib/models/message';

export class UnifiedConversationCacheService {
  private static instance: UnifiedConversationCacheService;

  private constructor() {}

  static getInstance(): UnifiedConversationCacheService {
    if (!this.instance) {
      this.instance = new UnifiedConversationCacheService();
    }
    return this.instance;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const cacheKey = `conversations:${userId}`;
    const cached = await cacheSystem.get<Conversation[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    try {
      const response = await apiClient.get<any>('/v1/chat/conversations?limit=50');
      const raw = Array.isArray(response) ? response : response.conversations || [];
      const conversations: Conversation[] = raw.map((conv: any) => ({
        id: conv.id,
        otherUserId: conv.peer_id || conv.other_user_id || '',
        otherUserName: conv.name || conv.other_user_name || 'Unknown',
        otherUserAvatar: conv.image || conv.avatar_url || null,
        lastMessage: conv.last_message_text || conv.last_message || null,
        lastMessageTime: conv.last_message_at || conv.last_message_time || null,
        unreadCount: conv.unread_count ?? 0,
        isTyping: false,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at || conv.last_message_at || conv.created_at,
      }));

      await cacheSystem.set(cacheKey, conversations, { ttl: 120 });
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversations = await this.getConversations(userId);
    return conversations.find(conversation => conversation.id === conversationId) ?? null;
  }

  async updateConversationCache(userId: string, conversationId: string, updates: Partial<Conversation>): Promise<void> {
    const cacheKey = `conversations:${userId}`;
    const cached = await cacheSystem.get<Conversation[]>(cacheKey);
    if (!cached) return;

    const updated = cached
      .map(conversation => conversation.id === conversationId ? { ...conversation, ...updates, updatedAt: new Date().toISOString() } : conversation)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    await cacheSystem.set(cacheKey, updated, { ttl: 120 });
  }

  async clearConversationCache(userId: string): Promise<void> {
    await cacheSystem.invalidate(`conversations:${userId}`);
  }
}

export const conversationCache = UnifiedConversationCacheService.getInstance();
