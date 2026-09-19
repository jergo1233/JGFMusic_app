import React, { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { ChevronDown, Play, Pause, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import VolumeControl from '../components/VolumeControl';
import PlayerControls from '../components/PlayerControls';
import BeatAnimation from '../components/BeatAnimation';
import CdDisc from '../components/CdDisc';
import { DjCdHand } from '../components/HandCdVisual';
import CustomCoverModal from '../components/CustomCoverModal';
import { formatTime } from '../utils/format';

const NowPlayingPage = () => {
  const { 
    currentSong, isPlaying, currentTime, duration,
    repeatMode, shuffleMode,
    togglePlay, handleNext, handlePrevious,
    seek, toggleRepeat, toggleShuffle, closePlayer
  } = usePlayer();
  const { logoUrl } = useTheme();
  const { updateSongCover } = useLibrary();
  const navigate = useNavigate();

  const [showCoverModal, setShowCoverModal] = useState(false);

  useEffect(() => {
    if (!currentSong) {
      navigate(-1);
    }
  }, [currentSong, navigate]);

  if (!currentSong) {
    return null;
  }

  const handleClose = () => {
    closePlayer();
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col pt-3 pb-8 px-4 sm:px-6 overflow-y-auto select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between py-1.5 max-w-sm mx-auto w-full mb-2 sm:mb-3">
        {/* Compact Back Button */}
        <button 
          id="now-playing-back-btn"
          type="button"
          onClick={() => navigate(-1)} 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-indigo-900/60 dark:border-indigo-300/60 bg-indigo-100/90 dark:bg-slate-800/90 text-indigo-950 dark:text-indigo-50 shadow-sm hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="Bumalik (Minimize Player)"
        >
          <ChevronDown size={20} className="stroke-[2.8]" />
        </button>

        {/* Header App Identity */}
        <div className="flex items-center space-x-2">
          <img 
            src={logoUrl || "/icon.svg"} 
            alt="JGFMusic Logo" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-full border-2 border-indigo-500 shadow-sm" 
          />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-orange-400 dark:from-purple-400 dark:to-orange-400 drop-shadow-sm">
            JGFMUSIC
          </h2>
        </div>

        {/* Quick Custom Cover Button */}
        <button
          type="button"
          onClick={() => setShowCoverModal(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-indigo-900/60 dark:border-indigo-300/60 bg-indigo-100/90 dark:bg-slate-800/90 text-amber-500 hover:text-amber-400 shadow-sm hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="Palitan ang cover ng kanta"
        >
          <ImageIcon size={18} className="stroke-[2.5]" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-3 sm:space-y-4">
        {/* Main Song Visual & Interactive Play/Pause Disc */}
        <div 
          onClick={togglePlay}
          role="button"
          tabIndex={0}
          aria-label={isPlaying ? "Pause Song" : "Play Song"}
          className={`w-full max-w-[250px] sm:max-w-[280px] mx-auto aspect-square bg-indigo-100 dark:bg-slate-800 max-border rounded-[2.2rem] max-shadow flex items-center justify-center relative overflow-hidden transform -rotate-1 transition-all cursor-pointer group select-none ${
            isPlaying ? 'playing-now-playing-beat' : ''
          }`}
        >
          {currentSong.artworkUri ? (
            <img 
              src={currentSong.artworkUri} 
              alt={currentSong.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 relative overflow-hidden">
              <CdDisc 
                isPlaying={isPlaying} 
                title={currentSong.title} 
                artist={currentSong.artist} 
                className="w-full h-full max-w-[240px] max-h-[240px] shadow-2xl" 
              />
            </div>
          )}

          {/* Centered Pause & Play Button Overlay */}
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center transition-all z-30">
            <button
              type="button"
              id="now-playing-center-play-pause-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white max-border shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-center transform active:scale-90 group-hover:scale-105 transition-all cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={36} fill="currentColor" />
              ) : (
                <Play size={36} fill="currentColor" className="ml-1" />
              )}
            </button>
            <span className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-full bg-black/60 border border-white/20 shadow-md pointer-events-none">
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </span>
          </div>

          {/* Authentic DJ Hand touching/holding the CD */}
          <DjCdHand 
            isPlaying={isPlaying} 
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }} 
          />

          {/* Live duration indicator badge on the song card */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-indigo-400/50 shadow-xl flex items-center gap-1.5 z-10 pointer-events-none">
            <BeatAnimation isPlaying={isPlaying} />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </span>
            <span className="text-white/60 text-xs">•</span>
            <span className="text-xs font-mono font-black text-amber-300 flex items-center gap-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Song Info Card */}
        <div className="text-center bg-indigo-50 dark:bg-slate-900 max-border rounded-2xl p-2.5 sm:p-3 transform rotate-0.5 flex flex-col items-center relative">
          <h1 className="text-xl sm:text-2xl font-black uppercase text-indigo-950 dark:text-white mb-0.5 tracking-tight drop-shadow-[2px_2px_0_#c7d2fe] dark:drop-shadow-[2px_2px_0_#312e81] truncate w-full px-2">
            {currentSong.title}
          </h1>
          <p className="text-sm sm:text-base font-black uppercase text-indigo-700 dark:text-amber-300 truncate w-full px-2">
            {currentSong.artist}
          </p>

          {/* Custom Cover Trigger Tag */}
          <button
            type="button"
            onClick={() => setShowCoverModal(true)}
            className="mt-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-indigo-200 dark:bg-slate-800 text-indigo-950 dark:text-amber-300 hover:bg-amber-400 hover:text-black transition-colors flex items-center gap-1 cursor-pointer border border-indigo-500/40"
          >
            <ImageIcon size={12} />
            <span>CHANGE MUSIC COVER</span>
          </button>
        </div>

        {/* Progress Control (Song progress bar, click/drag para pumunta sa specific part ng song) */}
        <div className="bg-indigo-600 dark:bg-slate-800 max-border rounded-2xl p-3 shadow-md">
          <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
        </div>

        {/* Volume Slider Control */}
        <VolumeControl />

        {/* Fixed Symmetrical Bottom Player Controls (Shuffle, Previous, Play/Pause, Next, Repeat) */}
        <div className="bg-indigo-100 dark:bg-slate-800 max-border rounded-3xl max-shadow p-3.5 sm:p-4">
          <PlayerControls 
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onNext={handleNext}
            onPrev={handlePrevious}
            repeatMode={repeatMode}
            onToggleRepeat={toggleRepeat}
            shuffleMode={shuffleMode}
            onToggleShuffle={toggleShuffle}
            onStop={handleClose}
          />
        </div>
      </div>

      {/* Custom Music Cover Modal */}
      {showCoverModal && (
        <CustomCoverModal
          isOpen={showCoverModal}
          song={currentSong}
          onClose={() => setShowCoverModal(false)}
          onSaveCover={updateSongCover}
        />
      )}
    </div>
  );
};

export default NowPlayingPage;
