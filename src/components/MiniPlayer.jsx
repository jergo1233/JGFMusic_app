import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, X, Clock, SkipBack, SkipForward } from 'lucide-react';
import { Link } from 'react-router-dom';
import BeatAnimation from './BeatAnimation';
import CdDisc from './CdDisc';
import { formatTime } from '../utils/format';

const MiniPlayer = () => {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    closePlayer, 
    currentTime, 
    duration, 
    handleNext, 
    handlePrevious,
    seek
  } = usePlayer();

  if (!currentSong) return null;

  const totalDuration = duration || currentSong.duration || 0;
  const progressPercent = totalDuration > 0 ? Math.min(100, ((currentTime || 0) / totalDuration) * 100) : 0;

  const handleProgressBarClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    if (width > 0 && totalDuration > 0) {
      const newTime = (clickX / width) * totalDuration;
      seek(newTime);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-18 left-0 right-0 bg-indigo-50/95 dark:bg-slate-900/95 backdrop-blur-2xl max-border border-b-0 rounded-t-2xl sm:rounded-t-3xl max-shadow z-30 select-none transition-all">
      {/* Interactive Top Progress Bar with smooth gradient & click-to-seek */}
      <div 
        onClick={handleProgressBarClick}
        className="w-full bg-indigo-200/70 dark:bg-slate-800 h-1.5 sm:h-2 cursor-pointer relative group overflow-hidden"
        title="Click to seek track"
      >
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-300 rounded-full border border-black shadow opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      {/* Main MiniPlayer Row: Song Info on Left, Fixed Action Buttons on Right */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-15 sm:h-17 max-w-2xl mx-auto gap-2">
        {/* Left: Link to full Now Playing screen */}
        <Link 
          to="/now-playing" 
          className="flex items-center min-w-0 flex-1 overflow-hidden py-1 group cursor-pointer"
          title="Open Now Playing"
        >
          {/* Song Album Art / CD Disc */}
          <div className={`w-11 h-11 sm:w-12 sm:h-12 bg-slate-900 max-border rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden transition-all shadow-sm ${isPlaying ? 'playing-thumb-beat border-purple-400' : ''}`}>
            {currentSong.artworkUri ? (
              <img src={currentSong.artworkUri} alt={currentSong.title} className="w-full h-full object-cover" />
            ) : (
              <CdDisc isPlaying={isPlaying} compact={true} className="w-full h-full scale-105" />
            )}
          </div>

          {/* Title & Artist & Time info */}
          <div className="ml-2.5 sm:ml-3 flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm sm:text-base font-black uppercase text-indigo-950 dark:text-indigo-50 truncate tracking-tight group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">
                {currentSong.title}
              </p>
              {isPlaying && (
                <div className="flex-shrink-0 scale-75">
                  <BeatAnimation isPlaying={true} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              <span className="truncate max-w-[100px] sm:max-w-[160px] uppercase">
                {currentSong.artist}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black">•</span>
              <span className="font-mono text-[10px] sm:text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-0.5 flex-shrink-0">
                <Clock size={11} className="stroke-[2.5]" />
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>
          </div>
        </Link>

        {/* Right: Dedicated Playback Buttons (Previous, Play/Pause, Next, Close) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Previous Song Button */}
          <button
            type="button"
            id="mini-prev-btn"
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault();
              handlePrevious(); 
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-indigo-100/90 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50 hover:bg-indigo-200 dark:hover:bg-slate-700 active:scale-90 transition-all border border-indigo-900/15 dark:border-indigo-200/15 shadow-sm cursor-pointer"
            title="Previous track"
          >
            <SkipBack size={18} className="stroke-[2.8]" />
          </button>

          {/* Center Play / Pause Button */}
          <button 
            type="button"
            id="mini-play-pause-btn"
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault();
              togglePlay(); 
            }}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full max-border shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff] hover:translate-x-0.5 hover:translate-y-0.5 active:scale-90 transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-indigo-600 dark:bg-indigo-50 text-white dark:text-indigo-950'
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Next Song Button */}
          <button
            type="button"
            id="mini-next-btn"
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault();
              handleNext(); 
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-indigo-100/90 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50 hover:bg-indigo-200 dark:hover:bg-slate-700 active:scale-90 transition-all border border-indigo-900/15 dark:border-indigo-200/15 shadow-sm cursor-pointer"
            title="Next track"
          >
            <SkipForward size={18} className="stroke-[2.8]" />
          </button>

          {/* Close Button */}
          <button 
            type="button"
            id="mini-close-btn"
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault();
              closePlayer(); 
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors active:scale-90 cursor-pointer ml-0.5"
            title="Close player"
          >
            <X size={17} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;

/* JGFMusic v1.0.2 */
