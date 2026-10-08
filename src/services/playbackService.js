class PlaybackService {
  constructor() {
    this.audio = new Audio();
    this.currentUrl = null;
    this.audio.volume = 1;
    this.lastNonZeroVolume = 1;
    this.endedDispatched = false;

    // Normal audio ended event
    this.audio.addEventListener('ended', () => {
      if (!this.endedDispatched) {
        this.endedDispatched = true;
        if (this.onEnded) this.onEnded();
      }
    });

    // Reset dispatched flag whenever a track begins playing
    this.audio.addEventListener('play', () => {
      this.endedDispatched = false;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    });

    this.audio.addEventListener('pause', () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      const cur = this.audio.currentTime || 0;
      const dur = this.audio.duration || 0;
      if (this.onTimeUpdate) this.onTimeUpdate(cur);

      // Re-arm ended trigger if seeked back
      if (dur > 0 && cur < dur - 1.2) {
        this.endedDispatched = false;
      }

      // Safeguard for mobile browsers or audio streams where 'ended' event could be dropped:
      if (
        !this.endedDispatched &&
        dur > 0 &&
        cur >= dur - 0.25 &&
        !this.audio.paused
      ) {
        this.endedDispatched = true;
        if (this.onEnded) {
          this.onEnded();
        }
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.onLoadedMetadata) this.onLoadedMetadata(this.audio.duration || 0);
    });

    // Audio error handling: notify so PlayerContext can auto-skip unplayable/corrupt files
    this.audio.addEventListener('error', (e) => {
      console.warn('Playback audio element error:', e);
      if (this.onError) {
        this.onError(e);
      }
    });

    this.setupMediaSession();
  }

  setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.onPrevious) this.onPrevious();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.onNext) this.onNext();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in this.audio) {
          this.audio.fastSeek(details.seekTime);
        } else {
          this.seek(details.seekTime);
        }
      });
    }
  }

  updateMediaSessionMetadata(song) {
    if ('mediaSession' in navigator && song) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title || 'Track',
          artist: song.artist || 'Audio Track',
          album: song.album || song.folder || 'Music Library',
          artwork: song.artworkUri ? [
            { src: song.artworkUri, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });
      } catch (e) {
        console.warn('MediaSession metadata error:', e);
      }
    }
  }

  primeAudio() {
    try {
      if (this.audio) {
        this.audio.muted = false;
      }
    } catch (e) {}
  }

  async load(url, song, forceFromBeginning = false) {
    this.endedDispatched = false;
    if (this.currentUrl !== url) {
      // Clean up previous blob URL if needed to prevent memory leaks
      if (this.currentUrl && this.currentUrl.startsWith('blob:') && this.currentUrl !== url) {
        try {
          URL.revokeObjectURL(this.currentUrl);
        } catch (e) {}
      }
      this.audio.src = url;
      this.currentUrl = url;
    }

    if (forceFromBeginning) {
      try {
        this.audio.currentTime = 0;
      } catch (e) {}
    }

    if (song) {
      this.updateMediaSessionMetadata(song);
    }
  }

  async play() {
    try {
      this.audio.muted = false;

      // Ensure audio element has loaded metadata/data before requesting play
      if (this.audio.readyState < 2 && this.audio.src) {
        await new Promise((resolve) => {
          let finished = false;
          const done = () => {
            if (!finished) {
              finished = true;
              cleanup();
              resolve();
            }
          };
          const cleanup = () => {
            this.audio.removeEventListener('canplay', done);
            this.audio.removeEventListener('loadeddata', done);
            this.audio.removeEventListener('error', done);
            clearTimeout(timer);
          };
          const timer = setTimeout(done, 600);
          this.audio.addEventListener('canplay', done, { once: true });
          this.audio.addEventListener('loadeddata', done, { once: true });
          this.audio.addEventListener('error', done, { once: true });
        });
      }

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      return { success: true };
    } catch (e) {
      console.warn("Playback autoplay/play caught:", e);
      // If play request was interrupted by rapid source switch, retry once
      if (e.name === 'AbortError') {
        try {
          await new Promise(r => setTimeout(r, 120));
          await this.audio.play();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
          return { success: true };
        } catch (retryErr) {
          return { success: false, error: retryErr };
        }
      }
      return { success: false, error: e };
    }
  }

  pause() {
    this.audio.pause();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  seek(time) {
    const safeDuration = this.audio.duration || Infinity;
    const safeTime = Math.max(0, Math.min(time, safeDuration));
    this.audio.currentTime = safeTime;
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.audio.volume = clamped;
    if (clamped > 0) {
      this.lastNonZeroVolume = clamped;
      this.audio.muted = false;
    }
  }

  getVolume() {
    return this.audio.volume;
  }

  toggleMute() {
    if (this.audio.volume > 0) {
      this.lastNonZeroVolume = this.audio.volume;
      this.audio.volume = 0;
      return 0;
    } else {
      const restored = this.lastNonZeroVolume || 0.8;
      this.audio.volume = restored;
      return restored;
    }
  }

  setRepeat(repeatMode) {
    // Mode: 'off', 'all', 'song'
    this.audio.loop = (repeatMode === 'song');
  }
}

export const playbackService = new PlaybackService();

/* JGFMusic v1.0.2 */
