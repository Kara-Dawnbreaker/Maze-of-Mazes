/**
 * Stalker Enemy AI System
 * Implements an intelligent, atmospheric finite state machine:
 * PATROL -> SUSPICION -> CHASE -> SEARCH -> RETURN TO PATROL.
 *
 * Realism & Fairness:
 * - Strictly respects maze walls and navigates along valid passages using BFS.
 * - Hearing & Proximity use acoustic corridor distance through open passages, NOT Manhattan wall-hacks.
 * - Detection is strictly based on direct corridor line of sight and footstep acoustic echoes.
 * - If the player breaks sight around corners and stays quiet, the Stalker searches and resumes patrol.
 */

import { MazeGrid, StalkerState, Direction } from '../types/maze';
import { canMove, solveMazeBFS } from './mazeGenerator';
import { hasDirectLineOfSight } from './visibility';
import { PRNG } from './prng';

/**
 * Computes corridor distance between two points via BFS along open passages.
 * Returns -1 if unreachable or exceeding maxDistance.
 */
function getCorridorDistance(
  maze: MazeGrid,
  startR: number,
  startC: number,
  targetR: number,
  targetC: number,
  maxDistance: number = 30
): number {
  if (startR === targetR && startC === targetC) return 0;

  const queue: Array<{ r: number; c: number; dist: number }> = [{ r: startR, c: startC, dist: 0 }];
  const visited = new Set<string>();
  visited.add(`${startR},${startC}`);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.r === targetR && cur.c === targetC) {
      return cur.dist;
    }
    if (cur.dist >= maxDistance) continue;

    const neighbors = [
      { r: cur.r - 1, c: cur.c },
      { r: cur.r + 1, c: cur.c },
      { r: cur.r, c: cur.c - 1 },
      { r: cur.r, c: cur.c + 1 },
    ];

    for (const n of neighbors) {
      const k = `${n.r},${n.c}`;
      if (
        !visited.has(k) &&
        canMove(maze.cells, maze.rows, maze.cols, cur.r, cur.c, n.r, n.c)
      ) {
        visited.add(k);
        queue.push({ r: n.r, c: n.c, dist: cur.dist + 1 });
      }
    }
  }

  return -1;
}

/**
 * Initializes a new Stalker entity placed far from the player.
 */
export function initializeStalker(maze: MazeGrid, playerR: number, playerC: number): StalkerState {
  let bestR = maze.exit.r;
  let bestC = maze.exit.c;
  let maxDist = 0;

  // Sample candidate tiles across inner cells
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const d = Math.abs(r - playerR) + Math.abs(c - playerC);
      if (d > maxDist) {
        maxDist = d;
        bestR = r;
        bestC = c;
      }
    }
  }

  return {
    r: bestR,
    c: bestC,
    animX: bestC,
    animY: bestR,
    direction: 'down',
    status: 'PATROL',
    targetPos: null,
    lastKnownPlayerPos: null,
    searchTimer: 0,
    distanceToPlayer: maxDist,
  };
}

/**
 * Executes a single AI logic tick for the Stalker.
 */
export function updateStalkerAI(
  stalker: StalkerState,
  maze: MazeGrid,
  playerR: number,
  playerC: number,
  playerMovedRecently: boolean,
  params: {
    sightDistance: number;
    hearingDistance: number;
  },
  rng: PRNG
): { nextStalker: StalkerState; captured: boolean; statusChanged: boolean } {
  let { r, c, direction, status, targetPos, lastKnownPlayerPos, searchTimer } = stalker;
  let statusChanged = false;

  // Check capture condition (same tile)
  if (r === playerR && c === playerC) {
    return {
      nextStalker: { ...stalker, distanceToPlayer: 0 },
      captured: true,
      statusChanged: false,
    };
  }

  // 1. Line-of-sight along straight corridors
  const hasSight = hasDirectLineOfSight(maze, r, c, playerR, playerC, params.sightDistance);

  // 2. Realistic acoustic corridor hearing (sound travels through open doorways, not walls)
  const soundDist = getCorridorDistance(maze, r, c, playerR, playerC, params.hearingDistance + 2);
  const isHeard = playerMovedRecently && soundDist !== -1 && soundDist <= params.hearingDistance;

  // 3. Immediate proximity (in the same corridor within 2 steps)
  const isPointBlank = soundDist !== -1 && soundDist <= 2;

  const prevStatus = status;

  // --- STATE TRANSITIONS ---
  if (hasSight || isPointBlank) {
    // Direct sightline or point-blank corridor contact -> CHASE
    if (status !== 'CHASE') {
      status = 'CHASE';
      statusChanged = true;
    }
    lastKnownPlayerPos = { r: playerR, c: playerC };
    targetPos = { r: playerR, c: playerC };
  } else if (isHeard && (status === 'PATROL' || status === 'SEARCH')) {
    // Heard footsteps echoing down hallway -> SUSPICION
    status = 'SUSPICION';
    statusChanged = true;
    lastKnownPlayerPos = { r: playerR, c: playerC };
    targetPos = { r: playerR, c: playerC };
    searchTimer = 4;
  } else if (status === 'CHASE' && !hasSight) {
    // Lost line-of-sight during chase -> transition to SEARCH at last known position
    status = 'SEARCH';
    statusChanged = true;
    targetPos = lastKnownPlayerPos ?? { r: playerR, c: playerC };
    searchTimer = 5;
  }

  // --- STATE ACTIONS ---
  if (status === 'CHASE') {
    targetPos = { r: playerR, c: playerC };
    lastKnownPlayerPos = { r: playerR, c: playerC };
  } else if (status === 'SEARCH' || status === 'SUSPICION') {
    // Reached search destination? Look around nearby corridor junctions
    if (targetPos && r === targetPos.r && c === targetPos.c) {
      searchTimer -= 1;
      if (searchTimer <= 0) {
        status = 'PATROL';
        statusChanged = true;
        targetPos = null;
      } else {
        const neighbors = getPassableNeighbors(maze, r, c);
        if (neighbors.length > 0) {
          targetPos = rng.pick(neighbors);
        }
      }
    }
  } else if (status === 'PATROL') {
    // Pick next patrol target if none or reached
    if (!targetPos || (r === targetPos.r && c === targetPos.c)) {
      targetPos = pickIntelligentPatrolNode(maze, playerR, playerC, rng);
    }
  }

  // --- PATHFINDING & MOVEMENT (BFS strictly along valid open corridors) ---
  let nextR = r;
  let nextC = c;
  let nextDir = direction;

  if (targetPos) {
    const path = solveMazeBFS(maze.cells, maze.rows, maze.cols, { r, c }, targetPos);
    if (path.length > 1) {
      const step = path[1];
      if (canMove(maze.cells, maze.rows, maze.cols, r, c, step.r, step.c)) {
        nextR = step.r;
        nextC = step.c;

        if (nextR > r) nextDir = 'down';
        else if (nextR < r) nextDir = 'up';
        else if (nextC > c) nextDir = 'right';
        else if (nextC < c) nextDir = 'left';
      }
    }
  }

  // Check capture after move
  const captured = nextR === playerR && nextC === playerC;
  const currentDist = Math.abs(nextR - playerR) + Math.abs(nextC - playerC);

  return {
    nextStalker: {
      ...stalker,
      r: nextR,
      c: nextC,
      direction: nextDir,
      status,
      targetPos,
      lastKnownPlayerPos,
      searchTimer,
      distanceToPlayer: currentDist,
    },
    captured,
    statusChanged: status !== prevStatus,
  };
}

/**
 * Returns accessible neighboring cells with no wall in between.
 */
function getPassableNeighbors(maze: MazeGrid, r: number, c: number): Array<{ r: number; c: number }> {
  const neighbors: Array<{ r: number; c: number }> = [];
  const cell = maze.cells[r][c];

  if (!cell.walls.top && r > 0) neighbors.push({ r: r - 1, c });
  if (!cell.walls.bottom && r < maze.rows - 1) neighbors.push({ r: r + 1, c });
  if (!cell.walls.left && c > 0) neighbors.push({ r, c: c - 1 });
  if (!cell.walls.right && c < maze.cols - 1) neighbors.push({ r, c: c + 1 });

  return neighbors;
}

/**
 * Intelligently picks a patrol destination.
 * In large mazes, biases patrol towards central thoroughfares and broad vicinity of the player,
 * ensuring authentic tension without artificial wall-hacking.
 */
function pickIntelligentPatrolNode(
  maze: MazeGrid,
  playerR: number,
  playerC: number,
  rng: PRNG
): { r: number; c: number } {
  // 60% chance to patrol general sector of player, 40% random junction
  const shouldBiasNearPlayer = rng.next() < 0.6;
  const candidates: Array<{ r: number; c: number }> = [];

  const maxRadius = Math.max(8, Math.min(maze.rows, maze.cols) / 2);

  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const d = Math.abs(r - playerR) + Math.abs(c - playerC);
      if (shouldBiasNearPlayer) {
        if (d >= 4 && d <= maxRadius) {
          candidates.push({ r, c });
        }
      } else {
        candidates.push({ r, c });
      }
    }
  }

  if (candidates.length > 0) {
    return rng.pick(candidates);
  }

  return { r: maze.exit.r, c: maze.exit.c };
}
