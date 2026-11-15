/**
 * ProgressionModal - Achievements & Expeditions Record
 * Displays persistent player stats, realm mastery, streak, and unlocked achievements.
 */

import React from 'react';
import { Trophy, X, Flame, Footprints, Clock, Award, CheckCircle2, Lock } from 'lucide-react';
import { Achievement, PlayerStats, PlayerProgression } from '../types/progression';

interface ProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: PlayerStats;
  achievements?: Record<string, Achievement>;
  progression?: PlayerProgression;
}

export const ProgressionModal: React.FC<ProgressionModalProps> = ({
  isOpen,
  onClose,
  stats: propStats,
  achievements: propAchievements,
  progression,
}) => {
  if (!isOpen) return null;

  const stats = progression?.stats || propStats;
  const achievements = progression?.achievements || propAchievements;
  if (!stats || !achievements) return null;

  const achievementList = Object.values(achievements);
  const unlockedCount = achievementList.filter((a) => a.unlocked).length;

  const formatSecs = (sec: number | null) => {
    if (sec === null) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="progression-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-amber-50/98 rounded-3xl border border-amber-200 shadow-2xl text-stone-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-amber-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/90 text-white shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 id="progression-title" className="text-xl font-extrabold text-stone-900 tracking-tight">
                Expedition Records
              </h2>
              <p className="text-xs text-stone-600">
                Achievements & Lifetime Statistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-amber-100 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Section 1: Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 text-center">
              <div className="text-[11px] font-semibold text-stone-500 mb-0.5">Escaped</div>
              <div className="text-xl font-bold font-mono text-amber-900">{stats.totalEscaped}</div>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 text-center">
              <div className="text-[11px] font-semibold text-stone-500 mb-0.5 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" /> Win Streak
              </div>
              <div className="text-xl font-bold font-mono text-orange-700">{stats.currentStreak}</div>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 text-center">
              <div className="text-[11px] font-semibold text-stone-500 mb-0.5 flex items-center justify-center gap-1">
                <Footprints className="w-3 h-3 text-amber-700" /> Steps
              </div>
              <div className="text-lg font-bold font-mono text-stone-800 truncate">
                {stats.totalSteps.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 text-center">
              <div className="text-[11px] font-semibold text-stone-500 mb-0.5 flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-amber-600" /> Challenges
              </div>
              <div className="text-xl font-bold font-mono text-amber-800">
                {stats.challengesCompleted}
              </div>
            </div>
          </div>

          {/* Section 2: Best Times by Realm */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Realm Best Times
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-xs">
                <span className="text-stone-600 font-medium">Classic Labyrinth:</span>
                <div className="font-mono font-bold text-stone-900 mt-0.5">{formatSecs(stats.bestTimes.classic)}</div>
              </div>
              <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-xs">
                <span className="text-stone-600 font-medium">Horror & Darkness:</span>
                <div className="font-mono font-bold text-stone-900 mt-0.5">{formatSecs(stats.bestTimes.horror)}</div>
              </div>
              <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-xs">
                <span className="text-stone-600 font-medium">Puzzle Sanctum:</span>
                <div className="font-mono font-bold text-stone-900 mt-0.5">{formatSecs(stats.bestTimes.puzzle)}</div>
              </div>
              <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-xs">
                <span className="text-stone-600 font-medium">Hazard Sanctum:</span>
                <div className="font-mono font-bold text-stone-900 mt-0.5">{formatSecs(stats.bestTimes.hazard)}</div>
              </div>
              <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-xs">
                <span className="text-stone-600 font-medium">Impossible Geometry:</span>
                <div className="font-mono font-bold text-stone-900 mt-0.5">{formatSecs(stats.bestTimes.impossible)}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Achievements Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Achievements ({unlockedCount} / {achievementList.length})
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">
                {Math.round((unlockedCount / achievementList.length) * 100)}%
              </span>
            </div>

            <div className="space-y-2">
              {achievementList.map((ach) => (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                    ach.unlocked
                      ? 'bg-white border-amber-300 shadow-xs'
                      : 'bg-stone-100/60 border-stone-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      ach.unlocked
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {ach.unlocked ? ach.icon : <Lock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-stone-900">{ach.name}</span>
                      {ach.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-amber-100/50 border-t border-amber-200/80 text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Close Records
          </button>
        </div>
      </div>
    </div>
  );
};
