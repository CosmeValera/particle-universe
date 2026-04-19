import { atom, map } from 'nanostores';

export type ColorMode = 'solid' | 'velocity' | 'age';
export type BoundaryMode = 'wrap' | 'bounce' | 'none';
export type GravityDirection = 'down' | 'up' | 'left' | 'right';

export interface ParticleConfig {
  gravity: number;
  gravityDirection: GravityDirection;
  speed: number;
  count: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'star' | 'triangle';
  attraction: number;
  friction: number;
  trail: number;
  colorMode: ColorMode;
  boundary: BoundaryMode;
  collision: boolean;
  immortal: boolean;
  bounciness: number;
}

export interface ParticleMetrics {
  fps: number;
  particleCount: number;
  fpsHistory: number[];
}

export const DEFAULT_CONFIG: ParticleConfig = {
  gravity: 0.02,
  gravityDirection: 'down',
  speed: 1.5,
  count: 500,
  size: 2,
  color: '#a78bfa',
  shape: 'circle',
  attraction: 0.8,
  friction: 0.995,
  trail: 0.05,
  colorMode: 'solid',
  boundary: 'wrap',
  collision: false,
  immortal: false,
  bounciness: 0.8,
};

export const PRESETS: Record<string, Partial<ParticleConfig>> = {
  galaxy: {
    gravity: 0.02,
    speed: 1.5,
    count: 500,
    size: 2,
    color: '#a78bfa',
    shape: 'circle',
    attraction: 0.8,
    friction: 0.995,
    trail: 0.05,
  },
  fireworks: {
    gravity: 0.15,
    speed: 5,
    count: 200,
    size: 3,
    color: '#f59e0b',
    shape: 'star',
    attraction: -0.3,
    friction: 0.97,
    trail: 0.1,
  },
  rain: {
    gravity: 0.4,
    speed: 3,
    count: 400,
    size: 2,
    color: '#3b82f6',
    shape: 'circle',
    attraction: 0.7,
    friction: 0.98,
    trail: 0.3,
  },
  matrix: {
    gravity: 0.25,
    speed: 2,
    count: 350,
    size: 2,
    color: '#22c55e',
    shape: 'square',
    attraction: 0,
    friction: 0.99,
    trail: 0.4,
  },
  nebula: {
    gravity: 0.01,
    speed: 0.8,
    count: 600,
    size: 4,
    color: '#ec4899',
    shape: 'circle',
    attraction: 0.3,
    friction: 0.998,
    trail: 0.02,
  },
  snowfall: {
    gravity: 0.08,
    speed: 1,
    count: 350,
    size: 3,
    color: '#e0e0ff',
    shape: 'circle',
    attraction: 0.15,
    friction: 0.992,
    trail: 0.12,
  },
};

export const $particleConfig = map<ParticleConfig>({ ...DEFAULT_CONFIG });
export const $particleMetrics = map<ParticleMetrics>({
  fps: 0,
  particleCount: 0,
  fpsHistory: [],
});
export const $isPaused = atom(false);
export const $preset = atom('galaxy');
export const $resetTrigger = atom(0);

// Performance warning state
export const $autoReduceParticles = atom(false);
export const $forceLowFps = atom(false);

// Theme
export type Theme = 'dark' | 'light';
export const $theme = atom<Theme>(
  (typeof localStorage !== 'undefined' && localStorage.getItem('theme') as Theme) || 'dark'
);

export function toggleTheme() {
  const next = $theme.get() === 'dark' ? 'light' : 'dark';
  $theme.set(next);
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

export function applyPreset(name: string) {
  const preset = PRESETS[name];
  if (preset) {
    $particleConfig.set({ ...DEFAULT_CONFIG, ...preset });
    $preset.set(name);
  } else {
    $particleConfig.set({ ...DEFAULT_CONFIG });
    $preset.set('default');
  }
}

export function resetParticles() {
  $resetTrigger.set($resetTrigger.get() + 1);
}

export function togglePause() {
  $isPaused.set(!$isPaused.get());
}

export function randomize() {
  const colors = ['#667eea', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#a78bfa', '#ef4444', '#14b8a6'];
  const shapes: ParticleConfig['shape'][] = ['circle', 'square', 'star', 'triangle'];
  const colorModes: ColorMode[] = ['solid', 'velocity', 'age'];
  const boundaries: BoundaryMode[] = ['wrap', 'bounce', 'none'];
  const gravityDirs: GravityDirection[] = ['down', 'up', 'left', 'right'];

  $particleConfig.set({
    gravity: Math.random() * 0.5,
    gravityDirection: gravityDirs[Math.floor(Math.random() * gravityDirs.length)],
    speed: 0.5 + Math.random() * 5,
    count: 100 + Math.floor(Math.random() * 500),
    size: 1 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    attraction: -1 + Math.random() * 2,
    friction: 0.95 + Math.random() * 0.05,
    trail: Math.random() * 0.5,
    colorMode: colorModes[Math.floor(Math.random() * colorModes.length)],
    boundary: boundaries[Math.floor(Math.random() * boundaries.length)],
    collision: Math.random() > 0.5,
    immortal: Math.random() > 0.5,
    bounciness: 0.5 + Math.random() * 0.5,
  });
  $preset.set('custom');
}

// --- Share config via URL ---

export function encodeConfigToUrl(): string {
  const cfg = $particleConfig.get();
  const preset = $preset.get();
  const data = { ...cfg, preset };
  const encoded = btoa(JSON.stringify(data));
  return `${window.location.origin}${window.location.pathname}#config=${encoded}`;
}

export function loadConfigFromUrl(): boolean {
  const hash = window.location.hash;
  if (!hash.startsWith('#config=')) return false;
  try {
    const encoded = hash.slice('#config='.length);
    const data = JSON.parse(atob(encoded));
    const { preset, ...cfg } = data;
    $particleConfig.set({ ...DEFAULT_CONFIG, ...cfg });
    $preset.set(preset || 'custom');
    return true;
  } catch {
    return false;
  }
}
