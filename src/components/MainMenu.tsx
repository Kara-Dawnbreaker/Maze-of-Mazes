/**
 * MainMenu - Refined, Immersive Side-Docked Maze Adventure Interface
 * Redesigned for Phase 02:
 * - Moves the selection panel to a compact right-side dock (or bottom sheet on mobile),
 *   leaving the center-left open for the explorer and persistent maze environment.
 * - Replaces crowded top text buttons with a clean visual 5-step journey progress track.
 * - Strict warm, light, welcoming color identity (sunny gold, warm stone, coral, turquoise).
 * - Clear information hierarchy with zero-pill typography and no text clutter.
 */

import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  Flame,
  Sliders,
  Sun,
  Layers,
  MapPin,
  CheckCircle2,
  Trophy,
  Hourglass,
  Calendar,
  Footprints,
  Palette,
} from 'lucide-react';
import {
  MAZE_CATEGORIES,
  MAZE_VARIANTS,
  MENU_CHAMBERS,
  MenuChamber,
} from '../data/menuMazeData';
import { DIFFICULTY_PRESETS } from '../utils/mazeGenerator';
import { CategoryId, DifficultyId, VariantId, CustomMazeDimensions } from '../types/maze';
import { ChallengeMode } from '../types/progression';
import { getDailyChallengeConfig } from '../utils/progressionEngine';
import { generateRandomSeed } from '../utils/prng';
import { sounds } from '../utils/audio';

interface MainMenuProps {
  currentChamberIndex: number;
  isTraveling: boolean;
  onNavigateToChamber: (targetIndex: number) => void;
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  selectedDifficulty: DifficultyId;
  onSelectDifficulty: (diff: DifficultyId) => void;
  customDims: CustomMazeDimensions;
  onCustomDimsChange: (dims: CustomMazeDimensions) => void;
  selectedVariant: VariantId;
  onSelectVariant: (variant: VariantId) => void;
  seed: string;
  onSeedChange: (newSeed: string) => void;
  challengeMode: ChallengeMode;
  onSelectChallengeMode: (mode: ChallengeMode) => void;
  onStartGame: () => void;
  onOpenProgression?: () => void;
  onOpenThemes?: () => void;
  onOpenWardrobe?: () => void;
  onOpenSettings?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  currentChamberIndex,
  isTraveling,
  onNavigateToChamber,
  selectedCategory,
  onSelectCategory,
  selectedDifficulty,
  onSelectDifficulty,
  customDims,
  onCustomDimsChange,
  selectedVariant,
  onSelectVariant,
  seed,
  onSeedChange,
  challengeMode,
  onSelectChallengeMode,
  onStartGame,
  onOpenProgression,
  onOpenThemes,
  onOpenWardrobe,
  onOpenSettings,
}) => {
  const currentChamber: MenuChamber = MENU_CHAMBERS[currentChamberIndex];
  const [seedInput, setSeedInput] = useState<string>(seed);

  const handleNext = () => {
    if (currentChamberIndex < MENU_CHAMBERS.length - 1 && !isTraveling) {
      sounds.playChamberAdvance();
      onNavigateToChamber(currentChamberIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentChamberIndex > 0 && !isTraveling) {
      sounds.playChamberRewind();
      onNavigateToChamber(currentChamberIndex - 1);
    }
  };

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = seedInput.trim().toUpperCase() || 'MAZE-ORIGIN-01';
    onSeedChange(trimmed);
    setSeedInput(trimmed);
  };

  const handleRandomizeSeed = () => {
    const s = generateRandomSeed();
    setSeedInput(s);
    onSeedChange(s);
    sounds.playStep();
  };

  const handleQuickPlay = () => {
    sounds.playPortalEnter();
    onStartGame();
  };

  // Helper for step icons
  const renderStepIcon = (iconType: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = `w-3.5 h-3.5 ${
      isActive ? 'text-white' : isCompleted ? 'text-amber-800' : 'text-stone-400'
    }`;
    switch (iconType) {
      case 'hearth':
        return <Flame className={iconClass} />;
      case 'realm':
        return <Compass className={iconClass} />;
      case 'scale':
        return <Sliders className={iconClass} />;
      case 'variant':
        return <Sparkles className={iconClass} />;
      case 'portal':
        return <Sun className={iconClass} />;
      default:
        return <MapPin className={iconClass} />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 z-10 overflow-hidden">
      {/* 1. TOP HEADER & VISUAL JOURNEY TRACK */}
      <header className="pointer-events-auto flex items-center justify-between gap-3 md:gap-6 bg-amber-50/90 backdrop-blur-md px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border border-amber-200/90 shadow-sm max-w-6xl mx-auto w-full shrink-0">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-stone-900 whitespace-nowrap block leading-tight">
              Maze of Mazes
            </span>
            <span className="text-[11px] text-amber-800/80 hidden sm:block">
              Interactive Menu Journey
            </span>
          </div>
        </div>

        {/* Visual Journey Progress Track */}
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1"
          aria-label="Expedition Progress"
        >
          {MENU_CHAMBERS.map((ch, idx) => {
            const isActive = idx === currentChamberIndex;
            const isCompleted = idx < currentChamberIndex;
            return (
              <React.Fragment key={ch.id}>
                {/* Connecting track line between nodes */}
                {idx > 0 && (
                  <div
                    className={`h-0.5 w-3 sm:w-5 md:w-7 transition-colors rounded-full ${
                      idx <= currentChamberIndex ? 'bg-amber-400' : 'bg-stone-200'
                    }`}
                  />
                )}

                {/* Step Node Button */}
                <button
                  onClick={() => !isTraveling && onNavigateToChamber(idx)}
                  disabled={isTraveling}
                  className={`group relative flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all cursor-pointer disabled:cursor-wait ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs font-semibold ring-2 ring-amber-400/50'
                      : isCompleted
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      : 'bg-stone-100/80 hover:bg-amber-50 text-stone-500'
                  }`}
                  title={`Navigate to Chamber ${idx + 1}: ${ch.name}`}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {renderStepIcon(ch.iconType, isActive, isCompleted)}
                  </div>
                  <span className="text-xs hidden md:inline whitespace-nowrap">
                    {ch.shortName}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Quick Play & Records CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenThemes && (
            <button
              onClick={onOpenThemes}
              disabled={isTraveling}
              className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
              title="Maze Themes & Color Palettes"
            >
              <Palette className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Themes</span>
            </button>
          )}

          {onOpenWardrobe && (
            <button
              onClick={onOpenWardrobe}
              disabled={isTraveling}
              className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
              title="Characters & Wardrobe Customization"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Wardrobe</span>
            </button>
          )}

          {onOpenProgression && (
            <button
              onClick={onOpenProgression}
              disabled={isTraveling}
              className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
              title="Expedition Records & Achievements"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Records</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              disabled={isTraveling}
              className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
              title="Settings, Audio & Controls"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}

          <button
            onClick={handleQuickPlay}
            disabled={isTraveling}
            className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-xs md:text-sm rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
            title="Instant game start with current selections"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Quick Play</span>
          </button>
        </div>
      </header>

      {/* 2. REFINED SIDE-DOCKED SELECTION PANEL */}
      {/* On desktop: docked elegantly to the right (w-[380px]), keeping center-left open for the maze & explorer */}
      {/* On mobile: compact bottom sheet card that preserves the upper half for the maze view */}
      <div className="pointer-events-auto flex-1 flex flex-col justify-end lg:justify-center items-end max-w-6xl mx-auto w-full py-2">
        <aside
          className="w-full lg:w-[380px] max-h-[50vh] lg:max-h-[82vh] bg-amber-50/92 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-amber-200/90 shadow-xl flex flex-col justify-between transition-all duration-300 overflow-hidden"
          role="region"
          aria-label="Chamber Selection Dock"
        >
          {/* Header Zone: Concise Chamber Info */}
          <div className="border-b border-amber-200/70 pb-3 mb-3 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-0.5">
              <span>Chamber 0{currentChamberIndex + 1} of 05</span>
              <span>{currentChamber.shortName}</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-stone-900 tracking-tight font-display">
              {currentChamber.title}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed line-clamp-2">
              {currentChamber.description}
            </p>
          </div>

          {/* Body Zone: Compact Choices with Clean Hierarchy */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[160px]">
            {/* Step 0: Explorer's Hearth */}
            {currentChamberIndex === 0 && (
              <div className="space-y-3 py-1">
                <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-200/80 text-stone-800 text-xs leading-relaxed space-y-1">
                  <div className="font-semibold text-amber-950">
                    The Miniature Maze World
                  </div>
                  <p className="text-stone-700">
                    Your explorer stands by the hearth. Walk through the sunlit stone corridors,
                    configure your trial, and manifest your procedural labyrinth.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                  <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/60">
                    <div className="font-semibold text-stone-900 mb-0.5">Procedural DFS</div>
                    <div>100% solvable paths</div>
                  </div>
                  <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/60">
                    <div className="font-semibold text-stone-900 mb-0.5">Deterministic</div>
                    <div>Reproducible seeds</div>
                  </div>
                </div>

                {/* Quick Expansion Features */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Customization & Themes
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {onOpenThemes && (
                      <button
                        onClick={onOpenThemes}
                        className="p-2.5 rounded-xl bg-amber-100/80 hover:bg-amber-200 active:scale-95 text-amber-950 border border-amber-300/80 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Palette className="w-4 h-4 text-amber-700" />
                        <span>Themes</span>
                      </button>
                    )}
                    {onOpenWardrobe && (
                      <button
                        onClick={onOpenWardrobe}
                        className="p-2.5 rounded-xl bg-amber-100/80 hover:bg-amber-200 active:scale-95 text-amber-950 border border-amber-300/80 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-4 h-4 text-amber-700" />
                        <span>Wardrobe</span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={isTraveling}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <span>Begin Expedition Walk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Step 1: Category Selection */}
            {currentChamberIndex === 1 && (
              <div className="space-y-1.5">
                {MAZE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        if (cat.id === 'puzzle') onSelectVariant('riddles');
                        else if (cat.id === 'hazard') onSelectVariant('tide');
                        else if (cat.id === 'impossible') onSelectVariant('impossible');
                        else if (cat.id === 'horror' && selectedVariant !== 'fog' && selectedVariant !== 'stalker') onSelectVariant('fog');
                        else if (cat.id === 'classic') onSelectVariant('pure');
                        sounds.playStep();
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-100/90 border-amber-400 shadow-xs ring-1 ring-amber-400/40'
                          : 'bg-white/60 border-amber-200/60 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.accentColor }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-stone-900 truncate">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate">
                            {cat.description}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : cat.isPlayable ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                          Ready
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Difficulty & Custom Dimension Selection */}
            {currentChamberIndex === 2 && (
              <div className="space-y-3">
                {/* Mode Selector Tabs: Presets vs Custom Dimensions */}
                <div className="flex p-1 bg-stone-200/70 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onCustomDimsChange({ ...customDims, isCustom: false });
                      sounds.playStep();
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      !customDims.isCustom
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Preset Scales
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCustomDimsChange({ ...customDims, isCustom: true });
                      sounds.playStep();
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      customDims.isCustom
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Custom Dimensions
                  </button>
                </div>

                {!customDims.isCustom ? (
                  /* Preset Grid */
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(DIFFICULTY_PRESETS) as DifficultyId[]).map((key) => {
                      const diff = DIFFICULTY_PRESETS[key];
                      const isSelected = selectedDifficulty === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onSelectDifficulty(key);
                            sounds.playStep();
                          }}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-amber-100/90 border-amber-400 shadow-xs ring-2 ring-amber-400/40'
                              : 'bg-white/60 border-amber-200/60 hover:bg-amber-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-stone-900 text-xs truncate">
                              {diff.name.split(' ')[0]}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-amber-900 bg-amber-200/60 px-1.5 py-0.2 rounded">
                              {diff.rows}×{diff.cols}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mb-1">
                            {diff.deadEndDensity} dead ends
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {diff.recommendedTime}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Custom Dimensions Controls */
                  <div className="space-y-3 p-3 bg-white/70 rounded-2xl border border-amber-200/80">
                    {/* Dimension Summary & Cell Count */}
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                      <div>
                        <div className="text-xs font-extrabold text-stone-900 font-mono">
                          {customDims.cols} × {customDims.rows}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Width (Cols) × Height (Rows)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                          {(customDims.cols * customDims.rows).toLocaleString()} cells
                        </span>
                        <div className="text-[10px] text-stone-500">
                          Ratio {(customDims.cols / customDims.rows).toFixed(2)}:1
                        </div>
                      </div>
                    </div>

                    {/* Width Control (Cols: 5-100) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="maze-width-input" className="font-semibold text-stone-800">
                          Maze Width (Columns)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            id="maze-width-input"
                            type="number"
                            min={5}
                            max={100}
                            value={customDims.cols}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                onCustomDimsChange({
                                  ...customDims,
                                  cols: Math.min(100, Math.max(5, val)),
                                });
                              }
                            }}
                            className="w-14 px-1.5 py-0.5 text-center font-mono font-bold text-xs bg-amber-50 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="text-[11px] text-stone-400">cells</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={1}
                        value={customDims.cols}
                        onChange={(e) => {
                          onCustomDimsChange({
                            ...customDims,
                            cols: parseInt(e.target.value, 10),
                          });
                        }}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Min: 5</span>
                        <span>Max: 100</span>
                      </div>
                    </div>

                    {/* Height Control (Rows: 5-100) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="maze-height-input" className="font-semibold text-stone-800">
                          Maze Height (Rows)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            id="maze-height-input"
                            type="number"
                            min={5}
                            max={100}
                            value={customDims.rows}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                onCustomDimsChange({
                                  ...customDims,
                                  rows: Math.min(100, Math.max(5, val)),
                                });
                              }
                            }}
                            className="w-14 px-1.5 py-0.5 text-center font-mono font-bold text-xs bg-amber-50 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="text-[11px] text-stone-400">cells</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={1}
                        value={customDims.rows}
                        onChange={(e) => {
                          onCustomDimsChange({
                            ...customDims,
                            rows: parseInt(e.target.value, 10),
                          });
                        }}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Min: 5</span>
                        <span>Max: 100</span>
                      </div>
                    </div>

                    {/* Quick Shape Presets */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                        Quick Dimension Templates:
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onCustomDimsChange({ cols: 5, rows: 50, isCustom: true });
                            sounds.playStep();
                          }}
                          className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-colors ${
                            customDims.cols === 5 && customDims.rows === 50
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-amber-50 hover:bg-amber-100 text-stone-700 border-amber-200'
                          }`}
                          title="Tall Narrow Corridor Tower (5x50)"
                        >
                          5×50
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCustomDimsChange({ cols: 50, rows: 5, isCustom: true });
                            sounds.playStep();
                          }}
                          className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-colors ${
                            customDims.cols === 50 && customDims.rows === 5
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-amber-50 hover:bg-amber-100 text-stone-700 border-amber-200'
                          }`}
                          title="Wide Flat Runway Corridor (50x5)"
                        >
                          50×5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCustomDimsChange({ cols: 69, rows: 34, isCustom: true });
                            sounds.playStep();
                          }}
                          className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-colors ${
                            customDims.cols === 69 && customDims.rows === 34
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-amber-50 hover:bg-amber-100 text-stone-700 border-amber-200'
                          }`}
                          title="Custom Rectangular 69x34"
                        >
                          69×34
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCustomDimsChange({ cols: 100, rows: 100, isCustom: true });
                            sounds.playStep();
                          }}
                          className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-colors ${
                            customDims.cols === 100 && customDims.rows === 100
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-amber-50 hover:bg-amber-100 text-stone-700 border-amber-200'
                          }`}
                          title="Maximum Labyrinth 100x100 (10,000 cells)"
                        >
                          100×100
                        </button>
                      </div>
                    </div>

                    {/* Difficulty Tier Pairing for Dead Ends & Stalker */}
                    <div className="pt-2 border-t border-amber-200/60">
                      <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                        Maze Complexity & Behavior Tier:
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(Object.keys(DIFFICULTY_PRESETS) as DifficultyId[]).map((key) => {
                          const isSel = selectedDifficulty === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                onSelectDifficulty(key);
                                sounds.playStep();
                              }}
                              className={`py-1 text-[10px] font-semibold rounded-lg border text-center transition-colors ${
                                isSel
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : 'bg-white hover:bg-amber-50 text-stone-700 border-amber-200'
                              }`}
                            >
                              {DIFFICULTY_PRESETS[key].name.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Variant Selection */}
            {currentChamberIndex === 3 && (
              <div className="space-y-1.5">
                {MAZE_VARIANTS.map((variant) => {
                  const isSelected = selectedVariant === variant.id;
                  let subtitle = 'Active trial';
                  if (variant.id === 'pure') {
                    subtitle = 'Full labyrinth visibility & classic orientation';
                  } else if (variant.id === 'fog') {
                    subtitle = 'Darkness & lantern radius with wall shadows';
                  } else if (variant.id === 'stalker') {
                    subtitle = 'Shadow hunter tracks by sight and sound';
                  } else if (variant.id === 'riddles') {
                    subtitle = 'Rune keys, locked portcullises, pressure plates & switches';
                  } else if (variant.id === 'tide') {
                    subtitle = 'Rising flood tide, timed pressure spikes & shallows';
                  } else if (variant.id === 'impossible') {
                    subtitle = 'Quantum portals, spatial bypasses & illusion corridors';
                  }

                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        onSelectVariant(variant.id);
                        sounds.playStep();
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-100/90 border-amber-400 shadow-xs ring-1 ring-amber-400/40'
                          : 'bg-white/60 border-amber-200/60 hover:bg-amber-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {variant.name}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {subtitle}
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : variant.isPlayable ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                          Active
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 4: The Golden Threshold Gateway */}
            {currentChamberIndex === 4 && (
              <div className="space-y-2.5 py-1">
                {/* Challenge Mode Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                    <span>Expedition Trial Mode:</span>
                    <span className="text-[10px] text-amber-800 font-mono font-bold">
                      {challengeMode === 'none'
                        ? 'Standard Expedition'
                        : challengeMode === 'time_trial'
                        ? 'Time Trial Challenge'
                        : challengeMode === 'limited_moves'
                        ? 'Limited Move Budget'
                        : 'Daily Challenge'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectChallengeMode('none');
                        sounds.playStep();
                      }}
                      className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${
                        challengeMode === 'none'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-200'
                      }`}
                    >
                      Standard
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectChallengeMode('time_trial');
                        sounds.playStep();
                      }}
                      className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        challengeMode === 'time_trial'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-200'
                      }`}
                    >
                      <Hourglass className="w-3 h-3" />
                      <span>Time Trial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectChallengeMode('limited_moves');
                        sounds.playStep();
                      }}
                      className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        challengeMode === 'limited_moves'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-200'
                      }`}
                    >
                      <Footprints className="w-3 h-3" />
                      <span>Moves</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const daily = getDailyChallengeConfig();
                        onSelectCategory(daily.category);
                        onSelectDifficulty(daily.difficultyId);
                        const variant =
                          daily.category === 'horror'
                            ? 'fog'
                            : daily.category === 'puzzle'
                            ? 'riddles'
                            : daily.category === 'hazard'
                            ? 'tide'
                            : daily.category === 'impossible'
                            ? 'impossible'
                            : 'pure';
                        onSelectVariant(variant);
                        onSeedChange(daily.seed);
                        setSeedInput(daily.seed);
                        onSelectChallengeMode('daily');
                        sounds.playStep();
                      }}
                      className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        challengeMode === 'daily'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-200'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Daily</span>
                    </button>
                  </div>
                </div>

                {/* Compact Expedition Manifest */}
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/80 text-xs space-y-1">
                  <div className="flex justify-between text-stone-600">
                    <span>Realm:</span>
                    <span className="font-semibold text-stone-900">
                      {MAZE_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Scale:</span>
                    <span className="font-semibold text-stone-900">
                      {customDims.isCustom ? (
                        <>Custom ({customDims.cols}×{customDims.rows})</>
                      ) : (
                        <>
                          {DIFFICULTY_PRESETS[selectedDifficulty].name} (
                          {DIFFICULTY_PRESETS[selectedDifficulty].rows}×
                          {DIFFICULTY_PRESETS[selectedDifficulty].cols})
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Variant:</span>
                    <span className="font-semibold text-stone-900">
                      {MAZE_VARIANTS.find((v) => v.id === selectedVariant)?.name}
                    </span>
                  </div>
                </div>

                {/* Seed Input & Randomizer */}
                <form onSubmit={handleSeedSubmit} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-600">
                    <span>Seed</span>
                    <span className="text-amber-800 font-mono text-[10px]">Deterministic</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      onBlur={handleSeedSubmit}
                      placeholder="e.g. SOLAR-42"
                      className="flex-1 bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleRandomizeSeed}
                      className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-medium border border-amber-300 flex items-center gap-1 transition-colors"
                      title="Roll a fresh seed"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reroll</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer Controls: Retrace / Advance / Portal Action */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-amber-200/70 shrink-0">
            {currentChamberIndex > 0 ? (
              <button
                onClick={handleBack}
                disabled={isTraveling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-white/70 hover:bg-amber-100 text-stone-700 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retrace</span>
              </button>
            ) : (
              <div />
            )}

            {currentChamberIndex < MENU_CHAMBERS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isTraveling}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 ml-auto"
              >
                <span>Next Chamber</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playPortalEnter();
                  onStartGame();
                }}
                disabled={isTraveling}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md transition-all active:scale-95 ml-auto"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Enter The Portal</span>
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* 3. SUBTLE FOOTER BAR */}
      <footer className="pointer-events-auto flex items-center justify-between text-[11px] text-stone-500 max-w-6xl mx-auto w-full px-2 shrink-0">
        <div className="flex items-center gap-2">
          <span>Sunny Gold</span>
          <span>·</span>
          <span>Warm Stone</span>
          <span>·</span>
          <span>Adventurous Labyrinth</span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-stone-500 hover:text-amber-800 transition-colors cursor-pointer"
            >
              Controls & Audio
            </button>
          )}
          <span>·</span>
          <span className="font-semibold text-stone-600">v1.0.0 Release</span>
        </div>
      </footer>
    </div>
  );
};
