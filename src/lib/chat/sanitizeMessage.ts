import { sanitizeText } from '@/lib/validation/sanitize';

const MAX_MESSAGE_LENGTH = 10000;

/** Strip dangerous content before sending chat messages. */
export function sanitizeChatMessage(content: string): string {
  return sanitizeText(content).slice(0, MAX_MESSAGE_LENGTH);
}
