class PlaybackService {
  constructor() {
    this.audio = new Audio();
    this.currentUrl = null;
    this.audio.volume = 1;
    this.lastNonZeroVolume = 1;

    this.audio.addEventListener('ended', () => {
      if (this.onEnded) this.onEnded();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) this.onTimeUpdate(this.audio.currentTime);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.onLoadedMetadata) this.onLoadedMetadata(this.audio.duration);
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
          artist: song.artist || 'Artist',
          album: song.album || 'Album',
          artwork: song.artworkUri ? [
            { src: song.artworkUri, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });
      } catch (e) {
        console.warn('MediaSession metadata error:', e);
      }
    }
  }

  async load(url, song) {
    if (this.currentUrl !== url) {
      this.audio.src = url;
      this.audio.load();
      this.currentUrl = url;
    }
    if (song) {
      this.updateMediaSessionMetadata(song);
    }
  }

  play() {
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn("Playback autoplay/play caught:", e);
      });
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
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
    // Mode: 'off', 'playlist', 'song'
    this.audio.loop = (repeatMode === 'song');
  }
}

export const playbackService = new PlaybackService();
