import { apiClient } from '../apiClient';
import type { ActiveSession, DeviceInfo } from '@/lib/types/session';
export type { ActiveSession } from '@/lib/types/session';

function parseDeviceInfo(raw: any): DeviceInfo {
  if (raw && typeof raw === 'object') {
    return raw;
  }

  const userAgent = String(raw || '');
  return {
    browser: userAgent || 'Unknown browser',
    os: 'Unknown OS',
    device: /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop',
    userAgent,
  };
}

export class SessionService {
  static async createSession(userId?: string): Promise<string | null> {
    return 'handled-by-backend';
  }

  static async getUserActiveSessions(): Promise<ActiveSession[]> {
    try {
      const response = await apiClient.get<any>('/v1/sessions/active');
      // Backend might return { sessions: [] } or just the array
      const sessions = Array.isArray(response) ? response : response.sessions || [];
      return sessions.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        device_id: s.device_id,
        session_token: s.session_token || s.id,
        device_info: parseDeviceInfo(s.device_info || s.user_agent),
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        location_country: s.location_country || null,
        location_city: s.location_city || null,
        location_region: s.location_region || null,
        location: s.location || null,
        created_at: s.created_at,
        last_activity: s.last_activity || s.updated_at || s.created_at,
        expires_at: s.expires_at || s.expiresAt || s.created_at,
        is_active: s.is_active ?? true,
        is_current: s.is_current || false,
        app_version: s.app_version || null,
        platform: s.platform || null,
        fcm_token: s.fcm_token || null,
        device_model: s.device_model || null,
        network_type: s.network_type || null,
        device_os: s.device_os || null,
      }));
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  static async updateSessionActivity(): Promise<void> {
    try {
      await apiClient.post('/v1/sessions/touch', {
        device_id: localStorage.getItem('device_id') || undefined
      });
    } catch (error) {
      // Ignore errors for touch
    }
  }

  static async logoutSession(sessionId: string): Promise<boolean> {
    try {
      await apiClient.post('/v1/sessions/terminate', {
        session_id: sessionId
      });
      return true;
    } catch (error) {
      console.error('Failed to logout session:', error);
      return false;
    }
  }

  static async logoutOtherSessions(): Promise<boolean> {
    try {
      await apiClient.post('/v1/sessions/terminate-others', {
        device_id: localStorage.getItem('device_id') || undefined
      });
      return true;
    } catch (error) {
      console.error('Failed to logout other sessions:', error);
      return false;
    }
  }

  static async getActiveSessionsCount(): Promise<number> {
    const sessions = await this.getUserActiveSessions();
    return sessions.length;
  }
}

class SessionManagerService {
  private static instance: SessionManagerService;
  private currentSessionId: string | null = null;

  public static getInstance(): SessionManagerService {
    if (!SessionManagerService.instance) {
      SessionManagerService.instance = new SessionManagerService();
    }
    return SessionManagerService.instance;
  }

  public async initialize(user?: any) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('session_id');
      if (stored) {
        this.currentSessionId = stored;
      }
    }
  }

  public getCurrentSessionId(): string | null {
    if (!this.currentSessionId && process.env.NODE_ENV === 'production') {
      return null;
    }
    return this.currentSessionId || 'mock-session-id';
  }

  public async logout() {
    if (this.currentSessionId) {
      await SessionService.logoutSession(this.currentSessionId);
    }
  }
}

export const sessionManager = SessionManagerService.getInstance();
