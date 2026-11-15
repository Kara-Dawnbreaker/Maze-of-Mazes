/**
 * DefeatModal - Non-graphic, atmospheric defeat modal for Horror & Darkness
 * Triggered when captured by the Stalker entity in Stalker Hunt variant.
 */

import React from 'react';
import { Skull, RotateCcw, ArrowLeft, Footprints, Clock, Hourglass, AlertTriangle } from 'lucide-react';
import { DifficultyId, CustomMazeDimensions } from '../types/maze';
import { DIFFICULTY_PRESETS } from '../utils/mazeGenerator';

interface DefeatModalProps {
  timeSeconds: number;
  stepCount: number;
  difficultyId: DifficultyId;
  customDims?: CustomMazeDimensions | null;
  seed: string;
  cause?: 'stalker' | 'spikes' | 'drowning' | 'timeout' | 'out_of_moves';
  onRetry: () => void;
  onReturnToMenu: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  timeSeconds,
  stepCount,
  difficultyId,
  customDims,
  seed,
  cause = 'stalker',
  onRetry,
  onReturnToMenu,
}) => {
  const diffConfig = DIFFICULTY_PRESETS[difficultyId];

  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const tenths = Math.floor((timeSeconds * 10) % 10);
  const timeFormatted = `${mins > 0 ? `${mins}m ` : ''}${secs}.${tenths}s`;

  let title = 'Claimed by the Shadows';
  let desc = 'The Stalker converged upon your footsteps in the dark corridors.';
  let iconColor = 'text-red-500';
  let badgeBorder = 'border-red-700/60 bg-red-950/80';
  let IconComponent = Skull;

  if (cause === 'spikes') {
    title = 'Impaled by Pressure Spikes';
    desc = 'A timed pressure spike trap triggered beneath your footsteps.';
    iconColor = 'text-amber-500';
    badgeBorder = 'border-amber-700/60 bg-amber-950/80';
    IconComponent = AlertTriangle;
  } else if (cause === 'drowning') {
    title = 'Submerged by the Tide';
    desc = 'The rising floodwaters claimed the lower corridors before you could escape.';
    iconColor = 'text-cyan-400';
    badgeBorder = 'border-cyan-700/60 bg-cyan-950/80';
    IconComponent = AlertTriangle;
  } else if (cause === 'timeout') {
    title = 'Time Trial Expired';
    desc = 'The sands of the hourglass ran out before you could unlock the exit portal.';
    iconColor = 'text-amber-400';
    badgeBorder = 'border-amber-600/60 bg-amber-950/80';
    IconComponent = Hourglass;
  } else if (cause === 'out_of_moves') {
    title = 'Exhausted All Moves';
    desc = 'Your allocated step budget was completely spent before finding the exit.';
    iconColor = 'text-orange-400';
    badgeBorder = 'border-orange-600/60 bg-orange-950/80';
    IconComponent = Footprints;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 text-stone-100 rounded-3xl border border-red-900/60 shadow-2xl p-6 md:p-8 max-w-lg w-full space-y-6 transform transition-all">
        {/* Eerie Atmosphere Header */}
        <div className="text-center space-y-2">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${badgeBorder} border ${iconColor} flex items-center justify-center shadow-lg`}>
            <IconComponent className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className={`text-2xl md:text-3xl font-extrabold font-display ${iconColor} tracking-tight`}>
            {title}
          </h2>
          <p className="text-xs md:text-sm text-stone-400">
            {desc}
          </p>
        </div>

        {/* Survival Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-stone-950/70 rounded-2xl border border-stone-800 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-stone-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span>Time Survived</span>
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-stone-100 tabular-nums">
              {timeFormatted}
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/70 rounded-2xl border border-stone-800 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-stone-500 mb-1">
              <Footprints className="w-3.5 h-3.5 text-red-400" />
              <span>Steps Taken</span>
            </div>
            <div className="text-base md:text-lg font-bold font-mono text-stone-100 tabular-nums">
              {stepCount}
            </div>
          </div>
        </div>

        {/* Expedition Seed Context */}
        <div className="p-3.5 bg-red-950/30 rounded-2xl border border-red-900/40 text-xs text-stone-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-stone-500">Scale:</span>
            <span className="font-semibold text-stone-200">
              {customDims?.isCustom ? (
                <>Custom ({customDims.cols}×{customDims.rows})</>
              ) : (
                <>{diffConfig.name} ({diffConfig.rows}×{diffConfig.cols})</>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Expedition Seed:</span>
            <span className="font-mono text-red-400 font-semibold">{seed}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-700 hover:bg-red-600 active:scale-95 text-white text-sm font-bold shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Expedition</span>
          </button>

          <button
            onClick={onReturnToMenu}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
