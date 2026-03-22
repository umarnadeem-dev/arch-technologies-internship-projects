/**
 * songs.js — Song Data Module
 * 
 * Central data store for all songs in the music player.
 * Each song object contains metadata used by the player and UI.
 * 
 * All audio sources are online URLs (SoundHelix royalty-free demos).
 * All cover images are online URLs (Picsum Photos).
 */

const SONGS = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Luna Wave",
    cover: "https://picsum.photos/seed/midnight/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    category: "Pop"
  },
  {
    id: 2,
    title: "Neon Lights",
    artist: "Synthwave Collective",
    cover: "https://picsum.photos/seed/neon/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    category: "Pop"
  },
  {
    id: 3,
    title: "Electric Storm",
    artist: "Thunder Ridge",
    cover: "https://picsum.photos/seed/storm/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    category: "Rock"
  },
  {
    id: 4,
    title: "Ocean Breeze",
    artist: "Calm Shores",
    cover: "https://picsum.photos/seed/ocean/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    category: "Chill"
  },
  {
    id: 5,
    title: "Golden Hour",
    artist: "Amber Keys",
    cover: "https://picsum.photos/seed/golden/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    category: "Instrumental"
  },
  {
    id: 6,
    title: "City Lights",
    artist: "Urban Echo",
    cover: "https://picsum.photos/seed/city/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    category: "Rock"
  },
  {
    id: 7,
    title: "Summer Pulse",
    artist: "Tropical Haze",
    cover: "https://picsum.photos/seed/summer/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    category: "Pop"
  },
  {
    id: 8,
    title: "Velvet Skies",
    artist: "Dream Weaver",
    cover: "https://picsum.photos/seed/velvet/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    category: "Chill"
  },
  {
    id: 9,
    title: "Iron Rails",
    artist: "Voltage Band",
    cover: "https://picsum.photos/seed/iron/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    category: "Rock"
  },
  {
    id: 10,
    title: "Starlit Path",
    artist: "Cosmos Strings",
    cover: "https://picsum.photos/seed/starlit/200",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    category: "Instrumental"
  }
];
