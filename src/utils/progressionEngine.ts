/**
 * Progression & Achievements Engine
 * Manages local persistent player statistics, achievement unlock evaluations,
 * and challenge mode parameters (Time Trial, Limited Moves, Daily Challenge).
 */

import { CategoryId, DifficultyId } from '../types/maze';
import {
  Achievement,
  AchievementId,
  ChallengeConfig,
  ChallengeMode,
  PlayerStats,
  RunResult,
} from '../types/progression';

const STORAGE_KEY = 'maze_of_mazes_progression_data';

export const INITIAL_ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_escape: {
    id: 'first_escape',
    name: 'First Stroll',
    description: 'Escape your first labyrinth and reach the Sun Portal.',
    category: 'general',
    icon: '✦',
    unlocked: false,
  },
  master_escape: {
    id: 'master_escape',
    name: 'Grand Navigator',
    description: 'Conquer a complex maze on Master or Nightmare difficulty.',
    category: 'general',
    icon: '★',
    unlocked: false,
  },
  shadow_survivor: {
    id: 'shadow_survivor',
    name: 'Shadow Dodger',
    description: 'Evade the lurking Stalker and escape Horror & Darkness unscathed.',
    category: 'realm',
    icon: '👁',
    unlocked: false,
  },
  riddle_scholar: {
    id: 'riddle_scholar',
    name: 'Rune Scholar',
    description: 'Collect rune keys, open sealed gates, and solve the Puzzle Sanctum.',
    category: 'realm',
    icon: '🗝',
    unlocked: false,
  },
  tide_runner: {
    id: 'tide_runner',
    name: 'High Ground',
    description: 'Navigate the Hazard Sanctum and outrun the rising flood tide.',
    category: 'realm',
    icon: '🌊',
    unlocked: false,
  },
  space_weaver: {
    id: 'space_weaver',
    name: 'Space Weaver',
    description: 'Step through paired quantum portals and master Impossible Geometry.',
    category: 'realm',
    icon: '🌀',
    unlocked: false,
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Swift Wind',
    description: 'Conquer a Time Trial challenge before the hourglass expires.',
    category: 'challenge',
    icon: '⏱',
    unlocked: false,
  },
  step_master: {
    id: 'step_master',
    name: 'Pathfinder Economy',
    description: 'Escape a labyrinth within a restricted step movement budget.',
    category: 'challenge',
    icon: '👣',
    unlocked: false,
  },
  daily_devotee: {
    id: 'daily_devotee',
    name: 'Daily Devotee',
    description: 'Complete the curated Daily Expedition Challenge for the current day.',
    category: 'challenge',
    icon: '☀',
    unlocked: false,
  },
  grand_explorer: {
    id: 'grand_explorer',
    name: 'Grand Explorer',
    description: 'Achieve victory at least once across all five labyrinth realms.',
    category: 'general',
    icon: '👑',
    unlocked: false,
  },
};

export const INITIAL_STATS: PlayerStats = {
  totalPlayed: 0,
  totalEscaped: 0,
  totalSteps: 0,
  totalTimeSeconds: 0,
  currentStreak: 0,
  highestStreak: 0,
  challengesCompleted: 0,
  categoriesCompleted: {
    classic: false,
    horror: false,
    puzzle: false,
    hazard: false,
    impossible: false,
  },
  bestTimes: {
    classic: null,
    horror: null,
    puzzle: null,
    hazard: null,
    impossible: null,
  },
  dailyCompletedDates: {},
};

/**
 * Loads saved progression and achievements from localStorage.
 */
export function loadPlayerProgression(): {
  stats: PlayerStats;
  achievements: Record<AchievementId, Achievement>;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const stats: PlayerStats = { ...INITIAL_STATS, ...(data.stats || {}) };
      const achievements: Record<AchievementId, Achievement> = { ...INITIAL_ACHIEVEMENTS };

      if (data.achievements) {
        Object.keys(INITIAL_ACHIEVEMENTS).forEach((key) => {
          const achId = key as AchievementId;
          if (data.achievements[achId]?.unlocked) {
            achievements[achId] = {
              ...achievements[achId],
              unlocked: true,
              unlockedAt: data.achievements[achId].unlockedAt,
            };
          }
        });
      }

      return { stats, achievements };
    }
  } catch {
    // Local storage disabled or corrupted
  }

  return { stats: { ...INITIAL_STATS }, achievements: { ...INITIAL_ACHIEVEMENTS } };
}

/**
 * Saves progression and achievements into localStorage.
 */
export function savePlayerProgression(
  stats: PlayerStats,
  achievements: Record<AchievementId, Achievement>
): void {
  try {
    const payload = { stats, achievements };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage unavailable
  }
}

/**
 * Records completion of an expedition run, updates player stats, and unlocks achievements.
 */
export function recordRunCompletion(
  result: RunResult,
  currentStats: PlayerStats,
  currentAchievements: Record<AchievementId, Achievement>
): {
  updatedStats: PlayerStats;
  updatedAchievements: Record<AchievementId, Achievement>;
  newlyUnlocked: Achievement[];
} {
  const stats: PlayerStats = {
    ...currentStats,
    totalPlayed: currentStats.totalPlayed + 1,
    totalSteps: currentStats.totalSteps + result.stepCount,
    totalTimeSeconds: currentStats.totalTimeSeconds + result.timeSeconds,
  };

  const achievements: Record<AchievementId, Achievement> = { ...currentAchievements };
  const newlyUnlocked: Achievement[] = [];

  const unlock = (id: AchievementId) => {
    if (!achievements[id].unlocked) {
      achievements[id] = {
        ...achievements[id],
        title: achievements[id].name,
        unlocked: true,
        unlockedAt: Date.now(),
      };
      newlyUnlocked.push(achievements[id]);
    }
  };

  if (result.won) {
    stats.totalEscaped += 1;
    stats.currentStreak += 1;
    stats.highestStreak = Math.max(stats.highestStreak, stats.currentStreak);

    // Track category completion
    stats.categoriesCompleted[result.category] = true;

    // Track best time per category
    const prevBest = stats.bestTimes[result.category];
    if (prevBest === null || result.timeSeconds < prevBest) {
      stats.bestTimes[result.category] = Math.round(result.timeSeconds * 10) / 10;
    }

    // 1. General Achievements
    unlock('first_escape');

    if (result.difficultyId === 'master' || result.difficultyId === 'nightmare') {
      unlock('master_escape');
    }

    // Check all categories completed
    const allDone = Object.values(stats.categoriesCompleted).every(Boolean);
    if (allDone) {
      unlock('grand_explorer');
    }

    // 2. Realm Specific Achievements
    if (result.category === 'horror') unlock('shadow_survivor');
    if (result.category === 'puzzle') unlock('riddle_scholar');
    if (result.category === 'hazard') unlock('tide_runner');
    if (result.category === 'impossible') unlock('space_weaver');

    // 3. Challenge Mode Achievements
    if (result.challengeMode === 'time_trial') {
      stats.challengesCompleted += 1;
      unlock('speed_demon');
    } else if (result.challengeMode === 'limited_moves') {
      stats.challengesCompleted += 1;
      unlock('step_master');
    } else if (result.challengeMode === 'daily') {
      stats.challengesCompleted += 1;
      unlock('daily_devotee');
      if (result.dateStr) {
        stats.dailyCompletedDates[result.dateStr] = true;
      }
    }
  } else {
    // Streak reset on defeat
    stats.currentStreak = 0;
  }

  savePlayerProgression(stats, achievements);
  return { updatedStats: stats, updatedAchievements: achievements, newlyUnlocked };
}

/**
 * Convenient wrapper to record a run using persistent storage directly.
 */
export function recordRun(result: RunResult): {
  progression: { stats: PlayerStats; achievements: Record<AchievementId, Achievement> };
  newlyUnlocked: Achievement[];
} {
  const current = loadPlayerProgression();
  const { updatedStats, updatedAchievements, newlyUnlocked } = recordRunCompletion(
    result,
    current.stats,
    current.achievements
  );
  return {
    progression: { stats: updatedStats, achievements: updatedAchievements },
    newlyUnlocked,
  };
}

/**
 * Returns the deterministic daily challenge configuration for the specified date.
 */
export function getDailyChallengeConfig(date: Date = new Date()): {
  seed: string;
  dateStr: string;
  category: CategoryId;
  difficultyId: DifficultyId;
  challengeMode: ChallengeMode;
  rows: number;
  cols: number;
} {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const seed = `DAILY-${dateStr}`;

  // Deterministically rotate categories based on day of year
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      (24 * 60 * 60 * 1000)
  );

  const categories: CategoryId[] = ['classic', 'puzzle', 'hazard', 'horror', 'impossible'];
  const category = categories[dayOfYear % categories.length];

  return {
    seed,
    dateStr,
    category,
    difficultyId: 'pathfinder',
    challengeMode: 'daily',
    rows: 21,
    cols: 21,
  };
}

/**
 * Computes a fair time limit for Time Trial based on shortest path and difficulty.
 */
export function getTimeTrialLimit(
  shortestPathLength: number,
  difficultyId: DifficultyId
): number {
  const speedMultiplier =
    difficultyId === 'nightmare' ? 1.4 : difficultyId === 'master' ? 1.7 : difficultyId === 'pathfinder' ? 2.1 : 2.6;
  // Assume ~3.0 steps per second ideal walk pace
  const idealSec = shortestPathLength / 3.0;
  return Math.max(15, Math.ceil(idealSec * speedMultiplier));
}

/**
 * Computes a fair step budget for Limited Moves challenge.
 */
export function getLimitedMovesBudget(
  shortestPathLength: number,
  difficultyId: DifficultyId
): number {
  const moveMultiplier =
    difficultyId === 'nightmare' ? 1.5 : difficultyId === 'master' ? 1.8 : difficultyId === 'pathfinder' ? 2.2 : 2.8;
  return Math.max(10, Math.ceil(shortestPathLength * moveMultiplier));
}
