/**
 * SettingsModal - Audio Preferences & Gameplay Display Controls
 * Accessible, clean modal providing independent volume controls, fullscreen toggle,
 * camera mode, and breadcrumb options.
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Footprints,
  Sliders,
  X,
  Compass,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraMode: 'follow' | 'overview';
  onToggleCamera: () => void;
  showBreadcrumbs: boolean;
  onToggleBreadcrumbs: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cameraMode,
  onToggleCamera,
  showBreadcrumbs,
  onToggleBreadcrumbs,
}) => {
  const [masterVol, setMasterVol] = useState<number>(Math.round(sounds.getMasterVolume() * 100));
  const [sfxVol, setSfxVol] = useState<number>(Math.round(sounds.getSfxVolume() * 100));
  const [ambientVol, setAmbientVol] = useState<number>(Math.round(sounds.getAmbientVolume() * 100));
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(document.fullscreenElement));

  // Re-sync states whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setMasterVol(Math.round(sounds.getMasterVolume() * 100));
      setSfxVol(Math.round(sounds.getSfxVolume() * 100));
      setAmbientVol(Math.round(sounds.getAmbientVolume() * 100));
      setIsMuted(sounds.getMuted());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen) return null;

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    sounds.setMasterVolume(val / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    sounds.setSfxVolume(val / 100);
    // Play quick preview sound
    sounds.playStep();
  };

  const handleAmbientChange = (val: number) => {
    setAmbientVol(val);
    sounds.setAmbientVolume(val / 100);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sounds.playStep();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col p-5 sm:p-6 bg-amber-50 rounded-3xl border border-amber-200 shadow-2xl text-stone-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-amber-200/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-title" className="text-lg font-bold text-stone-900">
                Settings, Audio & Controls
              </h2>
              <p className="text-xs text-stone-600">Preferences save automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-amber-100/80 rounded-xl transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
          {/* Section 1: Audio Volumes */}
          <div className="space-y-3 p-3.5 bg-white/70 rounded-2xl border border-amber-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Audio Volumes
              </span>
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-stone-700 border-amber-300 hover:bg-amber-200'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Unmute All' : 'Mute All'}</span>
              </button>
            </div>

            {/* Master Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" /> Master Volume
                </span>
                <span className="font-mono">{isMuted ? 'Muted' : `${masterVol}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVol}
                disabled={isMuted}
                onChange={(e) => handleMasterChange(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* SFX Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Volume1 className="w-3.5 h-3.5 text-amber-700" /> Sound Effects (SFX)
                </span>
                <span className="font-mono">{`${sfxVol}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVol}
                disabled={isMuted}
                onChange={(e) => handleSfxChange(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Ambience Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-700" /> Environmental Ambience
                </span>
                <span className="font-mono">{`${ambientVol}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ambientVol}
                disabled={isMuted}
                onChange={(e) => handleAmbientChange(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Section 2: Camera & Display */}
          <div className="space-y-2.5 p-3.5 bg-white/70 rounded-2xl border border-amber-200/70">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Camera & Display
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Camera mode button */}
              <button
                onClick={onToggleCamera}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  cameraMode === 'overview'
                    ? 'bg-amber-200 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                <Compass className="w-4 h-4 text-amber-700" />
                <span>{cameraMode === 'follow' ? 'Follow Cam' : 'Overview Map'}</span>
              </button>

              {/* Breadcrumb toggle */}
              <button
                onClick={onToggleBreadcrumbs}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  showBreadcrumbs
                    ? 'bg-amber-200 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                <Footprints className="w-4 h-4 text-amber-700" />
                <span>{showBreadcrumbs ? 'Footprints: On' : 'Footprints: Off'}</span>
              </button>
            </div>

            {/* Fullscreen button */}
            <button
              onClick={handleToggleFullscreen}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-amber-200 hover:bg-amber-100/70 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4 text-stone-600" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4 text-stone-600" />
                  <span>Toggle Fullscreen</span>
                </>
              )}
            </button>
          </div>

          {/* Section 3: Gameplay Controls Reference */}
          <div className="space-y-2 p-3.5 bg-amber-100/50 rounded-2xl border border-amber-200/80 text-xs">
            <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">
              How to Play & Controls
            </span>
            <div className="grid grid-cols-2 gap-2 text-stone-700">
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-stone-900">
                  W A S D / Arrows
                </span>
                <span>Move Explorer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-stone-900">
                  Space / M
                </span>
                <span>Toggle Map</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-stone-900">
                  Touch Swipe
                </span>
                <span>Slide Corridor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-stone-900">
                  On-screen D-Pad
                </span>
                <span>Touch Nav</span>
              </div>
            </div>
          </div>

          {/* Section 4: Game Release & Engine Credits */}
          <div className="p-3 bg-stone-100/80 rounded-2xl border border-stone-200 text-center space-y-1">
            <div className="font-bold text-xs text-stone-800">
              Maze of Mazes · Version 1.0.0
            </div>
            <p className="text-[11px] text-stone-600">
              Deterministic Randomized DFS Backtracking · Synthesized Web Audio · 100% Client-Side React SPA
            </p>
          </div>
        </div>

        {/* Footer Done Button */}
        <div className="pt-3 border-t border-amber-200/80 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
