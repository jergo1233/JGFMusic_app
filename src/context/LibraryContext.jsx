import React, { createContext, useState, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { deviceScanService } from '../services/deviceScanService';
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
    try {
      let s = await storageService.get('songs', []);
      // Remove any starter or demo songs so only genuine file manager MP3s are kept
      if (Array.isArray(s)) {
        s = s.filter(song => !song.id?.startsWith('starter_') && !song.id?.startsWith('scanned_'));
        
        // Strict deduplication to eliminate any cloned tracks
        const unique = [];
        const seenSignatures = new Set();
        for (const item of s) {
          if (!item || !item.title) continue;
          const cleanTitle = (item.title || '').trim().toLowerCase();
          const cleanArtist = (item.artist || '').trim().toLowerCase();
          const size = item.fileSize || 0;
          
          const primaryKey = `${cleanTitle}__${cleanArtist}__${size}`;
          const titleKey = `${cleanTitle}__${cleanArtist}`;
          
          if (!seenSignatures.has(primaryKey) && !seenSignatures.has(titleKey)) {
            seenSignatures.add(primaryKey);
            seenSignatures.add(titleKey);
            unique.push(item);
          }
        }
        s = unique;
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

      setSongs(s.sort((a, b) => (a?.title || '').localeCompare(b?.title || '')));
      setPlaylists(cleanPlaylists);
      setSchedules(Array.isArray(sched) ? sched : []);
      setRecentlyPlayed(recent);
      setListeningHistory(history);
    } catch (err) {
      console.error('Error loading library data:', err);
      setSongs([]);
      setPlaylists([]);
      setSchedules([]);
      setRecentlyPlayed([]);
      setListeningHistory([]);
    }
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
    // Retain only genuine existing songs
    const existingSongs = songs.filter(s => !s.id?.startsWith('scanned_') && !s.id?.startsWith('starter_'));
    const newSongs = [...existingSongs];
    const duplicates = [];
    let addedCount = 0;

    // Fast lookup signatures for duplicate detection
    const signatures = new Set();
    const registerSig = (title, artist, fileName, fileSize) => {
      const cleanT = (title || '').trim().toLowerCase();
      const cleanA = (artist || '').trim().toLowerCase();
      const cleanF = (fileName || '').replace(/\.[^/.]+$/, '').trim().toLowerCase();
      
      if (cleanT) {
        signatures.add(`title:${cleanT}`);
        if (cleanA) signatures.add(`title_artist:${cleanT}__${cleanA}`);
        if (fileSize) signatures.add(`title_size:${cleanT}__${fileSize}`);
      }
      if (cleanF) {
        signatures.add(`file:${cleanF}`);
        if (fileSize) signatures.add(`file_size:${cleanF}__${fileSize}`);
      }
    };

    // Pre-populate signatures with all existing songs
    for (const song of existingSongs) {
      registerSig(song.title, song.artist, song.title, song.fileSize);
    }

    // Process files sequentially to ensure zero race conditions and zero duplicate clones
    for (const fileObj of fileObjects) {
      if (!fileObj || !fileService.isAudioFile(fileObj)) continue;

      const fileName = fileObj.name || `track_${Date.now()}.mp3`;
      const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').trim().toLowerCase();
      const fileSize = fileObj.size || 0;

      // Check if file name + size already exists
      if (signatures.has(`file_size:${cleanBaseName}__${fileSize}`)) {
        duplicates.push(fileName);
        continue;
      }

      try {
        const metadata = await parseMetadata(fileObj);
        const candidateTitle = (metadata.title || cleanBaseName).trim().toLowerCase();
        const candidateArtist = (metadata.artist || 'Audio Track').trim().toLowerCase();

        // Check if title or title+artist or title+size already exists
        const isDuplicate = 
          signatures.has(`title:${candidateTitle}`) ||
          signatures.has(`title_artist:${candidateTitle}__${candidateArtist}`) ||
          (fileSize > 0 && signatures.has(`title_size:${candidateTitle}__${fileSize}`));

        if (isDuplicate) {
          duplicates.push(metadata.title || fileName);
          continue;
        }

        // Immediately reserve signature to prevent another file in the same selection from cloning it
        registerSig(metadata.title || cleanBaseName, metadata.artist, fileName, fileSize);

        // Save file to persistent storage only once verified unique
        const uri = await fileService.saveFileToPrivateStorage(fileObj, fileName);
        const newTrack = {
          id: generateId(),
          title: metadata.title || cleanBaseName,
          artist: metadata.artist || 'Audio Track',
          album: metadata.album || '',
          folder: metadata.folder || '',
          format: metadata.format || 'MP3',
          duration: metadata.duration || 0,
          fileSize: fileSize,
          fileUri: uri,
          artworkUri: metadata.artwork || null,
          dateAdded: Date.now() + Math.random()
        };

        newSongs.push(newTrack);
        addedCount++;
      } catch (e) {
        console.error("Failed to parse and add track:", e);
      }
    }

    if (addedCount > 0) {
      const sorted = newSongs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
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

  const scanAndPopulateLibrary = async (onProgress = null) => {
    const scannedSongs = await deviceScanService.scanDeviceAudio(onProgress);
    const existing = [...songs];
    let addedCount = 0;

    for (const song of scannedSongs) {
      const alreadyHas = existing.some(s => (s.title || '').toLowerCase() === (song.title || '').toLowerCase());
      if (!alreadyHas) {
        existing.push(song);
        addedCount++;
      }
    }

    const sorted = existing.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    setSongs(sorted);
    await storageService.set('songs', sorted);
    return { addedCount: addedCount > 0 ? addedCount : scannedSongs.length, total: sorted.length };
  };

  return (
    <LibraryContext.Provider value={{
      songs, playlists, schedules,
      recentlyPlayed, listeningHistory,
      addMusic, scanAndPopulateLibrary, renameSong, deleteSong,
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

/* JGFMusic v1.0.2 */
