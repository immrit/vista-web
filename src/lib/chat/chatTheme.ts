/** Chat visual tokens — ported from Flutter `chat_theme.dart`. */

export const CHAT_PRIMARY = '#6366F1';
export const CHAT_SECONDARY = '#8B5CF6';

export interface ChatThemeTokens {
  isDark: boolean;
  background: string;
  appBar: string;
  text: string;
  secondaryText: string;
  divider: string;
  myBubbleGradient: string;
  myBubbleText: string;
  otherBubble: string;
  otherBubbleText: string;
  online: string;
  pending: string;
  sent: string;
  read: string;
  error: string;
  inputBg: string;
  inputBorder: string;
  inputHint: string;
  sendButton: string;
  icon: string;
  bubbleRadius: number;
  bubbleMergedRadius: number;
  myBubbleShadow: string;
  otherBubbleShadow: string;
  inputShadow: string;
}

export function getChatTheme(isDark: boolean): ChatThemeTokens {
  if (isDark) {
    return {
      isDark: true,
      background: '#000000',
      appBar: 'rgba(0,0,0,0.95)',
      text: '#F1F5F9',
      secondaryText: '#94A3B8',
      divider: '#222222',
      myBubbleGradient: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_SECONDARY})`,
      myBubbleText: '#FFFFFF',
      otherBubble: '#1E1E1E',
      otherBubbleText: '#FFFFFF',
      online: '#4ADE80',
      pending: '#FBBF24',
      sent: '#94A3B8',
      read: '#4ADE80',
      error: '#F87171',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: 'rgba(255,255,255,0.08)',
      inputHint: '#64748B',
      sendButton: CHAT_PRIMARY,
      icon: '#94A3B8',
      bubbleRadius: 18,
      bubbleMergedRadius: 6,
      myBubbleShadow: '0 1px 4px rgba(255,255,255,0.1)',
      otherBubbleShadow: '0 1px 4px rgba(0,0,0,0.2)',
      inputShadow: '0 -2px 12px rgba(0,0,0,0.2)',
    };
  }

  return {
    isDark: false,
    background: '#FFFFFF',
    appBar: 'rgba(255,255,255,0.95)',
    text: '#000000',
    secondaryText: '#64748B',
    divider: '#E5E5E5',
    myBubbleGradient: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_SECONDARY})`,
    myBubbleText: '#FFFFFF',
    otherBubble: '#F1F5F9',
    otherBubbleText: '#000000',
    online: '#22C55E',
    pending: '#F59E0B',
    sent: '#94A3B8',
    read: '#22C55E',
    error: '#EF4444',
    inputBg: 'rgba(255,255,255,0.72)',
    inputBorder: 'rgba(0,0,0,0.06)',
    inputHint: '#94A3B8',
    sendButton: CHAT_PRIMARY,
    icon: '#64748B',
    bubbleRadius: 18,
    bubbleMergedRadius: 6,
    myBubbleShadow: '0 2px 4px rgba(99,102,241,0.15)',
    otherBubbleShadow: '0 1px 3px rgba(0,0,0,0.03)',
    inputShadow: '0 -2px 10px rgba(0,0,0,0.05)',
  };
}

/** Merged bubble corners — RTL: own bubbles on the right. */
export function bubbleBorderRadius(
  isMe: boolean,
  isFirstInGroup: boolean,
  isLastInGroup: boolean,
  radius = 18,
  merged = 6,
): string {
  const r = `${radius}px`;
  const mr = `${merged}px`;
  const side = isMe ? 'right' : 'left';

  const top = isFirstInGroup ? r : mr;
  const bottom = isLastInGroup ? r : mr;

  if (side === 'right') {
    return `${top} ${r} ${r} ${bottom}`;
  }
  return `${r} ${top} ${bottom} ${r}`;
}
