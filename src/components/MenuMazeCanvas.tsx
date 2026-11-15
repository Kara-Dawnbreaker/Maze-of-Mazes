/**
 * MenuMazeCanvas - High-Fidelity Interactive Menu Labyrinth
 * Renders the persistent menu maze with authentic 3D carved stone walls,
 * warm flagstone courtyards, animated scenic props, floating sun motes,
 * and smart camera framing that keeps the explorer majestically in view.
 */

import React, { useEffect, useRef } from 'react';
import {
  MENU_CHAMBERS,
  MENU_PROPS,
  MENU_WAYPOINTS,
  MENU_WALL_MAP,
  MENU_MAZE_DIMS,
} from '../data/menuMazeData';

interface MenuMazeCanvasProps {
  currentChamberIndex: number;
  isTraveling: boolean;
  onTravelComplete: () => void;
}

interface SunMote {
  x: number;
  y: number;
  speed: number;
  radius: number;
  phase: number;
  opacity: number;
}

export const MenuMazeCanvas: React.FC<MenuMazeCanvasProps> = ({
  currentChamberIndex,
  isTraveling,
  onTravelComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Discrete / Interpolated explorer position
  const posRef = useRef<{ r: number; c: number; dir: 'up' | 'down' | 'left' | 'right' }>({
    r: MENU_CHAMBERS[0].center.r,
    c: MENU_CHAMBERS[0].center.c,
    dir: 'right',
  });

  // Camera focus offset (lerped smoothly)
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating ambient sun motes
  const motesRef = useRef<SunMote[]>([]);

  // Animation walk cycle timer
  const animTimeRef = useRef<number>(0);
  const activePathRef = useRef<Array<{ r: number; c: number }> | null>(null);
  const pathProgressRef = useRef<number>(0);
  const lastIndexRef = useRef<number>(currentChamberIndex);

  // Initialize motes
  useEffect(() => {
    const motes: SunMote[] = [];
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: Math.random() * 800 - 400,
        y: Math.random() * 800 - 400,
        speed: 0.2 + Math.random() * 0.4,
        radius: 1.2 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.25 + Math.random() * 0.45,
      });
    }
    motesRef.current = motes;
  }, []);

  // When currentChamberIndex changes, set up interpolation path
  useEffect(() => {
    const prev = lastIndexRef.current;
    const curr = currentChamberIndex;
    if (prev !== curr) {
      if (curr > prev) {
        const fullPath: Array<{ r: number; c: number }> = [];
        for (let i = prev; i < curr; i++) {
          const segKey = `${i}-${i + 1}`;
          const seg = MENU_WAYPOINTS[segKey];
          if (seg) {
            const slice = fullPath.length === 0 ? seg : seg.slice(1);
            fullPath.push(...slice);
          }
        }
        activePathRef.current = fullPath;
      } else {
        const fullPath: Array<{ r: number; c: number }> = [];
        for (let i = prev; i > curr; i--) {
          const segKey = `${i - 1}-${i}`;
          const seg = MENU_WAYPOINTS[segKey];
          if (seg) {
            const revSeg = [...seg].reverse();
            const slice = fullPath.length === 0 ? revSeg : revSeg.slice(1);
            fullPath.push(...slice);
          }
        }
        activePathRef.current = fullPath;
      }
      pathProgressRef.current = 0;
      lastIndexRef.current = curr;
    }
  }, [currentChamberIndex]);

  // Main 60fps render & physics loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      animTimeRef.current = time;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle path progression if traveling
      if (activePathRef.current && activePathRef.current.length > 1) {
        const path = activePathRef.current;
        pathProgressRef.current += 0.055;
        if (pathProgressRef.current >= path.length - 1) {
          const finalPoint = path[path.length - 1];
          posRef.current.r = finalPoint.r;
          posRef.current.c = finalPoint.c;
          activePathRef.current = null;
          onTravelComplete();
        } else {
          const segIndex = Math.floor(pathProgressRef.current);
          const segFraction = pathProgressRef.current - segIndex;
          const p1 = path[segIndex];
          const p2 = path[Math.min(segIndex + 1, path.length - 1)];

          const nextR = p1.r + (p2.r - p1.r) * segFraction;
          const nextC = p1.c + (p2.c - p1.c) * segFraction;

          if (Math.abs(p2.c - p1.c) > Math.abs(p2.r - p1.r)) {
            posRef.current.dir = p2.c >= p1.c ? 'right' : 'left';
          } else if (Math.abs(p2.r - p1.r) > 0) {
            posRef.current.dir = p2.r >= p1.r ? 'down' : 'up';
          }

          posRef.current.r = nextR;
          posRef.current.c = nextC;
        }
      }

      // Responsive canvas sizing
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

      // Determine viewport layout mode for framing
      const isDesktop = width >= 1024;
      const isTablet = width >= 768 && width < 1024;

      // Tile dimensions (close zoom for miniature adventure feel)
      const tileSize = Math.min(width, height) / 6.8;

      // Target camera focal point on screen
      // If desktop, the right ~390px is occupied by the sleek side dock,
      // so we place the explorer right in the center of the available left space!
      let screenFocalX = width / 2;
      let screenFocalY = height / 2;

      if (isDesktop) {
        const availableWidth = width - 400;
        screenFocalX = Math.max(availableWidth / 2, width * 0.38);
      } else if (isTablet) {
        const availableWidth = width - 330;
        screenFocalX = availableWidth / 2;
      } else {
        // Mobile: panel occupies bottom ~40%, so center explorer in upper half
        screenFocalY = height * 0.36;
      }

      // World coordinate of explorer
      const targetCamX = posRef.current.c * tileSize + tileSize / 2;
      const targetCamY = posRef.current.r * tileSize + tileSize / 2;

      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

      // Center camera on screenFocalX, screenFocalY
      ctx.translate(screenFocalX - cameraRef.current.x, screenFocalY - cameraRef.current.y);

      // --- 1. Draw Menu Ground & Flagstones ---
      drawGroundAndCorridors(ctx, tileSize, time);

      // --- 2. Draw Chambers & Mosaic Plinths ---
      drawChamberPlazas(ctx, tileSize, time);

      // --- 3. Draw 3D Carved Stone Maze Walls ---
      drawCarvedMazeWalls(ctx, tileSize, time);

      // --- 4. Draw Environmental Props (Campfire, Lanterns, Fountain, Portal) ---
      drawMenuProps(ctx, tileSize, time);

      // --- 5. Draw Friendly Explorer Character ---
      drawExplorer(
        ctx,
        posRef.current.r,
        posRef.current.c,
        posRef.current.dir,
        tileSize,
        time,
        !!activePathRef.current
      );

      // --- 6. Draw Ambient Golden Sun Motes ---
      drawSunMotes(ctx, cameraRef.current.x, cameraRef.current.y, time);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [onTravelComplete]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-amber-50">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

/**
 * Draws the ground terrain, textured warm flagstones, and paved corridor roads
 */
function drawGroundAndCorridors(ctx: CanvasRenderingContext2D, tileSize: number, time: number) {
  // Base warm ambient bedrock
  ctx.fillStyle = '#FEF9F0'; // Warm ivory cream
  ctx.fillRect(-tileSize * 3, -tileSize * 3, tileSize * 24, tileSize * 20);

  // Paved corridor stone tiles
  for (let r = 0; r < MENU_MAZE_DIMS.rows; r++) {
    for (let c = 0; c < MENU_MAZE_DIMS.cols; c++) {
      const cellType = MENU_WALL_MAP[r]?.[c] ?? 1;
      const x = c * tileSize;
      const y = r * tileSize;

      if (cellType === 0) {
        // Open passage or courtyard
        const hash = (r * 19 + c * 37) % 4;
        if (hash === 0) ctx.fillStyle = '#FFFDF7';
        else if (hash === 1) ctx.fillStyle = '#FDF6E8';
        else if (hash === 2) ctx.fillStyle = '#FBF1DD';
        else ctx.fillStyle = '#FEF4E2';

        ctx.fillRect(x, y, tileSize, tileSize);

        // Stone joint hairline
        ctx.strokeStyle = 'rgba(235, 218, 192, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Subtle stone pebble / chisel mark
        if ((r + c * 3) % 5 === 0) {
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.35, y + tileSize * 0.4, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(217, 190, 150, 0.5)';
          ctx.fill();
        }
      }
    }
  }

  // Draw golden stone corridor pathways connecting the waypoints
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.7)'; // Warm sunny gold
  ctx.lineWidth = tileSize * 0.52;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  Object.values(MENU_WAYPOINTS).forEach((points) => {
    ctx.beginPath();
    points.forEach((p, idx) => {
      const px = p.c * tileSize + tileSize / 2;
      const py = p.r * tileSize + tileSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  // Inner warm pathway stone strip
  ctx.strokeStyle = '#FEF3C7';
  ctx.lineWidth = tileSize * 0.34;
  Object.values(MENU_WAYPOINTS).forEach((points) => {
    ctx.beginPath();
    points.forEach((p, idx) => {
      const px = p.c * tileSize + tileSize / 2;
      const py = p.r * tileSize + tileSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  // Stepping stones dotted track
  ctx.strokeStyle = 'rgba(217, 160, 90, 0.38)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 6]);
  Object.values(MENU_WAYPOINTS).forEach((points) => {
    ctx.beginPath();
    points.forEach((p, idx) => {
      const px = p.c * tileSize + tileSize / 2;
      const py = p.r * tileSize + tileSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

/**
 * Draws distinctive paved plazas for the 5 chambers
 */
function drawChamberPlazas(ctx: CanvasRenderingContext2D, tileSize: number, time: number) {
  MENU_CHAMBERS.forEach((chamber) => {
    const cx = chamber.center.c * tileSize + tileSize / 2;
    const cy = chamber.center.r * tileSize + tileSize / 2;
    const radius = tileSize * 0.96;

    // Ambient Chamber Shadow
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(217, 160, 90, 0.16)';
    ctx.fill();

    // Chamber Stone Base Plinth
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFBEB'; // Sunny ivory
    ctx.fill();
    ctx.strokeStyle = '#FCD34D'; // Sunny gold rim
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Mosaic Circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Chamber-specific floor emblems
    if (chamber.index === 0) {
      // Hearth ring of stones
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = '#FDE68A';
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else if (chamber.index === 1) {
      // Realm 4-way compass rose
      const rays = 8;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI * 2) / rays;
        const len = i % 2 === 0 ? radius * 0.52 : radius * 0.32;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    } else if (chamber.index === 2) {
      // Concentric rings (The Crucible)
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (chamber.index === 3) {
      // Chamber of Variants turquoise water ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = '#CCFBF1';
      ctx.fill();
      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else if (chamber.index === 4) {
      // The Sun Portal revolving sun runes
      const rays = 12;
      const rot = time * 0.0012;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < rays; i++) {
        const angle = rot + (i * Math.PI * 2) / rays;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * (radius * 0.2), cy + Math.sin(angle) * (radius * 0.2));
        ctx.lineTo(cx + Math.cos(angle) * (radius * 0.52), cy + Math.sin(angle) * (radius * 0.52));
        ctx.stroke();
      }
    }
  });
}

/**
 * Draws 3D Carved Stone Maze Walls with warm terracotta rims,
 * depth shadows, and moss/ivy detailing to make the maze physically real.
 */
function drawCarvedMazeWalls(ctx: CanvasRenderingContext2D, tileSize: number, time: number) {
  const wallTopColor = '#E6C29C'; // Warm stone face
  const wallSideColor = '#BC6C25'; // Terracotta stone shadow side
  const wallBevelColor = '#FFF1DA'; // Sunlit bevel rim

  // Render solid stone wall blocks
  for (let r = 0; r < MENU_MAZE_DIMS.rows; r++) {
    for (let c = 0; c < MENU_MAZE_DIMS.cols; c++) {
      if (MENU_WALL_MAP[r][c] === 1) {
        const x = c * tileSize;
        const y = r * tileSize;

        // Ambient ground shadow under wall
        ctx.fillStyle = 'rgba(120, 80, 40, 0.25)';
        ctx.fillRect(x + 2, y + 4, tileSize, tileSize);

        // 3D Stone Wall Side / Depth (bottom extrusion)
        ctx.fillStyle = wallSideColor;
        ctx.fillRect(x, y + 5, tileSize, tileSize - 5);

        // 3D Stone Wall Top Face
        ctx.fillStyle = wallTopColor;
        ctx.fillRect(x, y, tileSize, tileSize - 5);

        // Sunlit Bevel Top Rim
        ctx.fillStyle = wallBevelColor;
        ctx.fillRect(x, y, tileSize, 2.5);

        // Vertical Chisel Line / Stone Block Joints
        ctx.fillStyle = 'rgba(160, 90, 40, 0.35)';
        ctx.fillRect(x + tileSize * 0.5, y, 1.2, tileSize - 5);

        // Climbing ivy / moss detail on select wall blocks
        if ((r * 7 + c * 11) % 6 === 0) {
          ctx.fillStyle = '#86EFAC'; // Soft green moss
          ctx.beginPath();
          ctx.arc(x + 4, y + tileSize - 8, 3.5, 0, Math.PI * 2);
          ctx.arc(x + 8, y + tileSize - 6, 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Tiny coral flower petal
          if ((r + c) % 3 === 0) {
            ctx.fillStyle = '#FB7185';
            ctx.beginPath();
            ctx.arc(x + 6, y + tileSize - 9, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }
}

/**
 * Draws charming props: campfire, glowing warm lanterns, fountain, archway
 */
function drawMenuProps(ctx: CanvasRenderingContext2D, tileSize: number, time: number) {
  MENU_PROPS.forEach((prop) => {
    const px = prop.c * tileSize + tileSize / 2;
    const py = prop.r * tileSize + tileSize / 2;

    if (prop.type === 'campfire') {
      // Hearth cozy campfire
      const flicker = Math.sin(time * 0.01) * 2;

      // Warm fire glow
      const glow = ctx.createRadialGradient(px, py, 2, px, py, tileSize * 0.7 + flicker);
      glow.addColorStop(0, 'rgba(251, 146, 60, 0.6)');
      glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.beginPath();
      ctx.arc(px, py, tileSize * 0.7 + flicker, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Stone ring
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Wooden logs
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(px - 7, py + 4);
      ctx.lineTo(px + 7, py - 4);
      ctx.moveTo(px - 7, py - 4);
      ctx.lineTo(px + 7, py + 4);
      ctx.stroke();

      // Dancing Flame
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(px, py - 3, 5 + flicker, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(px, py - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'lantern') {
      // Warm glowing light halo
      const flicker = Math.sin(time * 0.005 + prop.r * 3 + prop.c) * 4;
      const grad = ctx.createRadialGradient(px, py - 4, 2, px, py - 4, tileSize * 0.72 + flicker);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.28)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

      ctx.beginPath();
      ctx.arc(px, py - 4, tileSize * 0.72 + flicker, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Stone Pedestal post
      ctx.fillStyle = '#D6D3D1';
      ctx.fillRect(px - 2.5, py - 2, 5, tileSize * 0.32);

      // Brass lantern frame
      ctx.fillStyle = '#B45309';
      ctx.fillRect(px - 6, py - 13, 12, 11);

      // Glowing flame inside
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(px, py - 7.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'plant') {
      // Terracotta Pot
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.roundRect(px - 8, py + 2, 16, 11, [2, 2, 5, 5]);
      ctx.fill();

      // Soft Green Bush Foliage
      ctx.fillStyle = '#86EFAC';
      ctx.beginPath();
      ctx.arc(px, py - 3, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.arc(px - 3, py - 4, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Tiny peach/coral flower blossom
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(px + 3, py - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'fountain') {
      // Turquoise pool basin
      ctx.fillStyle = '#99F6E4';
      ctx.beginPath();
      ctx.arc(px, py, tileSize * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gentle ripple rings
      const ripple = (time * 0.002) % 1;
      ctx.beginPath();
      ctx.arc(px, py, ripple * tileSize * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(13, 148, 136, ${1 - ripple})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Center stone water spout
      ctx.fillStyle = '#0D9488';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'arch') {
      // Majestic Golden Sun Portal
      const pulse = Math.sin(time * 0.004) * 4;
      const portalGrad = ctx.createRadialGradient(px, py, 4, px, py, tileSize * 0.85 + pulse);
      portalGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      portalGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
      portalGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.beginPath();
      ctx.arc(px, py, tileSize * 0.85 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = portalGrad;
      ctx.fill();

      // Stone Pillars on both sides
      ctx.fillStyle = '#F59E0B'; // Sunny Gold
      ctx.fillRect(px - tileSize * 0.48, py - tileSize * 0.42, 9, tileSize * 0.84);
      ctx.fillRect(px + tileSize * 0.48 - 9, py - tileSize * 0.42, 9, tileSize * 0.84);

      // Keystone Arch
      ctx.beginPath();
      ctx.arc(px, py - tileSize * 0.36, tileSize * 0.48, Math.PI, 0, false);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 7;
      ctx.stroke();
    }
  });
}

/**
 * Draws the friendly explorer character
 */
function drawExplorer(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  direction: 'up' | 'down' | 'left' | 'right',
  tileSize: number,
  time: number,
  isMoving: boolean
) {
  const x = c * tileSize + tileSize / 2;
  const y = r * tileSize + tileSize / 2;

  // Walking bob cycle
  const bob = isMoving ? Math.sin(time * 0.016) * 3 : Math.sin(time * 0.0035) * 1.5;
  const walkSwing = isMoving ? Math.cos(time * 0.016) * 4.5 : 0;

  // Friendly soft shadow underneath
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120, 80, 40, 0.22)';
  ctx.fill();

  ctx.save();
  ctx.translate(x, y + bob);

  // Body / Tunic (Adventure warm terracotta orange)
  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.roundRect(-7.5, -4.5, 15, 13.5, [4, 4, 3, 3]);
  ctx.fill();

  // Explorer's backpack
  ctx.fillStyle = '#9A3412';
  if (direction === 'up') {
    ctx.fillRect(-6, -6, 12, 10);
  } else if (direction === 'left') {
    ctx.fillRect(4.5, -4, 6, 9);
  } else if (direction === 'right') {
    ctx.fillRect(-10.5, -4, 6, 9);
  }

  // Cute explorer legs with walk swing
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(-4, 9);
  ctx.lineTo(-4 + (direction === 'left' || direction === 'right' ? walkSwing : 0), 14);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4, 9);
  ctx.lineTo(4 - (direction === 'left' || direction === 'right' ? walkSwing : 0), 14);
  ctx.stroke();

  // Explorer's head
  ctx.fillStyle = '#FED7AA'; // Warm peach skin tone
  ctx.beginPath();
  ctx.arc(0, -9, 8, 0, Math.PI * 2);
  ctx.fill();

  // Explorer's wide-brim sunny straw hat
  ctx.fillStyle = '#FBBF24'; // Sunny gold straw
  ctx.beginPath();
  ctx.ellipse(0, -13, 14.5, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hat crown
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(0, -15, 6.2, Math.PI, 0, false);
  ctx.fill();

  // Coral hat ribbon band
  ctx.strokeStyle = '#FB7185';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -13, 6.2, 0.2, Math.PI - 0.2, false);
  ctx.stroke();

  // Small feather in hat
  ctx.strokeStyle = '#2DD4BF'; // Turquoise feather
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, -14);
  ctx.lineTo(9.5, -22);
  ctx.stroke();

  // Cute eyes looking in direction
  if (direction !== 'up') {
    ctx.fillStyle = '#451A03';
    let eyeOffsetX = 0;
    if (direction === 'left') eyeOffsetX = -2.2;
    if (direction === 'right') eyeOffsetX = 2.2;

    ctx.beginPath();
    ctx.arc(-2.5 + eyeOffsetX, -9, 1.3, 0, Math.PI * 2);
    ctx.arc(2.5 + eyeOffsetX, -9, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Rosy adventurer cheeks
    ctx.fillStyle = 'rgba(251, 113, 133, 0.65)';
    ctx.beginPath();
    ctx.arc(-4 + eyeOffsetX, -7, 1.6, 0, Math.PI * 2);
    ctx.arc(4 + eyeOffsetX, -7, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small handheld adventurer lantern
  const lanternAngle = direction === 'left' ? -0.5 : 0.5;
  const lx = Math.sin(lanternAngle) * 11.5;
  const ly = 2;
  ctx.fillStyle = '#D97706';
  ctx.fillRect(lx - 2.5, ly, 5, 6.5);
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(lx, ly + 3, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Ambient golden sun motes drifting lazily through the sunny labyrinth
 */
function drawSunMotes(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  time: number
) {
  ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
  const motes = [
    { x: camX - 120, y: camY - 80, s: 1.5, offset: 0 },
    { x: camX + 90, y: camY - 140, s: 2.0, offset: 1.2 },
    { x: camX - 60, y: camY + 110, s: 1.8, offset: 2.5 },
    { x: camX + 130, y: camY + 70, s: 1.4, offset: 3.8 },
    { x: camX - 180, y: camY + 40, s: 2.2, offset: 4.6 },
  ];

  motes.forEach((m) => {
    const floatY = Math.sin(time * 0.0015 + m.offset) * 14;
    const floatX = Math.cos(time * 0.0012 + m.offset) * 10;
    ctx.beginPath();
    ctx.arc(m.x + floatX, m.y + floatY, m.s, 0, Math.PI * 2);
    ctx.fill();
  });
}
