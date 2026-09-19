import React, { createContext, useState, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { generateId } from '../utils/format';
import { parseMetadata } from '../services/metadataService';

const LibraryContext = createContext();

export const useLibrary = () => useContext(LibraryContext);

// Pre-seeded starter songs so user can test sound, next/prev, progress & cover right away
const STARTER_SONGS = [
  {
    id: 'starter_1',
    title: 'Neon Beat Symphony',
    artist: 'Jerome Urbano (JGF)',
    album: 'Cyber Soundscapes',
    duration: 184,
    // Free high-quality sample audio stream
    fileUri: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    artworkUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 3600000 * 2
  },
  {
    id: 'starter_2',
    title: 'Midnight Turntable Groove',
    artist: 'DJ Sonic Wave',
    album: 'Retro Hi-Fi Collection',
    duration: 152,
    fileUri: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    artworkUri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 3600000 * 1
  },
  {
    id: 'starter_3',
    title: 'Acoustic Sunset Chill',
    artist: 'Horizon Resonance',
    album: 'Island Acoustics',
    duration: 210,
    fileUri: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=relaxed-vlog-131746.mp3',
    artworkUri: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now()
  }
];

export const LibraryProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    let s = await storageService.get('songs', null);
    if (!s || !Array.isArray(s) || s.length === 0) {
      s = STARTER_SONGS;
      await storageService.set('songs', STARTER_SONGS);
    }
    const p = await storageService.get('playlists', [
      {
        id: 'pl_starter_1',
        name: 'Favorites & Vibes',
        songIds: [STARTER_SONGS[0].id, STARTER_SONGS[1].id],
        dateCreated: Date.now() - 86400000
      }
    ]);
    const sched = await storageService.get('schedules', []);
    const recent = await storageService.get('recentlyPlayed', [STARTER_SONGS[0]]);
    const history = await storageService.get('listeningHistory', [
      {
        id: generateId(),
        songId: STARTER_SONGS[0].id,
        title: STARTER_SONGS[0].title,
        artist: STARTER_SONGS[0].artist,
        album: STARTER_SONGS[0].album,
        artworkUri: STARTER_SONGS[0].artworkUri,
        playedAt: Date.now() - 1000 * 60 * 15
      }
    ]);

    setSongs(s.sort((a, b) => a.title.localeCompare(b.title)));
    setPlaylists(p);
    setSchedules(sched);
    setRecentlyPlayed(recent);
    setListeningHistory(history);
  };

  const addToRecentlyPlayed = async (song) => {
    if (!song) return;
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 30);
      storageService.set('recentlyPlayed', updated);
      return updated;
    });
  };

  const addToHistory = async (song) => {
    if (!song) return;
    const record = {
      id: generateId(),
      songId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artworkUri: song.artworkUri || null,
      playedAt: Date.now()
    };
    setListeningHistory(prev => {
      const updated = [record, ...prev].slice(0, 150);
      storageService.set('listeningHistory', updated);
      return updated;
    });
  };

  const clearHistory = async () => {
    setListeningHistory([]);
    await storageService.set('listeningHistory', []);
  };

  const clearRecentlyPlayed = async () => {
    setRecentlyPlayed([]);
    await storageService.set('recentlyPlayed', []);
  };

  // Custom Music Cover Updater
  const updateSongCover = async (songId, newArtworkUri) => {
    const updatedSongs = songs.map(s => {
      if (s.id === songId) {
        return { ...s, artworkUri: newArtworkUri };
      }
      return s;
    });
    setSongs(updatedSongs);
    await storageService.set('songs', updatedSongs);

    // Also update in recently played
    setRecentlyPlayed(prev => {
      const updated = prev.map(s => s.id === songId ? { ...s, artworkUri: newArtworkUri } : s);
      storageService.set('recentlyPlayed', updated);
      return updated;
    });

    // Also update in listening history
    setListeningHistory(prev => {
      const updated = prev.map(item => item.songId === songId ? { ...item, artworkUri: newArtworkUri } : item);
      storageService.set('listeningHistory', updated);
      return updated;
    });

    return true;
  };

  const addMusic = async (fileObjects) => {
    const newSongs = [...songs];
    for (const fileObj of fileObjects) {
      try {
        const metadata = await parseMetadata(fileObj);
        const fileName = fileObj.name || `track_${Date.now()}.mp3`;
        const uri = await fileService.saveFileToPrivateStorage(fileObj, fileName);

        const song = {
          id: generateId(),
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          fileUri: uri,
          artworkUri: metadata.artwork,
          dateAdded: Date.now()
        };
        newSongs.push(song);
      } catch (e) {
        console.error("Failed to add song", e);
      }
    }
    const sorted = newSongs.sort((a, b) => a.title.localeCompare(b.title));
    setSongs(sorted);
    await storageService.set('songs', sorted);
  };

  const renameSong = async (id, newTitle) => {
    const updated = songs.map(s => s.id === id ? { ...s, title: newTitle } : s).sort((a, b) => a.title.localeCompare(b.title));
    setSongs(updated);
    await storageService.set('songs', updated);
  };

  const deleteSong = async (id) => {
    const song = songs.find(s => s.id === id);
    if (song) {
      await fileService.deleteFile(song.fileUri);
    }
    const updated = songs.filter(s => s.id !== id);
    setSongs(updated);
    await storageService.set('songs', updated);

    // Remove from playlists
    const updatedPlaylists = playlists.map(p => ({
      ...p,
      songIds: p.songIds.filter(sid => sid !== id)
    }));
    setPlaylists(updatedPlaylists);
    await storageService.set('playlists', updatedPlaylists);
  };

  const createPlaylist = async (name) => {
    const p = { id: generateId(), name, songIds: [], dateCreated: Date.now() };
    const updated = [...playlists, p];
    setPlaylists(updated);
    await storageService.set('playlists', updated);
    return p.id;
  };

  const deletePlaylist = async (id) => {
    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
    await storageService.set('playlists', updated);
  };

  const renamePlaylist = async (id, name) => {
    const updated = playlists.map(p => p.id === id ? { ...p, name } : p);
    setPlaylists(updated);
    await storageService.set('playlists', updated);
  };

  const addSongToPlaylist = async (playlistId, songId) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId && !p.songIds.includes(songId)) {
        return { ...p, songIds: [...p.songIds, songId] };
      }
      return p;
    });
    setPlaylists(updated);
    await storageService.set('playlists', updated);
  };

  const removeSongFromPlaylist = async (playlistId, songId) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songIds: p.songIds.filter(id => id !== songId) };
      }
      return p;
    });
    setPlaylists(updated);
    await storageService.set('playlists', updated);
  };

  const saveSchedules = async (newSchedules) => {
    setSchedules(newSchedules);
    await storageService.set('schedules', newSchedules);
  };

  return (
    <LibraryContext.Provider value={{
      songs, playlists, schedules,
      recentlyPlayed, listeningHistory,
      addMusic, renameSong, deleteSong,
      createPlaylist, deletePlaylist, renamePlaylist,
      addSongToPlaylist, removeSongFromPlaylist,
      saveSchedules,
      addToRecentlyPlayed, addToHistory,
      clearHistory, clearRecentlyPlayed,
      updateSongCover
    }}>
      {children}
    </LibraryContext.Provider>
  );
};
