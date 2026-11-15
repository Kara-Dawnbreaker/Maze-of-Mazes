/**
 * Impossible Geometry Engine
 * Implements paired quantum teleportation portals, non-Euclidean spatial links,
 * and graph-based reachability validation.
 *
 * Guarantees fair solvability:
 * - Every portal pair has a valid open corridor tile destination.
 * - Spatial links only warp forward towards the exit and never drop players into dead-ends.
 * - Augmented graph solver verifies exit reachability from entrance AND from all portal destinations.
 * - Cooldown mechanism prevents disorientation and infinite warp oscillation.
 */

import {
  DifficultyId,
  IllusionWall,
  ImpossibleGeometryState,
  MazeGrid,
  SpatialLink,
  WarpPortal,
} from '../types/maze';
import { PRNG } from './prng';
import { canMove } from './mazeGenerator';

/**
 * Initializes Impossible Geometry features for a maze.
 */
export function generateImpossibleGeometry(
  maze: MazeGrid,
  difficultyId: DifficultyId,
  rng: PRNG
): ImpossibleGeometryState {
  const portals: WarpPortal[] = [];
  const spatialLinks: SpatialLink[] = [];
  const illusionWalls: IllusionWall[] = [];

  const minDim = Math.min(maze.rows, maze.cols);
  const portalPairsCount = Math.min(
    difficultyId === 'nightmare' ? 3 : difficultyId === 'master' ? 2 : 1,
    Math.max(1, Math.floor(minDim / 4))
  );

  const portalColors = ['#06B6D4', '#EC4899', '#8B5CF6'];
  const glyphs = ['Ω', 'Ψ', 'Φ'];

  // Collect candidate corridor cells away from entrance and exit
  const candidates: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const isEnt = r === maze.entrance.r && c === maze.entrance.c;
      const isExit = r === maze.exit.r && c === maze.exit.c;
      if (!isEnt && !isExit) {
        // Must have at least 1 open wall so the player can step out
        const cell = maze.cells[r][c];
        const openCount =
          (cell.walls.top ? 0 : 1) +
          (cell.walls.bottom ? 0 : 1) +
          (cell.walls.left ? 0 : 1) +
          (cell.walls.right ? 0 : 1);
        if (openCount >= 1) {
          candidates.push({ r, c });
        }
      }
    }
  }

  const shuffled = rng.shuffle([...candidates]);
  let cIdx = 0;

  for (let p = 0; p < portalPairsCount; p++) {
    if (shuffled.length < cIdx + 2) break;

    const posA = shuffled[cIdx++];
    const posB = shuffled[cIdx++];
    const color = portalColors[p % portalColors.length];
    const glyph = glyphs[p % glyphs.length];

    const idA = `portal-${p}-A`;
    const idB = `portal-${p}-B`;

    portals.push({
      id: idA,
      pairId: idB,
      r: posA.r,
      c: posA.c,
      targetR: posB.r,
      targetC: posB.c,
      color,
      glyph,
    });

    portals.push({
      id: idB,
      pairId: idA,
      r: posB.r,
      c: posB.c,
      targetR: posA.r,
      targetC: posA.c,
      color,
      glyph,
    });
  }

  // 2. Spatial Shortcuts (Non-adjacent cosmic wormholes)
  // Connect a farther corridor cell to a cell with a shorter corridor route to the exit.
  if (shuffled.length >= cIdx + 2 && (difficultyId === 'master' || difficultyId === 'nightmare')) {
    const distanceToExit: number[][] = Array.from(
      { length: maze.rows },
      () => Array(maze.cols).fill(-1)
    );
    const queue: Array<{ r: number; c: number }> = [maze.exit];
    distanceToExit[maze.exit.r][maze.exit.c] = 0;

    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      const neighbors = [
        { r: current.r - 1, c: current.c },
        { r: current.r + 1, c: current.c },
        { r: current.r, c: current.c - 1 },
        { r: current.r, c: current.c + 1 },
      ];

      for (const next of neighbors) {
        if (
          canMove(maze.cells, maze.rows, maze.cols, current.r, current.c, next.r, next.c) &&
          distanceToExit[next.r][next.c] === -1
        ) {
          distanceToExit[next.r][next.c] = distanceToExit[current.r][current.c] + 1;
          queue.push(next);
        }
      }
    }

    const remaining = shuffled.slice(cIdx).filter(
      (cell) => distanceToExit[cell.r][cell.c] >= 0
    );
    const closestDistance = remaining.reduce(
      (minimum, cell) => Math.min(minimum, distanceToExit[cell.r][cell.c]),
      Number.POSITIVE_INFINITY
    );
    const fromCandidates = remaining.filter(
      (cell) => distanceToExit[cell.r][cell.c] > closestDistance
    );

    if (fromCandidates.length > 0) {
      const from = rng.pick(fromCandidates);
      const toCandidates = remaining.filter(
        (cell) => distanceToExit[cell.r][cell.c] < distanceToExit[from.r][from.c]
      );

      if (toCandidates.length > 0) {
        const to = rng.pick(toCandidates);
        spatialLinks.push({
          fromR: from.r,
          fromC: from.c,
          toR: to.r,
          toC: to.c,
          isOneWay: true,
          color: '#F43F5E',
        });
      }
    }
  }

  // Add a few false walls across real corridors. They fade away when
  // the player reaches either side, revealing a hidden passage.
  const illusionCandidates: Array<Pick<IllusionWall, 'r' | 'c' | 'side'>> = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (
        Math.abs(r - maze.entrance.r) + Math.abs(c - maze.entrance.c) < 2 ||
        Math.abs(r - maze.exit.r) + Math.abs(c - maze.exit.c) < 2
      ) continue;
      if (c + 1 < maze.cols && canMove(maze.cells, maze.rows, maze.cols, r, c, r, c + 1)) {
        illusionCandidates.push({ r, c, side: 'right' });
      }
      if (r + 1 < maze.rows && canMove(maze.cells, maze.rows, maze.cols, r, c, r + 1, c)) {
        illusionCandidates.push({ r, c, side: 'bottom' });
      }
    }
  }

  const illusionCount = Math.min(
    difficultyId === 'nightmare' ? 8 : difficultyId === 'master' ? 6 : 4,
    illusionCandidates.length
  );
  rng.shuffle(illusionCandidates).slice(0, illusionCount).forEach((wall, index) => {
    illusionWalls.push({ ...wall, revealed: false });
  });

  const state: ImpossibleGeometryState = {
    portals,
    spatialLinks,
    illusionWalls,
    lastTeleportTime: 0,
    teleportCooldownMs: 800,
    activeWarpAnimation: undefined,
  };

  // Validate solvability across the combined navigation graph
  const isSolvable = validateImpossibleSolvability(maze, state);
  if (!isSolvable) {
    // If spatial links or portals somehow trapped graph flow, simplify to purely bidirectional portals
    state.spatialLinks = [];
  }

  return state;
}

/**
 * Checks if stepping onto a tile triggers teleportation via a quantum portal or spatial link.
 */
export function checkPortalWarp(
  playerR: number,
  playerC: number,
  state: ImpossibleGeometryState,
  nowMs: number
): {
  didWarp: boolean;
  targetPos?: { r: number; c: number };
  portalColor?: string;
} {
  if (nowMs - state.lastTeleportTime < state.teleportCooldownMs) {
    return { didWarp: false };
  }

  // Check quantum portals (bidirectional)
  const portal = state.portals.find((p) => p.r === playerR && p.c === playerC);
  if (portal) {
    return {
      didWarp: true,
      targetPos: { r: portal.targetR, c: portal.targetC },
      portalColor: portal.color,
    };
  }

  // Check spatial links
  const link = state.spatialLinks.find((l) => l.fromR === playerR && l.fromC === playerC);
  if (link) {
    return {
      didWarp: true,
      targetPos: { r: link.toR, c: link.toC },
      portalColor: link.color,
    };
  }

  return { didWarp: false };
}

/**
 * Validates reachability from entrance to exit using the navigation graph
 * (grid corridors + paired portals + spatial links).
 * Also verifies that every portal destination retains a valid route to the exit.
 */
export function validateImpossibleSolvability(
  maze: MazeGrid,
  state: ImpossibleGeometryState
): boolean {
  const isTargetReachableFrom = (start: { r: number; c: number }, target: { r: number; c: number }): boolean => {
    const visited = new Set<string>();
    const queue: Array<{ r: number; c: number }> = [start];
    visited.add(`${start.r},${start.c}`);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.r === target.r && cur.c === target.c) {
        return true;
      }

      // 1. Grid neighbor moves
      const neighbors = [
        { r: cur.r - 1, c: cur.c },
        { r: cur.r + 1, c: cur.c },
        { r: cur.r, c: cur.c - 1 },
        { r: cur.r, c: cur.c + 1 },
      ];

      for (const n of neighbors) {
        if (
          canMove(maze.cells, maze.rows, maze.cols, cur.r, cur.c, n.r, n.c) &&
          !visited.has(`${n.r},${n.c}`)
        ) {
          visited.add(`${n.r},${n.c}`);
          queue.push(n);
        }
      }

      // 2. Portal transitions
      for (const portal of state.portals) {
        if (portal.r === cur.r && portal.c === cur.c) {
          const destKey = `${portal.targetR},${portal.targetC}`;
          if (!visited.has(destKey)) {
            visited.add(destKey);
            queue.push({ r: portal.targetR, c: portal.targetC });
          }
        }
      }

      // 3. Spatial links
      for (const link of state.spatialLinks) {
        if (link.fromR === cur.r && link.fromC === cur.c) {
          const destKey = `${link.toR},${link.toC}`;
          if (!visited.has(destKey)) {
            visited.add(destKey);
            queue.push({ r: link.toR, c: link.toC });
          }
        }
      }
    }

    return false;
  };

  // 1. Check Entrance -> Exit reachability
  const entranceToExit = isTargetReachableFrom(maze.entrance, maze.exit);
  if (!entranceToExit) return false;

  // 2. Verify that from every portal destination, exit is still reachable
  for (const portal of state.portals) {
    const portalToExit = isTargetReachableFrom({ r: portal.targetR, c: portal.targetC }, maze.exit);
    if (!portalToExit) return false;
  }

  // 3. Verify that from every spatial link destination, exit is still reachable
  for (const link of state.spatialLinks) {
    const linkToExit = isTargetReachableFrom({ r: link.toR, c: link.toC }, maze.exit);
    if (!linkToExit) return false;
  }

  return true;
}
