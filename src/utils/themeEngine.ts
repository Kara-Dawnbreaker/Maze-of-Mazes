/**
 * Theme Engine for Maze of Mazes
 * Provides 10 built-in themes, persistence, and custom theme management.
 */

import { MazeTheme, BuiltInThemeId, ThemePreferences } from '../types/theme';

export const BUILT_IN_THEMES: Record<BuiltInThemeId, MazeTheme> = {
  // 1. Pastel Garden — lavender, pink, mint and cream
  pastel_garden: {
    id: 'pastel_garden',
    name: 'Pastel Garden',
    description: 'Soft lavender pavers, blooming rose walls, mint accents, and gentle cream corridors.',
    isBuiltIn: true,
    wallColor: '#C084FC',      // Soft lavender purple
    wallShadow: '#9333EA',     // Deeper violet
    wallRim: '#F472B6',        // Rose pink rim
    floorColor: '#FFFDF5',     // Cream floor
    floorAltColor: '#F3E8FF',  // Pale lavender paver
    jointColor: '#E9D5FF',     // Light purple mortar
    pathColor: '#EC4899',      // Pink petal footprints
    bgColor: '#FAF5FF',        // Soft floral cream
    exitColor: '#10B981',      // Mint green portal
    entranceColor: '#F472B6',  // Rose arch
    interactiveColor: '#A855F7',
    accentColor: '#D946EF',
  },

  // 2. Cyber Neon — cyan, magenta and purple
  cyber_neon: {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    description: 'Electrifying neon magenta barriers, high-contrast cyan circuitry, and deep synthetic purple void.',
    isBuiltIn: true,
    wallColor: '#D946EF',      // Neon magenta
    wallShadow: '#701A75',     // Dark magenta
    wallRim: '#06B6D4',        // Bright cyan rim
    floorColor: '#0F091F',     // Dark tech floor
    floorAltColor: '#1A1033',  // Dark purple alternate
    jointColor: '#3B0764',     // Cyber circuit line
    pathColor: '#06B6D4',      // Glowing cyan trace
    bgColor: '#06030F',        // Deep matrix void
    exitColor: '#00F0FF',      // High-luminance cyan core
    entranceColor: '#E11D48',  // Laser entry
    interactiveColor: '#C026D3',
    accentColor: '#06B6D4',
  },

  // 3. Golden Desert — sand, amber and warm orange
  golden_desert: {
    id: 'golden_desert',
    name: 'Golden Desert',
    description: 'Sun-baked sandstone walls, undulating dune pavers, warm amber light, and rich sunset orange.',
    isBuiltIn: true,
    wallColor: '#D97706',      // Warm amber wall
    wallShadow: '#92400E',     // Sunbaked shadow
    wallRim: '#FDE68A',        // Sunlit crest
    floorColor: '#FEF3C7',     // Warm sand
    floorAltColor: '#FDE68A',  // Dune crest
    jointColor: '#F59E0B',     // Sandstone seam
    pathColor: '#EA580C',      // Burnt orange footsteps
    bgColor: '#FFFBEB',        // Desert haze
    exitColor: '#F59E0B',      // Radiant solar beacon
    entranceColor: '#D97706',  // Sandstone arch
    interactiveColor: '#B45309',
    accentColor: '#F59E0B',
  },

  // 4. Emerald Forest — emerald, lime and earthy brown
  emerald_forest: {
    id: 'emerald_forest',
    name: 'Emerald Forest',
    description: 'Ancient mossy bark walls, deep emerald canopy flagstones, vibrant lime trails, and rich loam.',
    isBuiltIn: true,
    wallColor: '#059669',      // Emerald green
    wallShadow: '#064E3B',     // Deep forest shadow
    wallRim: '#A3E635',        // Lime leaf highlight
    floorColor: '#F0FDF4',     // Fresh glade floor
    floorAltColor: '#DCFCE7',  // Pale foliage paver
    jointColor: '#BBF7D0',     // Mossy joint
    pathColor: '#16A34A',      // Leaf trail
    bgColor: '#022C22',        // Deep ancient grove
    exitColor: '#84CC16',      // Glowing lime portal
    entranceColor: '#059669',  // Living canopy arch
    interactiveColor: '#047857',
    accentColor: '#10B981',
  },

  // 5. Frozen Kingdom — icy blue, white and silver
  frozen_kingdom: {
    id: 'frozen_kingdom',
    name: 'Frozen Kingdom',
    description: 'Chiseled glacial walls, pristine silver-white ice floors, crystal blue glow, and winter chill.',
    isBuiltIn: true,
    wallColor: '#38BDF8',      // Glacial blue
    wallShadow: '#0369A1',     // Deep crevasse blue
    wallRim: '#F0F9FF',        // Crystalline frost rim
    floorColor: '#F0F9FF',     // Pure ice floor
    floorAltColor: '#E0F2FE',  // Compacted snow paver
    jointColor: '#BAE6FD',     // Ice frost crack
    pathColor: '#0284C7',      // Deep frost footsteps
    bgColor: '#0C4A6E',        // Winter midnight void
    exitColor: '#38BDF8',      // Aurora portal
    entranceColor: '#7DD3FC',  // Glacial gate
    interactiveColor: '#0284C7',
    accentColor: '#38BDF8',
  },

  // 6. Candy World — coral, strawberry, yellow and turquoise
  candy_world: {
    id: 'candy_world',
    name: 'Candy World',
    description: 'Strawberry candy walls, marshmallow cream floors, coral accents, turquoise sprinkles, and lemon glow.',
    isBuiltIn: true,
    wallColor: '#FB7185',      // Strawberry pink
    wallShadow: '#BE123C',     // Dark raspberry
    wallRim: '#FDE047',        // Lemon sugar rim
    floorColor: '#FFF1F2',     // Marshmallow floor
    floorAltColor: '#FFE4E6',  // Cotton candy paver
    jointColor: '#FECDD3',     // Sugar glaze joint
    pathColor: '#06B6D4',      // Turquoise sprinkle trail
    bgColor: '#881337',        // Berry syrup void
    exitColor: '#FACC15',      // Lemon drop portal
    entranceColor: '#F43F5E',  // Candy cane arch
    interactiveColor: '#EC4899',
    accentColor: '#FB7185',
  },

  // 7. Volcanic World — orange, red, charcoal and glowing amber
  volcanic_world: {
    id: 'volcanic_world',
    name: 'Volcanic World',
    description: 'Charcoal obsidian walls, hardened volcanic basalt pavers, molten red fissures, and fiery embers.',
    isBuiltIn: true,
    wallColor: '#EA580C',      // Fiery magma orange
    wallShadow: '#7C2D12',     // Basalt crust
    wallRim: '#FBBF24',        // Molten glow rim
    floorColor: '#1C1917',     // Hardened charcoal basalt
    floorAltColor: '#292524',  // Obsidian paver
    jointColor: '#44403C',     // Ash mortar
    pathColor: '#EF4444',      // Glowing cinder footprints
    bgColor: '#0C0A09',        // Deep subterranean cavern
    exitColor: '#F97316',      // Superheated molten portal
    entranceColor: '#DC2626',  // Magma threshold
    interactiveColor: '#EA580C',
    accentColor: '#F97316',
  },

  // 8. Ocean World — turquoise, aqua, deep teal and sandy cream
  ocean_world: {
    id: 'ocean_world',
    name: 'Ocean World',
    description: 'Deep sea teal walls, aqua crystal floors, sandy cream paths, and luminous bioluminescent glow.',
    isBuiltIn: true,
    wallColor: '#0D9488',      // Deep sea teal
    wallShadow: '#134E4A',     // Abyssal depth
    wallRim: '#2DD4BF',        // Aqua crest rim
    floorColor: '#F0FDFA',     // Sandy seafoam cream
    floorAltColor: '#CCFBF1',  // Pale shallow water paver
    jointColor: '#99F6E4',     // Coral reef joint
    pathColor: '#0891B2',      // Deep aqua footprints
    bgColor: '#042F2E',        // Oceanic abyss
    exitColor: '#14B8A6',      // Sunlit surface portal
    entranceColor: '#0D9488',  // Kelp gate
    interactiveColor: '#0F766E',
    accentColor: '#14B8A6',
  },

  // 9. Royal Purple — violet, lavender, gold and pale grey
  royal_purple: {
    id: 'royal_purple',
    name: 'Royal Purple',
    description: 'Regal velvet violet walls, pale grey marble floors, royal lavender corridors, and imperial gold trim.',
    isBuiltIn: true,
    wallColor: '#7C3AED',      // Imperial violet
    wallShadow: '#4C1D95',     // Royal velvet shadow
    wallRim: '#FBBF24',        // Crown gold rim
    floorColor: '#F8FAFC',     // Pale grey marble
    floorAltColor: '#EDE9FE',  // Soft lavender paver
    jointColor: '#DDD6FE',     // Gilded seam
    pathColor: '#EAB308',      // Gold dust footsteps
    bgColor: '#2E1065',        // Midnight velvet void
    exitColor: '#A855F7',      // Royal sovereign portal
    entranceColor: '#7C3AED',  // Imperial archway
    interactiveColor: '#6D28D9',
    accentColor: '#8B5CF6',
  },

  // 10. Classic Adventure — warm stone, natural green and golden accents
  classic_adventure: {
    id: 'classic_adventure',
    name: 'Classic Adventure',
    description: 'Original warm carved stone, weathered amber shadows, lush natural moss, and radiant golden gates.',
    isBuiltIn: true,
    wallColor: '#D4A373',      // Carved warm stone
    wallShadow: '#BC6C25',     // Earthy bevel shadow
    wallRim: '#FAEDCD',        // Sunlit rim
    floorColor: '#FAF0DC',     // Sandstone paver
    floorAltColor: '#FDF6E8',  // Light stone tile
    jointColor: 'rgba(235, 218, 192, 0.45)',
    pathColor: 'rgba(245, 158, 11, 0.75)', // Sunny golden footprints
    bgColor: '#FAF5EA',        // Sunlit courtyard
    exitColor: '#F59E0B',      // Radiant solar beacon
    entranceColor: '#6EE7B7',  // Emerald grove entrance
    interactiveColor: '#D97706',
    accentColor: '#F59E0B',
  },
};

const THEME_STORAGE_KEY = 'maze_of_mazes_theme_preferences';

/**
 * Loads stored theme preferences, fallback to Classic Adventure.
 */
export function loadThemePreferences(): ThemePreferences {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        activeThemeId: parsed.activeThemeId || 'classic_adventure',
        customThemes: Array.isArray(parsed.customThemes) ? parsed.customThemes : [],
      };
    }
  } catch {
    // Local storage unreadable
  }

  return {
    activeThemeId: 'classic_adventure',
    customThemes: [],
  };
}

/**
 * Saves theme preferences to localStorage.
 */
export function saveThemePreferences(prefs: ThemePreferences): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Local storage unavailable
  }
}

/**
 * Resolves the active MazeTheme from preferences or built-ins.
 */
export function resolveActiveTheme(prefs: ThemePreferences): MazeTheme {
  // Check if it's a built-in theme
  if (prefs.activeThemeId in BUILT_IN_THEMES) {
    return BUILT_IN_THEMES[prefs.activeThemeId as BuiltInThemeId];
  }

  // Check if it's a custom theme
  const custom = prefs.customThemes.find((t) => t.id === prefs.activeThemeId);
  if (custom) {
    return custom;
  }

  // Fallback to classic adventure
  return BUILT_IN_THEMES.classic_adventure;
}

export const getActiveTheme = resolveActiveTheme;

/**
 * Generates an automatic shadow and rim color from a hex wall color.
 */
export function deriveShades(hex: string): { shadow: string; rim: string } {
  // Simple brightness adjustment
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

  // Darker shadow (~60% brightness)
  const sr = Math.max(0, Math.floor(r * 0.6)).toString(16).padStart(2, '0');
  const sg = Math.max(0, Math.floor(g * 0.6)).toString(16).padStart(2, '0');
  const sb = Math.max(0, Math.floor(b * 0.6)).toString(16).padStart(2, '0');

  // Lighter rim (~140% brightness capped at 255)
  const rr = Math.min(255, Math.floor(r * 1.35 + 30)).toString(16).padStart(2, '0');
  const rg = Math.min(255, Math.floor(g * 1.35 + 30)).toString(16).padStart(2, '0');
  const rb = Math.min(255, Math.floor(b * 1.35 + 30)).toString(16).padStart(2, '0');

  return {
    shadow: `#${sr}${sg}${sb}`,
    rim: `#${rr}${rg}${rb}`,
  };
}
