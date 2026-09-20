import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { MoreVertical, Play, Pause, Edit2, Trash2, Share, PlusCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { formatTime, formatBytes } from '../utils/format';
import { usePlayer } from '../context/PlayerContext';
import BeatAnimation from './BeatAnimation';
import CdDisc from './CdDisc';

const SongItem = ({ 
  song, 
  isPlaying, 
  isCurrent, 
  onClick, 
  onPlayPause, 
  onRename, 
  onDelete, 
  onExport, 
  onAddToPlaylist, 
  onSchedule,
  onCustomCover,
  isMenuOpen = false,
  onToggleMenu
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState('bottom');
  const menuBtnRef = useRef(null);
  const { currentTime, duration: activeDuration } = usePlayer();

  const isMenuVisible = onToggleMenu ? isMenuOpen : internalMenuOpen;

  const calculatePlacement = useCallback(() => {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      // BottomNav (~70px) + MiniPlayer (~70px) occupy bottom area (~140px).
      // Dropdown menu is ~280px tall. If space below is less than 310px and space above has room, flip upward!
      if (spaceBelow < 310 && spaceAbove > 220) {
        setMenuPlacement('top');
      } else {
        setMenuPlacement('bottom');
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (isMenuVisible) {
      calculatePlacement();
    }
  }, [isMenuVisible, calculatePlacement]);

  useEffect(() => {
    if (!isMenuVisible) return;
    const handleScrollOrResize = () => {
      calculatePlacement();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isMenuVisible, calculatePlacement]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    calculatePlacement();
    if (onToggleMenu) {
      onToggleMenu(song.id);
    } else {
      setInternalMenuOpen(prev => !prev);
    }
  };

  const closeMenu = () => {
    if (onToggleMenu) {
      onToggleMenu(null);
    } else {
      setInternalMenuOpen(false);
    }
  };

  const executeAction = (action, e) => {
    e.stopPropagation();
    e.preventDefault();
    closeMenu();
    if (action) action(song);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    closeMenu();
    if (onPlayPause) {
      onPlayPause(song);
    } else {
      onClick(song);
    }
  };

  const handleCardClick = () => {
    closeMenu();
    onClick(song);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`relative flex items-center p-3.5 sm:p-4 cursor-pointer max-border rounded-2xl max-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all ${
        isMenuVisible ? 'z-40' : 'z-0'
      } ${
        isCurrent && isPlaying 
          ? 'playing-box-beat bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950' 
          : isCurrent 
          ? 'bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950' 
          : 'bg-indigo-50 text-indigo-950 dark:bg-slate-800 dark:text-indigo-50'
      }`}
    >
      {/* Thumbnail with interactive Play/Pause and Cover button */}
      <div 
        onClick={handleToggle}
        className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 max-border rounded-xl flex items-center justify-center overflow-hidden relative transition-all group ${
          isCurrent && isPlaying 
            ? 'playing-thumb-beat border-purple-400' 
            : isCurrent 
            ? 'border-indigo-50 dark:border-indigo-900' 
            : 'border-indigo-900 dark:border-indigo-300'
        }`}
        title="Tap to play/pause"
      >
        {song.artworkUri ? (
          <img src={song.artworkUri} alt="Artwork" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full p-0.5 flex items-center justify-center bg-slate-900/40">
            <CdDisc 
              isPlaying={isCurrent && isPlaying} 
              compact={true} 
              className="w-full h-full scale-105" 
            />
          </div>
        )}
        
        {/* Play/Pause Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isCurrent && isPlaying ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
              <Pause size={16} fill="currentColor" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow">
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </div>
          )}
        </div>
      </div>
      
      <div className="ml-3 sm:ml-4 flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <h4 className={`text-lg sm:text-xl font-black uppercase truncate tracking-tight ${isCurrent ? 'text-white dark:text-indigo-950 drop-shadow-[2px_2px_0_#c7d2fe]' : 'drop-shadow-[2px_2px_0_#c7d2fe] dark:drop-shadow-[2px_2px_0_#312e81]'}`}>
            {song.title}
          </h4>
          {isCurrent && isPlaying && (
            <div className="flex-shrink-0 scale-90">
              <BeatAnimation isPlaying={true} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className={`text-sm sm:text-base font-extrabold uppercase truncate max-w-[120px] sm:max-w-[200px] ${
            isCurrent ? 'text-indigo-100 dark:text-indigo-900' : 'text-slate-800 dark:text-slate-200'
          }`}>
            {song.artist}
          </p>
          <span className="text-slate-500 dark:text-slate-400 font-black text-xs">•</span>
          {isCurrent ? (
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1 flex-shrink-0">
              <Clock size={11} className="stroke-[2.5]" />
              {formatTime(currentTime)} / {formatTime(song.duration || activeDuration)}
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 flex-shrink-0">
              {formatTime(song.duration)}
            </span>
          )}

          {song.fileSize ? (
            <>
              <span className="text-slate-500 dark:text-slate-400 font-black text-xs">•</span>
              <span className={`text-[11px] font-mono font-black uppercase flex-shrink-0 ${
                isCurrent ? 'text-indigo-100 dark:text-indigo-900' : 'text-indigo-700 dark:text-indigo-300'
              }`}>
                {formatBytes(song.fileSize)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Quick Custom Cover Icon button */}
      <button
        type="button"
        onClick={(e) => executeAction(onCustomCover, e)}
        className={`p-2 rounded-xl transition-all mr-1 ${
          isCurrent 
            ? 'text-white hover:text-amber-300 dark:text-indigo-950 dark:hover:text-indigo-800' 
            : 'text-indigo-950 hover:text-indigo-700 dark:text-indigo-100 dark:hover:text-amber-300'
        } hover:scale-110 active:scale-95 cursor-pointer`}
        title="Custom Music Cover (Palitan ang cover)"
      >
        <ImageIcon size={22} className="stroke-[2.5]" />
      </button>

      {/* Dedicated Play / Pause Button */}
      <button 
        type="button"
        onClick={handleToggle}
        className={`w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 max-border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          isCurrent && isPlaying 
            ? 'bg-amber-400 text-slate-950 shadow-[2px_2px_0_#000] scale-105' 
            : isCurrent 
            ? 'bg-emerald-400 text-slate-950 shadow-[2px_2px_0_#000]' 
            : 'bg-indigo-600 dark:bg-indigo-50 text-white dark:text-indigo-950 shadow-[2px_2px_0_#000]'
        } hover:scale-110 active:scale-95`}
        title={isCurrent && isPlaying ? "Pause" : "Play"}
      >
        {isCurrent && isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* More Options Dropdown (Single click toggle, no multiple open menus) */}
      <button 
        type="button"
        ref={menuBtnRef}
        id={`song-menu-btn-${song.id}`}
        onClick={handleMenuClick} 
        className={`p-2 ml-1 cursor-pointer transition-all rounded-lg active:scale-95 ${
          isMenuVisible 
            ? 'bg-amber-400 text-slate-950 shadow-sm scale-105' 
            : isCurrent 
            ? 'text-white dark:text-indigo-950 hover:bg-white/20' 
            : 'text-indigo-950 dark:text-indigo-50 hover:bg-black/10 dark:hover:bg-white/10'
        }`}
        title="Options (Single tap)"
      >
        <MoreVertical size={24} className="stroke-[3]" />
      </button>

      {/* Single Dropdown Menu with Smart Upward / Downward Placement */}
      {isMenuVisible && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-3 ${
            menuPlacement === 'top' 
              ? 'bottom-14 origin-bottom-right' 
              : 'top-14 origin-top-right'
          } w-56 max-w-[calc(100vw-2rem)] bg-indigo-50 dark:bg-slate-900 max-border rounded-2xl max-shadow z-50 flex flex-col p-1.5 overflow-y-auto max-h-[min(380px,calc(100vh-160px))] shadow-2xl animate-fade-in`}
        >
          <button 
            type="button"
            onClick={(e) => executeAction(onCustomCover, e)} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-black uppercase text-indigo-950 dark:text-indigo-50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-50 dark:hover:text-indigo-950 rounded-xl cursor-pointer transition-colors flex-shrink-0"
          >
            <ImageIcon size={18} className="mr-3 stroke-[2.5] text-amber-500 flex-shrink-0" /> CUSTOM COVER
          </button>
          <button 
            type="button"
            onClick={(e) => executeAction(onSchedule, e)} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-black uppercase text-indigo-950 dark:text-indigo-50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-50 dark:hover:text-indigo-950 rounded-xl cursor-pointer transition-colors flex-shrink-0"
          >
            <Clock size={18} className="mr-3 stroke-[2.5] text-indigo-500 flex-shrink-0" /> SCHEDULE
          </button>
          <button 
            type="button"
            onClick={(e) => executeAction(onAddToPlaylist, e)} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-black uppercase text-indigo-950 dark:text-indigo-50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-50 dark:hover:text-indigo-950 rounded-xl cursor-pointer transition-colors flex-shrink-0"
          >
            <PlusCircle size={18} className="mr-3 stroke-[2.5] text-emerald-500 flex-shrink-0" /> ADD TO LIST
          </button>
          <button 
            type="button"
            onClick={(e) => executeAction(onRename, e)} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-black uppercase text-indigo-950 dark:text-indigo-50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-50 dark:hover:text-indigo-950 rounded-xl cursor-pointer transition-colors flex-shrink-0"
          >
            <Edit2 size={18} className="mr-3 stroke-[2.5] text-blue-500 flex-shrink-0" /> RENAME
          </button>
          <button 
            type="button"
            onClick={(e) => executeAction(onExport, e)} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-black uppercase text-indigo-950 dark:text-indigo-50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-50 dark:hover:text-indigo-950 rounded-xl cursor-pointer transition-colors flex-shrink-0"
          >
            <Share size={18} className="mr-3 stroke-[2.5] text-purple-500 flex-shrink-0" /> EXPORT
          </button>
          <div className="h-0.5 bg-indigo-200 dark:bg-slate-800 my-1 rounded flex-shrink-0" />
          <button 
            type="button"
            onClick={(e) => executeAction(onDelete, e)} 
            className="w-full flex items-center px-4 py-3 text-sm font-black uppercase bg-red-500 text-white hover:bg-red-600 active:bg-red-700 rounded-xl cursor-pointer transition-colors shadow-sm flex-shrink-0"
          >
            <Trash2 size={18} className="mr-3 stroke-[2.5] flex-shrink-0" /> DELETE
          </button>
        </div>
      )}
    </div>
  );
};

export default SongItem;
