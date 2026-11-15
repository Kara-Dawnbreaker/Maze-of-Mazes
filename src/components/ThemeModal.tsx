/**
 * ThemeModal - 2D Maze Themes & Custom Theme Creator
 * Allows selecting from 10 handcrafted built-in themes or creating custom palettes
 * with live canvas preview, hex pickers, renaming, saving, and deletion.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  X,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  Save,
  Copy,
} from 'lucide-react';
import { MazeTheme, ThemePreferences, BuiltInThemeId } from '../types/theme';
import {
  BUILT_IN_THEMES,
  deriveShades,
  saveThemePreferences,
} from '../utils/themeEngine';
import { sounds } from '../utils/audio';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themePrefs: ThemePreferences;
  onThemePrefsChange: (prefs: ThemePreferences) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themePrefs,
  onThemePrefsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'editor'>('presets');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Editor working state
  const [editingTheme, setEditingTheme] = useState<MazeTheme>(() => {
    return (
      themePrefs.customThemes.find((t) => t.id === themePrefs.activeThemeId) || {
        id: `custom_${Date.now()}`,
        name: 'My Custom Theme',
        description: 'User-designed maze color palette.',
        isBuiltIn: false,
        wallColor: '#6366F1',
        wallShadow: '#3730A3',
        wallRim: '#A5B4FC',
        floorColor: '#EEF2FF',
        floorAltColor: '#E0E7FF',
        jointColor: '#C7D2FE',
        pathColor: '#4F46E5',
        bgColor: '#1E1B4B',
        exitColor: '#10B981',
        entranceColor: '#6366F1',
        interactiveColor: '#4F46E5',
        accentColor: '#6366F1',
      }
    );
  });

  const [editorBaseTheme, setEditorBaseTheme] = useState<string>('classic_adventure');

  // Draw miniature 5x5 maze live preview
  useEffect(() => {
    if (!isOpen) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 180;
    canvas.width = size;
    canvas.height = size;
    const tileSize = size / 5;

    // Background
    ctx.fillStyle = editingTheme.bgColor;
    ctx.fillRect(0, 0, size, size);

    // Floors
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isAlt = (r + c) % 2 === 1;
        ctx.fillStyle = isAlt ? editingTheme.floorAltColor : editingTheme.floorColor;
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

        ctx.strokeStyle = editingTheme.jointColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }

    // Footprints sample path
    const samplePath = [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 2, c: 1 },
      { r: 2, c: 2 },
      { r: 3, c: 2 },
      { r: 4, c: 2 },
      { r: 4, c: 3 },
      { r: 4, c: 4 },
    ];
    samplePath.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.c * tileSize + tileSize / 2, pt.r * tileSize + tileSize / 2, tileSize * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = editingTheme.pathColor;
      ctx.fill();
    });

    // Entrance at 0,0
    ctx.fillStyle = editingTheme.entranceColor;
    ctx.beginPath();
    ctx.roundRect(tileSize * 0.2, tileSize * 0.2, tileSize * 0.6, tileSize * 0.6, 3);
    ctx.fill();

    // Exit at 4,4
    const exitX = 4 * tileSize + tileSize / 2;
    const exitY = 4 * tileSize + tileSize / 2;
    const grad = ctx.createRadialGradient(exitX, exitY, 2, exitX, exitY, tileSize * 0.45);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.5, editingTheme.exitColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(exitX, exitY, tileSize * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer & inner decorative walls
    ctx.strokeStyle = editingTheme.wallShadow;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const wallSegments = [
      // Top, bottom, left, right outer walls
      [[0, 0], [5, 0]],
      [[0, 5], [5, 5]],
      [[0, 0], [0, 5]],
      [[5, 0], [5, 5]],
      // Interior maze walls
      [[1, 0], [1, 2]],
      [[1, 3], [1, 5]],
      [[3, 1], [3, 4]],
      [[2, 3], [4, 3]],
    ];

    wallSegments.forEach(([[c1, r1], [c2, r2]]) => {
      ctx.beginPath();
      ctx.moveTo(c1 * tileSize, r1 * tileSize);
      ctx.lineTo(c2 * tileSize, r2 * tileSize);
      ctx.stroke();
    });

    // Wall top rim
    ctx.strokeStyle = editingTheme.wallRim;
    ctx.lineWidth = 1.5;
    wallSegments.forEach(([[c1, r1], [c2, r2]]) => {
      ctx.beginPath();
      ctx.moveTo(c1 * tileSize, r1 * tileSize);
      ctx.lineTo(c2 * tileSize, r2 * tileSize);
      ctx.stroke();
    });
  }, [isOpen, editingTheme]);

  if (!isOpen) return null;

  const handleSelectTheme = (themeId: string) => {
    sounds.playStep();
    const updated = { ...themePrefs, activeThemeId: themeId };
    onThemePrefsChange(updated);
    saveThemePreferences(updated);
  };

  const handleStartFromPreset = (presetId: string) => {
    const base = BUILT_IN_THEMES[presetId as BuiltInThemeId] || BUILT_IN_THEMES.classic_adventure;
    setEditorBaseTheme(presetId);
    setEditingTheme({
      ...base,
      id: `custom_${Date.now()}`,
      name: `Custom ${base.name}`,
      description: `Customized from ${base.name}`,
      isBuiltIn: false,
    });
    sounds.playStep();
  };

  const handleSaveCustomTheme = () => {
    sounds.playChamberAdvance();
    const existingIndex = themePrefs.customThemes.findIndex((t) => t.id === editingTheme.id);
    let updatedCustoms = [...themePrefs.customThemes];

    if (existingIndex >= 0) {
      updatedCustoms[existingIndex] = editingTheme;
    } else {
      updatedCustoms.push(editingTheme);
    }

    const updatedPrefs: ThemePreferences = {
      activeThemeId: editingTheme.id,
      customThemes: updatedCustoms,
    };

    onThemePrefsChange(updatedPrefs);
    saveThemePreferences(updatedPrefs);
    setActiveTab('presets');
  };

  const handleDeleteCustomTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playStep();
    const filtered = themePrefs.customThemes.filter((t) => t.id !== id);
    const updatedPrefs: ThemePreferences = {
      activeThemeId: themePrefs.activeThemeId === id ? 'classic_adventure' : themePrefs.activeThemeId,
      customThemes: filtered,
    };
    onThemePrefsChange(updatedPrefs);
    saveThemePreferences(updatedPrefs);
  };

  const handleWallColorChange = (hex: string) => {
    const { shadow, rim } = deriveShades(hex);
    setEditingTheme((prev) => ({
      ...prev,
      wallColor: hex,
      wallShadow: shadow,
      wallRim: rim,
      entranceColor: hex,
    }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-amber-50 rounded-3xl border border-amber-200 shadow-2xl text-stone-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
                Maze Themes & Palettes
              </h2>
              <p className="text-xs text-stone-600">
                Customize 2D maze walls, floors, paths, and portals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-amber-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-200/80 px-4 pt-2 bg-amber-100/40 shrink-0">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-amber-600 text-amber-900 bg-amber-50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Built-in Themes & Saved ({10 + themePrefs.customThemes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'editor'
                ? 'border-amber-600 text-amber-900 bg-amber-50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Custom Theme Creator</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: PRESETS & SAVED THEMES */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Handcrafted Labyrinth Palettes
                </span>
                <button
                  onClick={() => {
                    handleStartFromPreset('classic_adventure');
                    setActiveTab('editor');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom</span>
                </button>
              </div>

              {/* Grid of 10 Built-in Themes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(BUILT_IN_THEMES) as BuiltInThemeId[]).map((key) => {
                  const theme = BUILT_IN_THEMES[key];
                  const isSelected = themePrefs.activeThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`text-left p-3 rounded-2xl border transition-all relative flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                          : 'bg-white/80 border-amber-200/70 hover:bg-amber-50/80 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-xs sm:text-sm">
                          {theme.name}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-600 line-clamp-1 leading-snug">
                        {theme.description}
                      </p>

                      {/* Color Swatch Bar */}
                      <div className="flex items-center gap-1 pt-1 border-t border-amber-100">
                        <span className="text-[10px] text-stone-400 mr-1">Palette:</span>
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.wallColor }}
                          title="Wall Color"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.floorColor }}
                          title="Floor Color"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.pathColor }}
                          title="Path Color"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.exitColor }}
                          title="Exit Beacon Color"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs ml-auto"
                          style={{ backgroundColor: theme.bgColor }}
                          title="Background Void"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* User Saved Custom Themes */}
              {themePrefs.customThemes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-amber-200/80">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Your Custom Palettes
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {themePrefs.customThemes.map((theme) => {
                      const isSelected = themePrefs.activeThemeId === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => handleSelectTheme(theme.id)}
                          className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                              : 'bg-white/80 border-amber-200/70 hover:bg-amber-50/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 text-xs sm:text-sm">
                              {theme.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Active</span>
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTheme(theme);
                                  setActiveTab('editor');
                                }}
                                className="p-1 text-stone-500 hover:text-amber-800 rounded transition-colors"
                                title="Edit Custom Theme"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                                className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                                title="Delete Custom Theme"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 pt-1 border-t border-amber-100">
                            <div
                              className="w-4 h-4 rounded-full border border-black/10"
                              style={{ backgroundColor: theme.wallColor }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-black/10"
                              style={{ backgroundColor: theme.floorColor }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-black/10"
                              style={{ backgroundColor: theme.pathColor }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-black/10"
                              style={{ backgroundColor: theme.exitColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM THEME CREATOR */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Left: Interactive Live Canvas Preview */}
                <div className="md:col-span-5 flex flex-col items-center p-3 bg-white/80 rounded-2xl border border-amber-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-2">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Live Labyrinth Preview</span>
                  </div>
                  <canvas
                    ref={previewCanvasRef}
                    className="rounded-xl border border-stone-300 shadow-inner w-[180px] h-[180px]"
                  />
                  <div className="text-[10px] text-stone-500 mt-2 text-center">
                    Shows 5×5 walls, pavers, footprint trail, entrance, and exit.
                  </div>

                  {/* Start from template selector */}
                  <div className="w-full mt-3 pt-3 border-t border-amber-200/60">
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                      Start from Preset Template:
                    </label>
                    <select
                      value={editorBaseTheme}
                      onChange={(e) => handleStartFromPreset(e.target.value)}
                      className="w-full text-xs font-medium px-2 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-stone-800"
                    >
                      {(Object.keys(BUILT_IN_THEMES) as BuiltInThemeId[]).map((key) => (
                        <option key={key} value={key}>
                          {BUILT_IN_THEMES[key].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Color Pickers and Theme Details */}
                <div className="md:col-span-7 space-y-3">
                  {/* Theme Name */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Theme Name
                    </label>
                    <input
                      type="text"
                      value={editingTheme.name}
                      onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                      placeholder="e.g. Celestial Aurora"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Color Pickers Matrix */}
                  <div className="space-y-2 p-3 bg-white/70 rounded-2xl border border-amber-200/60 text-xs">
                    <span className="font-bold text-stone-800 block border-b border-amber-100 pb-1">
                      Surface Palettes
                    </span>

                    {/* Walls */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Walls</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.wallColor}
                          onChange={(e) => handleWallColorChange(e.target.value)}
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.wallColor}
                        </span>
                      </div>
                    </div>

                    {/* Floor Paver */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Floor Paver (Primary)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.floorColor}
                          onChange={(e) =>
                            setEditingTheme({ ...editingTheme, floorColor: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.floorColor}
                        </span>
                      </div>
                    </div>

                    {/* Alternate Paver */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Floor Paver (Alternate)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.floorAltColor}
                          onChange={(e) =>
                            setEditingTheme({ ...editingTheme, floorAltColor: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.floorAltColor}
                        </span>
                      </div>
                    </div>

                    {/* Path / Footprints */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Path / Footprints</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.pathColor}
                          onChange={(e) =>
                            setEditingTheme({ ...editingTheme, pathColor: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.pathColor}
                        </span>
                      </div>
                    </div>

                    {/* Exit Portal Glow */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Exit Portal Glow</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.exitColor}
                          onChange={(e) =>
                            setEditingTheme({ ...editingTheme, exitColor: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.exitColor}
                        </span>
                      </div>
                    </div>

                    {/* Background Canvas */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Background / Void</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.bgColor}
                          onChange={(e) =>
                            setEditingTheme({ ...editingTheme, bgColor: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.bgColor}
                        </span>
                      </div>
                    </div>

                    {/* UI Accent */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-700 font-medium">UI Accent</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingTheme.accentColor}
                          onChange={(e) =>
                            setEditingTheme({ ...editingTheme, accentColor: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-amber-300 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] text-stone-500 uppercase">
                          {editingTheme.accentColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleStartFromPreset(editorBaseTheme)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCustomTheme}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Activate Theme</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200/80 bg-amber-100/30 flex items-center justify-between text-xs text-stone-600">
          <span>Active: {themePrefs.activeThemeId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
