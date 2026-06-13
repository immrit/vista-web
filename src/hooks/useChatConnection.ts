'use client';

import { useEffect, useState } from 'react';
import { ChatWsConnectionState, getChatWebSocket } from '@/lib/chat/chatWebSocket';

export function useChatConnectionState(): ChatWsConnectionState {
  const [state, setState] = useState<ChatWsConnectionState>('disconnected');

  useEffect(() => {
    const ws = getChatWebSocket();
    if (!ws) return;
    return ws.subscribeState(setState);
  }, []);

  return state;
}
