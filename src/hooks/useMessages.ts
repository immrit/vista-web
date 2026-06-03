'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/lib/models/message';
import { soundManager } from '@/lib/audio/NotificationSounds';
import { apiClient, getBackendWebSocketUrl } from '@/lib/apiClient';

interface UseMessagesOptions {
    conversationId: string;
    currentUserId: string;
}

export function useMessages({ conversationId, currentUserId }: UseMessagesOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const previousMessagesCountRef = useRef<number>(0);
    const isInitialLoadRef = useRef<boolean>(true);

    // Fetch conversation details
    useEffect(() => {
        if (!conversationId) return;

        const fetchConversation = async () => {
            try {
                // Fetch from the backend API
                const data = await apiClient.get<any>(`/v1/chat/conversations/${conversationId}`);
                
                // Format participants for the UI
                let participants = [];
                if (data.peer_id) {
                    participants.push({
                        user_id: data.peer_id,
                        profile: {
                            id: data.peer_id,
                            full_name: data.name,
                            avatar_url: data.image
                        }
                    });
                }

                const enrichedConversation = {
                    ...data,
                    participants
                };

                setConversation(enrichedConversation);
            } catch (error: any) {
                console.error('Error fetching conversation:', error?.message || error);
            }
        };

        fetchConversation();
    }, [conversationId]);

    // Fetch initial messages and subscribe to real-time updates
    useEffect(() => {
        if (!conversationId || !currentUserId) return;

        let ws: WebSocket | null = null;
        let isMounted = true;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get<{messages: any[]}>(`/v1/chat/conversations/${conversationId}/messages?limit=50`);
                
                if (!isMounted) return;

                const formattedMessages: Message[] = (response.messages || []).map(msg => ({
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
                    reactions: msg.reactions || [],
                    attachmentUrl: msg.media_url,
                    attachmentType: msg.message_type,
                })).reverse(); // API usually returns newest first if paginated, but UI needs oldest to newest

                setMessages(formattedMessages);
                previousMessagesCountRef.current = formattedMessages.length;
                isInitialLoadRef.current = false;
            } catch (error: any) {
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error fetching messages:', errorMessage);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        const setupWebSocket = () => {
            ws = new WebSocket(getBackendWebSocketUrl('/v1/chat/ws'));

            ws.onopen = () => {
                console.log('WebSocket connected');
                // The backend requires authentication. Usually if we don't pass header, we might get 401. 
                // We'll see how it behaves. The backend middleware checks X-Device-ID or token.
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'new_message' && data.data.conversation_id === conversationId) {
                        const payload = data.data;
                        const newMessage: Message = {
                            id: payload.id,
                            content: payload.content || '',
                            senderId: payload.sender_id,
                            conversationId: payload.conversation_id,
                            createdAt: payload.created_at,
                            updatedAt: payload.updated_at,
                            isMe: payload.sender_id === currentUserId,
                            isRead: payload.is_read || false,
                            isDelivered: payload.is_delivered || false,
                            isSent: true,
                            replyToId: payload.reply_to_message_id,
                            reactions: payload.reactions || [],
                            attachmentUrl: payload.media_url,
                            attachmentType: payload.message_type,
                        };

                        if (payload.sender_id === currentUserId) {
                            setMessages(prev => {
                                const filtered = prev.filter(msg => 
                                    !(msg.id.startsWith('temp_') && msg.content === newMessage.content && msg.senderId === currentUserId)
                                );
                                const exists = filtered.some(msg => msg.id === newMessage.id);
                                if (!exists) return [...filtered, newMessage];
                                return filtered.map(msg => msg.id === newMessage.id ? newMessage : msg);
                            });
                        } else {
                            setMessages(prev => {
                                const exists = prev.some(msg => msg.id === newMessage.id);
                                if (!exists) {
                                    if (!isInitialLoadRef.current) {
                                        soundManager.playReceived();
                                        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
                                        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                                            const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
                                                body: newMessage.content.substring(0, 100),
                                                icon: '/favicon.ico',
                                                tag: newMessage.id,
                                            };
                                            if ('vibrate' in Notification.prototype) {
                                                notificationOptions.vibrate = [200, 100, 200];
                                            }
                                            new Notification('پیام جدید', notificationOptions);
                                        }
                                    }
                                    return [...prev, newMessage];
                                }
                                return prev;
                            });
                        }
                    } else if (data.type === 'message_updated' && data.data.conversation_id === conversationId) {
                        const payload = data.data;
                        setMessages(prev => prev.map(msg => 
                            msg.id === payload.id 
                                ? { ...msg, content: payload.content, updatedAt: payload.updated_at } 
                                : msg
                        ));
                    } else if (data.type === 'message_deleted' && data.data.conversation_id === conversationId) {
                        setMessages(prev => prev.filter(msg => msg.id !== data.data.message_id));
                    }
                } catch (e) {
                    console.error('Failed to parse WS message', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
            };
        };

        fetchMessages().then(() => {
            setupWebSocket();
        });

        return () => {
            isMounted = false;
            if (ws) {
                ws.close();
            }
        };
    }, [conversationId, currentUserId]);

    const sendMessage = useCallback(
        async (content: string, files?: File[], replyToId?: string | null) => {
            let attachmentUrl = null;
            let attachmentType = null;

            if (files && files.length > 0) {
                const file = files[0];
                // TODO: use actual file upload
                attachmentType = file.type.split('/')[0];
            }

            const optimisticMessage: Message = {
                id: `temp_${Date.now()}_${Math.random()}`,
                conversationId,
                senderId: currentUserId,
                content,
                attachmentUrl,
                attachmentType: attachmentType as any,
                replyToId: replyToId || null,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                isDelivered: false,
                isRead: false,
                isSent: false,
                isMe: true,
                reactions: [],
            };

            setMessages(prev => [...prev, optimisticMessage]);

            try {
                const data = await apiClient.post<any>(`/v1/chat/conversations/${conversationId}/messages`, {
                    content,
                    reply_to_message_id: replyToId || undefined,
                    media_url: attachmentUrl || undefined,
                    message_type: attachmentType || undefined
                });

                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === optimisticMessage.id
                            ? {
                                  ...msg,
                                  id: data.id,
                                  createdAt: data.created_at,
                                  isSent: true,
                              }
                            : msg
                    )
                );
                
                soundManager.playSent();
                return data;
            } catch (error: any) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === optimisticMessage.id
                            ? { ...msg, isSent: false }
                            : msg
                    )
                );
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error sending message:', errorMessage);
                throw new Error(errorMessage);
            }
        },
        [conversationId, currentUserId]
    );

    const editMessage = useCallback(
        async (messageId: string, newContent: string) => {
            try {
                await apiClient.put(`/v1/chat/messages/${messageId}`, { content: newContent });
            } catch (error: any) {
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error editing message:', errorMessage);
                throw new Error(errorMessage);
            }
        },
        []
    );

    const deleteMessage = useCallback(
        async (messageId: string) => {
            try {
                await apiClient.delete(`/v1/chat/messages/${messageId}?for_everyone=true`);
            } catch (error: any) {
                const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
                console.error('Error deleting message:', errorMessage);
                throw new Error(errorMessage);
            }
        },
        []
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
