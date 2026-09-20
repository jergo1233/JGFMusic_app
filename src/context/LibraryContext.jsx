import React, { createContext, useState, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { generateId } from '../utils/format';
import { parseMetadata } from '../services/metadataService';

const LibraryContext = createContext();

export const useLibrary = () => useContext(LibraryContext);

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
    let s = await storageService.get('songs', []);
    // Remove any previously seeded starter songs
    if (Array.isArray(s)) {
      s = s.filter(song => !song.id?.startsWith('starter_'));
      await storageService.set('songs', s);
    } else {
      s = [];
      await storageService.set('songs', []);
    }

    const p = await storageService.get('playlists', []);
    const cleanPlaylists = (Array.isArray(p) ? p : [])
      .filter(pl => pl.id !== 'pl_starter_1')
      .map(pl => ({
        ...pl,
        songIds: (pl.songIds || []).filter(id => !id?.startsWith('starter_'))
      }));
    await storageService.set('playlists', cleanPlaylists);

    const sched = await storageService.get('schedules', []);

    let recent = await storageService.get('recentlyPlayed', []);
    if (Array.isArray(recent)) {
      recent = recent.filter(song => !song.id?.startsWith('starter_'));
      await storageService.set('recentlyPlayed', recent);
    } else {
      recent = [];
      await storageService.set('recentlyPlayed', []);
    }

    let history = await storageService.get('listeningHistory', []);
    if (Array.isArray(history)) {
      history = history.filter(item => !item.songId?.startsWith('starter_'));
      await storageService.set('listeningHistory', history);
    } else {
      history = [];
      await storageService.set('listeningHistory', []);
    }

    setSongs(s.sort((a, b) => a.title.localeCompare(b.title)));
    setPlaylists(cleanPlaylists);
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
    const duplicates = [];
    let addedCount = 0;

    for (const fileObj of fileObjects) {
      try {
        const metadata = await parseMetadata(fileObj);
        const fileName = fileObj.name || `track_${Date.now()}.mp3`;
        const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').trim().toLowerCase();
        const candidateTitle = (metadata.title || '').trim().toLowerCase();

        // Duplicate Check: compare against existing songs and newly added files in current batch
        const isDuplicate = newSongs.some(existing => {
          const existingTitle = (existing.title || '').trim().toLowerCase();
          const titleMatches = existingTitle === candidateTitle || existingTitle === cleanBaseName;
          const sizeMatches = existing.fileSize && fileObj.size && existing.fileSize === fileObj.size;
          return titleMatches || (sizeMatches && Math.abs((existing.duration || 0) - (metadata.duration || 0)) <= 2);
        });

        if (isDuplicate) {
          duplicates.push(metadata.title || fileName);
          continue; // Block duplicate from being added
        }

        const uri = await fileService.saveFileToPrivateStorage(fileObj, fileName);

        const song = {
          id: generateId(),
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          fileSize: fileObj.size || 0,
          fileUri: uri,
          artworkUri: metadata.artwork,
          dateAdded: Date.now()
        };
        newSongs.push(song);
        addedCount++;
      } catch (e) {
        console.error("Failed to add song", e);
      }
    }

    if (addedCount > 0) {
      const sorted = newSongs.sort((a, b) => a.title.localeCompare(b.title));
      setSongs(sorted);
      await storageService.set('songs', sorted);
    }

    return {
      success: addedCount > 0,
      addedCount,
      duplicates,
      totalPicked: fileObjects.length
    };
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
