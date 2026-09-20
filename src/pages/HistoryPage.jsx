import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { History, Clock, Trash2, Play, Music, Sparkles, Image as ImageIcon, Eye, CheckCircle2 } from 'lucide-react';
import { formatTime } from '../utils/format';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomCoverModal from '../components/CustomCoverModal';
import CdDisc from '../components/CdDisc';

const HistoryPage = () => {
  const { 
    recentlyPlayed, 
    listeningHistory, 
    clearHistory, 
    clearRecentlyPlayed, 
    updateSongCover 
  } = useLibrary();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'history'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [songForCover, setSongForCover] = useState(null);

  const formatPlayedAt = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'JUST NOW';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m AGO`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h AGO`;
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handlePlayRecent = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, recentlyPlayed);
    }
  };

  const handleConfirmClear = () => {
    if (activeTab === 'recent') {
      clearRecentlyPlayed();
    } else {
      clearHistory();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="pb-56 sm:pb-64 px-4 max-w-2xl mx-auto min-h-screen select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center shadow-sm">
            <History size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-indigo-950 dark:text-white">
              Activity
            </h2>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase tracking-wider">
              RECENT & LISTENING HISTORY
            </p>
          </div>
        </div>

        {/* Clear Button */}
        {((activeTab === 'recent' && recentlyPlayed.length > 0) || (activeTab === 'history' && listeningHistory.length > 0)) && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase rounded-xl max-border flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-95"
            title={activeTab === 'recent' ? "Clear Recently Played" : "Clear Listening History"}
          >
            <Trash2 size={15} />
            <span>CLEAR {activeTab === 'recent' ? 'RECENT' : 'HISTORY'}</span>
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-indigo-100 dark:bg-slate-800/80 p-1.5 rounded-2xl max-border mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-3 rounded-xl font-black text-xs sm:text-sm uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'recent'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-indigo-950 dark:text-indigo-100 hover:bg-white/40'
          }`}
        >
          <Clock size={16} />
          <span>RECENTLY PLAYED ({recentlyPlayed.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-black text-xs sm:text-sm uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-indigo-950 dark:text-indigo-100 hover:bg-white/40'
          }`}
        >
          <History size={16} />
          <span>FULL HISTORY ({listeningHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: RECENTLY PLAYED */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          {recentlyPlayed.length > 0 ? (
            recentlyPlayed.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={`${song.id}_${index}`}
                  onClick={() => handlePlayRecent(song)}
                  className={`p-3.5 max-border rounded-2xl max-shadow flex items-center justify-between gap-3 cursor-pointer transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                    isCurrent && isPlaying
                      ? 'playing-box-beat bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950'
                      : isCurrent
                      ? 'bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950'
                      : 'bg-indigo-50 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl max-border overflow-hidden bg-slate-900 flex items-center justify-center flex-shrink-0 relative">
                      {song.artworkUri ? (
                        <img src={song.artworkUri} alt="art" className="w-full h-full object-cover" />
                      ) : (
                        <CdDisc isPlaying={isCurrent && isPlaying} compact={true} className="w-full h-full scale-105" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-base sm:text-lg uppercase truncate tracking-tight">
                        {song.title}
                      </h4>
                      <p className={`text-xs sm:text-sm font-extrabold uppercase truncate ${
                        isCurrent ? 'text-indigo-100 dark:text-indigo-900' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Custom Cover Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSongForCover(song);
                      }}
                      className="p-2 rounded-xl text-amber-500 hover:text-amber-400 hover:bg-black/10 transition-colors"
                      title="Custom cover"
                    >
                      <ImageIcon size={20} />
                    </button>
                    {/* Play Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayRecent(song);
                      }}
                      className="w-10 h-10 rounded-xl max-border bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-all"
                      title={isCurrent && isPlaying ? "Pause" : "Play"}
                    >
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
              <Clock size={48} className="mx-auto text-indigo-700 dark:text-indigo-300 mb-3 stroke-[2]" />
              <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
                NO RECENTLY PLAYED SONGS
              </p>
              <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1">
                Songs will automatically appear here once you play music!
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULL LISTENING HISTORY (READ-ONLY AUDIT LOG) */}
      {activeTab === 'history' && (
        <div className="space-y-3.5">
          {listeningHistory.length > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-indigo-200/90 dark:bg-slate-800 border-2 border-indigo-900/30 dark:border-indigo-300/30 rounded-xl mb-3 text-xs text-indigo-950 dark:text-white">
              <div className="flex items-center gap-1.5 font-black">
                <Eye size={15} className="text-indigo-700 dark:text-indigo-300 stroke-[2.5]" />
                <span>Read-Only Activity Log (Playback Disabled)</span>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {listeningHistory.length} Record{listeningHistory.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {listeningHistory.length > 0 ? (
            listeningHistory.map((record) => {
              return (
                <div
                  key={record.id}
                  className="p-3.5 bg-indigo-50/95 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50 max-border rounded-2xl shadow-sm flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl max-border overflow-hidden bg-slate-900 flex items-center justify-center flex-shrink-0">
                      {record.artworkUri ? (
                        <img src={record.artworkUri} alt="art" className="w-full h-full object-cover" />
                      ) : (
                        <CdDisc compact={true} className="w-full h-full scale-105" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-base uppercase truncate tracking-tight text-indigo-950 dark:text-white">
                        {record.title}
                      </h4>
                      <p className="text-xs font-extrabold uppercase truncate text-slate-800 dark:text-slate-200">
                        {record.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-slate-700 text-indigo-950 dark:text-amber-300">
                      {formatPlayedAt(record.playedAt)}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase">
                      <CheckCircle2 size={12} className="text-emerald-500 stroke-[2.5]" />
                      <span>Logged</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
              <History size={48} className="mx-auto text-indigo-700 dark:text-indigo-300 mb-3 stroke-[2]" />
              <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
                LISTENING HISTORY IS EMPTY
              </p>
              <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1">
                Every song you play gets tracked here automatically!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title={`CLEAR ${activeTab === 'recent' ? 'RECENTLY PLAYED' : 'HISTORY'}?`}
        message={`Are you sure you want to clear your ${activeTab === 'recent' ? 'recently played list' : 'listening history records'}? This action cannot be undone.`}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Custom Cover Modal */}
      {songForCover && (
        <CustomCoverModal
          isOpen={!!songForCover}
          song={songForCover}
          onClose={() => setSongForCover(null)}
          onSaveCover={updateSongCover}
        />
      )}
    </div>
  );
};

export default HistoryPage;

/* JGFMusic v1.0.2 */
