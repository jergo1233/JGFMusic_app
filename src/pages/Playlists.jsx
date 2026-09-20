import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { ListMusic, Plus, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Playlists = () => {
  const { playlists, createPlaylist, deletePlaylist, songs } = useLibrary();
  const { playSong } = usePlayer();
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreate(false);
    }
  };

  const playPlaylist = (e, p) => {
    e.stopPropagation();
    if (p.songIds.length === 0) return;
    const pSongs = p.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
    if (pSongs.length > 0) {
      playSong(pSongs[0], pSongs);
    }
  };

  return (
    <div className="pb-56 sm:pb-64 px-4 max-w-2xl mx-auto min-h-screen select-none">
      {!showCreate && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center shadow-sm">
              <ListMusic size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-indigo-950 dark:text-white">
                Playlists
              </h2>
              <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase tracking-wider">
                YOUR CUSTOM MIXES ({playlists.length})
              </p>
            </div>
          </div>
          <button 
            id="new-playlist-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-50 dark:hover:bg-white dark:text-indigo-950 max-border rounded-2xl max-shadow hover:translate-y-0.5 hover:translate-x-0.5 transition-all font-black text-xs sm:text-sm uppercase shadow-sm cursor-pointer"
          >
            <Plus size={18} className="stroke-[3]" />
            <span>NEW LIST</span>
          </button>
        </div>
      )}

      {showCreate && (
        <div className="mb-8 bg-indigo-100 dark:bg-slate-800 p-6 max-border rounded-3xl max-shadow flex flex-col">
          <h3 className="text-xl font-black uppercase text-indigo-950 dark:text-white mb-3">
            CREATE PLAYLIST
          </h3>
          <input 
            type="text" 
            autoFocus
            placeholder="ENTER PLAYLIST NAME..." 
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="w-full bg-indigo-50 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 px-4 py-3.5 max-border rounded-xl mb-4 outline-none font-bold uppercase text-lg placeholder-slate-600 dark:placeholder-slate-400"
          />
          <div className="flex gap-3">
            <button 
              onClick={handleCreate} 
              className="flex-1 font-black text-base uppercase bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 max-border rounded-xl py-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
            >
              SAVE PLAYLIST
            </button>
            <button 
              onClick={() => setShowCreate(false)} 
              className="flex-1 font-black text-base uppercase bg-indigo-50 dark:bg-gray-800 text-indigo-950 dark:text-indigo-50 max-border rounded-xl py-3 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {playlists.map(p => (
          <div 
            key={p.id}
            onClick={() => navigate(`/playlists/${p.id}`)}
            className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-5 flex flex-col items-center justify-center relative aspect-square text-center transition-transform hover:-translate-y-1 hover:max-shadow cursor-pointer"
          >
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
              className="absolute -top-2.5 -right-2.5 p-2 bg-indigo-600 hover:bg-red-600 text-white max-border rounded-full hover:scale-110 transition-transform cursor-pointer shadow-md"
              title="Delete Playlist"
            >
              <Trash2 size={18} className="stroke-[2.5]" />
            </button>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 max-border rounded-2xl flex items-center justify-center mb-3">
              <ListMusic size={32} className="stroke-[3]" />
            </div>
            <h3 className="font-black text-lg sm:text-xl text-indigo-950 dark:text-indigo-50 truncate w-full px-1 uppercase tracking-tight">
              {p.name}
            </h3>
            <p className="font-black text-indigo-950 dark:text-slate-100 mt-1 text-xs uppercase bg-indigo-200 dark:bg-slate-900 px-2.5 py-0.5 max-border rounded-lg">
              {p.songIds.length} TRACKS
            </p>
            
            <button 
              type="button"
              onClick={(e) => playPlaylist(e, p)}
              className="mt-4 bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 p-3 max-border rounded-full shadow-[3px_3px_0_0_#ccc] dark:shadow-[3px_3px_0_0_#555] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all cursor-pointer"
              title="Play Playlist"
            >
              <Play size={20} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>

      {playlists.length === 0 && !showCreate && (
        <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl mt-4">
          <ListMusic size={48} className="mx-auto text-indigo-700 dark:text-indigo-300 mb-3 stroke-[2]" />
          <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
            NO PLAYLISTS YET!
          </p>
          <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1">
            Organize and bundle your favorite songs into custom collections.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl max-border hover:bg-indigo-700 transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>CREATE PLAYLIST</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Playlists;

/* JGFMusic v1.0.2 */
