import { apiClient } from './apiClient';

export interface NearbyCandidate {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  gender: string;
  marital_status: string;
  age: number;
  location_text: string;
  is_verified: boolean;
  verification_type: string;
  distance_km: number;
}

export interface NearbyMatch {
  match_id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_verified: boolean;
  matched_at: string;
}

export interface NearbyPreferences {
  interested_in: 'male' | 'female' | 'all';
  min_age: number;
  max_age: number;
  max_distance_km: number;
  is_enabled: boolean;
  has_location: boolean;
}

export interface NearbyLikeResult {
  matched: boolean;
  match_id: string;
  match?: NearbyMatch;
}

export function getDistanceLabel(distanceKm: number): string {
  if (distanceKm <= 0.1) return 'همین نزدیکی';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} متر`;
  return `${distanceKm.toFixed(1)} کیلومتر`;
}

export const nearbyApi = {
  updateLocation: (lat: number, lng: number) =>
    apiClient.post<void>('/v1/nearby/location', { lat, lng }),

  disableLocation: () =>
    apiClient.delete<void>('/v1/nearby/location'),

  getPreferences: () =>
    apiClient.get<NearbyPreferences>('/v1/nearby/preferences'),

  updatePreferences: (prefs: Omit<NearbyPreferences, 'is_enabled' | 'has_location'>) =>
    apiClient.put<NearbyPreferences>('/v1/nearby/preferences', prefs),

  discover: (limit = 20) =>
    apiClient.get<{ candidates: NearbyCandidate[] }>(`/v1/nearby/discover?limit=${limit}`),

  discoverRandomOnline: (limit = 20) =>
    apiClient.get<{ candidates: NearbyCandidate[] }>(`/v1/nearby/random-online?limit=${limit}`),

  like: (targetId: string, action: 'like' | 'pass') =>
    apiClient.post<NearbyLikeResult>('/v1/nearby/like', { target_id: targetId, action }),

  getMatches: () =>
    apiClient.get<{ matches: NearbyMatch[] }>('/v1/nearby/matches'),

  unmatch: (matchId: string) =>
    apiClient.delete<void>(`/v1/nearby/matches/${matchId}`),

  openChat: (matchId: string) =>
    apiClient.post<{ conversation_id: string }>(`/v1/nearby/matches/${matchId}/chat`),
};
