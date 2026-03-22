/**
 * app.js — UI Controller & Event Wiring
 * 
 * Connects the MusicPlayer engine to the DOM.
 * Handles playlist rendering, category filtering, live search,
 * player controls, and responsive sidebar toggle.
 */

// ─── Initialize Player ──────────────────────────────────────

const player = new MusicPlayer();

// ─── DOM References ──────────────────────────────────────────

const playlistContainer = document.getElementById("playlist");
const searchInput = document.getElementById("search-input");
const categoryButtons = document.querySelectorAll(".category-btn");
const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressThumb = document.getElementById("progress-thumb");
const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");
const volumeSlider = document.getElementById("volume-slider");
const volumeFill = document.getElementById("volume-fill");
const volumeIcon = document.getElementById("volume-icon");
const albumArt = document.getElementById("album-art");
const heroAlbumArt = document.getElementById("hero-album-art");
const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const heroTitle = document.getElementById("hero-title");
const heroArtist = document.getElementById("hero-artist");
const hamburgerBtn = document.getElementById("hamburger-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

// ─── State ───────────────────────────────────────────────────

let activeCategory = "All";
let searchQuery = "";
let currentSongId = null;

// ─── Playlist Rendering ─────────────────────────────────────

/**
 * Render the playlist in the sidebar based on current filters.
 * @param {Array} songs — array of song objects to display
 */
function renderPlaylist(songs) {
  playlistContainer.innerHTML = "";

  if (songs.length === 0) {
    playlistContainer.innerHTML = `
      <div class="playlist-empty">
        <i class="fas fa-music"></i>
        <p>No songs found</p>
      </div>
    `;
    return;
  }

  songs.forEach((song, index) => {
    const item = document.createElement("div");
    item.classList.add("playlist-item");
    if (song.id === currentSongId) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <img src="${song.cover}" alt="${song.title}" class="playlist-item-cover"
           onerror="this.src='https://placehold.co/48x48/1a1a2e/e0e0e0?text=♪'" />
      <div class="playlist-item-info">
        <span class="playlist-item-title">${song.title}</span>
        <span class="playlist-item-artist">${song.artist}</span>
      </div>
      <span class="playlist-item-duration"></span>
    `;

    // Click to play this song
    item.addEventListener("click", () => {
      // Find the index in the player's current playlist
      const playerIndex = player.playlist.findIndex((s) => s.id === song.id);
      if (playerIndex !== -1) {
        player.loadSong(playerIndex);
        player.playSong();
      }
      // Close sidebar on mobile after selecting
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });

    playlistContainer.appendChild(item);
  });
}

/**
 * Get filtered songs based on active category and search query.
 * @returns {Array} filtered song list
 */
function getFilteredSongs() {
  let filtered = [...SONGS];

  // Filter by category
  if (activeCategory !== "All") {
    filtered = filtered.filter((s) => s.category === activeCategory);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }

  return filtered;
}

/** Re-filter and re-render the playlist. */
function updatePlaylist() {
  const filtered = getFilteredSongs();
  player.setPlaylist(filtered);
  renderPlaylist(filtered);
}

// ─── Category Filtering ─────────────────────────────────────

categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update active state on buttons
    categoryButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    activeCategory = btn.dataset.category;
    updatePlaylist();
  });
});

// ─── Live Search ─────────────────────────────────────────────

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  updatePlaylist();
});

// ─── Player Controls ─────────────────────────────────────────

playPauseBtn.addEventListener("click", () => {
  if (!player.getCurrentSong()) {
    // No song loaded yet — load the first one
    player.loadSong(0);
  }
  player.togglePlay();
});

prevBtn.addEventListener("click", () => player.prevSong());
nextBtn.addEventListener("click", () => player.nextSong());

// ─── Progress Bar ────────────────────────────────────────────

progressBar.addEventListener("click", (e) => {
  const rect = progressBar.getBoundingClientRect();
  const percent = ((e.clientX - rect.left) / rect.width) * 100;
  player.seekTo(percent);
});

// Allow dragging the progress bar
let isDraggingProgress = false;

progressBar.addEventListener("mousedown", (e) => {
  isDraggingProgress = true;
  const rect = progressBar.getBoundingClientRect();
  const percent = ((e.clientX - rect.left) / rect.width) * 100;
  player.seekTo(percent);
});

document.addEventListener("mousemove", (e) => {
  if (!isDraggingProgress) return;
  const rect = progressBar.getBoundingClientRect();
  let percent = ((e.clientX - rect.left) / rect.width) * 100;
  percent = Math.max(0, Math.min(100, percent));
  player.seekTo(percent);
});

document.addEventListener("mouseup", () => {
  isDraggingProgress = false;
});

// ─── Volume Control ──────────────────────────────────────────

volumeSlider.addEventListener("click", (e) => {
  const rect = volumeSlider.getBoundingClientRect();
  const value = (e.clientX - rect.left) / rect.width;
  setVolume(value);
});

let isDraggingVolume = false;

volumeSlider.addEventListener("mousedown", (e) => {
  isDraggingVolume = true;
  const rect = volumeSlider.getBoundingClientRect();
  const value = (e.clientX - rect.left) / rect.width;
  setVolume(value);
});

document.addEventListener("mousemove", (e) => {
  if (!isDraggingVolume) return;
  const rect = volumeSlider.getBoundingClientRect();
  let value = (e.clientX - rect.left) / rect.width;
  value = Math.max(0, Math.min(1, value));
  setVolume(value);
});

document.addEventListener("mouseup", () => {
  isDraggingVolume = false;
});

/**
 * Set volume and update the UI.
 * @param {number} value — 0 to 1
 */
function setVolume(value) {
  player.setVolume(value);
  volumeFill.style.width = `${value * 100}%`;
  updateVolumeIcon(value);
}

/**
 * Update the volume icon based on current level.
 * @param {number} value — 0 to 1
 */
function updateVolumeIcon(value) {
  if (value === 0) {
    volumeIcon.className = "fas fa-volume-mute";
  } else if (value < 0.5) {
    volumeIcon.className = "fas fa-volume-down";
  } else {
    volumeIcon.className = "fas fa-volume-up";
  }
}

// Click volume icon to toggle mute
let previousVolume = 0.7;

volumeIcon.addEventListener("click", () => {
  if (player.audio.volume > 0) {
    previousVolume = player.audio.volume;
    setVolume(0);
  } else {
    setVolume(previousVolume);
  }
});

// ─── Sidebar Toggle (Mobile) ─────────────────────────────────

function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

hamburgerBtn.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

sidebarOverlay.addEventListener("click", closeSidebar);

// ─── Player Callbacks ────────────────────────────────────────

/** Update UI when the song changes. */
player.onSongChange = (song, index) => {
  currentSongId = song.id;

  // Update bottom bar info
  albumArt.src = song.cover;
  albumArt.onerror = function () { this.src = 'https://placehold.co/56x56/1a1a2e/e0e0e0?text=♪'; };
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;

  // Update hero section
  heroAlbumArt.src = song.cover;
  heroAlbumArt.onerror = function () { this.src = 'https://placehold.co/300x300/1a1a2e/e0e0e0?text=♪'; };
  heroTitle.textContent = song.title;
  heroArtist.textContent = song.artist;

  // Duration will be set once audio metadata loads
  totalTimeEl.textContent = "0:00";

  // Reset progress
  progressFill.style.width = "0%";
  progressThumb.style.left = "0%";
  currentTimeEl.textContent = "0:00";

  // Re-render playlist to update active highlight
  renderPlaylist(getFilteredSongs());

  // Update document title
  document.title = `${song.title} — ${song.artist} | VibePlayer`;
};

/** Update UI when playback starts. */
player.onPlay = () => {
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  playPauseBtn.setAttribute("aria-label", "Pause");

  // Add playing animation to hero
  heroAlbumArt.classList.add("playing");
};

/** Update UI when playback pauses. */
player.onPause = () => {
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  playPauseBtn.setAttribute("aria-label", "Play");

  heroAlbumArt.classList.remove("playing");
};

/** Update progress bar and time display during playback. */
player.onTimeUpdate = (currentTime, duration, percent) => {
  progressFill.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;
  currentTimeEl.textContent = formatTime(currentTime);
  totalTimeEl.textContent = formatTime(duration);
};

/** Show a console warning when a song fails to load. */
player.onError = (song) => {
  if (song) {
    console.warn(`[VibePlayer] Skipping "${song.title}" — source unavailable.`);
  }
};

// ─── Utilities ───────────────────────────────────────────────

/**
 * Format seconds into a m:ss string.
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ─── Keyboard Shortcuts ──────────────────────────────────────

document.addEventListener("keydown", (e) => {
  // Don't intercept when typing in search
  if (e.target === searchInput) return;

  switch (e.code) {
    case "Space":
      e.preventDefault();
      playPauseBtn.click();
      break;
    case "ArrowRight":
      nextBtn.click();
      break;
    case "ArrowLeft":
      prevBtn.click();
      break;
    case "ArrowUp":
      e.preventDefault();
      setVolume(Math.min(1, player.audio.volume + 0.05));
      break;
    case "ArrowDown":
      e.preventDefault();
      setVolume(Math.max(0, player.audio.volume - 0.05));
      break;
  }
});

// ─── Initialization ──────────────────────────────────────────

/** Boot the app — render the playlist and set initial state. */
function init() {
  // Set initial volume UI
  volumeFill.style.width = "70%";
  updateVolumeIcon(0.7);

  // Render the full playlist
  updatePlaylist();

  // Load (but don't play) the first song
  if (SONGS.length > 0) {
    player.loadSong(0);
  }
}

// Run on DOM ready
document.addEventListener("DOMContentLoaded", init);
