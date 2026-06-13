'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/models/message';
import { apiClient } from '@/lib/apiClient';
import {
  bytesToBase64,
  computeSharedAesKey,
  decryptMessage,
  encryptMessage,
  ensureKeyPair,
  getPeerPublicKeyBase64,
  getPublicKeyBytes,
  isE2EESupported,
  isKeyExchangeMessage,
  looksEncryptedSecretPayload,
  setPeerPublicKeyBase64,
} from '@/lib/chat/e2eEncryption';

interface UseSecretChatOptions {
  conversationId: string;
  userId: string;
  isSecret: boolean;
  messages: Message[];
}

export function useSecretChat({ conversationId, userId, isSecret, messages }: UseSecretChatOptions) {
  const [decryptedById, setDecryptedById] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const aesKeyRef = useRef<CryptoKey | null>(null);
  const exchangeInFlightRef = useRef(false);

  const pushNotice = useCallback((text: string) => {
    setNotices(prev => (prev.includes(text) ? prev : [...prev, text]));
  }, []);

  const prepareSharedKey = useCallback(async () => {
    if (!isSecret || !isE2EESupported()) {
      setIsReady(false);
      aesKeyRef.current = null;
      return;
    }
    const peerPub = getPeerPublicKeyBase64(conversationId);
    if (!peerPub) {
      setIsReady(false);
      aesKeyRef.current = null;
      return;
    }
    const aesKey = await computeSharedAesKey(userId, peerPub);
    aesKeyRef.current = aesKey;
    setIsReady(!!aesKey);
  }, [conversationId, isSecret, userId]);

  const sendKeyExchangeMessage = useCallback(
    async (content: string, messageType: 'exchange_key' | 'exchange_key_reply') => {
      await apiClient.post(`/v1/chat/conversations/${conversationId}/messages`, {
        id: crypto.randomUUID(),
        content,
        message_type: messageType,
      });
    },
    [conversationId],
  );

  const processKeyExchange = useCallback(async () => {
    if (!isSecret || !isE2EESupported() || exchangeInFlightRef.current) return;
    if (getPeerPublicKeyBase64(conversationId)) {
      await prepareSharedKey();
      return;
    }

    exchangeInFlightRef.current = true;
    try {
      await ensureKeyPair(userId);

      const peerKey = messages.find(m => !m.isMe && m.attachmentType === 'exchange_key');
      if (peerKey) {
        setPeerPublicKeyBase64(conversationId, peerKey.content);
        const myPub = await getPublicKeyBytes(userId);
        if (myPub) {
          await sendKeyExchangeMessage(bytesToBase64(myPub), 'exchange_key_reply');
          pushNotice('کلید امنیتی با موفقیت تبادل شد. ارتباط رمزنگاری شده برقرار است.');
        }
        await prepareSharedKey();
        return;
      }

      const myKeySent = messages.some(m => m.isMe && m.attachmentType === 'exchange_key');
      if (!myKeySent) {
        const myPub = await getPublicKeyBytes(userId);
        if (myPub) {
          await sendKeyExchangeMessage(bytesToBase64(myPub), 'exchange_key');
          pushNotice('در حال تبادل کلید رمزنگاری با طرف مقابل...');
        }
      }

      const peerReply = messages.find(m => !m.isMe && m.attachmentType === 'exchange_key_reply');
      if (peerReply) {
        setPeerPublicKeyBase64(conversationId, peerReply.content);
        pushNotice('ارتباط کاملاً امن و رمزنگاری‌شده (E2EE) برقرار شد.');
        await prepareSharedKey();
      }
    } catch {
      pushNotice('خطا در تبادل کلید امنیتی. دوباره تلاش کنید.');
    } finally {
      exchangeInFlightRef.current = false;
    }
  }, [conversationId, messages, prepareSharedKey, pushNotice, sendKeyExchangeMessage, userId, isSecret]);

  useEffect(() => {
    if (!isSecret) {
      setIsReady(true);
      return;
    }
    void processKeyExchange();
  }, [isSecret, processKeyExchange]);

  useEffect(() => {
    if (!isSecret) return;

    let cancelled = false;
    const run = async () => {
      await prepareSharedKey();
      const aesKey = aesKeyRef.current;
      if (!aesKey) return;

      const updates: Record<string, string> = {};
      for (const message of messages) {
        if (message.isMe || isKeyExchangeMessage(message.attachmentType)) continue;
        if (!looksEncryptedSecretPayload(message.content)) continue;

        updates[message.id] = await decryptMessage(message.content, aesKey);
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setDecryptedById(prev => ({ ...prev, ...updates }));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [messages, isSecret, prepareSharedKey]);

  const encryptIfNeeded = useCallback(
    async (plainText: string): Promise<string> => {
      if (!isSecret) return plainText;
      if (!isE2EESupported()) {
        throw new Error('مرورگر شما از رمزنگاری سرتاسری پشتیبانی نمی‌کند.');
      }
      const peerPub = getPeerPublicKeyBase64(conversationId);
      if (!peerPub) {
        throw new Error('در حال تبادل کلید امنیتی با مخاطب هستیم. لطفاً کمی صبر کنید.');
      }
      const aesKey = aesKeyRef.current ?? (await computeSharedAesKey(userId, peerPub));
      if (!aesKey) throw new Error('کلید امنیتی محلی یافت نشد.');
      aesKeyRef.current = aesKey;
      return encryptMessage(plainText, aesKey);
    },
    [conversationId, isSecret, userId],
  );

  const getDisplayContent = useCallback(
    (message: Message): string => {
      if (isKeyExchangeMessage(message.attachmentType)) return '🔐 تبادل کلید امنیتی';
      if (!isSecret) return message.content;
      if (decryptedById[message.id]) return decryptedById[message.id]!;
      if (message.isMe && !looksEncryptedSecretPayload(message.content)) return message.content;
      if (looksEncryptedSecretPayload(message.content)) {
        return decryptedById[message.id] ?? '🔒 در حال رمزگشایی...';
      }
      return message.content;
    },
    [decryptedById, isSecret],
  );

  return {
    isReady: !isSecret || isReady,
    isSecret,
    notices,
    encryptIfNeeded,
    getDisplayContent,
  };
}
