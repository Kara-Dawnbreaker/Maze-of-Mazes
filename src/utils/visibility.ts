/**
 * Visibility and Line of Sight System for Horror & Darkness
 * Computes dynamic illumination through maze corridors, ensuring walls
 * cast authentic shadows and distant corridors fade into darkness.
 */

import { MazeCell, MazeGrid, DifficultyId } from '../types/maze';

export const HORROR_DIFFICULTY_PARAMS: Record<
  DifficultyId,
  {
    lanternRadius: number; // in tiles
    stalkerStepMs: number; // ms per step
    sightDistance: number; // tile distance for line of sight detection
    hearingDistance: number; // sound propagation radius
  }
> = {
  apprentice: {
    lanternRadius: 5.2,
    stalkerStepMs: 800,
    sightDistance: 7,
    hearingDistance: 5,
  },
  pathfinder: {
    lanternRadius: 3.8,
    stalkerStepMs: 560,
    sightDistance: 9,
    hearingDistance: 7,
  },
  master: {
    lanternRadius: 2.8,
    stalkerStepMs: 400,
    sightDistance: 11,
    hearingDistance: 9,
  },
  nightmare: {
    lanternRadius: 2.0,
    stalkerStepMs: 310,
    sightDistance: 13,
    hearingDistance: 11,
  },
};

/**
 * Computes a 2D intensity map [0..1] of visible cells around the light source (player),
 * respecting walls so light does not penetrate closed walls.
 */
export function computeVisibilityGrid(
  maze: MazeGrid,
  centerR: number,
  centerC: number,
  radius: number
): Map<string, number> {
  const visMap = new Map<string, number>();
  const intRadius = Math.ceil(radius);

  // Use BFS starting from center cell with distance tracking through open passages
  interface Node {
    r: number;
    c: number;
    dist: number;
  }

  const queue: Node[] = [{ r: centerR, c: centerC, dist: 0 }];
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  visited.add(key(centerR, centerC));
  visMap.set(key(centerR, centerC), 1.0);

  while (queue.length > 0) {
    const { r, c, dist } = queue.shift()!;
    if (dist >= radius) continue;

    const cell = maze.cells[r][c];

    // Check all 4 open directions
    // Top
    if (!cell.walls.top && r > 0) {
      const nr = r - 1;
      const nc = c;
      const k = key(nr, nc);
      if (!visited.has(k)) {
        visited.add(k);
        const nextDist = dist + 1;
        const intensity = Math.max(0, 1 - nextDist / (radius + 0.5));
        visMap.set(k, intensity);
        queue.push({ r: nr, c: nc, dist: nextDist });
      }
    }
    // Bottom
    if (!cell.walls.bottom && r < maze.rows - 1) {
      const nr = r + 1;
      const nc = c;
      const k = key(nr, nc);
      if (!visited.has(k)) {
        visited.add(k);
        const nextDist = dist + 1;
        const intensity = Math.max(0, 1 - nextDist / (radius + 0.5));
        visMap.set(k, intensity);
        queue.push({ r: nr, c: nc, dist: nextDist });
      }
    }
    // Left
    if (!cell.walls.left && c > 0) {
      const nr = r;
      const nc = c - 1;
      const k = key(nr, nc);
      if (!visited.has(k)) {
        visited.add(k);
        const nextDist = dist + 1;
        const intensity = Math.max(0, 1 - nextDist / (radius + 0.5));
        visMap.set(k, intensity);
        queue.push({ r: nr, c: nc, dist: nextDist });
      }
    }
    // Right
    if (!cell.walls.right && c < maze.cols - 1) {
      const nr = r;
      const nc = c + 1;
      const k = key(nr, nc);
      if (!visited.has(k)) {
        visited.add(k);
        const nextDist = dist + 1;
        const intensity = Math.max(0, 1 - nextDist / (radius + 0.5));
        visMap.set(k, intensity);
        queue.push({ r: nr, c: nc, dist: nextDist });
      }
    }
  }

  return visMap;
}

/**
 * Checks whether there is an unobstructed direct line-of-sight along orthogonal
 * corridors between two points (fromR, fromC) and (toR, toC).
 */
export function hasDirectLineOfSight(
  maze: MazeGrid,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  maxDistance: number
): boolean {
  // If not on same row or column, no direct straight corridor sightline
  if (r1 !== r2 && c1 !== c2) return false;

  const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
  if (dist > maxDistance) return false;

  if (r1 === r2) {
    // Horizontal corridor check
    const step = c2 > c1 ? 1 : -1;
    let currC = c1;
    while (currC !== c2) {
      const cell = maze.cells[r1][currC];
      if (step === 1 && cell.walls.right) return false;
      if (step === -1 && cell.walls.left) return false;
      currC += step;
    }
    return true;
  } else {
    // Vertical corridor check
    const step = r2 > r1 ? 1 : -1;
    let currR = r1;
    while (currR !== r2) {
      const cell = maze.cells[currR][c1];
      if (step === 1 && cell.walls.bottom) return false;
      if (step === -1 && cell.walls.top) return false;
      currR += step;
    }
    return true;
  }
}
