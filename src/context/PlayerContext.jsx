import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { playbackService } from '../services/playbackService';
import { schedulerService, getNextScheduleDate } from '../services/schedulerService';
import { useLibrary } from './LibraryContext';
import { fileService } from '../services/fileService';
import { storageService } from '../services/storageService';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const { songs, playlists, schedules, saveSchedules, addToRecentlyPlayed, addToHistory } = useLibrary();

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
  const [scheduledAlarmPrompt, setScheduledAlarmPrompt] = useState(null);

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

  const playScheduledItem = async (sched, isUserGesture = false) => {
    if (!sched?.targetId) return;

    // Wake lock & audio context priming for background & lockscreen playback
    schedulerService.primeAudioKeepAlive();
    await schedulerService.requestWakeLock();

    let targetTitle = sched.title || 'Scheduled Music';
    let willPlaySong = null;
    let willPlayQueue = null;

    if (sched.type === 'song') {
      const targetSong = songs.find(s => s.id === sched.targetId);
      if (targetSong) {
        willPlaySong = targetSong;
        willPlayQueue = songs;
        targetTitle = targetSong.title;
      }
    } else if (sched.type === 'playlist') {
      const pl = playlists.find(p => p.id === sched.targetId);
      if (pl && pl.songIds && pl.songIds.length > 0) {
        const plSongs = pl.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
        if (plSongs.length > 0) {
          setCurrentPlaylist(plSongs);
          willPlaySong = plSongs[0];
          willPlayQueue = plSongs;
          targetTitle = pl.name;
        }
      }
    }

    if (!willPlaySong) return;

    // Alarm clock behavior: Ensure max volume and unmuted like a real phone alarm
    try {
      playbackService.setVolume(1.0);
      setVolumeState(1.0);
      setIsMuted(false);
      if (playbackService.audio) {
        playbackService.audio.muted = false;
      }
    } catch (e) {}

    // Start mobile phone vibration pattern
    schedulerService.triggerAlarmHaptics();

    // Play song directly from 0:00 (forceFromBeginning = true)
    const playResult = await playSong(willPlaySong, willPlayQueue, true);

    if (playResult && playResult.success) {
      schedulerService.stopBackgroundAlarmKeepAlive();
    } else {
      // If browser blocked audio playback while phone was asleep/locked, sound emergency alarm chime!
      schedulerService.playEmergencyAlarmTone();
    }

    // Always display the Phone Alarm Clock ringing screen with Snooze and Dismiss buttons
    setScheduledAlarmPrompt({
      id: sched.id || 'sched_' + Date.now(),
      targetId: sched.targetId,
      type: sched.type || 'song',
      title: targetTitle,
      time: sched.time || 'Now',
      song: willPlaySong,
      queue: willPlayQueue,
      scheduleItem: sched
    });
  };

  // Sync schedules with Service Worker & maintain WakeLock and silent audio keepalive when schedules are active
  useEffect(() => {
    if (schedules && schedules.length > 0) {
      schedulerService.syncWithServiceWorker(schedules);
      const hasActiveToday = schedules.some(s => s.enabled);
      if (hasActiveToday) {
        schedulerService.requestWakeLock();
        schedulerService.startBackgroundAlarmKeepAlive();
      } else {
        schedulerService.stopBackgroundAlarmKeepAlive();
      }

      // Invalidate triggered keys for schedules that were re-armed or updated with a new updatedAt
      triggeredRef.current.forEach(key => {
        const parts = key.split('_');
        const keyId = parts[0];
        const keyUpdatedTs = Number(parts[1]) || 0;
        const matched = schedules.find(s => s.id === keyId);
        if (!matched || !matched.enabled || (matched.updatedAt && matched.updatedAt > keyUpdatedTs)) {
          triggeredRef.current.delete(key);
        }
      });
    }
  }, [schedules]);

  // Re-acquire WakeLock and ensure keepalive is running whenever screen turns on or user switches tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const hasActiveToday = schedules && schedules.some(s => s.enabled);
        if (hasActiveToday) {
          schedulerService.requestWakeLock();
          schedulerService.startBackgroundAlarmKeepAlive();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [schedules]);

  // Listen for Service Worker background alarm auto-play messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (e) => {
        if (e.data && e.data.type === 'AUTO_PLAY_SCHEDULED') {
          console.log("Service Worker triggered auto-play:", e.data);
          playScheduledItem({
            targetId: e.data.targetId,
            type: e.data.targetType,
            title: e.data.title
          });
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, [songs, playlists]);

  // Check URL search parameter for scheduled play trigger on app open from notification
  useEffect(() => {
    if (songs.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const playScheduleId = params.get('playSchedule');
    const scheduleType = params.get('type') || 'song';
    if (playScheduleId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      playScheduledItem({ targetId: playScheduleId, type: scheduleType });
    }
  }, [songs, playlists]);

  // High-precision Schedule Watcher with Web Worker for unthrottled background/standby execution
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
      const nowTimestamp = now.getTime();

      const dayOfWeek = now.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      let schedulesUpdated = false;
      const updatedSchedules = [...schedules];

      schedules.forEach((sched, idx) => {
        if (!sched.enabled) return;

        let shouldTrigger = false;
        // The trigger key includes updatedAt so that editing or resetting the time starts a fresh trigger cycle!
        const schedKey = `${sched.id}_${sched.updatedAt || sched.createdAt || 0}_${todayStr}_${sched.time}`;
        const [sh, sm] = (sched.time || '00:00').split(':').map(Number);
        const schedDateToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0, 0);
        const schedTodayTimestamp = schedDateToday.getTime();

        // Safety: only catch up if the alarm was armed before or right around the alarm time
        const setBeforeAlarm = (sched.updatedAt || sched.createdAt || 0) <= (schedTodayTimestamp + 60000);
        const isDueNow = setBeforeAlarm && nowTimestamp >= schedTodayTimestamp && (nowTimestamp - schedTodayTimestamp) <= 15 * 60 * 1000;

        if (sched.repeat === 'daily') {
          if (!triggeredRef.current.has(schedKey) && (sched.time === timeStr || isDueNow)) {
            shouldTrigger = true;
            triggeredRef.current.add(schedKey);
          }
        } else if (sched.repeat === 'weekdays') {
          if (isWeekday && !triggeredRef.current.has(schedKey) && (sched.time === timeStr || isDueNow)) {
            shouldTrigger = true;
            triggeredRef.current.add(schedKey);
          }
        } else {
          // Once / Specific date
          if (!triggeredRef.current.has(schedKey)) {
            const isDateMatch = !sched.date || sched.date === todayStr;
            let targetTs = schedTodayTimestamp;
            if (sched.date) {
              const p = sched.date.split('-').map(Number);
              targetTs = new Date(p[0], p[1] - 1, p[2], sh, sm, 0, 0).getTime();
            }
            const setBeforeTarget = (sched.updatedAt || sched.createdAt || 0) <= (targetTs + 60000);
            const isPastDue = setBeforeTarget && nowTimestamp >= targetTs && (nowTimestamp - targetTs) <= 15 * 60 * 1000;

            if ((isDateMatch && sched.time === timeStr) || isPastDue) {
              shouldTrigger = true;
              triggeredRef.current.add(schedKey);
            }
          }
        }

        if (shouldTrigger) {
          console.log("Triggering scheduled music alarm:", sched.title);
          playScheduledItem(sched);

          // Handle schedule progression based on repeat mode
          if (sched.repeat === 'once' || !sched.repeat) {
            // One-time alarm completed: mark status completed, enabled: false
            updatedSchedules[idx] = {
              ...sched,
              enabled: false,
              status: 'completed',
              lastTriggered: nowTimestamp
            };
            schedulesUpdated = true;
          } else if (sched.repeat === 'daily') {
            // Daily: Automatically armed for next day!
            const nextTarget = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextDateStr = `${nextTarget.getFullYear()}-${String(nextTarget.getMonth() + 1).padStart(2, '0')}-${String(nextTarget.getDate()).padStart(2, '0')}`;
            updatedSchedules[idx] = {
              ...sched,
              date: nextDateStr,
              enabled: true,
              status: 'active',
              lastTriggered: nowTimestamp
            };
            schedulesUpdated = true;
          } else if (sched.repeat === 'weekdays') {
            // Weekdays: Automatically armed for next weekday!
            const nextTarget = getNextScheduleDate({ time: sched.time, repeat: 'weekdays' });
            const y = nextTarget.getFullYear();
            const m = String(nextTarget.getMonth() + 1).padStart(2, '0');
            const d = String(nextTarget.getDate()).padStart(2, '0');
            updatedSchedules[idx] = {
              ...sched,
              date: `${y}-${m}-${d}`,
              enabled: true,
              status: 'active',
              lastTriggered: nowTimestamp
            };
            schedulesUpdated = true;
          }
        }
      });

      if (schedulesUpdated && saveSchedules) {
        saveSchedules(updatedSchedules);
      }
    };

    let worker = null;
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => postMessage('tick'), 3000);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = () => {
        checkSchedules();
      };
      worker.postMessage('start');
    } catch (e) {
      console.warn('Worker ticker not available, fallback to standard timer', e);
    }

    const interval = setInterval(checkSchedules, 3000);
    return () => {
      clearInterval(interval);
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
    };
  }, [schedules, songs, playlists]);

  // Previous & Next Song (in Playlist & Library) + Auto-play Next Song when finished
  const handleNext = () => {
    const currentQ = (stateRef.current.queue && stateRef.current.queue.length > 0) 
      ? stateRef.current.queue 
      : stateRef.current.songs;
    const rMode = stateRef.current.repeatMode;

    if (rMode === 'song') {
      playbackService.seek(0);
      playbackService.play();
      setIsPlaying(true);
      return;
    }

    if (currentQ && currentQ.length > 0) {
      let curIdx = stateRef.current.currentIndex;
      if ((curIdx < 0 || curIdx >= currentQ.length) && stateRef.current.currentSong) {
        const matchIdx = currentQ.findIndex(s => s.id === stateRef.current.currentSong.id);
        if (matchIdx >= 0) curIdx = matchIdx;
      }
      if (curIdx < 0) curIdx = 0;
      let nextIdx = curIdx + 1;
      if (nextIdx >= currentQ.length) {
        nextIdx = 0; // Seamless loop back to top of queue
      }
      // Play next song in the established queue order without re-shuffling or resetting
      playSong(currentQ[nextIdx], null);
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

    if (currentQ && currentQ.length > 0) {
      let curIdx = stateRef.current.currentIndex;
      if ((curIdx < 0 || curIdx >= currentQ.length) && stateRef.current.currentSong) {
        const matchIdx = currentQ.findIndex(s => s.id === stateRef.current.currentSong.id);
        if (matchIdx >= 0) curIdx = matchIdx;
      }
      if (curIdx < 0) curIdx = 0;
      let prevIdx = curIdx - 1;
      if (prevIdx < 0) {
        prevIdx = currentQ.length - 1;
      }
      playSong(currentQ[prevIdx], null);
    }
  };

  useEffect(() => {
    playbackService.onTimeUpdate = (time) => setCurrentTime(time);
    playbackService.onLoadedMetadata = (dur) => setDuration(dur);
    playbackService.onEnded = handleNext; // Auto-play next song when current finishes!
    playbackService.onNext = handleNext;
    playbackService.onPrevious = handlePrevious;
  }, []);

  const updateQueue = (newQueue) => {
    if (!newQueue || !Array.isArray(newQueue) || newQueue.length === 0) return;
    setQueue(newQueue);
    stateRef.current.queue = newQueue;
    const activeSong = stateRef.current.currentSong || currentSong;
    if (activeSong) {
      const idx = newQueue.findIndex(s => s.id === activeSong.id);
      const newIdx = idx >= 0 ? idx : 0;
      setCurrentIndex(newIdx);
      stateRef.current.currentIndex = newIdx;
    }
  };

  const playSong = async (song, sourceQueue = null, forceFromBeginning = false) => {
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
    const resolvedIndex = foundIdx >= 0 ? foundIdx : 0;
    setCurrentIndex(resolvedIndex);
    setCurrentSong(song);

    // Keep stateRef immediately fresh for any incoming next callbacks
    stateRef.current.queue = activeQueue;
    stateRef.current.currentIndex = resolvedIndex;
    stateRef.current.currentSong = song;

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
      await playbackService.load(url, song, forceFromBeginning);
      if (forceFromBeginning) {
        playbackService.seek(0);
        setCurrentTime(0);
      }
      const playResult = await playbackService.play();
      if (playResult && playResult.success) {
        setIsPlaying(true);
        return { success: true };
      } else {
        setIsPlaying(false);
        return { success: false, error: playResult?.error };
      }
    } catch (e) {
      console.error("Failed to play", e);
      setIsPlaying(false);
      return { success: false, error: e };
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      playbackService.pause();
      setIsPlaying(false);
    } else {
      const res = await playbackService.play();
      if (res && res.success) {
        setIsPlaying(true);
      }
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

  const confirmScheduledPlay = async () => {
    // User chooses "Keep Playing Music"
    schedulerService.stopAlarmHaptics();
    if (scheduledAlarmPrompt?.song && !isPlaying) {
      await playSong(scheduledAlarmPrompt.song, scheduledAlarmPrompt.queue);
    }
    setScheduledAlarmPrompt(null);
  };

  const dismissScheduledAlarmPrompt = () => {
    // User stops the alarm
    schedulerService.stopAlarmHaptics();
    playbackService.pause();
    setIsPlaying(false);
    setScheduledAlarmPrompt(null);

    const hasActive = schedules && schedules.some(s => s.enabled);
    if (hasActive) {
      schedulerService.startBackgroundAlarmKeepAlive();
    }
  };

  const snoozeScheduledAlarm = (prompt) => {
    schedulerService.stopAlarmHaptics();
    playbackService.pause();
    setIsPlaying(false);
    setScheduledAlarmPrompt(null);

    // Snooze for 5 minutes
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
    const sh = String(snoozeTime.getHours()).padStart(2, '0');
    const sm = String(snoozeTime.getMinutes()).padStart(2, '0');
    const snoozeTimeStr = `${sh}:${sm}`;
    const snoozeDateStr = `${snoozeTime.getFullYear()}-${String(snoozeTime.getMonth() + 1).padStart(2, '0')}-${String(snoozeTime.getDate()).padStart(2, '0')}`;

    const newSnoozeItem = {
      id: 'snooze_' + Date.now(),
      targetId: prompt?.targetId || (prompt?.song ? prompt.song.id : ''),
      type: prompt?.type || 'song',
      title: `(Snooze) ${prompt?.title || 'Music Alarm'}`,
      time: snoozeTimeStr,
      date: snoozeDateStr,
      repeat: 'once',
      enabled: true,
      autoRenew: false
    };

    const newSchedules = [...schedules, newSnoozeItem];
    if (saveSchedules) {
      saveSchedules(newSchedules);
    }
    schedulerService.syncWithServiceWorker(newSchedules);
    schedulerService.startBackgroundAlarmKeepAlive();
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, currentTime, duration,
      volume, isMuted, changeVolume, toggleMute,
      repeatMode, shuffleMode, queue, currentIndex,
      updateQueue,
      playSong, togglePlay, handleNext, handlePrevious,
      seek, toggleRepeat, toggleShuffle, setCurrentPlaylist, closePlayer,
      playScheduledItem,
      scheduledAlarmPrompt,
      confirmScheduledPlay,
      dismissScheduledAlarmPrompt,
      snoozeScheduledAlarm
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

/* JGFMusic v1.0.2 */
