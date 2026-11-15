/**
 * Dedicated Persistent Menu Maze Data
 * Contains the immutable menu labyrinth topology, chambers, waypoint paths,
 * and configuration lists for categories, difficulties, and variants.
 */

import { CategoryConfig, VariantConfig } from '../types/maze';

export interface MenuChamber {
  index: number;
  id: string;
  name: string;
  shortName: string;
  iconType: 'hearth' | 'realm' | 'scale' | 'variant' | 'portal';
  title: string;
  subtitle: string;
  description: string;
  center: { r: number; c: number };
}

export const MENU_CHAMBERS: MenuChamber[] = [
  {
    index: 0,
    id: 'hearth',
    name: "Explorer's Hearth",
    shortName: 'Hearth',
    iconType: 'hearth',
    title: 'The Journey Begins',
    subtitle: 'Step into the realm of endless labyrinths',
    description: 'Stand at the sunlit campfire before setting forth into the labyrinthine world.',
    center: { r: 2, c: 2 },
  },
  {
    index: 1,
    id: 'category',
    name: 'Sanctum of Realms',
    shortName: 'Realm',
    iconType: 'realm',
    title: 'Choose Realm',
    subtitle: 'Select the architectural nature of your labyrinth',
    description: 'Each realm possesses unique geometric principles and physical properties.',
    center: { r: 2, c: 8 },
  },
  {
    index: 2,
    id: 'difficulty',
    name: 'Crucible of Scale',
    shortName: 'Scale',
    iconType: 'scale',
    title: 'Select Scale & Depth',
    subtitle: 'Determine labyrinth dimensions and corridor complexity',
    description: 'From compact apprentice strolls to sprawling nightmare labyrinths.',
    center: { r: 7, c: 8 },
  },
  {
    index: 3,
    id: 'variant',
    name: 'Chamber of Variants',
    shortName: 'Variant',
    iconType: 'variant',
    title: 'Choose Variant',
    subtitle: 'Select trial rules and atmospheric conditions',
    description: 'Phase 01 trial features Pure Navigation with full visibility and crisp response.',
    center: { r: 7, c: 14 },
  },
  {
    index: 4,
    id: 'gateway',
    name: 'The Sun Portal',
    shortName: 'Portal',
    iconType: 'portal',
    title: 'The Golden Threshold',
    subtitle: 'Verify your expedition seed and step through',
    description: 'The ancient stone arch hums with radiant solar power. Step through to manifest your maze.',
    center: { r: 11, c: 14 },
  },
];

/**
 * Predefined discrete cell-by-cell path segments connecting the chambers.
 * The explorer character traverses these exact coordinates in sequence.
 */
export const MENU_WAYPOINTS: Record<string, Array<{ r: number; c: number }>> = {
  '0-1': [
    { r: 2, c: 2 },
    { r: 2, c: 3 },
    { r: 2, c: 4 },
    { r: 2, c: 5 },
    { r: 2, c: 6 },
    { r: 2, c: 7 },
    { r: 2, c: 8 },
  ],
  '1-2': [
    { r: 2, c: 8 },
    { r: 3, c: 8 },
    { r: 4, c: 8 },
    { r: 5, c: 8 },
    { r: 6, c: 8 },
    { r: 7, c: 8 },
  ],
  '2-3': [
    { r: 7, c: 8 },
    { r: 7, c: 9 },
    { r: 7, c: 10 },
    { r: 7, c: 11 },
    { r: 7, c: 12 },
    { r: 7, c: 13 },
    { r: 7, c: 14 },
  ],
  '3-4': [
    { r: 7, c: 14 },
    { r: 8, c: 14 },
    { r: 9, c: 14 },
    { r: 10, c: 14 },
    { r: 11, c: 14 },
  ],
};

/**
 * Menu Maze Grid Dimensions
 */
export const MENU_MAZE_DIMS = { rows: 14, cols: 17 };

/**
 * Menu Maze Solid Wall Layout Map
 * 0 = open path / courtyard
 * 1 = solid carved stone wall with bevels and shadows
 * 2 = garden planter / moss bed
 */
export const MENU_WALL_MAP: number[][] = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
  [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1], // 1 (Hearth & Realm chambers)
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1], // 2 (Corridor 0 -> 1)
  [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1], // 3
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1], // 4 (Corridor 1 -> 2)
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1], // 5
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1], // 6 (Crucible & Variant)
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 7 (Corridor 2 -> 3)
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1], // 8
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], // 9 (Corridor 3 -> 4)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1], // 10 (Gateway Courtyard)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1], // 11 (Sun Portal Arch)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1], // 12
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 13
];

/**
 * Environmental decor props in the menu maze:
 * Lanterns, water basins, blooming potted shrubs, stone plinths.
 */
export interface MenuProp {
  r: number;
  c: number;
  type: 'lantern' | 'fountain' | 'plant' | 'pedestal' | 'arch' | 'campfire';
  label?: string;
}

export const MENU_PROPS: MenuProp[] = [
  { r: 2, c: 2, type: 'campfire' },
  { r: 1, c: 1, type: 'plant' },
  { r: 1, c: 3, type: 'plant' },
  { r: 3, c: 1, type: 'plant' },
  { r: 3, c: 3, type: 'lantern' },
  { r: 2, c: 5, type: 'lantern' },
  { r: 1, c: 8, type: 'pedestal', label: 'Realms' },
  { r: 3, c: 7, type: 'plant' },
  { r: 3, c: 9, type: 'plant' },
  { r: 4, c: 8, type: 'lantern' },
  { r: 6, c: 8, type: 'lantern' },
  { r: 7, c: 6, type: 'fountain' },
  { r: 8, c: 8, type: 'pedestal', label: 'Scale' },
  { r: 7, c: 10, type: 'lantern' },
  { r: 7, c: 12, type: 'lantern' },
  { r: 6, c: 14, type: 'plant' },
  { r: 8, c: 14, type: 'pedestal', label: 'Variant' },
  { r: 9, c: 14, type: 'lantern' },
  { r: 11, c: 13, type: 'plant' },
  { r: 11, c: 15, type: 'plant' },
  { r: 11, c: 14, type: 'arch', label: 'Gateway' },
];

/**
 * Initial Maze Categories
 */
export const MAZE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'classic',
    name: 'Classic Labyrinth',
    description: 'Pure, timeless architectural labyrinths with clean geometry, winding passages, and crisp navigation.',
    isPlayable: true,
    accentColor: '#F59E0B', // Sunny gold
  },
  {
    id: 'horror',
    name: 'Horror & Darkness',
    description: 'Deep darkness, fog of war, and shadow stealth. Features Dark Fog and Stalker Hunt.',
    isPlayable: true,
    accentColor: '#EF4444', // Crimson
  },
  {
    id: 'puzzle',
    name: 'Puzzle Sanctum',
    description: 'Color-coded rune keys, locked portcullises, brass pressure plates, switches, and sequence chambers.',
    isPlayable: true,
    accentColor: '#8B5CF6', // Mystic Purple
  },
  {
    id: 'hazard',
    name: 'Hazard Sanctum',
    description: 'Timed pressure spikes, rising flood tides, crumbling pavers, and dynamic water terrain.',
    isPlayable: true,
    accentColor: '#F97316', // Hazard Orange
  },
  {
    id: 'impossible',
    name: 'Impossible Geometry',
    description: 'Warp portals, non-Euclidean shortcuts, one-way spatial links, and illusion corridors.',
    isPlayable: true,
    accentColor: '#06B6D4', // Astral Cyan
  },
];

/**
 * Initial Maze Variants
 */
export const MAZE_VARIANTS: VariantConfig[] = [
  {
    id: 'pure',
    name: 'Pure Navigation',
    description: 'Full labyrinth visibility with clear spatial orientation. The foundational trial of speed, memory, and pathfinding.',
    isPlayable: true,
  },
  {
    id: 'fog',
    name: 'Dark Fog',
    description: 'Dense mist conceals the passages beyond your lantern radius. Walls cast dynamic shadows blocking line of sight.',
    isPlayable: true,
  },
  {
    id: 'stalker',
    name: 'Stalker Hunt',
    description: 'A relentless wandering shadow pursues the player through the corridors, responding to line of sight and sound.',
    isPlayable: true,
  },
  {
    id: 'riddles',
    name: 'Riddle Chambers',
    description: 'Rune keys, locked portcullises, pressure plates, and glyph switch sequences open the golden exit route.',
    isPlayable: true,
  },
  {
    id: 'tide',
    name: 'Flooding Tide',
    description: 'Surging floodwater steadily claims low-elevation corridors, demanding swift navigation across rising shallows.',
    isPlayable: true,
  },
  {
    id: 'impossible',
    name: 'Impossible Geometry',
    description: 'Paired quantum portals, non-Euclidean spatial bypasses, and illusion corridors defy conventional geometry.',
    isPlayable: true,
  },
];
