/**
 * Character Engine & Vector Canvas Drawing for Maze of Mazes
 * Renders 6 distinct 2D characters with smooth directional animations,
 * idle bobbing, victory celebration, and cosmetic accessories.
 */

import {
  CharacterConfig,
  CharacterId,
  CharacterPreferences,
  CosmeticItem,
  EquippedCosmetics,
  AnimationState,
} from '../types/character';
import { Direction } from '../types/maze';
import { PlayerProgression, Achievement } from '../types/progression';

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    title: 'Labyrinth Voyager',
    description: 'The classic sun-loving adventurer with sturdy boots, a straw hat, and an insatiable desire to map the unknown.',
    defaultColor: '#EA580C',
    unlockRequirement: 'Available from the start',
    isUnlocked: true,
    supportedCosmeticCategories: ['hat', 'outfit', 'back', 'glasses'],
  },
  robo: {
    id: 'robo',
    name: 'Robo',
    title: 'Unit M-01 Automaton',
    description: 'A friendly brass and titanium automaton engineered to navigate high-speed corridors with dual optical sensors.',
    defaultColor: '#0284C7',
    unlockRequirement: 'Complete a Time Trial or escape 3 mazes',
    isUnlocked: false,
    supportedCosmeticCategories: ['hat', 'outfit', 'back', 'glasses'],
  },
  astronaut: {
    id: 'astronaut',
    name: 'Astronaut',
    title: 'Cosmic Wayfarer',
    description: 'A high-tech space explorer equipped with an EVA pressurized suit and mirrored visor, exploring dimensional labyrinths.',
    defaultColor: '#E2E8F0',
    unlockRequirement: 'Conquer Impossible Geometry or Master scale',
    isUnlocked: false,
    supportedCosmeticCategories: ['hat', 'outfit', 'back', 'glasses'],
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    title: 'Rune Arcanist',
    description: 'A scholarly mystic cloaked in celestial robes who reads ancient glyphs and unlocks magical sanctum gates with ease.',
    defaultColor: '#7C3AED',
    unlockRequirement: 'Unlock the golden gate in Puzzle Sanctum',
    isUnlocked: false,
    supportedCosmeticCategories: ['hat', 'outfit', 'back', 'glasses'],
  },
  ninja: {
    id: 'ninja',
    name: 'Ninja',
    title: 'Shadow Infiltrator',
    description: 'A swift, silent shadow acrobat whose footsteps leave barely a whisper in the darkest corridors.',
    defaultColor: '#18181B',
    unlockRequirement: 'Evade the shadow hunter in Stalker Hunt',
    isUnlocked: false,
    supportedCosmeticCategories: ['hat', 'outfit', 'back', 'glasses'],
  },
  slime: {
    id: 'slime',
    name: 'Slime',
    title: 'Gelatinous Jumper',
    description: 'An adorable, translucent jelly companion that squishes, bounces, and cheerfully slides through any passage.',
    defaultColor: '#10B981',
    unlockRequirement: 'Reach a 3-maze escape streak or survive Hazard Sanctum',
    isUnlocked: false,
    supportedCosmeticCategories: ['hat', 'outfit', 'glasses'],
  },
};

export const COSMETIC_ITEMS: Record<string, CosmeticItem> = {
  // Hats
  straw_hat: {
    id: 'straw_hat',
    name: 'Straw Sunhat',
    category: 'hat',
    description: 'Woven golden straw hat with a cheerful ruby ribbon.',
    unlockRequirement: 'Unlocked by default',
    isUnlocked: true,
    color: '#FBBF24',
  },
  golden_crown: {
    id: 'golden_crown',
    name: 'Gilded Crown',
    category: 'hat',
    description: 'A gleaming imperial crown studded with polished emeralds.',
    unlockRequirement: 'Earn Grand Explorer achievement',
    isUnlocked: false,
    color: '#EAB308',
  },
  wizard_hat: {
    id: 'wizard_hat',
    name: 'Arcane Pointed Hat',
    category: 'hat',
    description: 'Midnight violet hat embroidered with silver crescent moons.',
    unlockRequirement: 'Unlock the Wizard character',
    isUnlocked: false,
    color: '#6D28D9',
  },
  miner_lamp: {
    id: 'miner_lamp',
    name: "Miner's Headlamp",
    category: 'hat',
    description: 'Hardened leather safety cap equipped with a brass carbide beam.',
    unlockRequirement: 'Escape 5 mazes',
    isUnlocked: false,
    color: '#D97706',
  },
  ninja_band: {
    id: 'ninja_band',
    name: 'Shinobi Headband',
    category: 'hat',
    description: 'Crimson cloth tied tightly with fluttering tail ribbons.',
    unlockRequirement: 'Unlock the Ninja character',
    isUnlocked: false,
    color: '#DC2626',
  },

  // Outfits / Colors
  tunic_orange: {
    id: 'tunic_orange',
    name: 'Solar Sunrise',
    category: 'outfit',
    description: 'Warm sunrise orange traveler garb.',
    unlockRequirement: 'Unlocked by default',
    isUnlocked: true,
    color: '#EA580C',
  },
  tunic_emerald: {
    id: 'tunic_emerald',
    name: 'Forest Cloak',
    category: 'outfit',
    description: 'Lush woodland green woven from deep moss fibers.',
    unlockRequirement: 'Escape 2 mazes',
    isUnlocked: false,
    color: '#059669',
  },
  tunic_midnight: {
    id: 'tunic_midnight',
    name: 'Midnight Velvet',
    category: 'outfit',
    description: 'Deep navy stealth fabric with silver stitching.',
    unlockRequirement: 'Survive in Horror & Darkness',
    isUnlocked: false,
    color: '#1E1B4B',
  },
  tunic_crimson: {
    id: 'tunic_crimson',
    name: 'Volcanic Ruby',
    category: 'outfit',
    description: 'Molten scarlet garb that radiates adventurous warmth.',
    unlockRequirement: 'Complete a Limited Moves challenge',
    isUnlocked: false,
    color: '#DC2626',
  },

  // Back items
  backpack_leather: {
    id: 'backpack_leather',
    name: 'Explorer Pack',
    category: 'back',
    description: 'Weathered brown leather backpack with bedroll and pouch.',
    unlockRequirement: 'Unlocked by default',
    isUnlocked: true,
  },
  backpack_jetpack: {
    id: 'backpack_jetpack',
    name: 'Mini Thruster',
    category: 'back',
    description: 'Dual brass propulsion nozzles with glowing blue coolant.',
    unlockRequirement: 'Complete a Time Trial',
    isUnlocked: false,
  },
  backpack_tome: {
    id: 'backpack_tome',
    name: 'Spellbook Satchel',
    category: 'back',
    description: 'Ancient leather-bound grimoire humming with quiet magic.',
    unlockRequirement: 'Solve Puzzle Sanctum',
    isUnlocked: false,
  },

  // Glasses / Face
  glasses_spectacles: {
    id: 'glasses_spectacles',
    name: 'Round Spectacles',
    category: 'glasses',
    description: 'Classic scholarly brass wireframe lenses.',
    unlockRequirement: 'Complete a maze without hitting dead ends',
    isUnlocked: false,
  },
  glasses_goggles: {
    id: 'glasses_goggles',
    name: 'Aviator Goggles',
    category: 'glasses',
    description: 'Heavy tinted goggles built for dusty dungeon exploration.',
    unlockRequirement: 'Escape 4 mazes',
    isUnlocked: false,
  },
};

const CHARACTER_STORAGE_KEY = 'maze_of_mazes_character_data';

export const INITIAL_CHARACTER_PREFERENCES: CharacterPreferences = {
  activeCharacterId: 'explorer',
  equippedCosmetics: {
    explorer: { hat: 'straw_hat', outfit: 'tunic_orange', back: 'backpack_leather' },
    robo: { back: 'backpack_jetpack' },
    astronaut: {},
    wizard: { hat: 'wizard_hat', back: 'backpack_tome' },
    ninja: { hat: 'ninja_band' },
    slime: {},
  },
  unlockedCharacters: {
    explorer: true,
    robo: false,
    astronaut: false,
    wizard: false,
    ninja: false,
    slime: false,
  },
  unlockedCosmetics: {
    straw_hat: true,
    tunic_orange: true,
    backpack_leather: true,
  },
};

export function loadCharacterPreferences(): CharacterPreferences {
  try {
    const raw = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        activeCharacterId: parsed.activeCharacterId || 'explorer',
        equippedCosmetics: {
          ...INITIAL_CHARACTER_PREFERENCES.equippedCosmetics,
          ...(parsed.equippedCosmetics || {}),
        },
        unlockedCharacters: {
          ...INITIAL_CHARACTER_PREFERENCES.unlockedCharacters,
          ...(parsed.unlockedCharacters || {}),
        },
        unlockedCosmetics: {
          ...INITIAL_CHARACTER_PREFERENCES.unlockedCosmetics,
          ...(parsed.unlockedCosmetics || {}),
        },
      };
    }
  } catch {
    // Local storage unreadable
  }

  return { ...INITIAL_CHARACTER_PREFERENCES };
}

export function saveCharacterPreferences(prefs: CharacterPreferences): void {
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Local storage unavailable
  }
}

/**
 * Checks player progression and achievements to unlock characters and cosmetics automatically.
 */
export function evaluateCharacterUnlocks(
  currentPrefs: CharacterPreferences,
  progression?: PlayerProgression
): {
  updatedPrefs: CharacterPreferences;
  newlyUnlockedCharacters: string[];
  newlyUnlockedCosmetics: string[];
} {
  const unlockedChars = { ...currentPrefs.unlockedCharacters, explorer: true };
  const unlockedCosmetics = { ...currentPrefs.unlockedCosmetics };
  const newlyUnlockedCharacters: string[] = [];
  const newlyUnlockedCosmetics: string[] = [];

  if (progression && progression.stats) {
    const stats = progression.stats;
    const achs = progression.achievements || {};
    const wins = stats.totalEscaped || 0;
    const totalRuns = stats.totalPlayed || 0;
    const cats = stats.categoriesCompleted || {};

    // 1. Robo: 2+ escapes or 3+ total played
    if (!unlockedChars.robo && (wins >= 2 || totalRuns >= 3 || stats.challengesCompleted > 0)) {
      unlockedChars.robo = true;
      newlyUnlockedCharacters.push('Robo');
    }

    // 2. Astronaut: Impossible Geometry completed or master escape
    if (!unlockedChars.astronaut && (cats.impossible || achs.master_escape?.unlocked)) {
      unlockedChars.astronaut = true;
      newlyUnlockedCharacters.push('Astronaut');
    }

    // 3. Wizard: Puzzle Sanctum completed or riddle scholar
    if (!unlockedChars.wizard && (cats.puzzle || achs.riddle_scholar?.unlocked)) {
      unlockedChars.wizard = true;
      newlyUnlockedCharacters.push('Wizard');
    }

    // 4. Ninja: Horror completed or Shadow survivor
    if (!unlockedChars.ninja && (cats.horror || achs.shadow_survivor?.unlocked)) {
      unlockedChars.ninja = true;
      newlyUnlockedCharacters.push('Ninja');
    }

    // 5. Slime: Hazard Sanctum completed or 2+ daily streak or tide runner
    if (!unlockedChars.slime && (cats.hazard || stats.highestStreak >= 2 || achs.tide_runner?.unlocked)) {
      unlockedChars.slime = true;
      newlyUnlockedCharacters.push('Slime');
    }

    // Cosmetics
    if (!unlockedCosmetics.tunic_emerald && wins >= 2) {
      unlockedCosmetics.tunic_emerald = true;
      newlyUnlockedCosmetics.push('Emerald Tunic');
    }
    if (!unlockedCosmetics.glasses_goggles && wins >= 4) {
      unlockedCosmetics.glasses_goggles = true;
      newlyUnlockedCosmetics.push('Brass Goggles');
    }
    if (!unlockedCosmetics.miner_lamp && wins >= 5) {
      unlockedCosmetics.miner_lamp = true;
      newlyUnlockedCosmetics.push('Miner Headlamp');
    }
    if (!unlockedCosmetics.golden_crown && (wins >= 8 || achs.grand_explorer?.unlocked)) {
      unlockedCosmetics.golden_crown = true;
      newlyUnlockedCosmetics.push('Golden Crown');
    }
    if (!unlockedCosmetics.wizard_hat && (cats.puzzle || unlockedChars.wizard)) {
      unlockedCosmetics.wizard_hat = true;
      newlyUnlockedCosmetics.push('Pointy Wizard Hat');
    }
    if (!unlockedCosmetics.backpack_tome && (cats.puzzle || unlockedChars.wizard)) {
      unlockedCosmetics.backpack_tome = true;
      newlyUnlockedCosmetics.push('Arcane Tome');
    }
    if (!unlockedCosmetics.ninja_band && unlockedChars.ninja) {
      unlockedCosmetics.ninja_band = true;
      newlyUnlockedCosmetics.push('Ninja Headband');
    }
    if (!unlockedCosmetics.backpack_jetpack && (unlockedChars.astronaut || achs.speed_demon?.unlocked)) {
      unlockedCosmetics.backpack_jetpack = true;
      newlyUnlockedCosmetics.push('Rocket Jetpack');
    }
  }

  const updatedPrefs: CharacterPreferences = {
    ...currentPrefs,
    unlockedCharacters: unlockedChars,
    unlockedCosmetics: unlockedCosmetics,
  };

  saveCharacterPreferences(updatedPrefs);
  return { updatedPrefs, newlyUnlockedCharacters, newlyUnlockedCosmetics };
}

/**
 * Universal High-Fidelity Canvas Vector Drawing for all 6 characters
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  charX: number,
  charY: number,
  characterId: CharacterId,
  direction: Direction,
  animState: AnimationState,
  time: number,
  scale: number,
  cosmetics: EquippedCosmetics = {},
  isHorror: boolean = false
): void {
  const isMoving = animState === 'walk';
  const isVictory = animState === 'victory';
  const isDefeat = animState === 'defeat';

  // Animation dynamics
  let bob = 0;
  let walkSwing = 0;
  let victoryJump = 0;

  if (isVictory) {
    // Jubilant jump + celebration sparkle
    victoryJump = Math.abs(Math.sin(time * 0.008)) * 8 * scale;
  } else if (isDefeat) {
    // Gentle stumble / slump
    bob = Math.sin(time * 0.005) * 1.5 * scale + 2 * scale;
  } else if (isMoving) {
    bob = Math.sin(time * 0.02) * 2.5 * scale;
    walkSwing = Math.cos(time * 0.02) * 3 * scale;
  } else {
    // Idle gentle breath
    bob = Math.sin(time * 0.004) * 1.5 * scale;
  }

  // Soft floor shadow
  ctx.beginPath();
  const shadowScale = isVictory ? Math.max(0.4, 1 - victoryJump / (16 * scale)) : 1;
  ctx.ellipse(charX, charY + 10 * scale, 10 * scale * shadowScale, 5 * scale * shadowScale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();

  ctx.save();
  ctx.translate(charX, charY + bob - victoryJump);

  if (isDefeat) {
    ctx.rotate(Math.sin(time * 0.004) * 0.08);
  }

  // Lantern glow in horror mode
  if (isHorror) {
    const lanternGrad = ctx.createRadialGradient(0, 0, 4 * scale, 0, 0, 48 * scale);
    lanternGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
    lanternGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.1)');
    lanternGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, 48 * scale, 0, Math.PI * 2);
    ctx.fillStyle = lanternGrad;
    ctx.fill();
  }

  // Victory aura sparkles
  if (isVictory) {
    ctx.save();
    ctx.fillStyle = '#FBBF24';
    for (let i = 0; i < 4; i++) {
      const angle = (time * 0.003 + (i * Math.PI) / 2) % (Math.PI * 2);
      const dist = (14 + Math.sin(time * 0.006 + i) * 3) * scale;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist - 8 * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // CHARACTER 1: EXPLORER
  // -------------------------------------------------------------
  if (characterId === 'explorer') {
    // Tunic
    const tunicColor = cosmetics.outfit === 'tunic_emerald' ? '#059669' : cosmetics.outfit === 'tunic_midnight' ? '#1E1B4B' : cosmetics.outfit === 'tunic_crimson' ? '#DC2626' : isHorror ? '#9A3412' : '#EA580C';
    ctx.fillStyle = tunicColor;
    ctx.beginPath();
    ctx.roundRect(-7 * scale, -5 * scale, 14 * scale, 13 * scale, 3 * scale);
    ctx.fill();

    // Backpack
    if (cosmetics.back !== 'none') {
      ctx.fillStyle = cosmetics.back === 'backpack_jetpack' ? '#0284C7' : cosmetics.back === 'backpack_tome' ? '#4C1D95' : '#78350F';
      if (direction === 'up') ctx.fillRect(-6 * scale, -7 * scale, 12 * scale, 10 * scale);
      else if (direction === 'left') ctx.fillRect(4 * scale, -5 * scale, 5 * scale, 9 * scale);
      else if (direction === 'right') ctx.fillRect(-9 * scale, -5 * scale, 5 * scale, 9 * scale);
    }

    // Legs
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4 * scale, 8 * scale);
    ctx.lineTo((-4 + walkSwing) * scale, 13 * scale);
    ctx.moveTo(4 * scale, 8 * scale);
    ctx.lineTo((4 - walkSwing) * scale, 13 * scale);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FED7AA';
    ctx.beginPath();
    ctx.arc(0, -9 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    if (cosmetics.hat === 'golden_crown') {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.moveTo(-7 * scale, -12 * scale);
      ctx.lineTo(-7 * scale, -17 * scale);
      ctx.lineTo(-3.5 * scale, -14 * scale);
      ctx.lineTo(0, -18 * scale);
      ctx.lineTo(3.5 * scale, -14 * scale);
      ctx.lineTo(7 * scale, -17 * scale);
      ctx.lineTo(7 * scale, -12 * scale);
      ctx.closePath();
      ctx.fill();
    } else if (cosmetics.hat === 'miner_lamp') {
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.ellipse(0, -13 * scale, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, -14 * scale, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default Straw Hat
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.ellipse(0, -13 * scale, 13 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      // Ribbon
      ctx.strokeStyle = isHorror ? '#EF4444' : '#FB7185';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.arc(0, -13 * scale, 5.5 * scale, 0.2, Math.PI - 0.2, false);
      ctx.stroke();
    }

    // Eyes
    if (direction !== 'up') {
      ctx.fillStyle = '#451A03';
      let eyeOffsetX = 0;
      if (direction === 'left') eyeOffsetX = -2 * scale;
      if (direction === 'right') eyeOffsetX = 2 * scale;

      ctx.beginPath();
      ctx.arc(-2.5 * scale + eyeOffsetX, -9 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.arc(2.5 * scale + eyeOffsetX, -9 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Handheld lantern
    const lx = (direction === 'left' ? -9 : 9) * scale;
    const ly = 1 * scale;
    ctx.fillStyle = '#D97706';
    ctx.fillRect(lx - 2 * scale, ly, 4 * scale, 5 * scale);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(lx, ly + 2.5 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // -------------------------------------------------------------
  // CHARACTER 2: ROBO (Friendly little automaton)
  // -------------------------------------------------------------
  else if (characterId === 'robo') {
    // Robotic Treads / Legs
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect((-6 + walkSwing * 0.5) * scale, 8 * scale, 4 * scale, 5 * scale, 1.5 * scale);
    ctx.roundRect((2 - walkSwing * 0.5) * scale, 8 * scale, 4 * scale, 5 * scale, 1.5 * scale);
    ctx.fill();

    // Metallic Chassis Body
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.roundRect(-8 * scale, -4 * scale, 16 * scale, 12 * scale, 3 * scale);
    ctx.fill();
    ctx.strokeStyle = '#0369A1';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Chest Meter LED
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-4 * scale, 0, 8 * scale, 3 * scale);

    // Boxy Head
    ctx.fillStyle = '#0EA5E9';
    ctx.beginPath();
    ctx.roundRect(-7 * scale, -15 * scale, 14 * scale, 10 * scale, 2.5 * scale);
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.stroke();

    // Antenna with pulsing tip
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -15 * scale);
    ctx.lineTo(0, -19 * scale);
    ctx.stroke();
    ctx.fillStyle = Math.sin(time * 0.01) > 0 ? '#38BDF8' : '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, -19 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Digital Visor Eyes
    if (direction !== 'up') {
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(-5 * scale, -13 * scale, 10 * scale, 5 * scale, 1.5 * scale);
      ctx.fill();

      // Glowing Cyan Visor Pixels
      ctx.fillStyle = '#22D3EE';
      let ex = direction === 'left' ? -2 * scale : direction === 'right' ? 2 * scale : 0;
      ctx.fillRect(-3 * scale + ex, -12 * scale, 2 * scale, 3 * scale);
      ctx.fillRect(1 * scale + ex, -12 * scale, 2 * scale, 3 * scale);
    }
  }

  // -------------------------------------------------------------
  // CHARACTER 3: ASTRONAUT (Cosmic Wayfarer)
  // -------------------------------------------------------------
  else if (characterId === 'astronaut') {
    // Pressurized Suit Body
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(-8 * scale, -5 * scale, 16 * scale, 13 * scale, 4 * scale);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Chest Panel
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(-3 * scale, -1 * scale, 6 * scale, 4 * scale);

    // Boots
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.roundRect((-5 + walkSwing * 0.5) * scale, 8 * scale, 4 * scale, 5 * scale, 2 * scale);
    ctx.roundRect((1 - walkSwing * 0.5) * scale, 8 * scale, 4 * scale, 5 * scale, 2 * scale);
    ctx.fill();

    // Bubble Helmet
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.arc(0, -10 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Golden Mirrored Bubble Visor
    if (direction !== 'up') {
      let vx = direction === 'left' ? -2 * scale : direction === 'right' ? 2 * scale : 0;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(vx, -10 * scale, 6.5 * scale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass specular reflection highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(vx - 2 * scale, -12 * scale, 3 * scale, 1.5 * scale, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Oxygen Life Support Pack
    if (direction === 'up') {
      ctx.fillStyle = '#94A3B8';
      ctx.roundRect(-6 * scale, -7 * scale, 12 * scale, 11 * scale, 2 * scale);
      ctx.fill();
    }
  }

  // -------------------------------------------------------------
  // CHARACTER 4: WIZARD (Rune Arcanist)
  // -------------------------------------------------------------
  else if (characterId === 'wizard') {
    // Flowing Mystic Robe
    ctx.fillStyle = '#6D28D9';
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 12 * scale);
    ctx.lineTo(8 * scale, 12 * scale);
    ctx.lineTo(5 * scale, -4 * scale);
    ctx.lineTo(-5 * scale, -4 * scale);
    ctx.closePath();
    ctx.fill();

    // Gilded Robe Trim
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Pointed Wizard Hat
    ctx.fillStyle = '#4C1D95';
    ctx.beginPath();
    ctx.ellipse(0, -9 * scale, 12 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat Cone
    ctx.beginPath();
    ctx.moveTo(-7 * scale, -9 * scale);
    ctx.lineTo(7 * scale, -9 * scale);
    ctx.lineTo(2 * scale + Math.sin(time * 0.005) * 1.5, -21 * scale);
    ctx.closePath();
    ctx.fill();

    // Crescent Moon Star on hat
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(1 * scale, -14 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Wizard Beard & Face
    if (direction !== 'up') {
      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.arc(0, -6 * scale, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy White Beard
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(-4 * scale, -5 * scale);
      ctx.quadraticCurveTo(0, 3 * scale, 4 * scale, -5 * scale);
      ctx.fill();

      // Mysterious Eyes
      ctx.fillStyle = '#312E81';
      let ex = direction === 'left' ? -1.5 * scale : direction === 'right' ? 1.5 * scale : 0;
      ctx.fillRect(-2 * scale + ex, -7 * scale, 1.2 * scale, 1.5 * scale);
      ctx.fillRect(1 * scale + ex, -7 * scale, 1.2 * scale, 1.5 * scale);
    }
  }

  // -------------------------------------------------------------
  // CHARACTER 5: NINJA (Shadow Infiltrator)
  // -------------------------------------------------------------
  else if (characterId === 'ninja') {
    // Midnight Shinobi Garb
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.roundRect(-6 * scale, -5 * scale, 12 * scale, 12 * scale, 3 * scale);
    ctx.fill();

    // Sash / Belt
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-6 * scale, 1 * scale, 12 * scale, 2.5 * scale);

    // Legs
    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * scale, 7 * scale);
    ctx.lineTo((-3 + walkSwing) * scale, 13 * scale);
    ctx.moveTo(3 * scale, 7 * scale);
    ctx.lineTo((3 - walkSwing) * scale, 13 * scale);
    ctx.stroke();

    // Ninja Cowl Head
    ctx.fillStyle = '#27272A';
    ctx.beginPath();
    ctx.arc(0, -8 * scale, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Red Headband with flowing tails
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-6.5 * scale, -11 * scale, 13 * scale, 2.5 * scale);

    // Headband fluttering ribbons
    const ribbonWave = Math.sin(time * 0.015) * 3 * scale;
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(direction === 'right' ? -6 * scale : 6 * scale, -10 * scale);
    ctx.quadraticCurveTo(
      (direction === 'right' ? -12 : 12) * scale,
      -8 * scale + ribbonWave,
      (direction === 'right' ? -16 : 16) * scale,
      -5 * scale + ribbonWave
    );
    ctx.stroke();

    // Piercing Eyes Slit
    if (direction !== 'up') {
      ctx.fillStyle = '#FEE2E2';
      let ex = direction === 'left' ? -1.5 * scale : direction === 'right' ? 1.5 * scale : 0;
      ctx.fillRect(-3 * scale + ex, -8.5 * scale, 6 * scale, 2 * scale);

      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-2 * scale + ex, -8 * scale, 1.2 * scale, 1.2 * scale);
      ctx.fillRect(1 * scale + ex, -8 * scale, 1.2 * scale, 1.2 * scale);
    }
  }

  // -------------------------------------------------------------
  // CHARACTER 6: SLIME (Cute animated creature)
  // -------------------------------------------------------------
  else if (characterId === 'slime') {
    const squishX = isMoving ? 1 + Math.sin(time * 0.02) * 0.15 : 1 + Math.sin(time * 0.005) * 0.06;
    const squishY = isMoving ? 1 - Math.sin(time * 0.02) * 0.15 : 1 - Math.sin(time * 0.005) * 0.06;

    // Translucent Jelly Body Dome
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale, 9 * scale * squishX, 8 * scale * squishY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner Jelly Glow
    const slimeGrad = ctx.createRadialGradient(-2 * scale, -1 * scale, 1, 0, 2 * scale, 8 * scale);
    slimeGrad.addColorStop(0, '#6EE7B7');
    slimeGrad.addColorStop(0.7, '#10B981');
    slimeGrad.addColorStop(1, '#047857');
    ctx.fillStyle = slimeGrad;
    ctx.fill();

    // Cute Anime Eyes
    if (direction !== 'up') {
      let ex = direction === 'left' ? -2 * scale : direction === 'right' ? 2 * scale : 0;
      ctx.fillStyle = '#064E3B';
      ctx.beginPath();
      ctx.arc(-3 * scale + ex, 1 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.arc(3 * scale + ex, 1 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Eye Sparkles
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-2.5 * scale + ex, 0.5 * scale, 0.8 * scale, 0, Math.PI * 2);
      ctx.arc(3.5 * scale + ex, 0.5 * scale, 0.8 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Cheerful Blushing Cheeks
      ctx.fillStyle = 'rgba(251, 113, 133, 0.5)';
      ctx.beginPath();
      ctx.arc(-4.5 * scale + ex, 3 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.arc(4.5 * scale + ex, 3 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
