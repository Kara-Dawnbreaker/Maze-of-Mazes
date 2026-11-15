import React, { useEffect, useRef, useState } from 'react';
import { Map, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import { MazeGrid } from '../types/maze';

interface MiniMapProps {
  maze: MazeGrid;
  playerPos: { r: number; c: number };
  exploredCells: Set<string>;
}

export const MiniMap: React.FC<MiniMapProps> = ({ maze, playerPos, exploredCells }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [exploredOnly, setExploredOnly] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 240;
    const height = 240;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(0, 0, width, height);

    const padding = 12;
    const fit = Math.min((width - padding * 2) / maze.cols, (height - padding * 2) / maze.rows);
    const cellSize = Math.max(1, fit * zoom);
    const offsetX = width / 2 - (playerPos.c + 0.5) * cellSize;
    const offsetY = height / 2 - (playerPos.r + 0.5) * cellSize;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let r = 0; r < maze.rows; r++) {
      for (let c = 0; c < maze.cols; c++) {
        const key = `${r},${c}`;
        const explored = !exploredOnly || exploredCells.has(key);
        if (!explored) continue;

        const x = c * cellSize;
        const y = r * cellSize;
        ctx.fillStyle = r === maze.exit.r && c === maze.exit.c
          ? '#fbbf24'
          : '#64748b';
        ctx.fillRect(x, y, Math.max(1, cellSize), Math.max(1, cellSize));

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = Math.max(0.7, cellSize * 0.1);
        const walls = maze.cells[r][c].walls;
        ctx.beginPath();
        if (walls.top) { ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); }
        if (walls.right) { ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); }
        if (walls.bottom) { ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); }
        if (walls.left) { ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); }
        ctx.stroke();
      }
    }

    const playerX = (playerPos.c + 0.5) * cellSize;
    const playerY = (playerPos.r + 0.5) * cellSize;
    ctx.beginPath();
    ctx.arc(playerX, playerY, Math.max(2.5, Math.min(6, cellSize * 0.34)), 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }, [maze, playerPos, exploredCells, zoom, exploredOnly]);

  return (
    <div className="absolute right-4 bottom-4 z-30 w-[min(260px,72vw)] rounded-2xl border border-slate-600/80 bg-slate-950/95 p-2 text-slate-100 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          onClick={() => setIsOpen((value) => !value)}
          className="flex items-center gap-2 text-xs font-bold tracking-wide"
          title={isOpen ? 'Collapse minimap' : 'Open minimap'}
        >
          <Map className="h-4 w-4 text-emerald-400" />
          <span>MINIMAP</span>
          <span className="text-[10px] text-slate-400">{exploredCells.size} explored</span>
        </button>
        {isOpen && (
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.2).toFixed(1))))} className="rounded-lg p-1.5 hover:bg-slate-800" title="Zoom out"><Minus className="h-3.5 w-3.5" /></button>
            <button onClick={() => setZoom((value) => Math.min(3, Number((value + 0.2).toFixed(1))))} className="rounded-lg p-1.5 hover:bg-slate-800" title="Zoom in"><Plus className="h-3.5 w-3.5" /></button>
            <button onClick={() => setExploredOnly((value) => !value)} className="rounded-lg p-1.5 hover:bg-slate-800" title={exploredOnly ? 'Reveal full maze' : 'Hide unexplored areas'}>
              {exploredOnly ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
      {isOpen && (
        <>
          <canvas ref={canvasRef} className="mx-auto block h-60 w-full rounded-xl" style={{ imageRendering: 'pixelated' }} />
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span><span className="text-emerald-400">●</span> You</span>
            <span><span className="text-amber-400">■</span> Exit</span>
            <span>{Math.round(zoom * 100)}% zoom</span>
          </div>
        </>
      )}
    </div>
  );
};
