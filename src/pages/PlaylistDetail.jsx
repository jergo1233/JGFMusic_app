import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { ChevronLeft, Play, Pause, Trash2, Clock, Image as ImageIcon } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomCoverModal from '../components/CustomCoverModal';
import CdDisc from '../components/CdDisc';
import BeatAnimation from '../components/BeatAnimation';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, songs, removeSongFromPlaylist, updateSongCover } = useLibrary();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const [songToRemove, setSongToRemove] = useState(null);
  const [songForCover, setSongForCover] = useState(null);

  const playlist = playlists.find(p => p.id === id);

  if (!playlist) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center select-none">
        <h1 className="text-3xl font-black uppercase text-gray-400 mb-4 tracking-tight">PLAYLIST NOT FOUND</h1>
        <button onClick={() => navigate('/playlists')} className="px-6 py-3 bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 max-border rounded-xl font-black uppercase cursor-pointer">
          GO BACK
        </button>
      </div>
    );
  }

  const playlistSongs = playlist.songIds.map(songId => songs.find(s => s.id === songId)).filter(Boolean);

  // Play All: Sets the playlist songs as the queue! (Previous and Next will move within this playlist)
  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  const handlePlaySong = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      // Play in this playlist's queue!
      playSong(song, playlistSongs);
    }
  };

  const confirmRemove = () => {
    if (songToRemove) {
      removeSongFromPlaylist(playlist.id, songToRemove.id);
      setSongToRemove(null);
    }
  };

  const handleSchedule = (song) => {
    navigate('/scheduled', { state: { prefillTargetId: song.id, prefillType: 'song' } });
  };

  return (
    <div className="pb-56 sm:pb-64 px-4 max-w-2xl mx-auto min-h-screen select-none">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/playlists')} 
          className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 max-border max-shadow hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center cursor-pointer"
          title="Back to Playlists"
        >
          <ChevronLeft size={22} className="stroke-[3]" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-indigo-950 dark:text-white truncate flex-1 text-right ml-4">
          {playlist.name}
        </h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="font-black text-xs sm:text-sm uppercase bg-indigo-200 dark:bg-slate-800 text-indigo-950 dark:text-amber-300 border-2 border-indigo-400/40 px-3.5 py-1.5 rounded-xl shadow-sm">
          {playlistSongs.length} TRACKS
        </p>
        {playlistSongs.length > 0 && (
          <button 
            onClick={handlePlayAll}
            className="flex items-center px-5 py-2.5 bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 max-border rounded-full max-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all font-black text-sm uppercase tracking-widest cursor-pointer shadow-md active:scale-95"
          >
            <Play size={18} fill="currentColor" className="mr-1.5" /> PLAY ALL
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {playlistSongs.map(song => {
          const isCurrent = currentSong?.id === song.id;
          return (
            <div 
              key={song.id}
              className={`max-border rounded-2xl max-shadow p-3.5 flex items-center transition-all hover:translate-x-0.5 ${
                isCurrent && isPlaying 
                  ? 'playing-box-beat bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950' 
                  : isCurrent 
                  ? 'bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950' 
                  : 'bg-indigo-50 dark:bg-slate-800 text-indigo-950 dark:text-indigo-50'
              }`}
            >
              {/* Thumbnail with interactive Play/Pause */}
              <button 
                type="button"
                onClick={() => handlePlaySong(song)}
                className={`w-13 h-13 sm:w-14 sm:h-14 bg-indigo-100 dark:bg-slate-900 max-border rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden group transition-all cursor-pointer ${
                  isCurrent && isPlaying ? 'playing-thumb-beat border-purple-400' : ''
                }`}
                title={isCurrent && isPlaying ? "Pause" : "Play"}
              >
                {song.artworkUri ? (
                  <img src={song.artworkUri} alt="art" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full p-0.5 flex items-center justify-center bg-slate-900/40">
                    <CdDisc 
                      isPlaying={isCurrent && isPlaying} 
                      compact={true} 
                      className="w-full h-full scale-105" 
                    />
                  </div>
                )}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isCurrent && isPlaying ? (
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                      <Pause size={14} fill="currentColor" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow">
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </div>
                  )}
                </div>
              </button>
              
              <div className="flex-1 min-w-0 ml-3.5 cursor-pointer" onClick={() => handlePlaySong(song)}>
                <div className="flex items-center gap-2">
                  <h3 className={`font-black text-base sm:text-lg uppercase tracking-tight truncate ${isCurrent ? 'text-white dark:text-indigo-950' : 'text-indigo-950 dark:text-indigo-50'}`}>
                    {song.title}
                  </h3>
                  {isCurrent && isPlaying && (
                    <div className="flex-shrink-0 scale-80">
                      <BeatAnimation isPlaying={true} />
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold uppercase truncate opacity-80">
                  {song.artist}
                </p>
              </div>

              {/* Custom Cover Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSongForCover(song);
                }}
                className="p-2 rounded-xl text-amber-500 hover:text-amber-400 transition-colors"
                title="Custom Music Cover"
              >
                <ImageIcon size={20} />
              </button>

              {/* Dedicated Play/Pause button */}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaySong(song);
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 max-border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent && isPlaying 
                    ? 'bg-amber-400 text-slate-950 shadow-[2px_2px_0_#000] scale-105' 
                    : isCurrent 
                    ? 'bg-emerald-400 text-slate-950 shadow-[2px_2px_0_#000]' 
                    : 'bg-indigo-600 dark:bg-indigo-50 text-white dark:text-indigo-950 shadow-[2px_2px_0_#000]'
                } hover:scale-110 active:scale-95 ml-1`}
                title={isCurrent && isPlaying ? "Pause" : "Play"}
              >
                {isCurrent && isPlaying ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <div className="flex items-center space-x-1 ml-1.5">
                <button 
                  onClick={() => handleSchedule(song)} 
                  className="p-2 text-indigo-950 dark:text-indigo-50 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Schedule Song"
                >
                  <Clock size={18} className="stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => setSongToRemove(song)} 
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                  title="Remove from Playlist"
                >
                  <Trash2 size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}
        {playlistSongs.length === 0 && (
          <div className="text-center py-12 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
            <p className="text-xl font-black uppercase text-indigo-950 dark:text-white">PLAYLIST IS EMPTY</p>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 mt-1 uppercase">Add songs from the library!</p>
          </div>
        )}
      </div>

      {songToRemove && (
        <ConfirmDialog
          isOpen={!!songToRemove}
          title="REMOVE SONG?"
          message={`Are you sure you want to remove "${songToRemove.title}" from this playlist?`}
          onConfirm={confirmRemove}
          onCancel={() => setSongToRemove(null)}
        />
      )}

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

export default PlaylistDetail;
