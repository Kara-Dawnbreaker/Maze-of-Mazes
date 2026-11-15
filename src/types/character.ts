/**
 * Character & Cosmetic Customization Types for Maze of Mazes
 */

import { Direction } from './maze';

export type CharacterId =
  | 'explorer'
  | 'robo'
  | 'astronaut'
  | 'wizard'
  | 'ninja'
  | 'slime';

export type AnimationState = 'idle' | 'walk' | 'victory' | 'defeat';

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'hat' | 'outfit' | 'back' | 'glasses';
  description: string;
  unlockRequirement: string;
  isUnlocked: boolean;
  color?: string;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  defaultColor: string;
  unlockRequirement: string;
  isUnlocked: boolean;
  supportedCosmeticCategories: Array<'hat' | 'outfit' | 'back' | 'glasses'>;
}

export interface EquippedCosmetics {
  hat?: string;
  outfit?: string;
  back?: string;
  glasses?: string;
  colorVariation?: string;
}

export interface CharacterPreferences {
  activeCharacterId: CharacterId;
  equippedCosmetics: Record<CharacterId, EquippedCosmetics>;
  unlockedCharacters: Record<CharacterId, boolean>;
  unlockedCosmetics: Record<string, boolean>;
}
