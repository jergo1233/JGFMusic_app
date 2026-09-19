import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { playbackService } from '../services/playbackService';
import { useLibrary } from './LibraryContext';
import { fileService } from '../services/fileService';
import { storageService } from '../services/storageService';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const { songs, playlists, schedules, addToRecentlyPlayed, addToHistory } = useLibrary();

  const [currentSong, setCurrentSong] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null); // array of songs or null for library
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'playlist', 'song'
  const [shuffleMode, setShuffleMode] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const triggeredRef = useRef(new Set());
  const stateRef = useRef({
    queue: [],
    currentIndex: -1,
    repeatMode: 'off',
    shuffleMode: false,
    songs: [],
    currentSong: null
  });

  // Keep stateRef fresh for audio callbacks
  useEffect(() => {
    stateRef.current = {
      queue,
      currentIndex,
      repeatMode,
      shuffleMode,
      songs,
      currentSong
    };
  }, [queue, currentIndex, repeatMode, shuffleMode, songs, currentSong]);

  // Load persisted volume on startup
  useEffect(() => {
    storageService.get('playerVolume', 1).then(v => {
      const vol = typeof v === 'number' ? v : 1;
      setVolumeState(vol);
      setIsMuted(vol === 0);
      playbackService.setVolume(vol);
    });
  }, []);

  // Update currentSong if song details (like artwork) change in Library
  useEffect(() => {
    if (currentSong && songs.length > 0) {
      const match = songs.find(s => s.id === currentSong.id);
      if (match && match.artworkUri !== currentSong.artworkUri) {
        setCurrentSong(match);
      }
    }
  }, [songs, currentSong]);

  // Automatic schedule watcher for in-app trigger
  useEffect(() => {
    const checkSchedules = () => {
      if (!schedules || schedules.length === 0) return;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDate = String(now.getDate()).padStart(2, '0');
      const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMins}`;

      schedules.forEach(sched => {
        if (!sched.enabled) return;
        const schedKey = `${sched.id}_${sched.date}_${sched.time}`;
        if (triggeredRef.current.has(schedKey)) return;

        if (sched.date === todayStr && sched.time === timeStr) {
          triggeredRef.current.add(schedKey);
          console.log("Triggering scheduled music:", sched.title);
          playScheduledItem(sched);
        }
      });
    };
    const interval = setInterval(checkSchedules, 4000);
    return () => clearInterval(interval);
  }, [schedules, songs, playlists]);

  const playScheduledItem = (sched) => {
    if (!sched?.targetId) return;
    if (sched.type === 'song') {
      const targetSong = songs.find(s => s.id === sched.targetId);
      if (targetSong) {
        playSong(targetSong, songs);
      }
    } else if (sched.type === 'playlist') {
      const pl = playlists.find(p => p.id === sched.targetId);
      if (pl && pl.songIds && pl.songIds.length > 0) {
        const plSongs = pl.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
        if (plSongs.length > 0) {
          setCurrentPlaylist(plSongs);
          playSong(plSongs[0], plSongs);
        }
      }
    }
  };

  // Previous & Next Song (in Playlist & Library) + Auto-play Next Song when finished
  const handleNext = () => {
    const currentQ = (stateRef.current.queue && stateRef.current.queue.length > 0) 
      ? stateRef.current.queue 
      : stateRef.current.songs;
    const curIdx = stateRef.current.currentIndex;
    const rMode = stateRef.current.repeatMode;

    if (rMode === 'song') {
      playbackService.seek(0);
      playbackService.play();
      setIsPlaying(true);
      return;
    }

    if (currentQ && currentQ.length > 0) {
      let nextIdx = curIdx + 1;
      if (nextIdx >= currentQ.length) {
        nextIdx = 0; // Seamless loop back to top of queue
      }
      playSong(currentQ[nextIdx], currentQ);
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrevious = () => {
    if (playbackService.audio.currentTime > 3) {
      playbackService.seek(0);
      return;
    }
    const currentQ = (stateRef.current.queue && stateRef.current.queue.length > 0) 
      ? stateRef.current.queue 
      : stateRef.current.songs;
    const curIdx = stateRef.current.currentIndex;

    if (currentQ && currentQ.length > 0) {
      let prevIdx = curIdx - 1;
      if (prevIdx < 0) {
        prevIdx = currentQ.length - 1;
      }
      playSong(currentQ[prevIdx], currentQ);
      setCurrentIndex(prevIdx);
    }
  };

  useEffect(() => {
    playbackService.onTimeUpdate = (time) => setCurrentTime(time);
    playbackService.onLoadedMetadata = (dur) => setDuration(dur);
    playbackService.onEnded = handleNext; // Auto-play next song when current finishes!
    playbackService.onNext = handleNext;
    playbackService.onPrevious = handlePrevious;
  }, []);

  const playSong = async (song, sourceQueue = null) => {
    if (!song) return;

    let activeQueue = sourceQueue || (queue.length > 0 ? queue : songs);
    if (!activeQueue || activeQueue.length === 0) {
      activeQueue = [song];
    }

    if (shuffleMode && sourceQueue) {
      let q = [...sourceQueue];
      q = q.sort(() => Math.random() - 0.5);
      q = [song, ...q.filter(s => s.id !== song.id)];
      activeQueue = q;
    }

    setQueue(activeQueue);
    const foundIdx = activeQueue.findIndex(s => s.id === song.id);
    setCurrentIndex(foundIdx >= 0 ? foundIdx : 0);
    setCurrentSong(song);

    // Automatically remember recently played song
    if (addToRecentlyPlayed) {
      addToRecentlyPlayed(song);
    }
    // Track listening history
    if (addToHistory) {
      addToHistory(song);
    }

    try {
      const url = await fileService.getFileUrl(song.fileUri);
      await playbackService.load(url, song);
      playbackService.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Failed to play", e);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      playbackService.pause();
      setIsPlaying(false);
    } else {
      playbackService.play();
      setIsPlaying(true);
    }
  };

  const seek = (time) => {
    playbackService.seek(time);
    setCurrentTime(time);
  };

  const changeVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    playbackService.setVolume(clamped);
    storageService.set('playerVolume', clamped);
  };

  const toggleMute = () => {
    const newVol = playbackService.toggleMute();
    setVolumeState(newVol);
    setIsMuted(newVol === 0);
    storageService.set('playerVolume', newVol);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'playlist', 'song'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
    playbackService.setRepeat(nextMode);
  };

  const toggleShuffle = () => {
    setShuffleMode(!shuffleMode);
    if (!shuffleMode && queue.length > 0) {
      const remaining = queue.slice(currentIndex + 1).sort(() => Math.random() - 0.5);
      setQueue([...queue.slice(0, currentIndex + 1), ...remaining]);
    }
  };

  const closePlayer = () => {
    playbackService.pause();
    setCurrentSong(null);
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, currentTime, duration,
      volume, isMuted, changeVolume, toggleMute,
      repeatMode, shuffleMode, queue, currentIndex,
      playSong, togglePlay, handleNext, handlePrevious,
      seek, toggleRepeat, toggleShuffle, setCurrentPlaylist, closePlayer,
      playScheduledItem
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
