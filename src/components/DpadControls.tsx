/**
 * DpadControls - Touch and Mouse D-pad for mobile and casual navigation
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Direction } from '../types/maze';

interface DpadControlsProps {
  onMove: (dir: Direction) => void;
}

export const DpadControls: React.FC<DpadControlsProps> = ({ onMove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-center pointer-events-auto select-none sm:opacity-85 hover:opacity-100 transition-opacity">
      {/* Up Button */}
      <button
        onClick={() => onMove('up')}
        className="w-13 h-13 bg-amber-100/90 active:bg-amber-300 border-2 border-amber-300 text-amber-900 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all touch-manipulation mb-1.5"
        aria-label="Move Up"
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      {/* Left / Center / Right row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onMove('left')}
          className="w-13 h-13 bg-amber-100/90 active:bg-amber-300 border-2 border-amber-300 text-amber-900 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all touch-manipulation"
          aria-label="Move Left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-amber-200/50 flex items-center justify-center border border-amber-300/50 text-[10px] font-bold text-amber-800">
          WASD
        </div>

        <button
          onClick={() => onMove('right')}
          className="w-13 h-13 bg-amber-100/90 active:bg-amber-300 border-2 border-amber-300 text-amber-900 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all touch-manipulation"
          aria-label="Move Right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Down Button */}
      <button
        onClick={() => onMove('down')}
        className="w-13 h-13 bg-amber-100/90 active:bg-amber-300 border-2 border-amber-300 text-amber-900 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all touch-manipulation mt-1.5"
        aria-label="Move Down"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </div>
  );
};
