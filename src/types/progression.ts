/**
 * Progression, Statistics, Achievements & Challenge Modes Types
 */

import { CategoryId, DifficultyId } from './maze';

export type ChallengeMode = 'none' | 'time_trial' | 'limited_moves' | 'daily';

export type AchievementId =
  | 'first_escape'
  | 'master_escape'
  | 'shadow_survivor'
  | 'riddle_scholar'
  | 'tide_runner'
  | 'space_weaver'
  | 'speed_demon'
  | 'step_master'
  | 'daily_devotee'
  | 'grand_explorer';

export interface Achievement {
  id: AchievementId;
  name: string;
  title?: string;
  description: string;
  category: 'general' | 'realm' | 'challenge';
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayerProgression {
  stats: PlayerStats;
  achievements: Record<AchievementId, Achievement>;
}

export interface PlayerStats {
  totalPlayed: number;
  totalEscaped: number;
  totalSteps: number;
  totalTimeSeconds: number;
  currentStreak: number;
  highestStreak: number;
  challengesCompleted: number;
  categoriesCompleted: Record<CategoryId, boolean>;
  bestTimes: Record<CategoryId, number | null>;
  dailyCompletedDates: Record<string, boolean>; // 'YYYY-MM-DD' -> true
}

export interface RunResult {
  category: CategoryId;
  difficultyId: DifficultyId;
  seed: string;
  timeSeconds: number;
  stepCount: number;
  shortestPathLength: number;
  isCustom: boolean;
  challengeMode: ChallengeMode;
  isDaily: boolean;
  dateStr?: string;
  won: boolean;
}

export interface ChallengeConfig {
  mode: ChallengeMode;
  name: string;
  description: string;
  targetTimeLimit?: number; // seconds
  targetMoveBudget?: number; // steps
  dateStr?: string;
}
