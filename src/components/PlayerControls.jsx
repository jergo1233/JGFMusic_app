import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Square, Volume2 } from 'lucide-react';

const PlayerControls = ({ 
  isPlaying, 
  onPlayPause,
  onStop,
  onNext, 
  onPrev, 
  repeatMode, 
  onToggleRepeat, 
  shuffleMode, 
  onToggleShuffle 
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full select-none">
      {/* Primary 5-Button Symmetrical Playback Row */}
      <div className="flex items-center justify-between w-full max-w-sm mx-auto px-1 sm:px-3">
        {/* 1. Shuffle Mode Button */}
        <button 
          type="button"
          id="player-shuffle-btn"
          onClick={onToggleShuffle} 
          className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center max-border rounded-2xl transition-all cursor-pointer ${
            shuffleMode 
              ? 'bg-amber-400 text-slate-950 shadow-[3px_3px_0_0_#000] scale-105' 
              : 'bg-indigo-50 text-indigo-950 dark:bg-slate-900 dark:text-indigo-50 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]'
          } hover:translate-y-0.5 hover:translate-x-0.5 active:scale-95`}
          title={shuffleMode ? "Shuffle: ON (Random order)" : "Shuffle: OFF (Normal order)"}
        >
          <Shuffle size={20} className={shuffleMode ? "stroke-[3]" : "stroke-[2.5]"} />
        </button>
        
        {/* 2. Previous Song Button */}
        <button 
          type="button"
          id="player-prev-btn"
          onClick={onPrev} 
          className="w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50 max-border rounded-2xl shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-0.5 hover:translate-y-0.5 active:scale-90 transition-all cursor-pointer"
          title="Previous Song (Nakaraang kanta)"
        >
          <SkipBack size={26} className="stroke-[3]" />
        </button>

        {/* 3. Hero Center Play / Pause Button */}
        <button 
          type="button"
          id="player-play-pause-btn"
          onClick={onPlayPause} 
          className={`w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center rounded-full max-border shadow-[5px_5px_0_0_#000] dark:shadow-[5px_5px_0_0_#fff] hover:translate-x-0.5 hover:translate-y-0.5 active:scale-90 transition-all cursor-pointer ${
            isPlaying 
              ? 'bg-amber-400 text-slate-950' 
              : 'bg-indigo-600 dark:bg-indigo-50 text-white dark:text-indigo-950'
          }`} 
          title={isPlaying ? "Pause Song" : "Play Song"}
        >
          {isPlaying ? (
            <Pause size={34} fill="currentColor" />
          ) : (
            <Play size={34} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* 4. Next Song Button */}
        <button 
          type="button"
          id="player-next-btn"
          onClick={onNext} 
          className="w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50 max-border rounded-2xl shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-0.5 hover:translate-y-0.5 active:scale-90 transition-all cursor-pointer"
          title="Next Song (Susunod na kanta)"
        >
          <SkipForward size={26} className="stroke-[3]" />
        </button>

        {/* 5. Repeat Mode Button */}
        <button 
          type="button"
          id="player-repeat-btn"
          onClick={onToggleRepeat} 
          className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center max-border rounded-2xl transition-all cursor-pointer ${
            repeatMode !== 'off' 
              ? 'bg-amber-400 text-slate-950 shadow-[3px_3px_0_0_#000] scale-105' 
              : 'bg-indigo-50 text-indigo-950 dark:bg-slate-900 dark:text-indigo-50 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]'
          } hover:translate-y-0.5 hover:translate-x-0.5 active:scale-95`}
          title={`Repeat: ${repeatMode === 'song' ? 'Loop Song' : repeatMode === 'all' ? 'Loop Queue' : 'OFF'}`}
        >
          {repeatMode === 'song' ? (
            <Repeat1 size={20} className="stroke-[3]" />
          ) : (
            <Repeat size={20} className={repeatMode === 'all' ? "stroke-[3]" : "stroke-[2.5]"} />
          )}
        </button>
      </div>

      {/* Auxiliary Status & Secondary Action Row */}
      <div className="flex items-center justify-between w-full max-w-sm mx-auto px-2 pt-3 mt-1 border-t border-indigo-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-950 dark:text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Auto-Play: Next</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200">
            {repeatMode === 'song' ? '🔂 Repeat 1' : repeatMode === 'all' ? '🔁 Repeat All' : shuffleMode ? '🔀 Shuffled' : '▶ Continuous'}
          </span>
          {onStop && (
            <button 
              type="button"
              id="player-stop-btn"
              onClick={onStop} 
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white border border-red-500/30 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 cursor-pointer"
              title="Stop playback and exit"
            >
              <Square size={10} fill="currentColor" />
              <span>STOP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
