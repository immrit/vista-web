import { sanitizeUuid } from '@/lib/validation/sanitize';

/** Reject malformed IDs before they reach the backend (IDOR / injection hardening). */
export function assertValidConversationId(conversationId: string): void {
  if (!sanitizeUuid(conversationId)) {
    throw new Error('شناسه گفتگو نامعتبر است');
  }
}

export function assertValidMessageId(messageId: string): void {
  if (messageId.startsWith('temp_')) return;
  if (!sanitizeUuid(messageId)) {
    throw new Error('شناسه پیام نامعتبر است');
  }
}

/** Strip control chars; messages are rendered as plain text only. */
export function escapeForPlainTextDisplay(content: string): string {
  return content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}
