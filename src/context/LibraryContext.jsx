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
    try {
      let s = await storageService.get('songs', []);
      // STRICT: Completely purge any demo, starter, or synthetic tracks so ONLY genuine user files remain!
      if (Array.isArray(s)) {
        s = s.filter(song => 
          !song.id?.startsWith('starter_') && 
          !song.id?.startsWith('scanned_') && 
          !song.id?.startsWith('device_mp3_')
        );
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
          songIds: (pl.songIds || []).filter(id => 
            !id?.startsWith('starter_') && 
            !id?.startsWith('scanned_') && 
            !id?.startsWith('device_mp3_')
          )
        }));
      await storageService.set('playlists', cleanPlaylists);

      const sched = await storageService.get('schedules', []);

      let recent = await storageService.get('recentlyPlayed', []);
      if (Array.isArray(recent)) {
        recent = recent.filter(song => 
          !song.id?.startsWith('starter_') && 
          !song.id?.startsWith('scanned_') && 
          !song.id?.startsWith('device_mp3_')
        );
        await storageService.set('recentlyPlayed', recent);
      } else {
        recent = [];
        await storageService.set('recentlyPlayed', []);
      }

      let history = await storageService.get('listeningHistory', []);
      if (Array.isArray(history)) {
        history = history.filter(item => 
          !item.songId?.startsWith('starter_') && 
          !item.songId?.startsWith('scanned_') && 
          !item.songId?.startsWith('device_mp3_')
        );
        await storageService.set('listeningHistory', history);
      } else {
        history = [];
        await storageService.set('listeningHistory', []);
      }

      setSongs(s);
      setPlaylists(cleanPlaylists);
      setSchedules(Array.isArray(sched) ? sched : []);
      setRecentlyPlayed(recent);
      setListeningHistory(history);
    } catch (e) {
      console.error("Failed to load library data", e);
    }
  };

  const addToRecentlyPlayed = async (song) => {
    if (!song) return;
    const filtered = recentlyPlayed.filter(s => s.id !== song.id);
    const updated = [song, ...filtered].slice(0, 30);
    setRecentlyPlayed(updated);
    await storageService.set('recentlyPlayed', updated);
  };

  const addToHistory = async (song) => {
    if (!song) return;
    const historyItem = {
      id: generateId(),
      songId: song.id,
      title: song.title,
      artist: song.artist,
      playedAt: Date.now()
    };
    const updated = [historyItem, ...listeningHistory].slice(0, 100);
    setListeningHistory(updated);
    await storageService.set('listeningHistory', updated);
  };

  const clearHistory = async () => {
    setListeningHistory([]);
    await storageService.set('listeningHistory', []);
  };

  const clearRecentlyPlayed = async () => {
    setRecentlyPlayed([]);
    await storageService.set('recentlyPlayed', []);
  };

  const updateSongCover = async (songId, imageFile) => {
    if (!songId || !imageFile) return false;
    
    const uniqueCoverName = `cover_${Date.now()}_${imageFile.name || 'cover.jpg'}`;
    const uri = await fileService.saveFileToPrivateStorage(imageFile, uniqueCoverName);
    const finalArtworkUrl = await fileService.getFileUrl(uri);

    const updated = songs.map(s => {
      if (s.id === songId) {
        return { ...s, artworkUri: finalArtworkUrl };
      }
      return s;
    });

    setSongs(updated);
    await storageService.set('songs', updated);

    const updatedRecently = recentlyPlayed.map(s => {
      if (s.id === songId) {
        return { ...s, artworkUri: finalArtworkUrl };
      }
      return s;
    });
    setRecentlyPlayed(updatedRecently);
    await storageService.set('recentlyPlayed', updatedRecently);

    return true;
  };

  /**
   * Adds genuine MP3 files from the device File Manager.
   * Strictly verifies that ONLY MP3 files are admitted!
   */
  const addMusic = async (fileObjects) => {
    if (!fileObjects || fileObjects.length === 0) {
      return { success: false, addedCount: 0, duplicates: [], rejectedNonMp3: 0 };
    }

    // STRICT CHECK: Filter only genuine MP3 files (.mp3 extension or audio/mpeg)
    const mp3Files = fileObjects.filter(f => fileService.isMp3File(f));
    const rejectedCount = fileObjects.length - mp3Files.length;

    const newSongs = songs.filter(s => 
      !s.id?.startsWith('scanned_') && 
      !s.id?.startsWith('starter_') && 
      !s.id?.startsWith('device_mp3_')
    );
    const duplicates = [];
    let addedCount = 0;

    const BATCH_SIZE = 15;
    for (let i = 0; i < mp3Files.length; i += BATCH_SIZE) {
      const batch = mp3Files.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (fileObj) => {
          try {
            const metadata = await parseMetadata(fileObj);
            const fileName = fileObj.name || `track_${Date.now()}.mp3`;
            const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').trim().toLowerCase();
            const candidateTitle = (metadata.title || '').trim().toLowerCase();

            // Duplicate Check
            const isDuplicate = newSongs.some(existing => {
              const existingTitle = (existing.title || '').trim().toLowerCase();
              const titleMatches = existingTitle === candidateTitle || existingTitle === cleanBaseName;
              const sizeMatches = existing.fileSize && fileObj.size && existing.fileSize === fileObj.size;
              return titleMatches || (sizeMatches && Math.abs((existing.duration || 0) - (metadata.duration || 0)) <= 2);
            });

            if (isDuplicate) {
              return { isDuplicate: true, title: metadata.title || fileName };
            }

            const uri = await fileService.saveFileToPrivateStorage(fileObj, fileName);
            return {
              song: {
                id: generateId(),
                title: metadata.title || cleanBaseName,
                artist: metadata.artist || 'Audio Track',
                album: metadata.album || '',
                folder: metadata.folder || '',
                format: 'MP3',
                duration: metadata.duration || 0,
                fileSize: fileObj.size || 0,
                fileUri: uri,
                artworkUri: metadata.artwork || null,
                dateAdded: Date.now() + Math.random()
              }
            };
          } catch (e) {
            console.error("Failed to add song", e);
            return null;
          }
        })
      );

      for (const res of batchResults) {
        if (!res) continue;
        if (res.isDuplicate) {
          duplicates.push(res.title);
        } else if (res.song) {
          newSongs.push(res.song);
          addedCount++;
        }
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
      rejectedCount,
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

/* JGFMusic v1.0.2 */
