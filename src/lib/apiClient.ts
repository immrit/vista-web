interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // BFF Pattern: Client routes through Next.js proxy to attach HttpOnly cookies
    return '/api/backend';
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir').replace(/\/+$/, '');
}

/**
 * Reads the access_token from the browser cookie.
 * In production cookies are HttpOnly (invisible to JS) – this returns null
 * intentionally. The browser sends them automatically on every request.
 * Kept for dev / non-HttpOnly fallback.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const cookieMatch = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
}

/**
 * Stores tokens securely by POSTing to /api/auth/token (server route).
 * That route sets HttpOnly; Secure; SameSite=Lax cookies – tokens are
 * NEVER written to localStorage.
 */
export async function persistAuthTokens(accessToken: string, refreshToken?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
    });
  } catch {
    // Dev fallback (no HttpOnly so JS can read for Authorization header)
    const maxAge = 60 * 60 * 24 * 3650;
    document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (refreshToken) {
      document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  }
}

/**
 * Clears tokens by calling DELETE /api/auth/token (server route clears HttpOnly cookies).
 */
export async function clearAuthTokens(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/auth/token', { method: 'DELETE' });
  } catch {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

let refreshInFlight: Promise<boolean> | null = null;

function shouldAttemptTokenRefresh(path: string) {
  const publicAuthPaths = [
    '/v1/auth/login',
    '/v1/auth/register',
    '/v1/auth/lookup',
    '/v1/auth/send-otp',
    '/v1/auth/verify-otp',
    '/v1/auth/2fa/verify',
    '/v1/auth/refresh',
  ];

  return !publicAuthPaths.some(publicPath => path.startsWith(publicPath));
}

async function refreshAuthCookies(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(response => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export function getBackendWebSocketUrl(path: string) {
  let base = getApiBaseUrl();
  if (base.startsWith('/') && typeof window !== 'undefined') {
    base = `${window.location.protocol}//${window.location.host}${base}`;
  }
  base = base.replace(/^http/i, 'ws');
  const url = new URL(path, base);
  // Token is no longer sent in query parameters for security.
  return url.toString();
}

export function getWebSocketProtocols(token?: string | null): string[] {
  const accessToken = token ?? getStoredAccessToken();
  return accessToken ? ['Authorization', accessToken] : [];
}

class ApiClient {
  private get baseUrl() {
    return getApiBaseUrl();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    // In production (HttpOnly cookie) the token is sent automatically.
    // In dev the cookie is readable by JS as a fallback.
    const token = getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async fetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const makeRequest = async () => {
      const headers = {
        ...(await this.getAuthHeaders()),
        ...options.headers,
      };

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // sends HttpOnly cookies cross-origin (when CORS allows)
      });
    };

    let response = await makeRequest();
    if (response.status === 401 && shouldAttemptTokenRefresh(path)) {
      const refreshed = await refreshAuthCookies();
      if (refreshed) {
        response = await makeRequest();
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || errorData.error || errorData.code || `HTTP error! status: ${response.status}`, response.status);
    }

    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  async get<T>(path: string, options?: FetchOptions) {
    return this.fetch<T>(path, { ...options, method: 'GET' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T>(path: string, body?: any, options?: FetchOptions) {
    return this.fetch<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async put<T>(path: string, body?: any, options?: FetchOptions) {
    return this.fetch<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patch<T>(path: string, body?: any, options?: FetchOptions) {
    return this.fetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: FetchOptions) {
    return this.fetch<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
