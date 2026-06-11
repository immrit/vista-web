import { MatchState, RoundState } from './types';

export function isAnswerPending(answer?: number, timeMs?: number) {
  return answer === undefined || (answer === -1 && (!timeMs || timeMs <= 0));
}

export function hasPendingAnswers(answers?: number[], times?: number[]) {
  if (!answers || answers.length < 3) return true;
  for (let i = 0; i < 3; i += 1) {
    if (isAnswerPending(answers[i], times?.[i])) return true;
  }
  return false;
}

export function getNextQuestionIndex(answers?: number[], times?: number[]) {
  if (!answers) return -1;
  for (let i = 0; i < 3; i += 1) {
    if (isAnswerPending(answers[i], times?.[i])) return i;
  }
  return -1;
}

export function getCurrentRound(match: MatchState): RoundState | null {
  return match.rounds[match.currentRoundIndex] || null;
}

export function getEffectiveTurnPlayerId(match: MatchState, round = getCurrentRound(match)): string | null {
  if (match.status !== 'in_progress' || !round) return null;

  if (round.status === 'picking_category') {
    return round.pickerId || round.turnPlayerId || null;
  }

  if (round.status !== 'playing') {
    return null;
  }

  const player1Pending = hasPendingAnswers(round.player1Answers, round.player1Times);
  const player2Pending = hasPendingAnswers(round.player2Answers, round.player2Times);

  if (!match.player2) {
    return player1Pending ? match.player1.id : null;
  }

  if (round.pickerId === match.player2.id) {
    if (player2Pending) return match.player2.id;
    if (player1Pending) return match.player1.id;
    return null;
  }

  if (player1Pending) return match.player1.id;
  if (player2Pending) return match.player2.id;
  return null;
}

export function isPlayerTurn(match: MatchState, playerId: string | null | undefined, round = getCurrentRound(match)) {
  if (!playerId) return false;
  return getEffectiveTurnPlayerId(match, round) === playerId;
}

export function hasPlayerCompletedRound(match: MatchState, playerId: string | null | undefined, round: RoundState | null) {
  if (!playerId || !round) return false;
  if (match.player1.id === playerId) {
    return !hasPendingAnswers(round.player1Answers, round.player1Times);
  }
  if (match.player2?.id === playerId) {
    return !hasPendingAnswers(round.player2Answers, round.player2Times);
  }
  return false;
}
