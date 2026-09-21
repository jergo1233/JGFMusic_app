import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { fileService } from '../services/fileService';
import { useNavigate } from 'react-router-dom';
import { Music, SlidersHorizontal, Calendar, ArrowDownAZ, ArrowUpZA, HardDrive, Check, X, Play } from 'lucide-react';
import SongItem from '../components/SongItem';
import AddMusicButton from '../components/AddMusicButton';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomCoverModal from '../components/CustomCoverModal';

const Library = () => {
  const { songs, playlists, renameSong, deleteSong, addSongToPlaylist, updateSongCover } = useLibrary();
  const { playSong, currentSong, isPlaying, togglePlay, updateQueue } = usePlayer();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [songToDelete, setSongToDelete] = useState(null);
  const [songToAdd, setSongToAdd] = useState(null);
  const [songForCover, setSongForCover] = useState(null);
  // Single active menu state: only ONE song menu can be open at a time
  const [openMenuSongId, setOpenMenuSongId] = useState(null);
  // Filter and Sort state
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.album && s.album.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return (b.dateAdded || 0) - (a.dateAdded || 0);
      case 'date-asc':
        return (a.dateAdded || 0) - (b.dateAdded || 0);
      case 'name-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'name-desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'size-desc': {
        const sizeA = a.fileSize || (a.duration ? a.duration * 40000 : 0);
        const sizeB = b.fileSize || (b.duration ? b.duration * 40000 : 0);
        return sizeB - sizeA;
      }
      case 'size-asc': {
        const sizeA = a.fileSize || (a.duration ? a.duration * 40000 : 0);
        const sizeB = b.fileSize || (b.duration ? b.duration * 40000 : 0);
        return sizeA - sizeB;
      }
      default:
        return 0;
    }
  });

  const sortOptions = [
    {
      id: 'date-desc',
      category: 'DATE ADDED',
      label: 'Date: Newest First',
      sublabel: 'Most Recently Added',
      icon: Calendar
    },
    {
      id: 'date-asc',
      category: 'DATE ADDED',
      label: 'Date: Oldest First',
      sublabel: 'Earliest Added',
      icon: Calendar
    },
    {
      id: 'name-asc',
      category: 'ALPHABETICAL',
      label: 'Name: A to Z',
      sublabel: 'Alphabetical from A to Z',
      icon: ArrowDownAZ
    },
    {
      id: 'name-desc',
      category: 'ALPHABETICAL',
      label: 'Name: Z to A',
      sublabel: 'Reverse from Z to A',
      icon: ArrowUpZA
    },
    {
      id: 'size-desc',
      category: 'SONG SIZE / DURATION',
      label: 'Size: Largest First',
      sublabel: 'Largest file size / longest',
      icon: HardDrive
    },
    {
      id: 'size-asc',
      category: 'SONG SIZE / DURATION',
      label: 'Size: Smallest First',
      sublabel: 'Smallest file size / shortest',
      icon: HardDrive
    },
  ];

  const currentSortObj = sortOptions.find(o => o.id === sortBy) || sortOptions[0];

  const handleToggleMenu = (songId) => {
    // If clicking same song, toggle off. Otherwise switch to the new single song.
    setOpenMenuSongId(prev => (prev === songId ? null : songId));
  };

  const handleSongPlayPause = (song) => {
    setOpenMenuSongId(null);
    if (currentSong?.id === song.id) {
      if (updateQueue) {
        updateQueue(sortedSongs);
      }
      togglePlay();
    } else {
      // Play in library context with sortedSongs as queue so playback follows filtered/sorted order!
      playSong(song, sortedSongs);
    }
  };

  const handlePlayAll = () => {
    if (sortedSongs.length > 0) {
      setOpenMenuSongId(null);
      // Starts from the very first song in the filtered list, queue follows filtered order!
      playSong(sortedSongs[0], sortedSongs);
    }
  };

  const handleRename = (song) => {
    setOpenMenuSongId(null);
    const newTitle = prompt("Enter new title for track:", song.title);
    if (newTitle && newTitle.trim()) {
      renameSong(song.id, newTitle.trim());
    }
  };

  const handleExport = async (song) => {
    setOpenMenuSongId(null);
    try {
      const extMatch = song.fileUri.match(/\.([a-z0-9]+)$/i);
      const ext = extMatch ? extMatch[1] : 'mp3';
      const destName = `${song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      await fileService.exportFile(song.fileUri, destName);
      alert("File exported successfully.");
    } catch (e) {
      alert("Failed to export file.");
    }
  };

  const handleAddToPlaylist = (playlistId) => {
    setOpenMenuSongId(null);
    if (songToAdd && playlistId) {
      addSongToPlaylist(playlistId, songToAdd.id);
      setSongToAdd(null);
    }
  };

  const handleSchedule = (song) => {
    setOpenMenuSongId(null);
    navigate('/scheduled', { state: { prefillTargetId: song.id, prefillType: 'song' } });
  };

  return (
    <div className="pb-60 sm:pb-64 px-4 max-w-2xl mx-auto min-h-screen select-none relative">
      {/* Backdrop overlay for closing any open song menu on click outside */}
      {openMenuSongId && (
        <div 
          className="fixed inset-0 z-35 bg-black/10 dark:bg-black/30 backdrop-blur-[1px]"
          onClick={() => setOpenMenuSongId(null)}
          onTouchStart={() => setOpenMenuSongId(null)}
        />
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center shadow-sm">
            <Music size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-indigo-950 dark:text-white">
              Music Library
            </h2>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase tracking-wider">
              ALL SONGS & AUDIO TRACKS
            </p>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Add Music bar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <input 
          type="text" 
          placeholder="SEARCH MUSIC / SONGS..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpenMenuSongId(null);
          }}
          className="flex-1 min-w-0 bg-indigo-50 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl max-border max-shadow outline-none focus:ring-4 focus:ring-indigo-400 font-bold uppercase placeholder-slate-600 dark:placeholder-slate-400 text-sm sm:text-base"
        />

        {/* Filter Button */}
        <button
          id="library-filter-btn"
          type="button"
          onClick={() => setShowFilterModal(true)}
          className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-3.5 sm:py-4 rounded-2xl max-border max-shadow transition-all shrink-0 cursor-pointer shadow-md active:scale-95 ${
            sortBy !== 'date-desc'
              ? 'bg-amber-400 text-slate-950 font-black'
              : 'bg-indigo-100 hover:bg-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-950 dark:text-white font-black'
          }`}
          title="Filter and Sort Music Library"
        >
          <SlidersHorizontal size={20} className="stroke-[2.5]" />
          <span className="text-xs sm:text-sm uppercase hidden xs:inline">FILTER</span>
        </button>

        <AddMusicButton />
      </div>

      {/* Track count indicator & Active Sort Filter Chip */}
      <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-950 dark:text-white">
            ALL SONGS ({sortedSongs.length})
          </span>
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-600 text-white dark:bg-indigo-400 dark:text-slate-950 max-border shadow-xs hover:opacity-90 cursor-pointer active:scale-95"
            title="Change filter/sort"
          >
            <SlidersHorizontal size={10} />
            <span>{currentSortObj.label}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {sortedSongs.length > 0 && (
            <button
              id="library-play-all-btn"
              type="button"
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 text-xs font-black uppercase px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white max-border shadow-sm cursor-pointer active:scale-95 transition-all"
              title="Start playing from the 1st song in the filtered list"
            >
              <Play size={12} fill="currentColor" />
              <span>PLAY ALL ({sortedSongs.length})</span>
            </button>
          )}
          <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded border border-amber-500/40">
            OFFLINE READY
          </span>
        </div>
      </div>

      {/* Filter / Sort Selection Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 max-border rounded-3xl max-shadow p-5 sm:p-6 w-full max-w-md relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-indigo-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center max-border shadow-sm">
                  <SlidersHorizontal size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Filter & Sort Songs
                  </h3>
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300">
                    ORGANIZE YOUR MUSIC
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {sortOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = sortBy === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id);
                      setShowFilterModal(false);
                    }}
                    className={`p-3.5 rounded-2xl max-border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-[3px_3px_0_#000]'
                        : 'bg-indigo-50/70 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                      }`}>
                        <Icon size={18} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isSelected ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-300'
                          }`}>
                            {opt.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight truncate">
                          {opt.label}
                        </h4>
                        <p className={`text-[11px] font-bold truncate ${
                          isSelected ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {opt.sublabel}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowFilterModal(false)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wide rounded-2xl max-border shadow-md active:scale-95 transition-all text-sm cursor-pointer"
            >
              APPLY FILTER
            </button>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-4">
        {sortedSongs.length > 0 ? (
          sortedSongs.map(song => (
            <SongItem 
              key={song.id} 
              song={song} 
              isCurrent={currentSong?.id === song.id}
              isPlaying={currentSong?.id === song.id && isPlaying}
              isMenuOpen={openMenuSongId === song.id}
              onToggleMenu={handleToggleMenu}
              onClick={handleSongPlayPause}
              onPlayPause={handleSongPlayPause}
              onRename={handleRename}
              onExport={handleExport}
              onDelete={(s) => {
                setOpenMenuSongId(null);
                setSongToDelete(s);
              }}
              onAddToPlaylist={(s) => {
                setOpenMenuSongId(null);
                setSongToAdd(s);
              }}
              onSchedule={handleSchedule}
              onCustomCover={(s) => {
                setOpenMenuSongId(null);
                setSongForCover(s);
              }}
            />
          ))
        ) : (
          <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
            <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
              NO MUSIC FOUND!
            </p>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1">
              Tap the ADD button above to import music from your device.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={!!songToDelete}
        title="DELETE SONG?"
        message={`Are you sure you want to remove "${songToDelete?.title}" from your library?`}
        onConfirm={() => {
          deleteSong(songToDelete.id);
          setSongToDelete(null);
        }}
        onCancel={() => setSongToDelete(null)}
      />

      {/* Add To Playlist Modal */}
      {songToAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-6 sm:p-8 w-full max-w-sm">
            <h3 className="text-2xl sm:text-3xl font-black mb-4 uppercase text-indigo-950 dark:text-indigo-50 tracking-tight drop-shadow-[2px_2px_0_#c7d2fe] dark:drop-shadow-[2px_2px_0_#312e81]">
              Add to Playlist
            </h3>
            <p className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-4 truncate">
              {songToAdd.title}
            </p>
            <div className="max-h-60 overflow-y-auto mb-6 space-y-3">
              {playlists.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => handleAddToPlaylist(p.id)}
                  className="w-full text-left px-5 py-3.5 bg-indigo-100 dark:bg-slate-900 max-border rounded-xl max-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-black text-base uppercase text-indigo-950 dark:text-indigo-50 cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
              {playlists.length === 0 && (
                <p className="text-indigo-950 dark:text-indigo-50 font-bold text-center text-sm py-4">
                  No playlists created yet. Create one in the Playlists tab!
                </p>
              )}
            </div>
            <button 
              onClick={() => setSongToAdd(null)}
              className="w-full px-6 py-3.5 font-black uppercase text-base bg-indigo-600 dark:bg-indigo-50 text-white dark:text-indigo-950 max-border rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Custom Music Cover Modal */}
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

export default Library;

/* JGFMusic v1.0.2 */
