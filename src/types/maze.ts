/**
 * Maze of Mazes - Type Definitions
 * Clean domain types separating menu journey, procedural generation, and gameplay state.
 */

export type DifficultyId = 'apprentice' | 'pathfinder' | 'master' | 'nightmare';

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  description: string;
  rows: number;
  cols: number;
  deadEndDensity: string;
  recommendedTime: string;
}

export interface CustomMazeDimensions {
  cols: number; // width: 5 to 100
  rows: number; // height: 5 to 100
  isCustom: boolean;
}

export type CategoryId =
  | 'classic'
  | 'horror'
  | 'puzzle'
  | 'hazard'
  | 'impossible';

export interface CategoryConfig {
  id: CategoryId;
  name: string;
  description: string;
  isPlayable: boolean;
  upcomingNote?: string;
  accentColor: string;
}

export type VariantId =
  | 'pure'
  | 'fog'
  | 'stalker'
  | 'riddles'
  | 'tide'
  | 'impossible';

export interface VariantConfig {
  id: VariantId;
  name: string;
  description: string;
  isPlayable: boolean;
  upcomingNote?: string;
}

export interface CellWalls {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface MazeCell {
  r: number;
  c: number;
  walls: CellWalls;
  visited?: boolean;
}

export interface MazeGrid {
  rows: number;
  cols: number;
  cells: MazeCell[][];
  entrance: { r: number; c: number };
  exit: { r: number; c: number };
  seed: string;
  shortestPathLength: number;
  shortestPath: Array<{ r: number; c: number }>;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerState {
  r: number;
  c: number;
  direction: Direction;
  isMoving: boolean;
  stepsCount: number;
}

export type GameScreen = 'MENU' | 'PLAYING' | 'VICTORY' | 'DEFEAT';

export type StalkerAIStatus = 'PATROL' | 'SUSPICION' | 'CHASE' | 'SEARCH';

export interface StalkerState {
  r: number;
  c: number;
  animX: number;
  animY: number;
  direction: Direction;
  status: StalkerAIStatus;
  targetPos: { r: number; c: number } | null;
  lastKnownPlayerPos: { r: number; c: number } | null;
  searchTimer: number;
  distanceToPlayer: number;
}

export interface HorrorDifficultyParams {
  lanternRadius: number; // in tiles
  stalkerStepMs: number; // ms per step
  sightDistance: number; // tile distance for line of sight detection
  hearingDistance: number; // sound propagation radius
}

export interface JourneyStep {
  stepIndex: number;
  title: string;
  subtitle: string;
  chamberName: string;
}

// ==========================================
// PHASE 05 — PUZZLE SANCTUM TYPES
// ==========================================
export type KeyColor = 'gold' | 'ruby' | 'sapphire' | 'emerald';

export interface PuzzleKey {
  id: string;
  color: KeyColor;
  r: number;
  c: number;
  collected: boolean;
  name: string;
}

export interface LockedDoor {
  id: string;
  color?: KeyColor;
  r: number;
  c: number;
  targetR: number;
  targetC: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  isUnlocked: boolean;
  name: string;
  unlockType: 'key' | 'plate' | 'timed' | 'switch' | 'sequence';
  unlockExpiresAt?: number;
  linkedPlateId?: string;
  linkedSwitchId?: string;
}

export interface PressurePlate {
  id: string;
  r: number;
  c: number;
  isPressed: boolean;
  linkedDoorId: string;
  symbol: string;
  color: string;
}

export interface PuzzleSwitch {
  id: string;
  r: number;
  c: number;
  isOn: boolean;
  symbol: string;
  color: string;
  sequenceIndex?: number;
}

export interface SequencePuzzle {
  id: string;
  targetOrder: string[];
  currentOrder: string[];
  isSolved: boolean;
  clueText: string;
}

export interface PuzzleSanctumState {
  keys: PuzzleKey[];
  doors: LockedDoor[];
  plates: PressurePlate[];
  switches: PuzzleSwitch[];
  sequence: SequencePuzzle | null;
  collectedKeyColors: KeyColor[];
  message: string | null;
}

// ==========================================
// PHASE 06 — HAZARD SANCTUM TYPES
// ==========================================
export type HazardType = 'spike' | 'crumble' | 'quicksand';

export interface HazardTrap {
  id: string;
  r: number;
  c: number;
  type: HazardType;
  state: 'safe' | 'warning' | 'active';
  timer: number;
  period: number;
  patrolPath?: Array<{ r: number; c: number }>;
  patrolIndex?: number;
}

export interface FloodingState {
  waterLevel: number;
  elevation: number[][]; // 0 to 10
  submergedCells: Set<string>;
  warningCells: Set<string>;
  maxElevation: number;
  risingSpeed: number; // units per second
}

// ==========================================
// PHASE 07 — IMPOSSIBLE GEOMETRY TYPES
// ==========================================
export interface WarpPortal {
  id: string;
  pairId: string;
  r: number;
  c: number;
  targetR: number;
  targetC: number;
  color: string;
  glyph: string;
}

export interface SpatialLink {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  isOneWay: boolean;
  color: string;
}

export interface IllusionWall {
  r: number;
  c: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  revealed: boolean;
}

export interface ImpossibleGeometryState {
  portals: WarpPortal[];
  spatialLinks: SpatialLink[];
  illusionWalls: IllusionWall[];
  lastTeleportTime: number;
  teleportCooldownMs: number;
  activeWarpAnimation?: {
    startTime: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null;
}


export type MazeCollectibleType = 'coin' | 'key' | 'relic';

export interface MazeCollectible {
  id: string;
  r: number;
  c: number;
  type: MazeCollectibleType;
}
