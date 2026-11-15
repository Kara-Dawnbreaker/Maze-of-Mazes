/**
 * CharacterModal - Character Selection & Cosmetic Wardrobe
 * Allows previewing, equipping, and customizing all 6 distinct 2D characters
 * with live directional animation preview (idle, walking, victory, defeat).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  X,
  Check,
  Lock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Smile,
  Zap,
} from 'lucide-react';
import {
  CharacterConfig,
  CharacterId,
  CharacterPreferences,
  AnimationState,
} from '../types/character';
import { Direction } from '../types/maze';
import {
  CHARACTERS,
  COSMETIC_ITEMS,
  drawCharacter,
  saveCharacterPreferences,
} from '../utils/characterEngine';
import { sounds } from '../utils/audio';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  charPrefs: CharacterPreferences;
  onCharPrefsChange: (prefs: CharacterPreferences) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  charPrefs,
  onCharPrefsChange,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<CharacterId>(charPrefs.activeCharacterId);
  const [previewDirection, setPreviewDirection] = useState<Direction>('down');
  const [previewAnimState, setPreviewAnimState] = useState<AnimationState>('idle');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const selectedChar: CharacterConfig = CHARACTERS[selectedCharId];
  const isUnlocked = charPrefs.unlockedCharacters[selectedCharId] ?? false;

  // Live animation loop on preview canvas
  useEffect(() => {
    if (!isOpen) return;

    let time = 0;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 160;

    const render = () => {
      time = performance.now();
      ctx.clearRect(0, 0, 160, 160);

      // Subtle checkered background pad
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.arc(80, 80, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 2;
      ctx.stroke();

      const equipped = charPrefs.equippedCosmetics[selectedCharId] || {};
      drawCharacter(
        ctx,
        80,
        80,
        selectedCharId,
        previewDirection,
        previewAnimState,
        time,
        2.2,
        equipped,
        false
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, selectedCharId, previewDirection, previewAnimState, charPrefs]);

  if (!isOpen) return null;

  const handleSelectCharacter = (id: CharacterId) => {
    sounds.playStep();
    setSelectedCharId(id);
  };

  const handleEquipActive = () => {
    if (!isUnlocked) return;
    sounds.playChamberAdvance();
    const updated: CharacterPreferences = {
      ...charPrefs,
      activeCharacterId: selectedCharId,
    };
    onCharPrefsChange(updated);
    saveCharacterPreferences(updated);
  };

  const handleToggleCosmetic = (category: 'hat' | 'outfit' | 'back' | 'glasses', itemId: string) => {
    sounds.playStep();
    const currentEquipped = charPrefs.equippedCosmetics[selectedCharId] || {};
    const isCurrentlyEquipped = currentEquipped[category] === itemId;

    const updatedEquipped = {
      ...charPrefs.equippedCosmetics,
      [selectedCharId]: {
        ...currentEquipped,
        [category]: isCurrentlyEquipped ? undefined : itemId,
      },
    };

    const updatedPrefs: CharacterPreferences = {
      ...charPrefs,
      equippedCosmetics: updatedEquipped,
    };

    onCharPrefsChange(updatedPrefs);
    saveCharacterPreferences(updatedPrefs);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="char-modal-title"
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="char-modal-title" className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
                Character Wardrobe
              </h2>
              <p className="text-xs text-stone-600">
                Choose your maze adventurer & cosmetic accessories
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Half: Character Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => {
              const char = CHARACTERS[id];
              const isSelected = selectedCharId === id;
              const isCharUnlocked = charPrefs.unlockedCharacters[id] ?? false;
              const isActive = charPrefs.activeCharacterId === id;

              return (
                <button
                  key={id}
                  onClick={() => handleSelectCharacter(id)}
                  className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 relative ${
                    isSelected
                      ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                      : isCharUnlocked
                      ? 'bg-white/80 border-amber-200/70 hover:bg-amber-50'
                      : 'bg-stone-100/60 border-stone-200 text-stone-400 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-stone-900">
                      {char.name}
                    </span>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </span>
                    ) : !isCharUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                    ) : null}
                  </div>

                  <div className="text-[11px] text-stone-500 line-clamp-1">
                    {char.title}
                  </div>

                  <div className="text-[10px] text-amber-800/80 font-medium">
                    {isCharUnlocked ? 'Unlocked & Ready' : char.unlockRequirement}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Half: Detailed Selected Character Preview & Cosmetics */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-white/70 rounded-2xl border border-amber-200/80 items-start">
            {/* Left: Live Canvas with direction & animation triggers */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <canvas
                ref={previewCanvasRef}
                className="w-[140px] h-[140px] rounded-2xl border border-amber-200 shadow-inner"
              />

              {/* Direction selector buttons */}
              <div className="flex items-center gap-1 mt-2.5">
                <button
                  onClick={() => setPreviewDirection('up')}
                  className={`p-1.5 rounded-lg border text-xs font-semibold ${
                    previewDirection === 'up' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-amber-200 text-stone-600'
                  }`}
                  title="Facing Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDirection('down')}
                  className={`p-1.5 rounded-lg border text-xs font-semibold ${
                    previewDirection === 'down' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-amber-200 text-stone-600'
                  }`}
                  title="Facing Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDirection('left')}
                  className={`p-1.5 rounded-lg border text-xs font-semibold ${
                    previewDirection === 'left' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-amber-200 text-stone-600'
                  }`}
                  title="Facing Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDirection('right')}
                  className={`p-1.5 rounded-lg border text-xs font-semibold ${
                    previewDirection === 'right' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-amber-200 text-stone-600'
                  }`}
                  title="Facing Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Animation state triggers */}
              <div className="flex items-center gap-1 mt-2">
                {(['idle', 'walk', 'victory', 'defeat'] as AnimationState[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPreviewAnimState(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                      previewAnimState === st
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 text-stone-700 hover:bg-amber-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Character Description & Available Cosmetics */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-stone-900">
                    {selectedChar.name} — <span className="text-amber-700 font-medium text-xs">{selectedChar.title}</span>
                  </h3>
                </div>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  {selectedChar.description}
                </p>
                {!isUnlocked && (
                  <div className="mt-2 p-2 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                    <span>Unlock Requirement: {selectedChar.unlockRequirement}</span>
                  </div>
                )}
              </div>

              {/* Cosmetic Accessories */}
              <div className="space-y-2 pt-2 border-t border-amber-200/80">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Available Cosmetics & Accessories
                </span>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {Object.values(COSMETIC_ITEMS)
                    .filter((item) => selectedChar.supportedCosmeticCategories.includes(item.category))
                    .map((item) => {
                      const isCosmeticUnlocked = charPrefs.unlockedCosmetics[item.id] ?? false;
                      const equipped = charPrefs.equippedCosmetics[selectedCharId] || {};
                      const isEquipped = equipped[item.category] === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                            isEquipped
                              ? 'bg-amber-100/90 border-amber-400'
                              : isCosmeticUnlocked
                              ? 'bg-white border-amber-200/80 hover:bg-amber-50'
                              : 'bg-stone-100/70 border-stone-200 text-stone-400 opacity-60'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-stone-900 text-xs">
                              {item.name} <span className="text-[10px] text-stone-400">({item.category})</span>
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {isCosmeticUnlocked ? item.description : item.unlockRequirement}
                            </div>
                          </div>

                          {isCosmeticUnlocked ? (
                            <button
                              onClick={() => handleToggleCosmetic(item.category, item.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                isEquipped
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-stone-100 text-stone-700 hover:bg-amber-200'
                              }`}
                            >
                              {isEquipped ? 'Equipped' : 'Equip'}
                            </button>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-stone-400 mr-2" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Equip Character Action */}
              <div className="pt-2">
                <button
                  disabled={!isUnlocked || charPrefs.activeCharacterId === selectedCharId}
                  onClick={handleEquipActive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {charPrefs.activeCharacterId === selectedCharId
                      ? 'Currently Active Adventurer'
                      : isUnlocked
                      ? `Select & Play as ${selectedChar.name}`
                      : 'Character Locked'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200/80 bg-amber-100/30 flex items-center justify-between text-xs text-stone-600">
          <span>Active: {CHARACTERS[charPrefs.activeCharacterId].name}</span>
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
