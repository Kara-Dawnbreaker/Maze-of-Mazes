/**
 * MazeRenderer - High-Fidelity Canvas Renderer for Maze of Mazes Gameplay
 * Supports both Classic Labyrinth (warm sunny stone) and Horror & Darkness
 * (dynamic lantern light cone, dark fog, shadow raycasting, and Stalker entity).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MazeGrid,
  Direction,
  CategoryId,
  VariantId,
  DifficultyId,
  StalkerState,
  PuzzleSanctumState,
  LockedDoor,
  HazardTrap,
  FloodingState,
  ImpossibleGeometryState,
  MazeCollectible,
} from '../types/maze';
import { MazeTheme } from '../types/theme';
import { CharacterId, EquippedCosmetics, AnimationState } from '../types/character';
import { canMove } from '../utils/mazeGenerator';
import { sounds } from '../utils/audio';
import { computeVisibilityGrid, HORROR_DIFFICULTY_PARAMS } from '../utils/visibility';
import { isDoorBlockingMove, getBlockingDoor } from '../utils/puzzleEngine';
import { drawCharacter } from '../utils/characterEngine';

interface MazeRendererProps {
  maze: MazeGrid;
  category: CategoryId;
  variant: VariantId;
  difficultyId: DifficultyId;
  theme?: MazeTheme;
  characterId?: CharacterId;
  cosmetics?: EquippedCosmetics;
  animState?: AnimationState;
  puzzleState?: PuzzleSanctumState | null;
  hazardTraps?: HazardTrap[];
  floodingState?: FloodingState | null;
  impossibleState?: ImpossibleGeometryState | null;
  stalker?: StalkerState | null;
  showBreadcrumbs: boolean;
  cameraMode: 'follow' | 'overview';
  onStepTaken: () => void;
  onVictory: () => void;
  onDefeat?: (cause?: 'stalker' | 'spikes' | 'drowning') => void;
  onPlayerPosChange?: (r: number, c: number) => void;
  playerPos?: { r: number; c: number };
  onDoorBump?: (door: LockedDoor) => void;
  collectibles?: MazeCollectible[];
  collectedCollectibleIds?: string[];
  onCollectibleCollected?: (item: MazeCollectible) => void;
}

export const MazeRenderer: React.FC<MazeRendererProps> = ({
  maze,
  category,
  variant,
  difficultyId,
  theme,
  characterId = 'explorer',
  cosmetics = {},
  animState = 'idle',
  puzzleState,
  hazardTraps,
  floodingState,
  impossibleState,
  stalker,
  showBreadcrumbs,
  cameraMode,
  onStepTaken,
  onVictory,
  onDefeat,
  onPlayerPosChange,
  playerPos,
  onDoorBump,
  collectibles = [],
  collectedCollectibleIds = [],
  onCollectibleCollected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isHorror = category === 'horror';
  const isDarkFog = isHorror && (variant === 'fog' || variant === 'stalker');
  const horrorParams = HORROR_DIFFICULTY_PARAMS[difficultyId] || HORROR_DIFFICULTY_PARAMS.pathfinder;

  // Discrete grid position of the player
  const playerGridPos = useRef<{ r: number; c: number }>({ r: maze.entrance.r, c: maze.entrance.c });
  // Smooth animated position of player
  const playerAnimPos = useRef<{ x: number; y: number; r: number; c: number }>({
    x: maze.entrance.c,
    y: maze.entrance.r,
    r: maze.entrance.r,
    c: maze.entrance.c,
  });
  // Facing direction
  const playerDir = useRef<Direction>('down');
  // Moving flag
  const isMoving = useRef<boolean>(false);
  // Visited cells for breadcrumbs
  const visitedCells = useRef<Set<string>>(new Set([`${maze.entrance.r},${maze.entrance.c}`]));

  // Smooth camera position and frame-rate independent movement timing.
  const cameraPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastFrameTimeRef = useRef<number>(0);

  // Tactile collision recoil offset
  const recoilOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Terminal state flag (victory or defeat)
  const gameOverTriggered = useRef<boolean>(false);

  // Re-initialize player if maze changes
  useEffect(() => {
    playerGridPos.current = { r: maze.entrance.r, c: maze.entrance.c };
    playerAnimPos.current = {
      x: maze.entrance.c,
      y: maze.entrance.r,
      r: maze.entrance.r,
      c: maze.entrance.c,
    };
    playerDir.current = 'down';
    lastFrameTimeRef.current = 0;
    visitedCells.current = new Set([`${maze.entrance.r},${maze.entrance.c}`]);
    gameOverTriggered.current = false;
  }, [maze]);

  // Synchronize when external warp/teleport occurs
  useEffect(() => {
    if (playerPos && (playerPos.r !== playerGridPos.current.r || playerPos.c !== playerGridPos.current.c)) {
      const prevR = playerGridPos.current.r;
      const prevC = playerGridPos.current.c;
      const warpDist = Math.abs(playerPos.r - prevR) + Math.abs(playerPos.c - prevC);

      playerGridPos.current = { r: playerPos.r, c: playerPos.c };
      playerAnimPos.current = {
        x: playerPos.c,
        y: playerPos.r,
        r: playerPos.r,
        c: playerPos.c,
      };
      visitedCells.current.add(`${playerPos.r},${playerPos.c}`);

      // Smooth camera snap if distant warp
      if (warpDist > 8) {
        cameraPos.current = {
          x: playerPos.c * 48 + 24,
          y: playerPos.r * 48 + 24,
        };
      }

      // Check exit condition on warp
      if (playerPos.r === maze.exit.r && playerPos.c === maze.exit.c && !gameOverTriggered.current) {
        gameOverTriggered.current = true;
        sounds.playVictory();
        setTimeout(() => {
          onVictory();
        }, 250);
      }
    }
  }, [playerPos, maze.exit, onVictory]);

  // Movement execution
  const executeMove = useCallback((dr: number, dc: number, dir: Direction) => {
    if (gameOverTriggered.current) return;

    const curR = playerGridPos.current.r;
    const curC = playerGridPos.current.c;
    const targetR = curR + dr;
    const targetC = curC + dc;

    playerDir.current = dir;

    // Check if a locked puzzle door blocks the move
    if (category === 'puzzle') {
      const door = getBlockingDoor(puzzleState, curR, curC, targetR, targetC);
      if (door) {
        sounds.playBump();
        recoilOffset.current = { x: -dc * 0.14, y: -dr * 0.14 };
        if (onDoorBump) {
          onDoorBump(door);
        }
        return;
      }
    }

    if (canMove(maze.cells, maze.rows, maze.cols, curR, curC, targetR, targetC)) {
      playerGridPos.current = { r: targetR, c: targetC };
      visitedCells.current.add(`${targetR},${targetC}`);
      isMoving.current = true;

      if (category === 'hazard' && floodingState && floodingState.warningCells.has(`${targetR},${targetC}`)) {
        sounds.playWaterSplash();
      } else if (isHorror) {
        sounds.playHorrorStep();
      } else {
        sounds.playStep();
      }

      onStepTaken();

      if (onPlayerPosChange) {
        onPlayerPosChange(targetR, targetC);
      }

      const collectible = collectibles.find(
        (item) => item.r === targetR && item.c === targetC && !collectedCollectibleIds.includes(item.id)
      );
      if (collectible) onCollectibleCollected?.(collectible);

      // Check exit condition
      if (targetR === maze.exit.r && targetC === maze.exit.c && !gameOverTriggered.current) {
        gameOverTriggered.current = true;
        sounds.playVictory();
        setTimeout(() => {
          onVictory();
        }, 250);
      }
    } else {
      sounds.playBump();
      recoilOffset.current = { x: -dc * 0.14, y: -dr * 0.14 };
    }
  }, [
    maze, category, puzzleState, floodingState, isHorror,
    onStepTaken, onVictory, onPlayerPosChange, onDoorBump,
    collectibles, collectedCollectibleIds, onCollectibleCollected,
  ]);

  // Check Stalker capture condition
  useEffect(() => {
    if (
      isHorror &&
      variant === 'stalker' &&
      stalker &&
      !gameOverTriggered.current &&
      stalker.r === playerGridPos.current.r &&
      stalker.c === playerGridPos.current.c
    ) {
      gameOverTriggered.current = true;
      sounds.playDefeatSound();
      if (onDefeat) {
        setTimeout(() => {
          onDefeat();
        }, 300);
      }
    }
  }, [stalker, isHorror, variant, onDefeat]);

  // Keyboard controls listener (Arrow keys and WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          executeMove(-1, 0, 'up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          executeMove(1, 0, 'down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          executeMove(0, -1, 'left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          executeMove(0, 1, 'right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeMove]);

  // Touch swipe gesture listener on canvas for fluid mobile navigation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default page pull-down/scroll while playing inside maze canvas
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const dist = Math.hypot(dx, dy);

        if (dist >= 24) {
          if (Math.abs(dx) > Math.abs(dy)) {
            executeMove(0, dx > 0 ? 1 : -1, dx > 0 ? 'right' : 'left');
          } else {
            executeMove(dy > 0 ? 1 : -1, 0, dy > 0 ? 'down' : 'up');
          }
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [executeMove]);

  // Global D-pad trigger
  useEffect(() => {
    (window as unknown as { triggerPlayerMove?: (dir: Direction) => void }).triggerPlayerMove = (dir: Direction) => {
      if (dir === 'up') executeMove(-1, 0, 'up');
      if (dir === 'down') executeMove(1, 0, 'down');
      if (dir === 'left') executeMove(0, -1, 'left');
      if (dir === 'right') executeMove(0, 1, 'right');
    };
    return () => {
      delete (window as unknown as { triggerPlayerMove?: (dir: Direction) => void }).triggerPlayerMove;
    };
  }, [executeMove]);

  // 60fps Animation and rendering loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Frame-rate independent interpolation keeps movement equally smooth
      // on slower laptops and high-refresh displays.
      const frameDelta = lastFrameTimeRef.current
        ? Math.min(50, Math.max(1, time - lastFrameTimeRef.current))
        : 16;
      lastFrameTimeRef.current = time;
      const movementEase = 1 - Math.pow(0.65, frameDelta / 16);

      const targetX = playerGridPos.current.c;
      const targetY = playerGridPos.current.r;
      const diffX = targetX - playerAnimPos.current.x;
      const diffY = targetY - playerAnimPos.current.y;

      if (Math.abs(diffX) < 0.02 && Math.abs(diffY) < 0.02) {
        playerAnimPos.current.x = targetX;
        playerAnimPos.current.y = targetY;
        isMoving.current = false;
      } else {
        playerAnimPos.current.x += diffX * movementEase;
        playerAnimPos.current.y += diffY * movementEase;
      }

      // Determine tile size based on camera mode
      let tileSize: number;
      if (cameraMode === 'overview') {
        const pad = 36;
        const availW = width - pad * 2;
        const availH = height - pad * 2;
        tileSize = Math.max(8, Math.min(availW / maze.cols, availH / maze.rows));
      } else {
        // Follow camera: spacious readable tiles
        tileSize = Math.min(width, height) / 10;
        tileSize = Math.max(38, Math.min(68, tileSize));
      }

      // Smooth camera position
      let targetCamX = 0;
      let targetCamY = 0;

      if (cameraMode === 'overview') {
        targetCamX = (maze.cols * tileSize) / 2;
        targetCamY = (maze.rows * tileSize) / 2;
      } else {
        targetCamX = playerAnimPos.current.x * tileSize + tileSize / 2;
        targetCamY = playerAnimPos.current.y * tileSize + tileSize / 2;
      }

      cameraPos.current.x += (targetCamX - cameraPos.current.x) * 0.15;
      cameraPos.current.y += (targetCamY - cameraPos.current.y) * 0.15;

      ctx.translate(width / 2 - cameraPos.current.x, height / 2 - cameraPos.current.y);

      // Viewport culling boundaries (only calculate tiles that fall within the view frustum + buffer)
      let minRow = 0;
      let maxRow = maze.rows - 1;
      let minCol = 0;
      let maxCol = maze.cols - 1;

      if (cameraMode === 'follow') {
        const halfW = width / 2;
        const halfH = height / 2;
        const worldMinX = cameraPos.current.x - halfW - tileSize;
        const worldMaxX = cameraPos.current.x + halfW + tileSize;
        const worldMinY = cameraPos.current.y - halfH - tileSize;
        const worldMaxY = cameraPos.current.y + halfH + tileSize;

        minCol = Math.max(0, Math.floor(worldMinX / tileSize));
        maxCol = Math.min(maze.cols - 1, Math.ceil(worldMaxX / tileSize));
        minRow = Math.max(0, Math.floor(worldMinY / tileSize));
        maxRow = Math.min(maze.rows - 1, Math.ceil(worldMaxY / tileSize));
      }

      // --- 1. Background Field ---
      if (theme) {
        ctx.fillStyle = theme.bgColor;
      } else if (category === 'horror') {
        ctx.fillStyle = '#05070D'; // Deep abyss black
      } else if (category === 'puzzle') {
        ctx.fillStyle = '#0E0A1A'; // Mystic runic dark purple
      } else if (category === 'hazard') {
        ctx.fillStyle = '#080F18'; // Subterranean deep teal
      } else if (category === 'impossible') {
        ctx.fillStyle = '#070514'; // Astral cosmic void
      } else {
        ctx.fillStyle = '#FEF9F0'; // Warm stone floor
      }
      ctx.fillRect(-tileSize * 3, -tileSize * 3, (maze.cols + 6) * tileSize, (maze.rows + 6) * tileSize);

      // --- 2. Calculate Visibility Grid for Dark Fog ---
      let visGrid: Map<string, number> | null = null;
      if (isDarkFog) {
        // Breathing pulse on lantern radius
        const flicker = Math.sin(time * 0.007) * 0.18 + Math.cos(time * 0.013) * 0.12;
        const dynamicRadius = Math.max(1.8, horrorParams.lanternRadius + flicker);
        visGrid = computeVisibilityGrid(maze, playerGridPos.current.r, playerGridPos.current.c, dynamicRadius);
      }

      // --- 3. Draw Maze Floor Tiles (with viewport culling) ---
      drawFloorTiles(ctx, maze, tileSize, category, visGrid, floodingState, minRow, maxRow, minCol, maxCol, theme);

      // --- 3b. Draw optional rewards ---
      drawCollectibles(
        ctx, collectibles, collectedCollectibleIds, tileSize, time,
        minRow, maxRow, minCol, maxCol, playerGridPos.current
      );

      // --- 4. Draw Hazard Traps (spikes) ---
      if (hazardTraps && hazardTraps.length > 0) {
        drawHazardTraps(ctx, hazardTraps, tileSize, time, minRow, maxRow, minCol, maxCol);
      }

      // --- 5. Draw Flooding Tide Water Layer ---
      if (floodingState) {
        drawFloodingWater(ctx, floodingState, tileSize, time, minRow, maxRow, minCol, maxCol);
      }

      // --- 6. Draw Breadcrumbs (if enabled) ---
      if (showBreadcrumbs && visitedCells.current.size > 0) {
        drawBreadcrumbsTrail(ctx, visitedCells.current, tileSize, isHorror, visGrid, minRow, maxRow, minCol, maxCol, theme);
      }

      // --- 7. Draw Puzzle Interactive Elements (Plates, Switches, Keys) ---
      if (puzzleState) {
        drawPuzzleElements(ctx, puzzleState, tileSize, time, minRow, maxRow, minCol, maxCol);
      }

      // --- 8. Draw Impossible Geometry (Portals & Spatial Links) ---
      if (impossibleState) {
        drawImpossibleGeometry(ctx, impossibleState, tileSize, time, minRow, maxRow, minCol, maxCol);
      }

      // --- 9. Draw Entrance & Exit Portals ---
      drawEntrance(ctx, maze.entrance.r, maze.entrance.c, tileSize, time, isHorror, visGrid, theme);
      drawExitPortal(ctx, maze.exit.r, maze.exit.c, tileSize, time, isHorror, visGrid, theme);

      // --- 10. Draw Walls with Depth (with viewport culling) ---
      drawWalls(ctx, maze, tileSize, category, visGrid, minRow, maxRow, minCol, maxCol, theme);

      // --- 11. Draw Locked Doors / Portcullises ---
      if (puzzleState && puzzleState.doors.length > 0) {
        drawLockedDoors(ctx, puzzleState.doors, tileSize, time, minRow, maxRow, minCol, maxCol);
      }

      // --- 12. Draw The Stalker Entity (if present in variant) ---
      if (isHorror && variant === 'stalker' && stalker) {
        drawStalker(ctx, stalker, tileSize, time, visGrid);
      }

      // Dampen collision recoil
      recoilOffset.current.x *= 0.68;
      recoilOffset.current.y *= 0.68;

      // --- 13. Draw Player Character ---
      const activeAnim: AnimationState = gameOverTriggered.current
        ? 'victory'
        : isMoving.current
        ? 'walk'
        : (animState || 'idle');
      const px = (playerAnimPos.current.x + recoilOffset.current.x) * tileSize + tileSize / 2;
      const py = (playerAnimPos.current.y + recoilOffset.current.y) * tileSize + tileSize / 2;
      drawCharacter(
        ctx,
        px,
        py,
        characterId,
        playerDir.current,
        activeAnim,
        time,
        tileSize / 48,
        cosmetics,
        isHorror
      );

      // --- 14. Draw Atmospheric Fog / Darkness Overlay (in Dark Fog / Stalker modes) ---
      if (isDarkFog) {
        drawDarknessFogOverlay(
          ctx,
          playerAnimPos.current.x * tileSize + tileSize / 2,
          playerAnimPos.current.y * tileSize + tileSize / 2,
          horrorParams.lanternRadius * tileSize,
          time
        );
      }

      ctx.restore();

      // --- 15. Stalker Threat Vignette in screen space ---
      if (isHorror && stalker) {
        const isChasing = stalker.status === 'CHASE';
        const isNear = stalker.distanceToPlayer <= 7;
        if (isChasing || isNear) {
          drawStalkerTensionVignette(ctx, width, height, time, isChasing, stalker.distanceToPlayer);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    maze, cameraMode, showBreadcrumbs, isHorror, isDarkFog, horrorParams, stalker,
    collectibles, collectedCollectibleIds,
  ]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${isHorror ? 'bg-[#05070D]' : 'bg-amber-50'}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

/**
 * Draws optional collectibles. Relics remain hidden until the player gets close.
 */
function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  items: MazeCollectible[],
  collectedIds: string[],
  tileSize: number,
  time: number,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number,
  player: { r: number; c: number }
) {
  for (const item of items) {
    if (collectedIds.includes(item.id)) continue;
    if (item.r < minRow || item.r > maxRow || item.c < minCol || item.c > maxCol) continue;
    if (item.type === 'relic' && Math.abs(item.r - player.r) + Math.abs(item.c - player.c) > 2) continue;

    const x = (item.c + 0.5) * tileSize;
    const y = (item.r + 0.5) * tileSize + Math.sin(time * 0.004 + item.r + item.c) * tileSize * 0.06;
    const pulse = 0.82 + Math.sin(time * 0.006 + item.c) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.shadowBlur = tileSize * 0.18;

    if (item.type === 'coin') {
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, tileSize * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff1a6';
      ctx.beginPath();
      ctx.arc(-tileSize * 0.04, -tileSize * 0.04, tileSize * 0.055, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'key') {
      ctx.shadowColor = '#60a5fa';
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = Math.max(2, tileSize * 0.07);
      ctx.beginPath();
      ctx.arc(-tileSize * 0.07, -tileSize * 0.04, tileSize * 0.11, 0, Math.PI * 2);
      ctx.moveTo(tileSize * 0.04, tileSize * 0.04);
      ctx.lineTo(tileSize * 0.2, tileSize * 0.2);
      ctx.lineTo(tileSize * 0.14, tileSize * 0.25);
      ctx.stroke();
    } else {
      ctx.shadowColor = '#c084fc';
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(0, -tileSize * 0.2);
      ctx.lineTo(tileSize * 0.16, 0);
      ctx.lineTo(0, tileSize * 0.2);
      ctx.lineTo(-tileSize * 0.16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Draws floor tiles with visibility shading and viewport culling
 */
function drawFloorTiles(
  ctx: CanvasRenderingContext2D,
  maze: MazeGrid,
  tileSize: number,
  category: CategoryId,
  visGrid: Map<string, number> | null,
  flooding: FloodingState | null | undefined,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number,
  theme?: MazeTheme
) {
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const x = c * tileSize;
      const y = r * tileSize;
      const isAlt = (r + c) % 2 === 0;

      const visIntensity = visGrid ? visGrid.get(`${r},${c}`) ?? 0 : 1.0;

      if (visGrid && visIntensity <= 0) {
        // Completely shrouded in pitch darkness
        ctx.fillStyle = theme ? theme.bgColor : '#05070D';
        ctx.fillRect(x, y, tileSize, tileSize);
        continue;
      }

      if (theme) {
        ctx.fillStyle = isAlt ? theme.floorAltColor : theme.floorColor;
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.strokeStyle = theme.jointColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      } else if (category === 'horror') {
        // Dark Obsidian / Slate corridor floor
        const baseColor = isAlt ? '#0E131F' : '#0A0E18';
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Faint cold stone joint
        ctx.strokeStyle = `rgba(30, 41, 59, ${visIntensity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      } else if (category === 'puzzle') {
        // Mystic Runic Pavers
        ctx.fillStyle = isAlt ? '#1E192E' : '#171324';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      } else if (category === 'hazard') {
        // Subterranean Basalt Stone with elevation brightness
        const elev = flooding ? flooding.elevation[r][c] : 5;
        const brightness = 14 + elev * 1.8;
        ctx.fillStyle = `rgb(${brightness}, ${brightness + 4}, ${brightness + 8})`;
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      } else if (category === 'impossible') {
        // Astral Cosmic Void Pavers
        ctx.fillStyle = isAlt ? '#16112C' : '#110C22';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      } else {
        // Classic Warm Stone Flagstones
        ctx.fillStyle = isAlt ? '#FDF6E8' : '#FAF0DC';
        ctx.fillRect(x, y, tileSize, tileSize);

        ctx.strokeStyle = 'rgba(235, 218, 192, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      }
    }
  }
}

/**
 * Draws breadcrumbs with culling
 */
function drawBreadcrumbsTrail(
  ctx: CanvasRenderingContext2D,
  visited: Set<string>,
  tileSize: number,
  isHorror: boolean,
  visGrid: Map<string, number> | null,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number,
  theme?: MazeTheme
) {
  visited.forEach((cellKey) => {
    const [rStr, cStr] = cellKey.split(',');
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);

    // Skip if outside viewport bounds
    if (r < minRow || r > maxRow || c < minCol || c > maxCol) return;

    const vis = visGrid ? visGrid.get(cellKey) ?? 0 : 1;

    if (vis > 0.05) {
      const cx = c * tileSize + tileSize / 2;
      const cy = r * tileSize + tileSize / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, tileSize * 0.11), 0, Math.PI * 2);
      if (theme) {
        ctx.fillStyle = theme.pathColor;
      } else if (isHorror) {
        ctx.fillStyle = `rgba(239, 68, 68, ${vis * 0.4})`; // Eerie faint crimson footprint
      } else {
        ctx.fillStyle = `rgba(245, 158, 11, ${vis * 0.4})`; // Sunny golden footprint
      }
      ctx.fill();
    }
  });
}

/**
 * Draws Entrance Marker
 */
function drawEntrance(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  tileSize: number,
  time: number,
  isHorror: boolean,
  visGrid: Map<string, number> | null,
  theme?: MazeTheme
) {
  const vis = visGrid ? visGrid.get(`${r},${c}`) ?? 0 : 1;
  if (vis <= 0) return;

  const cx = c * tileSize + tileSize / 2;
  const cy = r * tileSize + tileSize / 2;

  const aura = Math.sin(time * 0.003) * 2;
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, tileSize * 0.45 + aura);
  const baseColor = theme ? theme.entranceColor : (isHorror ? '#38BDF8' : '#A7F3D0');
  grad.addColorStop(0, baseColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * 0.45 + aura, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(cx - tileSize * 0.3, cy - tileSize * 0.3, tileSize * 0.6, tileSize * 0.6, 4);
  ctx.fill();
}

/**
 * Draws Exit Portal
 */
function drawExitPortal(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  tileSize: number,
  time: number,
  isHorror: boolean,
  visGrid: Map<string, number> | null,
  theme?: MazeTheme
) {
  const vis = visGrid ? visGrid.get(`${r},${c}`) ?? 0 : 1;
  // In horror, exit portal emits its own subtle glowing beacon if close or in view
  if (visGrid && vis <= 0) return;

  const cx = c * tileSize + tileSize / 2;
  const cy = r * tileSize + tileSize / 2;

  const pulse = Math.sin(time * 0.005) * (tileSize * 0.08);
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, tileSize * 0.65 + pulse);
  const exitCol = theme ? theme.exitColor : (isHorror ? '#EF4444' : '#FEF08A');
  grad.addColorStop(0, exitCol);
  grad.addColorStop(0.5, theme ? theme.exitColor + '88' : (isHorror ? 'rgba(185, 28, 28, 0.45)' : 'rgba(245, 158, 11, 0.5)'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * 0.65 + pulse, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = exitCol;
  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Rays
  const rays = 8;
  const rot = time * 0.0015;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  for (let i = 0; i < rays; i++) {
    const angle = rot + (i * Math.PI * 2) / rays;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (tileSize * 0.12), cy + Math.sin(angle) * (tileSize * 0.12));
    ctx.lineTo(cx + Math.cos(angle) * (tileSize * 0.28), cy + Math.sin(angle) * (tileSize * 0.28));
    ctx.stroke();
  }
}

/**
 * Draws carved maze walls with depth & bevel and viewport culling
 */
function drawWalls(
  ctx: CanvasRenderingContext2D,
  maze: MazeGrid,
  tileSize: number,
  category: CategoryId,
  visGrid: Map<string, number> | null,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number,
  theme?: MazeTheme
) {
  const wallWidth = Math.max(2.5, tileSize * 0.14);
  const wallHalf = wallWidth / 2;

  let wallTopColor = '#D4A373';
  let wallShadowColor = '#BC6C25';
  let wallRimColor = '#FAEDCD';

  if (theme) {
    wallTopColor = theme.wallColor;
    wallShadowColor = theme.wallShadow;
    wallRimColor = theme.wallRim;
  } else if (category === 'horror') {
    wallTopColor = '#1E293B';
    wallShadowColor = '#0A0E17';
    wallRimColor = '#334155';
  } else if (category === 'puzzle') {
    wallTopColor = '#4C1D95';
    wallShadowColor = '#2E1065';
    wallRimColor = '#A78BFA';
  } else if (category === 'hazard') {
    wallTopColor = '#334155';
    wallShadowColor = '#1E293B';
    wallRimColor = '#F97316';
  } else if (category === 'impossible') {
    wallTopColor = '#1E1B4B';
    wallShadowColor = '#0F0E2A';
    wallRimColor = '#06B6D4';
  }

  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const vis = visGrid ? visGrid.get(`${r},${c}`) ?? 0 : 1;
      if (visGrid && vis <= 0) continue;

      const cell = maze.cells[r][c];
      const x = c * tileSize;
      const y = r * tileSize;

      ctx.strokeStyle = wallShadowColor;
      ctx.lineWidth = wallWidth;

      if (cell.walls.top) {
        ctx.beginPath();
        ctx.moveTo(x - wallHalf, y);
        ctx.lineTo(x + tileSize + wallHalf, y);
        ctx.stroke();
      }
      if (cell.walls.left) {
        ctx.beginPath();
        ctx.moveTo(x, y - wallHalf);
        ctx.lineTo(x, y + tileSize + wallHalf);
        ctx.stroke();
      }
      if (cell.walls.bottom) {
        ctx.beginPath();
        ctx.moveTo(x - wallHalf, y + tileSize);
        ctx.lineTo(x + tileSize + wallHalf, y + tileSize);
        ctx.stroke();
      }
      if (cell.walls.right) {
        ctx.beginPath();
        ctx.moveTo(x + tileSize, y - wallHalf);
        ctx.lineTo(x + tileSize, y + tileSize + wallHalf);
        ctx.stroke();
      }

      // Rim highlight
      ctx.strokeStyle = wallRimColor;
      ctx.lineWidth = Math.max(1, wallWidth * 0.5);
      if (cell.walls.top) {
        ctx.beginPath();
        ctx.moveTo(x - wallHalf, y);
        ctx.lineTo(x + tileSize + wallHalf, y);
        ctx.stroke();
      }
    }
  }
}

/**
 * Draws the ominous Stalker entity
 */
function drawStalker(
  ctx: CanvasRenderingContext2D,
  stalker: StalkerState,
  tileSize: number,
  time: number,
  visGrid: Map<string, number> | null
) {
  const vis = visGrid ? visGrid.get(`${stalker.r},${stalker.c}`) ?? 0 : 1;
  const isChasing = stalker.status === 'CHASE';

  // If in pitch darkness and not close/chasing, only glowing crimson eyes are visible!
  const x = stalker.c * tileSize + tileSize / 2;
  const y = stalker.r * tileSize + tileSize / 2;
  const scale = tileSize / 48;

  const float = Math.sin(time * 0.006) * 3 * scale;

  ctx.save();
  ctx.translate(x, y + float);

  // Eerie shadowy tendril aura
  const auraRad = (isChasing ? 22 : 16) * scale;
  const auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, auraRad);
  auraGrad.addColorStop(0, isChasing ? 'rgba(239, 68, 68, 0.45)' : 'rgba(88, 28, 135, 0.35)');
  auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(0, 0, auraRad, 0, Math.PI * 2);
  ctx.fillStyle = auraGrad;
  ctx.fill();

  // Shadow Phantom Body (Wispy dark silhouette)
  ctx.fillStyle = '#0F0919';
  ctx.beginPath();
  ctx.ellipse(0, -2 * scale, 9 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trailing shadow tendrils
  ctx.strokeStyle = '#1E1233';
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.moveTo(-5 * scale, 8 * scale);
  ctx.lineTo(-7 * scale + Math.sin(time * 0.01) * 3, 16 * scale);
  ctx.moveTo(0, 9 * scale);
  ctx.lineTo(0 + Math.cos(time * 0.012) * 3, 18 * scale);
  ctx.moveTo(5 * scale, 8 * scale);
  ctx.lineTo(7 * scale + Math.sin(time * 0.01 + 2) * 3, 16 * scale);
  ctx.stroke();

  // Glowing piercing red / violet eyes
  ctx.fillStyle = isChasing ? '#EF4444' : '#A855F7';
  ctx.shadowColor = isChasing ? '#EF4444' : '#A855F7';
  ctx.shadowBlur = 8;

  let eyeOffsetX = 0;
  if (stalker.direction === 'left') eyeOffsetX = -2.5 * scale;
  if (stalker.direction === 'right') eyeOffsetX = 2.5 * scale;

  ctx.beginPath();
  ctx.arc(-3.5 * scale + eyeOffsetX, -6 * scale, 2.2 * scale, 0, Math.PI * 2);
  ctx.arc(3.5 * scale + eyeOffsetX, -6 * scale, 2.2 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the player explorer
 */
function drawPlayerExplorer(
  ctx: CanvasRenderingContext2D,
  charX: number,
  charY: number,
  direction: Direction,
  tileSize: number,
  time: number,
  isMoving: boolean,
  isHorror: boolean
) {
  const x = charX * tileSize + tileSize / 2;
  const y = charY * tileSize + tileSize / 2;
  const scale = tileSize / 48;

  const bob = isMoving ? Math.sin(time * 0.02) * 2.5 * scale : Math.sin(time * 0.004) * 1.5 * scale;
  const walkSwing = isMoving ? Math.cos(time * 0.02) * 3 * scale : 0;

  ctx.beginPath();
  ctx.ellipse(x, y + 10 * scale, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();

  ctx.save();
  ctx.translate(x, y + bob);

  // Lantern illumination cone in horror
  const lanternGrad = ctx.createRadialGradient(0, 0, 4 * scale, 0, 0, tileSize * 0.95);
  lanternGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
  lanternGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.12)');
  lanternGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.arc(0, 0, tileSize * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = lanternGrad;
  ctx.fill();

  // Tunic
  ctx.fillStyle = isHorror ? '#9A3412' : '#EA580C';
  ctx.beginPath();
  ctx.roundRect(-7 * scale, -5 * scale, 14 * scale, 13 * scale, 3 * scale);
  ctx.fill();

  // Backpack
  ctx.fillStyle = '#78350F';
  if (direction === 'up') ctx.fillRect(-6 * scale, -7 * scale, 12 * scale, 10 * scale);
  else if (direction === 'left') ctx.fillRect(4 * scale, -5 * scale, 5 * scale, 9 * scale);
  else if (direction === 'right') ctx.fillRect(-9 * scale, -5 * scale, 5 * scale, 9 * scale);

  // Legs
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4 * scale, 8 * scale);
  ctx.lineTo((-4 + walkSwing) * scale, 13 * scale);
  ctx.moveTo(4 * scale, 8 * scale);
  ctx.lineTo((4 - walkSwing) * scale, 13 * scale);
  ctx.stroke();

  // Head
  ctx.fillStyle = '#FED7AA';
  ctx.beginPath();
  ctx.arc(0, -9 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Straw Hat
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.ellipse(0, -13 * scale, 13 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Ribbon
  ctx.strokeStyle = isHorror ? '#EF4444' : '#FB7185';
  ctx.lineWidth = 1.8 * scale;
  ctx.beginPath();
  ctx.arc(0, -13 * scale, 5.5 * scale, 0.2, Math.PI - 0.2, false);
  ctx.stroke();

  // Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#451A03';
    let eyeOffsetX = 0;
    if (direction === 'left') eyeOffsetX = -2 * scale;
    if (direction === 'right') eyeOffsetX = 2 * scale;

    ctx.beginPath();
    ctx.arc(-2.5 * scale + eyeOffsetX, -9 * scale, 1.2 * scale, 0, Math.PI * 2);
    ctx.arc(2.5 * scale + eyeOffsetX, -9 * scale, 1.2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Handheld lantern
  const lx = (direction === 'left' ? -9 : 9) * scale;
  const ly = 1 * scale;
  ctx.fillStyle = '#D97706';
  ctx.fillRect(lx - 2 * scale, ly, 4 * scale, 5 * scale);
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(lx, ly + 2.5 * scale, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws atmospheric fog of war and darkness vignette
 */
function drawDarknessFogOverlay(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  lanternRadiusPx: number,
  time: number
) {
  // Vignette gradient that blankets the canvas outside the lantern radius
  const grad = ctx.createRadialGradient(
    playerX,
    playerY,
    lanternRadiusPx * 0.45,
    playerX,
    playerY,
    lanternRadiusPx * 1.05
  );
  grad.addColorStop(0, 'rgba(5, 7, 13, 0)');
  grad.addColorStop(0.7, 'rgba(5, 7, 13, 0.7)');
  grad.addColorStop(1, 'rgba(5, 7, 13, 0.98)');

  ctx.fillStyle = grad;
  ctx.fillRect(playerX - 2000, playerY - 2000, 4000, 4000);

  // Subtle drifting mist particles
  ctx.fillStyle = 'rgba(203, 213, 225, 0.04)';
  for (let i = 0; i < 6; i++) {
    const angle = time * 0.0006 + (i * Math.PI) / 3;
    const dist = lanternRadiusPx * (0.3 + (i % 3) * 0.2);
    const mx = playerX + Math.cos(angle) * dist;
    const my = playerY + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(mx, my, lanternRadiusPx * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws timed pressure spike traps
 */
function drawHazardTraps(
  ctx: CanvasRenderingContext2D,
  traps: HazardTrap[],
  tileSize: number,
  time: number,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number
) {
  for (const trap of traps) {
    if (trap.r < minRow || trap.r > maxRow || trap.c < minCol || trap.c > maxCol) continue;

    const cx = trap.c * tileSize + tileSize / 2;
    const cy = trap.r * tileSize + tileSize / 2;
    const pad = tileSize * 0.18;
    const size = tileSize - pad * 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Trap floor plate
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = trap.state === 'active' ? '#EF4444' : trap.state === 'warning' ? '#F59E0B' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    if (trap.state === 'safe') {
      // Perforated vent holes
      ctx.fillStyle = '#0F172A';
      const holeRad = Math.max(1.5, tileSize * 0.035);
      const offsets = [-size * 0.25, 0, size * 0.25];
      for (const ox of offsets) {
        for (const oy of offsets) {
          ctx.beginPath();
          ctx.arc(ox, oy, holeRad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (trap.state === 'warning') {
      // Pulsing amber warning glow & shuddering teeth
      const pulse = Math.sin(time * 0.02) * 1.5;
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2 - pulse, -size / 2 - pulse, size + pulse * 2, size + pulse * 2);

      // Warning glyph
      ctx.fillStyle = '#F59E0B';
      ctx.font = `bold ${Math.max(10, Math.floor(tileSize * 0.32))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', 0, 0);
    } else if (trap.state === 'active') {
      // Extended metal spikes
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1;

      const offsets = [-size * 0.25, 0, size * 0.25];
      for (const ox of offsets) {
        for (const oy of offsets) {
          // Sharp spike head
          ctx.beginPath();
          ctx.moveTo(ox, oy - tileSize * 0.16);
          ctx.lineTo(ox - tileSize * 0.06, oy + tileSize * 0.08);
          ctx.lineTo(ox + tileSize * 0.06, oy + tileSize * 0.08);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }
}

/**
 * Draws Flooding Tide water layer
 */
function drawFloodingWater(
  ctx: CanvasRenderingContext2D,
  flooding: FloodingState,
  tileSize: number,
  time: number,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number
) {
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const key = `${r},${c}`;
      const isSubmerged = flooding.submergedCells.has(key);
      const isWarning = flooding.warningCells.has(key);

      if (!isSubmerged && !isWarning) continue;

      const x = c * tileSize;
      const y = r * tileSize;

      if (isSubmerged) {
        // Deep water layer
        ctx.fillStyle = 'rgba(14, 116, 144, 0.62)';
        ctx.fillRect(x, y, tileSize, tileSize);

        // Animated wave ripples
        const wave = Math.sin(time * 0.003 + r * 0.4 + c * 0.4) * 2;
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + tileSize / 2 + wave);
        ctx.lineTo(x + tileSize - 2, y + tileSize / 2 - wave);
        ctx.stroke();
      } else if (isWarning) {
        // Warning shallows & surging tide foam
        const wave = Math.sin(time * 0.006 + r + c) * 1.5;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.fillRect(x, y, tileSize, tileSize);

        ctx.strokeStyle = 'rgba(207, 250, 254, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, Math.max(2, tileSize * 0.18 + wave), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

/**
 * Draws Puzzle Sanctum interactive objects: plates, switches, and floating keys
 */
function drawPuzzleElements(
  ctx: CanvasRenderingContext2D,
  puzzle: PuzzleSanctumState,
  tileSize: number,
  time: number,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number
) {
  // 1. Pressure Plates
  for (const plate of puzzle.plates) {
    if (plate.r < minRow || plate.r > maxRow || plate.c < minCol || plate.c > maxCol) continue;

    const cx = plate.c * tileSize + tileSize / 2;
    const cy = plate.r * tileSize + tileSize / 2;
    const size = tileSize * 0.6;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = plate.isPressed ? '#B45309' : '#F59E0B';
    ctx.strokeStyle = plate.isPressed ? '#78350F' : '#FEF3C7';
    ctx.lineWidth = 2;

    const pressScale = plate.isPressed ? 0.85 : 1.0;
    ctx.scale(pressScale, pressScale);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // Plate Symbol
    ctx.fillStyle = plate.isPressed ? '#FEF3C7' : '#78350F';
    ctx.font = `bold ${Math.max(10, Math.floor(tileSize * 0.32))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plate.symbol, 0, 0);

    ctx.restore();
  }

  // 2. Switches & Sequence Levers
  for (const sw of puzzle.switches) {
    if (sw.r < minRow || sw.r > maxRow || sw.c < minCol || sw.c > maxCol) continue;

    const cx = sw.c * tileSize + tileSize / 2;
    const cy = sw.r * tileSize + tileSize / 2;
    const size = tileSize * 0.5;

    ctx.save();
    ctx.translate(cx, cy);

    // Switch mount base
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 2, size, size, 4);
    ctx.fill();
    ctx.stroke();

    // Lever arm
    ctx.strokeStyle = sw.isOn ? '#FFFFFF' : '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.2);
    ctx.lineTo(sw.isOn ? size * 0.25 : -size * 0.25, -size * 0.25);
    ctx.stroke();

    // Glowing tip
    ctx.fillStyle = sw.color;
    ctx.beginPath();
    ctx.arc(sw.isOn ? size * 0.25 : -size * 0.25, -size * 0.25, Math.max(3, tileSize * 0.08), 0, Math.PI * 2);
    ctx.fill();

    // Symbol label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(8, Math.floor(tileSize * 0.2))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sw.symbol, 0, size * 0.32);

    ctx.restore();
  }

  // 3. Floating Keys
  const KEY_COLORS: Record<string, { fill: string; glow: string }> = {
    gold: { fill: '#F59E0B', glow: 'rgba(245, 158, 11, 0.45)' },
    ruby: { fill: '#EF4444', glow: 'rgba(239, 68, 68, 0.45)' },
    sapphire: { fill: '#38BDF8', glow: 'rgba(56, 189, 248, 0.45)' },
    emerald: { fill: '#10B981', glow: 'rgba(16, 185, 129, 0.45)' },
  };

  for (const key of puzzle.keys) {
    if (key.collected) continue;
    if (key.r < minRow || key.r > maxRow || key.c < minCol || key.c > maxCol) continue;

    const cx = key.c * tileSize + tileSize / 2;
    const cy = key.r * tileSize + tileSize / 2;
    const bob = Math.sin(time * 0.005 + key.r) * 3;
    const colors = KEY_COLORS[key.color] || KEY_COLORS.gold;

    ctx.save();
    ctx.translate(cx, cy + bob);

    // Glowing aura
    const rad = tileSize * 0.32;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
    grad.addColorStop(0, colors.glow);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw ornate key silhouette
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;

    // Bow (key loop)
    ctx.beginPath();
    ctx.arc(0, -tileSize * 0.1, tileSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F0919';
    ctx.beginPath();
    ctx.arc(0, -tileSize * 0.1, tileSize * 0.035, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.fillStyle = colors.fill;
    ctx.fillRect(-tileSize * 0.025, -tileSize * 0.05, tileSize * 0.05, tileSize * 0.2);

    // Bit teeth
    ctx.fillRect(0, tileSize * 0.08, tileSize * 0.06, tileSize * 0.04);
    ctx.fillRect(0, tileSize * 0.02, tileSize * 0.05, tileSize * 0.04);

    ctx.restore();
  }
}

/**
 * Draws locked portcullises / doors across wall segments
 */
function drawLockedDoors(
  ctx: CanvasRenderingContext2D,
  doors: LockedDoor[],
  tileSize: number,
  time: number,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number
) {
  for (const door of doors) {
    if (door.r < minRow - 1 || door.r > maxRow + 1 || door.c < minCol - 1 || door.c > maxCol + 1) continue;

    const midX = ((door.c + door.targetC) / 2 + 0.5) * tileSize;
    const midY = ((door.r + door.targetR) / 2 + 0.5) * tileSize;
    const isHorizontal = door.side === 'top' || door.side === 'bottom';

    ctx.save();
    ctx.translate(midX, midY);

    if (door.isUnlocked) {
      // Unlocked threshold (open archway)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(-tileSize * 0.25, -tileSize * 0.25, tileSize * 0.5, tileSize * 0.5);
    } else {
      // Locked sturdy portcullis bars
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = Math.max(2, tileSize * 0.12);

      const span = tileSize * 0.45;
      if (isHorizontal) {
        ctx.beginPath();
        ctx.moveTo(-span, 0);
        ctx.lineTo(span, 0);
        ctx.stroke();

        // Vertical grating teeth
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let ox = -span * 0.7; ox <= span * 0.7; ox += span * 0.45) {
          ctx.beginPath();
          ctx.moveTo(ox, -tileSize * 0.18);
          ctx.lineTo(ox, tileSize * 0.18);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -span);
        ctx.lineTo(0, span);
        ctx.stroke();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let oy = -span * 0.7; oy <= span * 0.7; oy += span * 0.45) {
          ctx.beginPath();
          ctx.moveTo(-tileSize * 0.18, oy);
          ctx.lineTo(tileSize * 0.18, oy);
          ctx.stroke();
        }
      }

      // Center glowing lock shield
      const lockColor =
        door.color === 'ruby'
          ? '#EF4444'
          : door.color === 'sapphire'
          ? '#38BDF8'
          : door.color === 'emerald'
          ? '#10B981'
          : '#F59E0B';

      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = lockColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, tileSize * 0.15), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Lock keyhole
      ctx.fillStyle = lockColor;
      ctx.beginPath();
      ctx.arc(0, -tileSize * 0.03, tileSize * 0.035, 0, Math.PI * 2);
      ctx.rect(-tileSize * 0.02, -tileSize * 0.03, tileSize * 0.04, tileSize * 0.07);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Draws Impossible Geometry quantum portals and spatial links
 */
function drawImpossibleGeometry(
  ctx: CanvasRenderingContext2D,
  impossible: ImpossibleGeometryState,
  tileSize: number,
  time: number,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number
) {
  // 1. Quantum Portals
  for (const portal of impossible.portals) {
    if (portal.r < minRow || portal.r > maxRow || portal.c < minCol || portal.c > maxCol) continue;

    const cx = portal.c * tileSize + tileSize / 2;
    const cy = portal.r * tileSize + tileSize / 2;
    const rot = time * 0.003;
    const rad = tileSize * 0.36;

    ctx.save();
    ctx.translate(cx, cy);

    // Glowing cosmic aura
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, rad * 1.2);
    grad.addColorStop(0, portal.color);
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.7)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, rad * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rotating outer ring
    ctx.strokeStyle = portal.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rad * 0.85, rad * 0.45, rot, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, rad * 0.85, rad * 0.45, -rot, 0, Math.PI * 2);
    ctx.stroke();

    // Central dark abyss
    ctx.fillStyle = '#050714';
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Portal Rune Glyph
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(9, Math.floor(tileSize * 0.3))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(portal.glyph, 0, 0);

    ctx.restore();
  }

  // 2. Spatial Links
  for (const link of impossible.spatialLinks) {
    if (link.fromR < minRow || link.fromR > maxRow || link.fromC < minCol || link.fromC > maxCol) continue;

    const cx = link.fromC * tileSize + tileSize / 2;
    const cy = link.fromR * tileSize + tileSize / 2;

    ctx.save();
    ctx.translate(cx, cy);

    const pulse = Math.sin(time * 0.007) * 2;
    ctx.strokeStyle = link.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, tileSize * 0.35 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

/**
 * Draws peripheral tension vignette when Stalker is actively chasing or lurking close
 */
function drawStalkerTensionVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  isChasing: boolean,
  distance: number
) {
  ctx.save();
  const pulse = Math.sin(time * 0.008) * 0.08;
  const alpha = isChasing ? 0.35 + pulse : Math.max(0, (7 - distance) * 0.04) + pulse * 0.4;

  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.32,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.7, isChasing ? `rgba(185, 28, 28, ${alpha * 0.6})` : `rgba(20, 10, 30, ${alpha * 0.8})`);
  grad.addColorStop(1, isChasing ? `rgba(220, 38, 38, ${alpha})` : `rgba(10, 5, 20, ${alpha * 1.4})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
