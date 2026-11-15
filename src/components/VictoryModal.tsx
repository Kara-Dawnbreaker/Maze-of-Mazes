/**
 * VictoryModal - Celebration modal when the player reaches the Exit Portal
 * Displays run performance, steps taken vs optimal BFS route, and next actions.
 */

import React from 'react';
import { Trophy, RotateCcw, ArrowRight, ArrowLeft, Sparkles, Footprints, Clock, Target, Award, Calendar, Hourglass } from 'lucide-react';
import { DifficultyId, CustomMazeDimensions } from '../types/maze';
import { DIFFICULTY_PRESETS } from '../utils/mazeGenerator';
import { ChallengeMode, Achievement } from '../types/progression';

interface VictoryModalProps {
  timeSeconds: number;
  stepCount: number;
  shortestPathLength: number;
  difficultyId: DifficultyId;
  customDims?: CustomMazeDimensions | null;
  seed: string;
  challengeMode?: ChallengeMode;
  personalBestSeconds?: number | null;
  newlyUnlockedAchievements?: Achievement[];
  onPlayAgain: () => void;
  onNextMaze: () => void;
  onReturnToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  timeSeconds,
  stepCount,
  shortestPathLength,
  difficultyId,
  customDims,
  seed,
  challengeMode = 'none',
  personalBestSeconds = null,
  newlyUnlockedAchievements = [],
  onPlayAgain,
  onNextMaze,
  onReturnToMenu,
}) => {
  const diffConfig = DIFFICULTY_PRESETS[difficultyId];

  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const tenths = Math.floor((timeSeconds * 10) % 10);
  const timeFormatted = `${mins > 0 ? `${mins}m ` : ''}${secs}.${tenths}s`;

  // Path efficiency calculation
  const efficiency = Math.min(100, Math.round((shortestPathLength / Math.max(1, stepCount)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-amber-50 rounded-3xl border-2 border-amber-300 shadow-2xl p-6 md:p-8 max-w-lg w-full text-stone-900 space-y-6 transform transition-all">
        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-lg animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2">
            {challengeMode === 'time_trial' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                <Hourglass className="w-3 h-3 text-amber-700" />
                Time Trial Victory
              </span>
            )}
            {challengeMode === 'limited_moves' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                <Footprints className="w-3 h-3 text-emerald-700" />
                Move Budget Master
              </span>
            )}
            {challengeMode === 'daily' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900 border border-purple-300">
                <Calendar className="w-3 h-3 text-purple-700" />
                Daily Challenge Conquered
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
            Labyrinth Conquered!
          </h2>
          <p className="text-sm text-stone-600">
            You successfully navigated the corridors and unlocked the Sun Portal.
          </p>
        </div>

        {/* Newly Unlocked Achievements Banner */}
        {newlyUnlockedAchievements.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl border-2 border-amber-300/80 shadow-xs space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-600 animate-spin-slow" />
              <span>Achievement Unlocked!</span>
            </div>
            <div className="space-y-1.5">
              {newlyUnlockedAchievements.map((ach) => (
                <div key={ach.id} className="flex items-center gap-2.5 bg-white/80 p-2 rounded-xl border border-amber-200">
                  <span className="text-xl">{ach.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-stone-900">{ach.name || ach.title}</div>
                    <div className="text-[11px] text-stone-600">{ach.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Time Taken */}
          <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-stone-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Time</span>
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-stone-900 tabular-nums">
              {timeFormatted}
            </div>
          </div>

          {/* Steps Taken */}
          <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-stone-500 mb-1">
              <Footprints className="w-3.5 h-3.5 text-amber-600" />
              <span>Steps</span>
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-stone-900 tabular-nums">
              {stepCount}
            </div>
          </div>

          {/* Route Efficiency */}
          <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-stone-500 mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Efficiency</span>
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-emerald-700 tabular-nums">
              {efficiency}%
            </div>
          </div>
        </div>

        {/* Expedition Details */}
        <div className="p-4 bg-amber-100/60 rounded-2xl border border-amber-200/80 text-xs text-stone-700 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-stone-500">Labyrinth Scale:</span>
            <span className="font-semibold text-stone-900">
              {customDims?.isCustom ? (
                <>Custom ({customDims.cols}×{customDims.rows})</>
              ) : (
                <>{diffConfig.name} ({diffConfig.rows}×{diffConfig.cols})</>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Shortest Route Possible:</span>
            <span className="font-mono font-medium text-stone-900">
              {shortestPathLength} steps
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Personal Best:</span>
            <span className="font-mono font-semibold text-emerald-700">
              {personalBestSeconds === null ? 'First completion!' : `${Math.floor(personalBestSeconds / 60)}m ${(personalBestSeconds % 60).toFixed(1)}s`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Deterministic Seed:</span>
            <span className="font-mono font-bold text-amber-900">{seed}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-stone-800 text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Same Seed</span>
          </button>

          <button
            onClick={onNextMaze}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-bold shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Next Maze</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Return to Menu Link */}
        <div className="text-center pt-1">
          <button
            onClick={onReturnToMenu}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Menu Journey</span>
          </button>
        </div>
      </div>
    </div>
  );
};
