import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { fileService } from '../services/fileService';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import SongItem from '../components/SongItem';
import AddMusicButton from '../components/AddMusicButton';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomCoverModal from '../components/CustomCoverModal';

const Library = () => {
  const { songs, playlists, renameSong, deleteSong, addSongToPlaylist, updateSongCover } = useLibrary();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [songToDelete, setSongToDelete] = useState(null);
  const [songToAdd, setSongToAdd] = useState(null);
  const [songForCover, setSongForCover] = useState(null);
  // Single active menu state: only ONE song menu can be open at a time
  const [openMenuSongId, setOpenMenuSongId] = useState(null);

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.album && s.album.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleMenu = (songId) => {
    // If clicking same song, toggle off. Otherwise switch to the new single song.
    setOpenMenuSongId(prev => (prev === songId ? null : songId));
  };

  const handleSongPlayPause = (song) => {
    setOpenMenuSongId(null);
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      // Play in library context with filteredSongs as queue!
      playSong(song, filteredSongs);
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
    <div className="pb-44 px-4 max-w-2xl mx-auto min-h-screen select-none relative">
      {/* Backdrop overlay for closing any open song menu on click outside */}
      {openMenuSongId && (
        <div 
          className="fixed inset-0 z-20 bg-transparent"
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

      {/* Search and Add Music bar */}
      <div className="flex items-center gap-3 mb-6">
        <input 
          type="text" 
          placeholder="SEARCH MUSIC / SONGS..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpenMenuSongId(null);
          }}
          className="flex-1 bg-indigo-50 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 px-5 py-4 rounded-2xl max-border max-shadow outline-none focus:ring-4 focus:ring-indigo-400 font-bold uppercase placeholder-slate-600 dark:placeholder-slate-400 text-sm sm:text-base"
        />
        <AddMusicButton />
      </div>

      {/* Track count indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-black uppercase tracking-widest text-indigo-950 dark:text-white">
          ALL SONGS ({filteredSongs.length})
        </span>
        <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded border border-amber-500/40">
          OFFLINE READY
        </span>
      </div>

      {/* Song List */}
      <div className="space-y-4">
        {filteredSongs.length > 0 ? (
          filteredSongs.map(song => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
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
