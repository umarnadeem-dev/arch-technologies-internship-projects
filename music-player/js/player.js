/**
 * player.js — Music Player Engine
 * 
 * Encapsulates the HTML5 Audio API in a clean MusicPlayer class.
 * Handles playback, volume, seeking, and auto-advancement.
 * Communicates state changes via callback functions.
 */

class MusicPlayer {
  constructor() {
    /** @type {HTMLAudioElement} */
    this.audio = new Audio();

    /** Index of the currently loaded song in the active playlist */
    this.currentIndex = 0;

    /** Whether audio is currently playing */
    this.isPlaying = false;

    /** The active playlist (may be a filtered subset of SONGS) */
    this.playlist = [...SONGS];

    // --- Callback hooks (set by app.js) ---
    this.onPlay = null;
    this.onPause = null;
    this.onTimeUpdate = null;
    this.onSongChange = null;
    this.onSongEnd = null;

    /** Consecutive load-failure counter (prevents infinite skip loops) */
    this._failCount = 0;

    // --- Callback hooks (set by app.js) ---
    this.onError = null;

    // --- Bind internal event listeners ---
    this.audio.addEventListener("timeupdate", () => this._handleTimeUpdate());
    this.audio.addEventListener("ended", () => this._handleSongEnd());
    this.audio.addEventListener("loadedmetadata", () => this._handleMetadataLoaded());
    this.audio.addEventListener("error", () => this._handleError());

    // Reset fail counter on successful playback
    this.audio.addEventListener("playing", () => { this._failCount = 0; });

    // Set default volume
    this.audio.volume = 0.7;
  }

  // ─── Public API ────────────────────────────────────────────

  /**
   * Load a song by its index in the current playlist.
   * @param {number} index — position in this.playlist
   */
  loadSong(index) {
    if (index < 0 || index >= this.playlist.length) return;

    this.currentIndex = index;
    const song = this.playlist[index];
    this.audio.src = song.src;
    this.audio.load();

    // Notify UI of song change
    if (this.onSongChange) {
      this.onSongChange(song, index);
    }
  }

  /** Play the currently loaded song. */
  playSong() {
    const playPromise = this.audio.play();

    // Handle autoplay restrictions gracefully
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          if (this.onPlay) this.onPlay();
        })
        .catch((err) => {
          console.warn("Playback was prevented:", err.message);
        });
    }
  }

  /** Pause the currently playing song. */
  pauseSong() {
    this.audio.pause();
    this.isPlaying = false;
    if (this.onPause) this.onPause();
  }

  /** Toggle between play and pause. */
  togglePlay() {
    if (this.isPlaying) {
      this.pauseSong();
    } else {
      this.playSong();
    }
  }

  /** Advance to the next song, wrapping around at the end. */
  nextSong() {
    let next = this.currentIndex + 1;
    if (next >= this.playlist.length) next = 0;
    this.loadSong(next);
    this.playSong();
  }

  /** Go to the previous song, wrapping around at the start. */
  prevSong() {
    let prev = this.currentIndex - 1;
    if (prev < 0) prev = this.playlist.length - 1;
    this.loadSong(prev);
    this.playSong();
  }

  /**
   * Set the playback volume.
   * @param {number} value — a float between 0 and 1
   */
  setVolume(value) {
    this.audio.volume = Math.max(0, Math.min(1, value));
  }

  /**
   * Seek to a position in the current track.
   * @param {number} percent — 0 to 100
   */
  seekTo(percent) {
    if (this.audio.duration) {
      this.audio.currentTime = (percent / 100) * this.audio.duration;
    }
  }

  /**
   * Update the active playlist (used when filtering by category or search).
   * Resets to the first song in the new playlist.
   * @param {Array} songs — filtered array of song objects
   */
  setPlaylist(songs) {
    this.playlist = songs;
  }

  /** Get the currently loaded song object, or null. */
  getCurrentSong() {
    return this.playlist[this.currentIndex] || null;
  }

  // ─── Internal Event Handlers ───────────────────────────────

  /** Fires continuously during playback — updates the progress bar. */
  _handleTimeUpdate() {
    if (!this.audio.duration) return;

    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration;
    const percent = (currentTime / duration) * 100;

    if (this.onTimeUpdate) {
      this.onTimeUpdate(currentTime, duration, percent);
    }
  }

  /** Fires when the current track ends — auto-advance. */
  _handleSongEnd() {
    if (this.onSongEnd) this.onSongEnd();
    this.nextSong();
  }

  /** Fires when audio metadata is available. */
  _handleMetadataLoaded() {
    // Duration is now available for the progress bar
  }

  /**
   * Fires when the audio source fails to load.
   * Logs the error and skips to the next song (with loop protection).
   */
  _handleError() {
    const song = this.getCurrentSong();
    const songDesc = song ? `"${song.title}" by ${song.artist}` : `index ${this.currentIndex}`;
    console.error(`[VibePlayer] Failed to load ${songDesc}`);

    // Notify UI of the error
    if (this.onError) {
      this.onError(song, this.currentIndex);
    }

    this._failCount++;

    // If every song in the playlist has failed, stop trying
    if (this._failCount >= this.playlist.length) {
      console.error("[VibePlayer] All songs failed to load. Stopping playback.");
      this._failCount = 0;
      return;
    }

    // Auto-skip to the next song
    this.nextSong();
  }
}
