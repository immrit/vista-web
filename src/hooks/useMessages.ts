'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/lib/models/message';
import { soundManager } from '@/lib/audio/NotificationSounds';

interface UseMessagesOptions {
    conversationId: string;
    currentUserId: string;
}

export function useMessages({ conversationId, currentUserId }: UseMessagesOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const previousMessagesCountRef = useRef<number>(0);
    const isInitialLoadRef = useRef<boolean>(true);

    // Fetch conversation details
    useEffect(() => {
        if (!conversationId) return;

        const fetchConversation = async () => {
            try {
                // Fetch conversation
                const { data: conversationData, error: conversationError } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('id', conversationId)
                    .single();

                if (conversationError) throw conversationError;

                // Fetch participants separately
                const { data: participants, error: participantsError } = await supabase
                    .from('conversation_participants')
                    .select('user_id, is_muted, joined_at')
                    .eq('conversation_id', conversationId);

                if (participantsError) throw participantsError;

                // Get user IDs from participants
                const userIds = participants?.map(p => p.user_id).filter(Boolean) || [];
                
                // Fetch profiles for participants
                let profiles: any[] = [];
                if (userIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, avatar_url, is_online, is_verified, verification_type')
                        .in('id', userIds);

                    if (profilesError) throw profilesError;
                    profiles = profilesData || [];
                }

                // Combine conversation with participants and their profiles
                const enrichedConversation = {
                    ...conversationData,
                    participants: participants?.map(participant => ({
                        ...participant,
                        profile: profiles.find(p => p.id === participant.user_id) || null,
                    })) || [],
                };

                setConversation(enrichedConversation);
            } catch (error: any) {
                console.error('Error fetching conversation:', error?.message || error);
            }
        };

        fetchConversation();
    }, [conversationId, supabase]);

    // Fetch initial messages
    useEffect(() => {
        if (!conversationId || !currentUserId) return;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                const formattedMessages: Message[] = (data || []).map(msg => ({
                    id: msg.id,
                    content: msg.content || '',
                    senderId: msg.sender_id,
                    conversationId: msg.conversation_id,
                    createdAt: msg.created_at,
                    updatedAt: msg.updated_at,
                    isMe: msg.sender_id === currentUserId,
                    isRead: msg.is_read || false,
                    isDelivered: msg.is_delivered || false,
                    isSent: true,
                    replyToId: msg.reply_to_message_id,
                    reactions: [],
                    attachmentUrl: msg.attachment_url,
                    attachmentType: msg.attachment_type,
                }));

                setMessages(formattedMessages);
                previousMessagesCountRef.current = formattedMessages.length;
                isInitialLoadRef.current = false;
            } catch (error: any) {
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error fetching messages:', errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                payload => {
                    if (payload.eventType === 'INSERT') {
                        const newMessage: Message = {
                            id: payload.new.id,
                            content: payload.new.content || '',
                            senderId: payload.new.sender_id,
                            conversationId: payload.new.conversation_id,
                            createdAt: payload.new.created_at,
                            updatedAt: payload.new.updated_at,
                            isMe: payload.new.sender_id === currentUserId,
                            isRead: payload.new.is_read || false,
                            isDelivered: payload.new.is_delivered || false,
                            isSent: true,
                            replyToId: payload.new.reply_to_message_id,
                            reactions: [],
                            attachmentUrl: payload.new.attachment_url,
                            attachmentType: payload.new.attachment_type,
                        };
                        // If this is our own message, replace the optimistic one
                        if (payload.new.sender_id === currentUserId) {
                            setMessages(prev => {
                                // Find and remove optimistic message with same content
                                const filtered = prev.filter(msg => 
                                    !(msg.id.startsWith('temp_') && msg.content === newMessage.content && msg.senderId === currentUserId)
                                );
                                // Check if message already exists (from optimistic update in sendMessage)
                                const exists = filtered.some(msg => msg.id === newMessage.id);
                                if (!exists) {
                                    return [...filtered, newMessage];
                                }
                                // Update existing message
                                return filtered.map(msg => 
                                    msg.id === newMessage.id ? newMessage : msg
                                );
                            });
                        } else {
                            // Other user's message - just add it
                            setMessages(prev => {
                                const exists = prev.some(msg => msg.id === newMessage.id);
                                if (!exists) {
                                    // Play notification sound for new incoming message
                                    // Play sound if not muted and not initial load
                                    if (!isInitialLoadRef.current) {
                                        soundManager.playReceived();
                                        
                                        // Haptic feedback (mobile only)
                                        if (navigator.vibrate) {
                                            navigator.vibrate([50, 100, 50]);
                                        }
                                        
                                        // Show browser notification if page is hidden
                                        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                                            new Notification('پیام جدید', {
                                                body: newMessage.content.substring(0, 100),
                                                icon: '/favicon.ico',
                                                tag: newMessage.id,
                                                vibrate: [200, 100, 200],
                                            });
                                        }
                                    }
                                    return [...prev, newMessage];
                                }
                                return prev;
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === payload.new.id
                                    ? {
                                          ...msg,
                                          content: payload.new.content || msg.content,
                                          updatedAt: payload.new.updated_at,
                                          isRead: payload.new.is_read || msg.isRead,
                                          isDelivered: payload.new.is_delivered || msg.isDelivered,
                                      }
                                    : msg
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUserId, supabase]);

    const sendMessage = useCallback(
        async (content: string, files?: File[], replyToId?: string | null) => {
            // TODO: Upload files if any
            let attachmentUrl = null;
            let attachmentType = null;

            if (files && files.length > 0) {
                // Upload file logic here
                // For now, just use the first file
                const file = files[0];
                attachmentType = file.type.startsWith('image/')
                    ? 'image'
                    : file.type.startsWith('video/')
                      ? 'video'
                      : file.type.startsWith('audio/')
                        ? 'audio'
                        : 'file';
            }

            // Create optimistic message
            const optimisticMessage: Message = {
                id: `temp_${Date.now()}_${Math.random()}`,
                conversationId,
                senderId: currentUserId,
                content,
                attachmentUrl,
                attachmentType,
                replyToId: replyToId || null,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                isDelivered: false,
                isRead: false,
                isSent: false, // Pending state - will show clock icon
                isMe: true,
                reactions: [],
            };

            // Add optimistic message immediately
            setMessages(prev => [...prev, optimisticMessage]);

            try {
                const { data, error } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversationId,
                        sender_id: currentUserId,
                        content,
                        reply_to_message_id: replyToId || null,
                        attachment_url: attachmentUrl,
                        attachment_type: attachmentType,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update optimistic message with real data
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === optimisticMessage.id
                            ? {
                                  ...msg,
                                  id: data.id,
                                  createdAt: data.created_at,
                                  isSent: true, // Success - will show check icon
                              }
                            : msg
                    )
                );
                
                // Play sent confirmation sound
                soundManager.playSent();

                // Update conversation last_message
                await supabase
                    .from('conversations')
                    .update({
                        last_message: content,
                        last_message_time: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversationId);

                return data;
            } catch (error: any) {
                // Remove failed message or mark as failed
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === optimisticMessage.id
                            ? {
                                  ...msg,
                                  isSent: false, // Keep as pending but could show error state
                              }
                            : msg
                    )
                );
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error sending message:', errorMessage);
                throw new Error(errorMessage);
            }
        },
        [conversationId, currentUserId, supabase]
    );

    const editMessage = useCallback(
        async (messageId: string, newContent: string) => {
            try {
                const { error } = await supabase
                    .from('messages')
                    .update({
                        content: newContent,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', messageId)
                    .eq('sender_id', currentUserId);

                if (error) throw error;
            } catch (error: any) {
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error editing message:', errorMessage);
                throw new Error(errorMessage);
            }
        },
        [currentUserId, supabase]
    );

    const deleteMessage = useCallback(
        async (messageId: string) => {
            try {
                const { error } = await supabase
                    .from('messages')
                    .delete()
                    .eq('id', messageId)
                    .eq('sender_id', currentUserId);

                if (error) throw error;
            } catch (error: any) {
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error deleting message:', errorMessage);
                throw new Error(errorMessage);
            }
        },
        [currentUserId, supabase]
    );

    return {
        messages,
        conversation,
        isLoading,
        sendMessage,
        editMessage,
        deleteMessage,
    };
}

