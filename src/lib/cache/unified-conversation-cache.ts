import { cacheSystem } from '@/lib/cache/advanced-cache';
import { createClient } from '@/lib/supabase/server';
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
    if (cached && cached.length > 0) {
      return cached;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
            id,
            user1_id,
            user2_id,
            last_message,
            last_message_time,
            unread_count,
            created_at,
            updated_at,
            profiles:profiles!conversations_other_user_id_fkey(
              id,
              username,
              full_name,
              avatar_url
            )
          `,
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      const conversations: Conversation[] = data.map(conv => {
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
        const profile = Array.isArray(conv.profiles) ? conv.profiles[0] : conv.profiles;
        return {
          id: conv.id,
          otherUserId,
          otherUserName: profile?.full_name || profile?.username || 'Unknown',
          otherUserAvatar: profile?.avatar_url,
          lastMessage: conv.last_message,
          lastMessageTime: conv.last_message_time,
          unreadCount: conv.unread_count ?? 0,
          isTyping: false,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        };
      });

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

  async updateConversationCache(
    userId: string,
    conversationId: string,
    updates: Partial<Conversation>,
  ): Promise<void> {
    const cacheKey = `conversations:${userId}`;
    const cached = await cacheSystem.get<Conversation[]>(cacheKey);
    if (!cached) {
      return;
    }

    const updated = cached
      .map(conversation =>
        conversation.id === conversationId
          ? { ...conversation, ...updates, updatedAt: new Date().toISOString() }
          : conversation,
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    await cacheSystem.set(cacheKey, updated, { ttl: 120 });
  }

  async clearConversationCache(userId: string): Promise<void> {
    await cacheSystem.invalidate(`conversations:${userId}`);
  }
}

export const conversationCache = UnifiedConversationCacheService.getInstance();


