import { MazeCollectible, MazeGrid } from '../types/maze';
import { PRNG } from './prng';

/** Places deterministic optional rewards in reachable corridor cells. */
export function generateCollectibles(maze: MazeGrid): MazeCollectible[] {
  const rng = new PRNG(`${maze.seed}-collectibles`);
  const candidates: Array<{ r: number; c: number; deadEnd: boolean }> = [];

  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if ((r === maze.entrance.r && c === maze.entrance.c) || (r === maze.exit.r && c === maze.exit.c)) continue;
      const walls = maze.cells[r][c].walls;
      const openings = Number(!walls.top) + Number(!walls.right) + Number(!walls.bottom) + Number(!walls.left);
      candidates.push({ r, c, deadEnd: openings === 1 });
    }
  }

  const shuffled = rng.shuffle(candidates);
  const totalCoins = Math.max(4, Math.min(14, Math.floor((maze.rows * maze.cols) / 55)));
  const selected: MazeCollectible[] = [];
  const used = new Set<string>();
  const add = (cell: { r: number; c: number }, type: MazeCollectible['type']) => {
    const key = `${cell.r},${cell.c}`;
    if (used.has(key)) return false;
    used.add(key);
    selected.push({ id: `${type}-${cell.r}-${cell.c}`, r: cell.r, c: cell.c, type });
    return true;
  };

  shuffled.filter((cell) => !cell.deadEnd).slice(0, totalCoins).forEach((cell) => add(cell, 'coin'));
  const keyCell = shuffled.find((cell) => !used.has(`${cell.r},${cell.c}`));
  if (keyCell) add(keyCell, 'key');
  const hiddenReward = shuffled.find((cell) => cell.deadEnd && !used.has(`${cell.r},${cell.c}`))
    || shuffled.find((cell) => !used.has(`${cell.r},${cell.c}`));
  if (hiddenReward) add(hiddenReward, 'relic');

  return selected;
}
