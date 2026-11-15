/**
 * Procedural Maze Generator
 * Implements deterministic Randomized DFS Backtracking algorithm.
 * Guarantees closed outer boundaries, consistent shared walls,
 * zero inaccessible cells, and a verified BFS shortest path solution.
 */

import { DifficultyConfig, DifficultyId, MazeCell, MazeGrid } from '../types/maze';
import { PRNG } from './prng';

export const DIFFICULTY_PRESETS: Record<DifficultyId, DifficultyConfig> = {
  apprentice: {
    id: 'apprentice',
    name: 'Apprentice',
    description: 'A cozy 13×13 labyrinth with gentle corridors, ideal for newcomers and swift strolls.',
    rows: 13,
    cols: 13,
    deadEndDensity: 'Low',
    recommendedTime: '~1–2 min',
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'A balanced 21×21 journey through winding corridors and branching paths.',
    rows: 21,
    cols: 21,
    deadEndDensity: 'Moderate',
    recommendedTime: '~2–4 min',
  },
  master: {
    id: 'master',
    name: 'Labyrinth Master',
    description: 'An intricate 31×31 labyrinth with deep dead ends and deceptive corridors.',
    rows: 31,
    cols: 31,
    deadEndDensity: 'High',
    recommendedTime: '~4–7 min',
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare Abyss',
    description: 'A sprawling 41×41 mega-maze demanding sharp orientation and unwavering resolve.',
    rows: 41,
    cols: 41,
    deadEndDensity: 'Intense',
    recommendedTime: '~8–15 min',
  },
};

interface DirectionOffset {
  dr: number;
  dc: number;
  wallCurrent: 'top' | 'right' | 'bottom' | 'left';
  wallNeighbor: 'bottom' | 'left' | 'top' | 'right';
}

const DIRECTIONS: DirectionOffset[] = [
  { dr: -1, dc: 0, wallCurrent: 'top', wallNeighbor: 'bottom' },
  { dr: 0, dc: 1, wallCurrent: 'right', wallNeighbor: 'left' },
  { dr: 1, dc: 0, wallCurrent: 'bottom', wallNeighbor: 'top' },
  { dr: 0, dc: -1, wallCurrent: 'left', wallNeighbor: 'right' },
];

/**
 * Generates a complete procedural maze deterministically from seed.
 * Supports custom rectangular dimensions (rows x cols) from 5 to 100 cells.
 */
export function generateMaze(
  seed: string,
  difficultyId: DifficultyId = 'pathfinder',
  customDims?: { rows: number; cols: number } | null
): MazeGrid {
  const config = DIFFICULTY_PRESETS[difficultyId] || DIFFICULTY_PRESETS.pathfinder;
  let rows = config.rows;
  let cols = config.cols;

  if (customDims) {
    rows = Math.max(5, Math.min(100, Math.floor(customDims.rows)));
    cols = Math.max(5, Math.min(100, Math.floor(customDims.cols)));
  }

  const rng = new PRNG(seed);

  // Initialize all cells with all 4 walls closed
  const cells: MazeCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: MazeCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        r,
        c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    cells.push(row);
  }

  // Entrance is at (0, 0)
  const entrance = { r: 0, c: 0 };
  // Default exit candidate is at (rows - 1, cols - 1)
  const exit = { r: rows - 1, c: cols - 1 };

  // Randomized Depth-First Search with explicit stack
  const stack: { r: number; c: number }[] = [];
  cells[0][0].visited = true;
  stack.push({ r: 0, c: 0 });

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { dir: DirectionOffset; r: number; c: number }[] = [];

    // Collect all unvisited in-bounds neighbors
    for (const dir of DIRECTIONS) {
      const nr = current.r + dir.dr;
      const nc = current.c + dir.dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !cells[nr][nc].visited) {
        neighbors.push({ dir, r: nr, c: nc });
      }
    }

    if (neighbors.length > 0) {
      // Deterministically pick one unvisited neighbor
      const chosen = rng.pick(neighbors);
      const curCell = cells[current.r][current.c];
      const nextCell = cells[chosen.r][chosen.c];

      // Knock down shared walls between current and chosen
      curCell.walls[chosen.dir.wallCurrent] = false;
      nextCell.walls[chosen.dir.wallNeighbor] = false;

      nextCell.visited = true;
      stack.push({ r: chosen.r, c: chosen.c });
    } else {
      // Backtrack
      stack.pop();
    }
  }

  // Braid a small, deterministic portion of dead ends into loops.
  // This keeps the maze readable while creating more route choices and
  // reducing the repetitive single-corridor feel of pure DFS mazes.
  const braidChance =
    difficultyId === 'apprentice' ? 0.16 :
    difficultyId === 'pathfinder' ? 0.14 :
    difficultyId === 'master' ? 0.12 : 0.1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r === entrance.r && c === entrance.c) || (r === exit.r && c === exit.c)) {
        continue;
      }

      const cell = cells[r][c];
      const openPassages = DIRECTIONS.filter((dir) => !cell.walls[dir.wallCurrent]).length;
      if (openPassages !== 1 || rng.next() >= braidChance) continue;

      const closedNeighbors = DIRECTIONS
        .map((dir) => ({ dir, r: r + dir.dr, c: c + dir.dc }))
        .filter(({ dir, r: nr, c: nc }) =>
          nr >= 0 && nr < rows &&
          nc >= 0 && nc < cols &&
          cell.walls[dir.wallCurrent]
        );

      if (closedNeighbors.length === 0) continue;

      const chosen = rng.pick(closedNeighbors);
      cell.walls[chosen.dir.wallCurrent] = false;
      cells[chosen.r][chosen.c].walls[chosen.dir.wallNeighbor] = false;
    }
  }

  // Ensure all visited flags are reset or ready for rendering
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells[r][c].visited = false;
    }
  }

  // Calculate BFS shortest path from entrance to exit
  const shortestPath = solveMazeBFS(cells, rows, cols, entrance, exit);

  return {
    rows,
    cols,
    cells,
    entrance,
    exit,
    seed,
    shortestPathLength: shortestPath.length,
    shortestPath,
  };
}

/**
 * Breadth-First Search solver to guarantee route solvability and measure optimal distance.
 */
export function solveMazeBFS(
  cells: MazeCell[][],
  rows: number,
  cols: number,
  start: { r: number; c: number },
  target: { r: number; c: number }
): Array<{ r: number; c: number }> {
  const queue: Array<{ r: number; c: number }> = [start];
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: Map<string, { r: number; c: number } | null> = new Map();

  const key = (r: number, c: number) => `${r},${c}`;
  visited[start.r][start.c] = true;
  parent.set(key(start.r, start.c), null);

  let queueHead = 0;
  while (queueHead < queue.length) {
    const cur = queue[queueHead++];
    if (cur.r === target.r && cur.c === target.c) {
      break;
    }

    const curCell = cells[cur.r][cur.c];

    for (const dir of DIRECTIONS) {
      // If there is no wall in this direction, passage is open
      if (!curCell.walls[dir.wallCurrent]) {
        const nr = cur.r + dir.dr;
        const nc = cur.c + dir.dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          visited[nr][nc] = true;
          parent.set(key(nr, nc), cur);
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  // Reconstruct path from target back to start
  const path: Array<{ r: number; c: number }> = [];
  let currKey: string | null = key(target.r, target.c);

  if (!parent.has(currKey)) {
    // Should never happen in a span tree maze, but safe fallback
    return [];
  }

  while (currKey) {
    const [r, c] = currKey.split(',').map(Number);
    path.unshift({ r, c });
    const p = parent.get(currKey);
    currKey = p ? key(p.r, p.c) : null;
  }

  return path;
}

/**
 * Validates that a move from (fromR, fromC) to (toR, toC) is physically legal:
 * exactly 1 orthogonal step and no wall exists between the cells.
 */
export function canMove(
  cells: MazeCell[][],
  rows: number,
  cols: number,
  fromR: number,
  fromC: number,
  toR: number,
  toC: number
): boolean {
  if (toR < 0 || toR >= rows || toC < 0 || toC >= cols) {
    return false;
  }
  const dr = toR - fromR;
  const dc = toC - fromC;
  if (Math.abs(dr) + Math.abs(dc) !== 1) {
    return false;
  }

  const currentCell = cells[fromR][fromC];
  if (dr === -1 && currentCell.walls.top) return false;
  if (dr === 1 && currentCell.walls.bottom) return false;
  if (dc === 1 && currentCell.walls.right) return false;
  if (dc === -1 && currentCell.walls.left) return false;

  return true;
}
