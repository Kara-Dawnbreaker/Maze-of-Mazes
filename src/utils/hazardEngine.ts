/**
 * Hazard Sanctum Engine
 * Implements timed floor spike traps, continuous topological elevation contours,
 * and the Flooding Tide simulation.
 *
 * Guarantees fair solvability:
 * - Elevation is mapped topologically along corridors from the exit downwards.
 * - The solution path forms an uphill route towards safety, preventing premature flood cuts.
 * - Flood rising speed scales proportionally with shortestPathLength and difficulty.
 * - Spikes are safely spaced, never adjacent, and have clear telegraph windows.
 */

import { DifficultyId, FloodingState, HazardTrap, MazeGrid } from '../types/maze';
import { PRNG } from './prng';
import { canMove } from './mazeGenerator';

/**
 * Initializes timed hazard traps safely distributed throughout corridors.
 */
export function generateHazardTraps(
  maze: MazeGrid,
  difficultyId: DifficultyId,
  rng: PRNG
): HazardTrap[] {
  const traps: HazardTrap[] = [];
  const totalCells = maze.rows * maze.cols;

  // Scale trap count based on maze dimensions and difficulty
  const divisor = difficultyId === 'nightmare' ? 18 : difficultyId === 'master' ? 26 : 38;
  const targetCount = Math.max(1, Math.min(Math.floor(totalCells / divisor), 50));

  // Exclude entrance and exit immediate radius
  const isProtected = (r: number, c: number) => {
    const dEnt = Math.abs(r - maze.entrance.r) + Math.abs(c - maze.entrance.c);
    const dExit = Math.abs(r - maze.exit.r) + Math.abs(c - maze.exit.c);
    return dEnt < 3 || dExit < 2;
  };

  const candidates: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (!isProtected(r, c)) {
        candidates.push({ r, c });
      }
    }
  }

  const shuffled = rng.shuffle(candidates);
  const selected: Array<{ r: number; c: number }> = [];

  // Enforce spacing: no two spike traps immediately adjacent to each other!
  for (const cand of shuffled) {
    if (selected.length >= targetCount) break;

    const tooClose = selected.some(
      (s) => Math.abs(s.r - cand.r) + Math.abs(s.c - cand.c) <= 1
    );

    if (!tooClose) {
      selected.push(cand);
    }
  }

  const period =
    difficultyId === 'nightmare' ? 2.8 : difficultyId === 'master' ? 3.4 : difficultyId === 'pathfinder' ? 4.0 : 4.6;

  const reservedPatrolCells = new Set(selected.map((pos) => `${pos.r},${pos.c}`));

  selected.forEach((pos, idx) => {
    let patrolPath: Array<{ r: number; c: number }> | undefined;
    // A portion of the spikes patrol a short, connected corridor instead of
    // remaining fixed. Their warning/active cycle remains unchanged.
    if (idx % 3 === 0) {
      const directions = rng.shuffle([
        { r: -1, c: 0 }, { r: 1, c: 0 },
        { r: 0, c: -1 }, { r: 0, c: 1 },
      ]);
      const nextCell = directions
        .map((dir) => ({ r: pos.r + dir.r, c: pos.c + dir.c }))
        .find((next) =>
          canMove(maze.cells, maze.rows, maze.cols, pos.r, pos.c, next.r, next.c) &&
          !isProtected(next.r, next.c) &&
          !reservedPatrolCells.has(`${next.r},${next.c}`)
        );

      if (nextCell) {
        patrolPath = [pos, nextCell];
        reservedPatrolCells.add(`${nextCell.r},${nextCell.c}`);
      }
    }

    traps.push({
      id: `trap-${idx}`,
      r: pos.r,
      c: pos.c,
      type: 'spike',
      state: 'safe',
      timer: (idx * 0.8) % period,
      period,
      patrolPath,
      patrolIndex: 0,
    });
  });

  return traps;
}

/**
 * Computes topological corridor distance from a target cell to every cell in the maze via BFS.
 */
function computeCorridorDistances(
  maze: MazeGrid,
  target: { r: number; c: number }
): number[][] {
  const dist: number[][] = Array.from({ length: maze.rows }, () => Array(maze.cols).fill(-1));
  const queue: Array<{ r: number; c: number }> = [target];
  dist[target.r][target.c] = 0;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curDist = dist[cur.r][cur.c];

    const neighbors = [
      { r: cur.r - 1, c: cur.c },
      { r: cur.r + 1, c: cur.c },
      { r: cur.r, c: cur.c - 1 },
      { r: cur.r, c: cur.c + 1 },
    ];

    for (const n of neighbors) {
      if (
        canMove(maze.cells, maze.rows, maze.cols, cur.r, cur.c, n.r, n.c) &&
        dist[n.r][n.c] === -1
      ) {
        dist[n.r][n.c] = curDist + 1;
        queue.push(n);
      }
    }
  }

  return dist;
}

/**
 * Generates an authentic topological elevation map for Flooding Tide:
 * - The Exit is the highest safe ground (elevation 10.0).
 * - Elevation flows along the corridor network: moving towards the exit leads uphill.
 * - Deep dead-end cul-de-sacs and far reaches have the lowest elevation (valleys where water pools first).
 * - Guarantees a continuous escape path where each step towards exit remains at or above water level.
 */
export function generateElevationMap(
  maze: MazeGrid,
  rng: PRNG
): { elevation: number[][]; maxElevation: number } {
  const rows = maze.rows;
  const cols = maze.cols;
  const distFromExit = computeCorridorDistances(maze, maze.exit);

  let maxDist = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (distFromExit[r][c] > maxDist) {
        maxDist = distFromExit[r][c];
      }
    }
  }

  const elevation: number[][] = Array.from({ length: rows }, () => Array(cols).fill(5));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = distFromExit[r][c] >= 0 ? distFromExit[r][c] : maxDist;
      // Normalized: 1 at exit, 0 at farthest corridor
      const ratio = 1 - d / maxDist;

      // Small gentle terrain variance (±0.4)
      const noise = (rng.next() - 0.5) * 0.8;
      // Elevation scales smoothly from 1.5 at deepest dead-ends to 9.5-10 at exit
      const elev = Math.max(1, Math.min(10, ratio * 7.5 + 2.0 + noise));
      elevation[r][c] = Math.round(elev * 10) / 10;
    }
  }

  // Preserve a dependable escape corridor along the verified shortest route.
  // Elevation rises from the entrance toward the exit so the flood does not
  // randomly cut across the intended route at the expected walking pace.
  const safeRoute = maze.shortestPath;
  const routeDenominator = Math.max(1, safeRoute.length - 1);
  safeRoute.forEach((cell, index) => {
    const routeElevation = 4.0 + (6.0 * index) / routeDenominator;
    elevation[cell.r][cell.c] = routeElevation;
  });

  // Ensure entrance and exit remain on their designated safe elevations.
  elevation[maze.entrance.r][maze.entrance.c] = Math.max(4.0, elevation[maze.entrance.r][maze.entrance.c]);
  elevation[maze.exit.r][maze.exit.c] = 10.0;

  return { elevation, maxElevation: 10 };
}

/**
 * Initializes Flooding Tide state.
 * Calibrates rising speed dynamically to maze dimensions and difficulty.
 */
export function initializeFloodingState(
  maze: MazeGrid,
  difficultyId: DifficultyId,
  rng: PRNG
): FloodingState {
  const { elevation, maxElevation } = generateElevationMap(maze, rng);

  // Calculate fair walking time based on shortest path
  // Assume player walking pace of ~3.2 steps per second
  const pathLen = maze.shortestPathLength || (maze.rows + maze.cols);
  const directWalkSec = pathLen / 3.2;

  // Total fair time to flood entire labyrinth (before exit plateau is reached):
  const multiplier =
    difficultyId === 'nightmare' ? 1.4 : difficultyId === 'master' ? 1.8 : difficultyId === 'pathfinder' ? 2.4 : 3.2;

  const timeToFlood = Math.max(25, directWalkSec * multiplier);
  // Max water level is 8.5 (safe exit plateau is 10.0)
  const risingSpeed = 8.5 / timeToFlood;

  return {
    waterLevel: 0,
    elevation,
    submergedCells: new Set<string>(),
    warningCells: new Set<string>(),
    maxElevation,
    risingSpeed,
  };
}

/**
 * Updates Flooding state for a given elapsed seconds.
 */
export function updateFlooding(
  state: FloodingState,
  elapsedSeconds: number,
  maze: MazeGrid
): FloodingState {
  const nextWaterLevel = Math.min(8.5, elapsedSeconds * state.risingSpeed);

  const submerged = new Set<string>();
  const warning = new Set<string>();

  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const elev = state.elevation[r][c];
      const key = `${r},${c}`;

      if (elev <= nextWaterLevel) {
        submerged.add(key);
      } else if (elev <= nextWaterLevel + 1.2) {
        warning.add(key);
      }
    }
  }

  return {
    ...state,
    waterLevel: nextWaterLevel,
    submergedCells: submerged,
    warningCells: warning,
  };
}

/**
 * Updates timed hazard traps.
 */
export function updateHazardTraps(traps: HazardTrap[], dtSeconds: number): HazardTrap[] {
  return traps.map((trap) => {
    let nextTimer = trap.timer + dtSeconds;
    let nextR = trap.r;
    let nextC = trap.c;
    let nextPatrolIndex = trap.patrolIndex ?? 0;
    if (nextTimer >= trap.period) {
      nextTimer = 0;
      if (trap.patrolPath && trap.patrolPath.length > 1) {
        nextPatrolIndex = (nextPatrolIndex + 1) % trap.patrolPath.length;
        nextR = trap.patrolPath[nextPatrolIndex].r;
        nextC = trap.patrolPath[nextPatrolIndex].c;
      }
    }

    // Cycle breakdown:
    // 0% - 60%: Safe (recessed into floor)
    // 60% - 78%: Warning (tremor, rattling sound, telegraphed sparks)
    // 78% - 100%: Active (sharp brass spikes extended)
    let state: 'safe' | 'warning' | 'active' = 'safe';
    if (nextTimer >= trap.period * 0.78) {
      state = 'active';
    } else if (nextTimer >= trap.period * 0.6) {
      state = 'warning';
    }

    return {
      ...trap,
      r: nextR,
      c: nextC,
      patrolIndex: nextPatrolIndex,
      timer: nextTimer,
      state,
    };
  });
}

/**
 * Checks if a player stepped on an active hazard or flooded tile.
 */
export function checkHazardPeril(
  playerR: number,
  playerC: number,
  traps: HazardTrap[],
  flooding: FloodingState | null
): { inPeril: boolean; cause?: 'spikes' | 'drowning' } {
  // 1. Spikes check (only active spikes trigger peril)
  const activeTrap = traps.find((t) => t.r === playerR && t.c === playerC && t.state === 'active');
  if (activeTrap) {
    return { inPeril: true, cause: 'spikes' };
  }

  // 2. Drowning check (fully submerged deep water)
  if (flooding && flooding.submergedCells.has(`${playerR},${playerC}`)) {
    return { inPeril: true, cause: 'drowning' };
  }

  return { inPeril: false };
}
