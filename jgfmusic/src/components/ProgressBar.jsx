import React, { useState, useEffect } from 'react';
import { formatTime } from '../utils/format';
import { Clock } from 'lucide-react';

const ProgressBar = ({ currentTime, duration, onSeek }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const safeDuration = duration || 0;
  const safeCurrent = isDragging ? dragValue : (currentTime || 0);
  const remainingTime = Math.max(0, safeDuration - safeCurrent);
  const progressPercent = safeDuration > 0 ? Math.min(100, (safeCurrent / safeDuration) * 100) : 0;

  const handleSeekChange = (e) => {
    const value = parseFloat(e.target.value);
    setDragValue(value);
    if (!isDragging) {
      onSeek(value);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    setDragValue(currentTime || 0);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(dragValue);
    }
  };

  const handleTouchStart = () => {
    setIsDragging(true);
    setDragValue(currentTime || 0);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(dragValue);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-2.5 select-none">
      {/* Live duration indicators header */}
      <div className="flex items-center justify-between text-xs font-mono font-black uppercase tracking-wider text-white">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/30 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-sm font-black">{formatTime(safeCurrent)}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/30 text-white shadow-sm">
          <Clock size={13} className="text-amber-400 stroke-[3]" />
          <span className="text-xs font-black text-amber-300 tracking-normal">TOTAL: {formatTime(safeDuration)}</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-white/30 text-white text-xs font-black shadow-sm">
          <span>-{formatTime(remainingTime)}</span>
        </div>
      </div>

      {/* Progress Slider Bar with Click & Drag Track */}
      <div className="relative flex items-center py-1">
        <input
          id="song-progress-slider"
          type="range"
          min="0"
          max={safeDuration || 100}
          step="0.1"
          value={safeCurrent}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onChange={handleSeekChange}
          className="w-full h-4 bg-indigo-950/90 dark:bg-gray-900 rounded-full max-border appearance-none cursor-pointer accent-amber-400 z-10 hover:brightness-110 active:scale-[1.01] transition-transform"
          title="Drag or click to seek in song"
        />
      </div>

      {/* Progress percentage footer */}
      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-white px-1">
        <span className="font-mono drop-shadow">00:00</span>
        <span className="font-mono text-amber-300 font-black drop-shadow">
          {Math.round(progressPercent)}% {isDragging ? 'SEEKING...' : 'COMPLETED'}
        </span>
        <span className="font-mono drop-shadow">{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
