/**
 * GameHUD - In-game Head-Up Display
 * Dynamically adapts between Classic Labyrinth and Horror & Darkness.
 * Displays variant-specific feedback (Lantern radius, Stalker threat awareness).
 */

import React, { useState } from 'react';
import {
  Compass,
  Footprints,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Copy,
  Check,
  Flame,
  Skull,
  Radio,
  Sliders,
  Trophy,
  Hourglass,
  Calendar,
  Palette,
  Sparkles,
} from 'lucide-react';
import {
  CategoryId,
  DifficultyId,
  VariantId,
  StalkerState,
  CustomMazeDimensions,
  PuzzleSanctumState,
  FloodingState,
  ImpossibleGeometryState,
} from '../types/maze';
import { ChallengeMode } from '../types/progression';
import { DIFFICULTY_PRESETS } from '../utils/mazeGenerator';
import { HORROR_DIFFICULTY_PARAMS } from '../utils/visibility';
import { sounds } from '../utils/audio';

interface GameHUDProps {
  category: CategoryId;
  variant: VariantId;
  difficultyId: DifficultyId;
  customDims?: CustomMazeDimensions | null;
  puzzleState?: PuzzleSanctumState | null;
  floodingState?: FloodingState | null;
  impossibleState?: ImpossibleGeometryState | null;
  stalker?: StalkerState | null;
  seed: string;
  stepCount: number;
  timeSeconds: number;
  cameraMode: 'follow' | 'overview';
  showBreadcrumbs: boolean;
  challengeMode?: ChallengeMode;
  timeTrialLimit?: number;
  moveBudget?: number;
  onToggleCamera: () => void;
  onToggleBreadcrumbs: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
  onOpenSettings?: () => void;
  onOpenProgression?: () => void;
  onOpenThemes?: () => void;
  onOpenWardrobe?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  category,
  variant,
  difficultyId,
  customDims,
  puzzleState,
  floodingState,
  impossibleState,
  stalker,
  seed,
  stepCount,
  timeSeconds,
  cameraMode,
  showBreadcrumbs,
  challengeMode = 'none',
  timeTrialLimit,
  moveBudget,
  onToggleCamera,
  onToggleBreadcrumbs,
  onRestart,
  onReturnToMenu,
  onOpenSettings,
  onOpenProgression,
  onOpenThemes,
  onOpenWardrobe,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());

  const isHorror = category === 'horror';
  const diffConfig = DIFFICULTY_PRESETS[difficultyId];
  const horrorParams = HORROR_DIFFICULTY_PARAMS[difficultyId] || HORROR_DIFFICULTY_PARAMS.pathfinder;

  // Format timer into mm:ss.d
  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const tenths = Math.floor((timeSeconds * 10) % 10);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seed).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      if (isHorror) sounds.playHorrorStep();
      else sounds.playStep();
    }
  };

  return (
    <header className="absolute top-3 left-3 right-3 md:top-4 md:left-8 md:right-8 z-20 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center justify-between gap-3 md:gap-6 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl border shadow-md max-w-6xl mx-auto w-full transition-colors ${
          category === 'horror'
            ? 'bg-stone-900/90 text-stone-200 border-stone-800 backdrop-blur-md'
            : category === 'puzzle'
            ? 'bg-[#181326]/90 text-purple-100 border-purple-900/70 backdrop-blur-md'
            : category === 'hazard'
            ? 'bg-[#0F172A]/90 text-cyan-100 border-cyan-900/70 backdrop-blur-md'
            : category === 'impossible'
            ? 'bg-[#0E0C22]/90 text-cyan-100 border-indigo-900/70 backdrop-blur-md'
            : 'bg-amber-50/95 text-stone-700 border-amber-200 backdrop-blur-md'
        }`}
      >
        {/* Zone 1: Brand Wordmark & Menu Return */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onReturnToMenu}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              category === 'horror' || category === 'puzzle' || category === 'hazard' || category === 'impossible'
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                : 'bg-amber-100 hover:bg-amber-200 text-stone-700 border-amber-300'
            }`}
            title="Return to Journey Menu"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <span
            className={`text-sm md:text-base font-bold tracking-tight whitespace-nowrap ${
              category === 'horror'
                ? 'text-red-400'
                : category === 'puzzle'
                ? 'text-purple-300'
                : category === 'hazard'
                ? 'text-amber-400'
                : category === 'impossible'
                ? 'text-cyan-300'
                : 'text-stone-900'
            }`}
          >
            {category === 'horror'
              ? 'Dark Labyrinth'
              : category === 'puzzle'
              ? 'Puzzle Sanctum'
              : category === 'hazard'
              ? 'Hazard Sanctum'
              : category === 'impossible'
              ? 'Impossible Geometry'
              : 'Maze of Mazes'}
          </span>
        </div>

        {/* Zone 2: Real-Time Stats with Variant Specific Feedback */}
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium whitespace-nowrap overflow-x-auto py-1">
          {/* Difficulty / Dimensions Tier */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400">Scale:</span>
            <span
              className={`font-semibold ${
                category === 'horror'
                  ? 'text-stone-200'
                  : category === 'puzzle'
                  ? 'text-purple-200'
                  : category === 'hazard'
                  ? 'text-cyan-200'
                  : category === 'impossible'
                  ? 'text-cyan-200'
                  : 'text-amber-900'
              }`}
            >
              {customDims?.isCustom
                ? `${customDims.cols}×${customDims.rows}`
                : `${diffConfig.name.split(' ')[0]} (${diffConfig.cols}×${diffConfig.rows})`}
            </span>
          </div>

          <span className="opacity-40" aria-hidden="true">
            ·
          </span>

          {/* Seed with click-to-copy */}
          <button
            onClick={handleCopySeed}
            className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border transition-colors ${
              category !== 'classic'
                ? 'bg-stone-950/60 text-stone-300 border-stone-800 hover:border-stone-700'
                : 'bg-white/70 text-stone-600 border-amber-200 hover:text-amber-800'
            }`}
            title="Click to copy deterministic seed"
          >
            <span className="truncate max-w-[110px]">{seed}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 opacity-60" />
            )}
          </button>

          <span className="opacity-40" aria-hidden="true">
            ·
          </span>

          {/* Variant-Specific Awareness Display */}
          {isHorror && variant === 'fog' && (
            <>
              <div className="flex items-center gap-1 text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span className="hidden sm:inline">Lantern:</span>
                <span className="font-mono text-xs font-bold">{horrorParams.lanternRadius}t</span>
              </div>
              <span className="opacity-40" aria-hidden="true">
                ·
              </span>
            </>
          )}

          {isHorror && variant === 'stalker' && stalker && (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    stalker.status === 'CHASE'
                      ? 'bg-red-500 animate-ping'
                      : stalker.status === 'SUSPICION'
                      ? 'bg-amber-400'
                      : stalker.status === 'SEARCH'
                      ? 'bg-purple-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    stalker.status === 'CHASE'
                      ? 'text-red-400'
                      : stalker.status === 'SUSPICION'
                      ? 'text-amber-400'
                      : stalker.status === 'SEARCH'
                      ? 'text-purple-300'
                      : 'text-stone-400'
                  }`}
                >
                  {stalker.status === 'CHASE'
                    ? 'Pursuing!'
                    : stalker.status === 'SUSPICION'
                    ? 'Alert'
                    : stalker.status === 'SEARCH'
                    ? 'Searching'
                    : 'Lurking'}
                </span>
              </div>
              <span className="opacity-40" aria-hidden="true">
                ·
              </span>
            </>
          )}

          {/* Puzzle Sanctum Awareness */}
          {category === 'puzzle' && puzzleState && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-300 font-semibold hidden sm:inline">Keys:</span>
                <div className="flex items-center gap-1">
                  {puzzleState.keys.map((k) => (
                    <span
                      key={k.id}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                        k.collected
                          ? k.color === 'ruby'
                            ? 'bg-red-500 text-white border-red-400'
                            : k.color === 'sapphire'
                            ? 'bg-sky-400 text-white border-sky-300'
                            : k.color === 'emerald'
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-amber-400 text-stone-900 border-amber-300'
                          : 'bg-stone-800/80 text-stone-500 border-stone-700'
                      }`}
                      title={k.name}
                    >
                      {k.name[0]}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-purple-200/80 ml-1">
                  Doors: {puzzleState.doors.filter((d) => d.isUnlocked).length}/{puzzleState.doors.length}
                </span>
              </div>
              <span className="opacity-40" aria-hidden="true">
                ·
              </span>
            </>
          )}

          {/* Hazard Sanctum Awareness */}
          {category === 'hazard' && floodingState && (
            <>
              <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span className="hidden sm:inline">Flood Tide:</span>
                <span className="font-mono text-xs font-bold bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                  {Math.min(100, Math.round((floodingState.waterLevel / 8.5) * 100))}%
                </span>
              </div>
              <span className="opacity-40" aria-hidden="true">
                ·
              </span>
            </>
          )}

          {/* Impossible Geometry Awareness */}
          {category === 'impossible' && impossibleState && (
            <>
              <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span className="hidden sm:inline">Portals:</span>
                <span className="font-mono text-xs font-bold bg-indigo-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-indigo-700">
                  {impossibleState.portals.length / 2} Pairs Active
                </span>
              </div>
              <span className="opacity-40" aria-hidden="true">
                ·
              </span>
            </>
          )}

          {/* Challenge Mode Meters or Standard Steps/Time */}
          {challengeMode === 'time_trial' && timeTrialLimit !== undefined ? (
            <>
              {/* Steps */}
              <div className="flex items-center gap-1">
                <span className="text-stone-500">Steps:</span>
                <span className={`font-mono font-bold tabular-nums ${isHorror ? 'text-stone-200' : 'text-stone-900'}`}>
                  {stepCount}
                </span>
              </div>
              <span className="opacity-40" aria-hidden="true">·</span>
              {/* Time Countdown */}
              {(() => {
                const remaining = Math.max(0, timeTrialLimit - timeSeconds);
                const rMins = Math.floor(remaining / 60);
                const rSecs = Math.floor(remaining % 60);
                const rTenths = Math.floor((remaining * 10) % 10);
                const isUrgent = remaining <= 10;
                return (
                  <div className={`flex items-center gap-1 font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                    <Hourglass className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs">Left:</span>
                    <span className="font-mono tabular-nums">
                      {String(rMins).padStart(2, '0')}:{String(rSecs).padStart(2, '0')}.{rTenths}
                    </span>
                  </div>
                );
              })()}
            </>
          ) : challengeMode === 'limited_moves' && moveBudget !== undefined ? (
            <>
              {/* Moves Left */}
              {(() => {
                const remaining = Math.max(0, moveBudget - stepCount);
                const isUrgent = remaining <= 10;
                return (
                  <div className={`flex items-center gap-1 font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-emerald-700'}`}>
                    <Footprints className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs">Moves Left:</span>
                    <span className="font-mono tabular-nums">
                      {remaining} / {moveBudget}
                    </span>
                  </div>
                );
              })()}
              <span className="opacity-40" aria-hidden="true">·</span>
              {/* Timer */}
              <div className="flex items-center gap-1">
                <span className="text-stone-500">Time:</span>
                <span className={`font-mono font-bold tabular-nums ${isHorror ? 'text-red-400' : 'text-amber-900'}`}>
                  {formattedTime}
                </span>
              </div>
            </>
          ) : (
            <>
              {challengeMode === 'daily' && (
                <>
                  <div className="flex items-center gap-1 text-xs font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800">
                    <Calendar className="w-3 h-3 text-purple-300" />
                    <span>Daily</span>
                  </div>
                  <span className="opacity-40" aria-hidden="true">·</span>
                </>
              )}
              {/* Steps */}
              <div className="flex items-center gap-1">
                <span className={isHorror ? 'text-stone-500' : 'text-stone-500'}>Steps:</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    isHorror ? 'text-stone-200' : 'text-stone-900'
                  }`}
                >
                  {stepCount}
                </span>
              </div>

              <span className={isHorror ? 'text-stone-700' : 'text-amber-300'} aria-hidden="true">
                ·
              </span>

              {/* Timer */}
              <div className="flex items-center gap-1">
                <span className={isHorror ? 'text-stone-500' : 'text-stone-500'}>Time:</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    isHorror ? 'text-red-400' : 'text-amber-900'
                  }`}
                >
                  {formattedTime}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Zone 3: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Progression Records & Achievements */}
          {onOpenProgression && (
            <button
              onClick={onOpenProgression}
              className={`p-2 rounded-xl border transition-colors ${
                isHorror
                  ? 'bg-stone-800 hover:bg-stone-700 text-amber-400 border-stone-700'
                  : 'bg-white/80 hover:bg-amber-100 text-amber-600 border-amber-300'
              }`}
              title="Expedition Records & Achievements"
            >
              <Trophy className="w-4 h-4" />
            </button>
          )}

          {/* Theme Switcher */}
          {onOpenThemes && (
            <button
              onClick={onOpenThemes}
              className={`p-2 rounded-xl border transition-colors ${
                isHorror
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                  : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-300'
              }`}
              title="Change Theme Palette"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          {/* Character & Wardrobe Switcher */}
          {onOpenWardrobe && (
            <button
              onClick={onOpenWardrobe}
              className={`p-2 rounded-xl border transition-colors ${
                isHorror
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                  : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-300'
              }`}
              title="Change Character & Wardrobe"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Camera Mode Toggle */}
          <button
            onClick={onToggleCamera}
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              cameraMode === 'overview'
                ? isHorror
                  ? 'bg-red-800 text-white border-red-700'
                  : 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isHorror
                ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-700'
                : 'bg-white/80 text-stone-700 hover:bg-amber-100 border-amber-300'
            }`}
            title={cameraMode === 'follow' ? 'Overview Map (Space)' : 'Follow Camera (Space)'}
          >
            {cameraMode === 'follow' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {/* Breadcrumbs Toggle */}
          <button
            onClick={onToggleBreadcrumbs}
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              showBreadcrumbs
                ? isHorror
                  ? 'bg-red-950/70 text-red-300 border-red-800'
                  : 'bg-amber-200 text-amber-900 border-amber-400'
                : isHorror
                ? 'bg-stone-800 text-stone-500 hover:bg-stone-700 border-stone-700'
                : 'bg-white/80 text-stone-500 hover:bg-amber-100 border-amber-300'
            }`}
            title="Toggle Footprint Breadcrumbs"
          >
            <Footprints className="w-4 h-4" />
          </button>

          {/* Settings & Audio Modal Trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-xl border transition-colors ${
                isHorror
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                  : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-300'
              }`}
              title="Audio & Gameplay Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              isHorror
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-300'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 opacity-50" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className={`flex items-center gap-1.5 px-3 py-2 text-white font-medium text-xs rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap ${
              isHorror ? 'bg-red-800 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
            title="Restart current maze"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Floating Puzzle Interaction Toast Banner */}
      {puzzleState?.message && (
        <div className="mt-2 text-center pointer-events-none transition-all duration-300">
          <span className="inline-block bg-purple-950/90 text-purple-200 border border-purple-500/80 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md animate-pulse">
            ✦ {puzzleState.message}
          </span>
        </div>
      )}
    </header>
  );
};
