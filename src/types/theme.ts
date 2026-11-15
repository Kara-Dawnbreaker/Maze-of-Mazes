/**
 * Maze Themes & Colour Customization Types
 * Defines built-in and user-customized visual palettes for MAZE OF MAZES.
 */

export interface MazeTheme {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;

  // Structural Surfaces
  wallColor: string;       // Primary wall color
  wallShadow: string;      // Deep wall shadow bevel
  wallRim: string;         // Top edge highlight rim
  floorColor: string;      // Base floor paver tile
  floorAltColor: string;   // Alternate checkered paver tile
  jointColor: string;      // Floor tile mortar / joint lines

  // Navigation & Spatial
  pathColor: string;       // Walked footprint breadcrumb dot color
  bgColor: string;         // Surrounding void / background canvas color

  // Objectives & Landmarks
  exitColor: string;       // Exit portal radiant core & beacon color
  entranceColor: string;   // Entrance threshold color
  interactiveColor: string;// Switches / altars accent base
  accentColor: string;     // UI highlight and badge theme color
}

export type BuiltInThemeId =
  | 'pastel_garden'
  | 'cyber_neon'
  | 'golden_desert'
  | 'emerald_forest'
  | 'frozen_kingdom'
  | 'candy_world'
  | 'volcanic_world'
  | 'ocean_world'
  | 'royal_purple'
  | 'classic_adventure';

export interface ThemePreferences {
  activeThemeId: string;
  customThemes: MazeTheme[];
}
