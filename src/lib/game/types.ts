import { Category, Question } from './questions';

export interface PlayerState {
  id: string;
  name: string;
  avatarUrl: string;
  score: number;
}

export interface RoundState {
  roundIndex: number;
  pickerId: string;
  category: Category | null;
  questions: Question[];
  player1Answers: number[];
  player2Answers: number[];
  player1Times: number[];
  player2Times: number[];
  status: 'picking_category' | 'playing' | 'round_finished';
  turnPlayerId: string;
}

export interface MatchState {
  matchId: string;
  player1: PlayerState;
  player2: PlayerState | null;
  status: 'waiting' | 'in_progress' | 'finished';
  rounds: RoundState[];
  currentRoundIndex: number;
  winnerId: string | null;
  createdAt: number;
  updatedAt: number;
}
