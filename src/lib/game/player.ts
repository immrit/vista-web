import { MatchState } from './types';

export function getAuthPlayerCandidates(userId?: string | null, profileId?: string | null, profileUserId?: string | null) {
  return [userId, profileId, profileUserId].filter((id): id is string => Boolean(id));
}

export function resolveMatchPlayerId(match: MatchState | null | undefined, candidates: string[]) {
  if (!match) return candidates[0] || null;

  for (const candidate of candidates) {
    if (match.player1.id === candidate || match.player2?.id === candidate) {
      return candidate;
    }
  }

  return candidates[0] || null;
}
