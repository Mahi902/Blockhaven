// Blockhaven - shared constants
export const TILE = 48;          // world pixels per grid cell
export const WALL_T = 12;        // wall thickness in world pixels
export const WORLD_W = 40;       // plot size in cells
export const WORLD_H = 30;
export const VERSION = '1.4';
export const REPO = 'mahi902/Blockhaven';   // used by the GitHub-API catalog fallback

export const SAVE_KEY = 'blockhaven.world.v1';
export const PLAYER_KEY = 'blockhaven.player.v1';
export const SETTINGS_KEY = 'blockhaven.settings.v1';

// The 16 colour variations every furniture has. The file names are the lowercase names + ".svg".
export const COLOR_NAMES = [
  'white', 'light gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow',
  'lime', 'green', 'cyan', 'light blue', 'blue', 'purple', 'magenta', 'pink',
];
export const COLOR_HEX = {
  'white': '#f4f4f2', 'light gray': '#c9cdd3', 'gray': '#8b919a', 'black': '#33353c',
  'brown': '#8a5a3b', 'red': '#e03c3c', 'orange': '#f28a2e', 'yellow': '#f6d43c',
  'lime': '#9ee03a', 'green': '#2fa953', 'cyan': '#2bc9d8', 'light blue': '#7fc6f6',
  'blue': '#3166e0', 'purple': '#8c52d8', 'magenta': '#d63fc0', 'pink': '#f8a5c9',
};

export const SKIN_TONES = ['#ffdfc4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21'];
export const HAIR_COLORS = ['#1e1b4b', '#3b2314', '#6b3e1f', '#c59a4b', '#e8d28a', '#c0392b', '#7c3aed', '#111827', '#9ca3af'];
export const SHIRT_COLORS = ['#0284c7', '#e11d48', '#16a34a', '#f59e0b', '#7c3aed', '#0f172a', '#f1f5f9', '#ec4899'];
export const PANTS_COLORS = ['#1e293b', '#334155', '#78350f', '#14532d', '#4c1d95', '#7f1d1d', '#d6d3d1'];

export const DEFAULT_LOOK = { style: 'short', skin: '#f1c27d', hair: '#1e1b4b', shirt: '#0284c7', pants: '#1e293b' };