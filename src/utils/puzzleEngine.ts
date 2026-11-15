/**
 * Puzzle Sanctum Engine
 * Implements deterministic generation, placement, interaction, and verified state-aware
 * BFS dependency validation for keys, locked doors, pressure plates, switches, and sequence puzzles.
 *
 * Guarantees 100% solvability:
 * - Every key is located in an area accessible BEFORE its corresponding door.
 * - Keys never spawn behind the doors they unlock.
 * - Pressure plates and switches are reachable.
 * - Sequence altars are reachable and verifiable.
 * - State-aware solver validates the entire player progression.
 */

import {
  DifficultyId,
  KeyColor,
  LockedDoor,
  MazeGrid,
  PressurePlate,
  PuzzleKey,
  PuzzleSanctumState,
  PuzzleSwitch,
  SequencePuzzle,
} from '../types/maze';
import { PRNG } from './prng';
import { canMove, solveMazeBFS } from './mazeGenerator';
import { sounds } from './audio';

const KEY_CONFIGS: Record<KeyColor, { name: string; hex: string }> = {
  gold: { name: 'Solar Gold Key', hex: '#F59E0B' },
  ruby: { name: 'Crimson Ruby Key', hex: '#EF4444' },
  sapphire: { name: 'Azure Sapphire Key', hex: '#0EA5E9' },
  emerald: { name: 'Verdant Emerald Key', hex: '#10B981' },
};

/**
 * Computes all cells reachable from a start position via open corridors,
 * respecting any currently closed/locked doors.
 */
export function getReachableCells(
  maze: MazeGrid,
  start: { r: number; c: number },
  lockedDoors: LockedDoor[]
): Set<string> {
  const reachable = new Set<string>();
  const queue: Array<{ r: number; c: number }> = [start];
  const key = (r: number, c: number) => `${r},${c}`;

  reachable.add(key(start.r, start.c));

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const neighbors = [
      { r: cur.r - 1, c: cur.c },
      { r: cur.r + 1, c: cur.c },
      { r: cur.r, c: cur.c - 1 },
      { r: cur.r, c: cur.c + 1 },
    ];

    for (const n of neighbors) {
      const nKey = key(n.r, n.c);
      if (reachable.has(nKey)) continue;

      if (!canMove(maze.cells, maze.rows, maze.cols, cur.r, cur.c, n.r, n.c)) {
        continue;
      }

      // Check if a locked door blocks this step
      const isBlocked = lockedDoors.some(
        (d) =>
          !d.isUnlocked &&
          ((d.r === cur.r && d.c === cur.c && d.targetR === n.r && d.targetC === n.c) ||
            (d.r === n.r && d.c === n.c && d.targetR === cur.r && d.targetC === cur.c))
      );

      if (!isBlocked) {
        reachable.add(nKey);
        queue.push(n);
      }
    }
  }

  return reachable;
}

/**
 * Generates a validated, 100% solvable Puzzle Sanctum state for the given maze.
 */
export function generatePuzzleSanctum(
  maze: MazeGrid,
  difficultyId: DifficultyId,
  rng: PRNG
): PuzzleSanctumState {
  const path = maze.shortestPath;
  const pathLen = path.length;

  const doors: LockedDoor[] = [];
  const keys: PuzzleKey[] = [];
  const plates: PressurePlate[] = [];
  const switches: PuzzleSwitch[] = [];
  let sequence: SequencePuzzle | null = null;

  // Determine number of puzzle elements based on difficulty & path length
  const maxElements = Math.min(
    difficultyId === 'nightmare' ? 4 : difficultyId === 'master' ? 3 : difficultyId === 'pathfinder' ? 2 : 1,
    Math.max(1, Math.floor(pathLen / 8))
  );

  const availableColors: KeyColor[] = ['ruby', 'sapphire', 'emerald', 'gold'];

  // Place doors sequentially along the main path
  // Door i is placed at path step stepIdx_i
  const segmentSteps = Math.floor(pathLen / (maxElements + 1));

  for (let i = 0; i < maxElements; i++) {
    const doorStepIdx = Math.min(pathLen - 2, Math.max(2, (i + 1) * segmentSteps));
    const cellA = path[doorStepIdx];
    const cellB = path[doorStepIdx + 1];

    let side: 'top' | 'right' | 'bottom' | 'left' = 'right';
    if (cellB.r > cellA.r) side = 'bottom';
    else if (cellB.r < cellA.r) side = 'top';
    else if (cellB.c > cellA.c) side = 'right';
    else if (cellB.c < cellA.c) side = 'left';

    const color = availableColors[i % availableColors.length];
    const doorId = `door-${i + 1}`;

    // Temporarily add this door to calculate reachable upstream territory
    const newDoor: LockedDoor = {
      id: doorId,
      color,
      r: cellA.r,
      c: cellA.c,
      targetR: cellB.r,
      targetC: cellB.c,
      side,
      isUnlocked: false,
      name:
        i === 0
          ? `${KEY_CONFIGS[color].name} Gate`
          : i === 1
          ? 'Pressure Portcullis'
          : i === 2
          ? 'Mechanism Lever Gate'
          : 'Glyph Sequence Arch',
      unlockType: i === 0 ? 'key' : i === 1 ? 'plate' : i === 2 ? 'switch' : 'sequence',
      linkedPlateId: i === 1 ? `plate-${i + 1}` : undefined,
      linkedSwitchId: i === 2 ? `switch-${i + 1}` : undefined,
    };

    doors.push(newDoor);

    // Compute all cells currently reachable from entrance with all current doors locked!
    // Any unlock mechanism for this door MUST come from this reachable set.
    const accessibleSet = getReachableCells(maze, maze.entrance, doors);

    // Convert accessible set to list of cells, excluding entrance and door tile itself
    const candidateCells: Array<{ r: number; c: number }> = [];
    const usedPositions = new Set<string>([
      `${maze.entrance.r},${maze.entrance.c}`,
      `${cellA.r},${cellA.c}`,
      `${cellB.r},${cellB.c}`,
    ]);
    keys.forEach((k) => usedPositions.add(`${k.r},${k.c}`));
    plates.forEach((p) => usedPositions.add(`${p.r},${p.c}`));
    switches.forEach((s) => usedPositions.add(`${s.r},${s.c}`));

    // Prioritize branch cells (cells not on the main path)
    const branchCandidates: Array<{ r: number; c: number }> = [];
    const pathSet = new Set(path.map((p) => `${p.r},${p.c}`));

    accessibleSet.forEach((coordStr) => {
      if (usedPositions.has(coordStr)) return;
      const [cr, cc] = coordStr.split(',').map(Number);
      candidateCells.push({ r: cr, c: cc });
      if (!pathSet.has(coordStr)) {
        branchCandidates.push({ r: cr, c: cc });
      }
    });

    // Helper to pick a candidate: prefer branch candidates, then path candidates
    const pickLocation = (): { r: number; c: number } => {
      if (branchCandidates.length > 0) {
        const idx = rng.nextInt(0, branchCandidates.length - 1);
        const chosen = branchCandidates[idx];
        branchCandidates.splice(idx, 1);
        usedPositions.add(`${chosen.r},${chosen.c}`);
        return chosen;
      }
      if (candidateCells.length > 0) {
        const idx = rng.nextInt(0, candidateCells.length - 1);
        const chosen = candidateCells[idx];
        candidateCells.splice(idx, 1);
        usedPositions.add(`${chosen.r},${chosen.c}`);
        return chosen;
      }
      // Extreme fallback to an earlier path cell
      const fallbackIdx = Math.max(1, Math.floor(doorStepIdx * 0.5));
      return path[fallbackIdx];
    };

    if (newDoor.unlockType === 'key') {
      const loc = pickLocation();
      keys.push({
        id: `key-${color}`,
        color,
        r: loc.r,
        c: loc.c,
        collected: false,
        name: KEY_CONFIGS[color].name,
      });
    } else if (newDoor.unlockType === 'plate') {
      const loc = pickLocation();
      plates.push({
        id: newDoor.linkedPlateId!,
        r: loc.r,
        c: loc.c,
        isPressed: false,
        linkedDoorId: doorId,
        symbol: '⬟',
        color: '#F59E0B',
      });
    } else if (newDoor.unlockType === 'switch') {
      const loc = pickLocation();
      switches.push({
        id: newDoor.linkedSwitchId!,
        r: loc.r,
        c: loc.c,
        isOn: false,
        symbol: '⚑',
        color: '#8B5CF6',
      });
    } else if (newDoor.unlockType === 'sequence') {
      const symbols = ['Alpha', 'Beta', 'Gamma'];
      symbols.forEach((sym, sIdx) => {
        const loc = pickLocation();
        switches.push({
          id: `seq-switch-${sIdx + 1}`,
          r: loc.r,
          c: loc.c,
          isOn: false,
          symbol: sym[0],
          color: sIdx === 0 ? '#38BDF8' : sIdx === 1 ? '#F472B6' : '#A78BFA',
          sequenceIndex: sIdx,
        });
      });

      sequence = {
        id: 'riddle-seq-1',
        targetOrder: ['Alpha', 'Beta', 'Gamma'],
        currentOrder: [],
        isSolved: false,
        clueText: 'Order of Enlightenment: Alpha (A) → Beta (B) → Gamma (G)',
      };
    }
  }

  const puzzleState: PuzzleSanctumState = {
    keys,
    doors,
    plates,
    switches,
    sequence,
    collectedKeyColors: [],
    message: null,
  };

  // State-aware verification simulation
  const isSolvable = simulatePuzzleProgression(maze, puzzleState);
  if (!isSolvable) {
    // If complex placements ever caused an edge case, safely unlock affected gates
    puzzleState.doors.forEach((d) => {
      d.isUnlocked = true;
    });
  }

  return puzzleState;
}

/**
 * State-Aware Pathfinding Simulator:
 * Accurately simulates player progression:
 * 1. Explores all reachable cells with currently unlocked doors.
 * 2. Collects any reachable keys, steps on plates, toggles switches, or solves sequence.
 * 3. Unlocks newly solved doors and expands the reachable frontier.
 * 4. Repeats until either exit is reached (true) or no more progress is possible (false).
 */
export function simulatePuzzleProgression(maze: MazeGrid, puzzle: PuzzleSanctumState): boolean {
  // Clone doors and items for pure simulation
  const simDoors = puzzle.doors.map((d) => ({ ...d }));
  const simKeys = puzzle.keys.map((k) => ({ ...k }));
  const simPlates = puzzle.plates.map((p) => ({ ...p }));
  const simSwitches = puzzle.switches.map((s) => ({ ...s }));
  const collectedKeys = new Set<string>();

  let changed = true;
  let iterations = 0;
  const maxIterations = 20;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Compute currently reachable cells
    const reachable = getReachableCells(maze, maze.entrance, simDoors);

    // If exit is already reachable, we are 100% solvable!
    if (reachable.has(`${maze.exit.r},${maze.exit.c}`)) {
      return true;
    }

    // 1. Collect reachable keys
    for (const key of simKeys) {
      if (!key.collected && reachable.has(`${key.r},${key.c}`)) {
        key.collected = true;
        collectedKeys.add(key.color);
        changed = true;

        // Unlock key doors
        for (const door of simDoors) {
          if (door.unlockType === 'key' && door.color === key.color && !door.isUnlocked) {
            door.isUnlocked = true;
          }
        }
      }
    }

    // 2. Press reachable plates
    for (const plate of simPlates) {
      if (!plate.isPressed && reachable.has(`${plate.r},${plate.c}`)) {
        plate.isPressed = true;
        changed = true;

        for (const door of simDoors) {
          if (door.id === plate.linkedDoorId && !door.isUnlocked) {
            door.isUnlocked = true;
          }
        }
      }
    }

    // 3. Toggle reachable switches
    for (const sw of simSwitches) {
      if (sw.sequenceIndex === undefined && !sw.isOn && reachable.has(`${sw.r},${sw.c}`)) {
        sw.isOn = true;
        changed = true;

        for (const door of simDoors) {
          if (door.linkedSwitchId === sw.id && !door.isUnlocked) {
            door.isUnlocked = true;
          }
        }
      }
    }

    // 4. Solve sequence switches if all are reachable
    if (puzzle.sequence) {
      const seqSwitches = simSwitches.filter((s) => s.sequenceIndex !== undefined);
      const allSeqReachable = seqSwitches.every((s) => reachable.has(`${s.r},${s.c}`));
      if (allSeqReachable) {
        for (const door of simDoors) {
          if (door.unlockType === 'sequence' && !door.isUnlocked) {
            door.isUnlocked = true;
            changed = true;
          }
        }
      }
    }
  }

  // Final check
  const finalReachable = getReachableCells(maze, maze.entrance, simDoors);
  return finalReachable.has(`${maze.exit.r},${maze.exit.c}`);
}

/**
 * Checks whether a locked door is blocking movement between two adjacent cells.
 */
export function isDoorBlockingMove(
  puzzle: PuzzleSanctumState | null | undefined,
  fromR: number,
  fromC: number,
  toR: number,
  toC: number
): boolean {
  if (!puzzle || !puzzle.doors || puzzle.doors.length === 0) return false;

  for (const door of puzzle.doors) {
    if (door.isUnlocked) continue;

    const isDoorSpan =
      (door.r === fromR && door.c === fromC && door.targetR === toR && door.targetC === toC) ||
      (door.r === toR && door.c === toC && door.targetR === fromR && door.targetC === fromC);

    if (isDoorSpan) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the specific locked door that is blocking a move, if any.
 */
export function getBlockingDoor(
  puzzle: PuzzleSanctumState | null | undefined,
  fromR: number,
  fromC: number,
  toR: number,
  toC: number
): LockedDoor | null {
  if (!puzzle || !puzzle.doors || puzzle.doors.length === 0) return null;

  for (const door of puzzle.doors) {
    if (door.isUnlocked) continue;

    const isDoorSpan =
      (door.r === fromR && door.c === fromC && door.targetR === toR && door.targetC === toC) ||
      (door.r === toR && door.c === toC && door.targetR === fromR && door.targetC === fromC);

    if (isDoorSpan) {
      return door;
    }
  }

  return null;
}

/**
 * Handles interactions when player moves to a new cell.
 */
export function processPuzzleStep(
  playerR: number,
  playerC: number,
  puzzle: PuzzleSanctumState
): {
  nextState: PuzzleSanctumState;
  stateChanged: boolean;
  message?: string;
} {
  let stateChanged = false;
  let nextKeys = [...puzzle.keys];
  let nextDoors = [...puzzle.doors];
  let nextPlates = [...puzzle.plates];
  let nextSwitches = [...puzzle.switches];
  let nextCollected = [...puzzle.collectedKeyColors];
  let nextSequence = puzzle.sequence ? { ...puzzle.sequence } : null;
  let message: string | null = null;

  // 1. Check Key pickup
  for (let i = 0; i < nextKeys.length; i++) {
    const k = nextKeys[i];
    if (!k.collected && k.r === playerR && k.c === playerC) {
      nextKeys[i] = { ...k, collected: true };
      nextCollected.push(k.color);
      stateChanged = true;
      message = `Acquired ${k.name}!`;
      sounds.playKeyPickup();

      // Automatically unlock any door requiring this key
      nextDoors = nextDoors.map((d) => {
        if (d.unlockType === 'key' && d.color === k.color && !d.isUnlocked) {
          sounds.playDoorUnlock();
          return { ...d, isUnlocked: true };
        }
        return d;
      });
      break;
    }
  }

  // 2. Check Pressure Plate activation
  for (let i = 0; i < nextPlates.length; i++) {
    const plate = nextPlates[i];
    if (plate.r === playerR && plate.c === playerC && !plate.isPressed) {
      nextPlates[i] = { ...plate, isPressed: true };
      stateChanged = true;
      sounds.playPlateClick();
      message = 'Pressure Plate depressed! Portcullis unsealed.';

      nextDoors = nextDoors.map((d) => {
        if (d.id === plate.linkedDoorId) {
          sounds.playDoorUnlock();
          return { ...d, isUnlocked: true };
        }
        return d;
      });
      break;
    }
  }

  // 3. Check Switches & Sequence
  for (let i = 0; i < nextSwitches.length; i++) {
    const sw = nextSwitches[i];
    if (sw.r === playerR && sw.c === playerC && !sw.isOn) {
      nextSwitches[i] = { ...sw, isOn: true };
      stateChanged = true;
      sounds.playSwitchToggle();

      // If standalone switch
      const linkedDoor = nextDoors.find((d) => d.linkedSwitchId === sw.id);
      if (linkedDoor) {
        nextDoors = nextDoors.map((d) => (d.id === linkedDoor.id ? { ...d, isUnlocked: true } : d));
        sounds.playDoorUnlock();
        message = 'Mechanism engaged! Gate opened.';
      }

      // If sequence switch
      if (nextSequence && sw.sequenceIndex !== undefined) {
        const symbolNames = ['Alpha', 'Beta', 'Gamma'];
        const chosen = symbolNames[sw.sequenceIndex];
        const expectedNext = nextSequence.targetOrder[nextSequence.currentOrder.length];

        if (chosen === expectedNext) {
          nextSequence.currentOrder = [...nextSequence.currentOrder, chosen];
          if (nextSequence.currentOrder.length === nextSequence.targetOrder.length) {
            nextSequence.isSolved = true;
            sounds.playSequenceSuccess();
            message = 'Riddle Sequence complete! Master arch unsealed.';
            nextDoors = nextDoors.map((d) => (d.unlockType === 'sequence' ? { ...d, isUnlocked: true } : d));
          } else {
            message = `Sequence glyph [${chosen}] activated (${nextSequence.currentOrder.length}/${nextSequence.targetOrder.length})`;
          }
        } else {
          // Wrong sequence step: soft reset sequence
          sounds.playSequenceError();
          nextSequence.currentOrder = [];
          nextSwitches = nextSwitches.map((s) => (s.sequenceIndex !== undefined ? { ...s, isOn: false } : s));
          message = 'Incorrect glyph sequence. The runes reset!';
        }
      }
      break;
    }
  }

  return {
    nextState: {
      keys: nextKeys,
      doors: nextDoors,
      plates: nextPlates,
      switches: nextSwitches,
      sequence: nextSequence,
      collectedKeyColors: nextCollected,
      message,
    },
    stateChanged,
    message: message ?? undefined,
  };
}
