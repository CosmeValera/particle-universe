<template>
  <div class="controls">
    <div class="framework-badge badge-vue">
      <svg width="12" height="12" viewBox="0 0 256 221">
        <path fill="#41B883" d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0z"/>
        <path fill="#35495E" d="M50.56 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0z"/>
      </svg>
      Vue Controls
    </div>

    <!-- Presets -->
    <div class="control-group">
      <label class="control-label">Preset</label>
      <div class="preset-grid">
        <button
          v-for="name in presetNames"
          :key="name"
          class="preset-btn"
          :class="{ active: currentPreset === name }"
          @click="selectPreset(name)"
        >
          {{ name }}
        </button>
      </div>
    </div>

    <!-- Sliders -->
    <div class="control-group" v-for="slider in sliders" :key="slider.key">
      <label class="control-label">
        {{ slider.label }}
        <span class="control-value">{{ formatValue(config[slider.key], slider.decimals) }}</span>
      </label>
      <input
        type="range"
        :min="slider.min"
        :max="slider.max"
        :step="slider.step"
        :value="config[slider.key]"
        @input="updateConfig(slider.key, ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Color -->
    <div class="control-group">
      <label class="control-label">Color</label>
      <div class="color-row">
        <input
          type="color"
          :value="config.color"
          @input="updateConfig('color', ($event.target as HTMLInputElement).value)"
          class="color-picker"
        />
        <div class="color-swatches">
          <button
            v-for="c in colors"
            :key="c"
            class="color-swatch"
            :style="{ background: c }"
            :class="{ active: config.color === c }"
            @click="updateConfig('color', c)"
          />
        </div>
      </div>
    </div>

    <!-- Shape -->
    <div class="control-group">
      <label class="control-label">Shape</label>
      <div class="shape-grid">
        <button
          v-for="s in shapes"
          :key="s.value"
          class="shape-btn"
          :class="{ active: config.shape === s.value }"
          @click="updateConfig('shape', s.value)"
        >
          {{ s.icon }}
        </button>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="action-row">
      <button class="action-btn" @click="handleTogglePause">
        {{ paused ? '▶ Play' : '⏸ Pause' }}
      </button>
      <button class="action-btn" @click="handleReset">↺ Reset</button>
      <button class="action-btn accent" @click="handleRandomize">🎲 Random</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import {
  $particleConfig,
  $isPaused,
  $preset,
  PRESETS,
  applyPreset,
  resetParticles,
  togglePause,
  randomize,
  DEFAULT_CONFIG,
} from '../../stores/store';

const config = useStore($particleConfig);
const paused = useStore($isPaused);
const currentPreset = useStore($preset);

const presetNames = ['default', ...Object.keys(PRESETS)];

const sliders = [
  { key: 'gravity' as const, label: 'Gravity', min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: 'speed' as const, label: 'Speed', min: 0.1, max: 8, step: 0.1, decimals: 1 },
  { key: 'count' as const, label: 'Particles', min: 10, max: 800, step: 10, decimals: 0 },
  { key: 'size' as const, label: 'Size', min: 1, max: 8, step: 0.5, decimals: 1 },
  { key: 'attraction' as const, label: 'Attraction', min: -1, max: 1, step: 0.05, decimals: 2 },
  { key: 'friction' as const, label: 'Friction', min: 0.9, max: 1, step: 0.002, decimals: 3 },
  { key: 'trail' as const, label: 'Trail', min: 0, max: 0.5, step: 0.01, decimals: 2 },
];

const colors = ['#667eea', '#a78bfa', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#14b8a6'];

const shapes = [
  { value: 'circle', icon: '●' },
  { value: 'square', icon: '■' },
  { value: 'star', icon: '★' },
  { value: 'triangle', icon: '▲' },
];

function formatValue(val: number | string, decimals: number = 2): string {
  if (typeof val === 'string') return val;
  return val.toFixed(decimals);
}

function updateConfig(key: string, value: string) {
  const numericKeys = ['gravity', 'speed', 'count', 'size', 'attraction', 'friction', 'trail'];
  const newValue = numericKeys.includes(key) ? parseFloat(value) : value;
  $particleConfig.setKey(key as any, newValue as any);
  $preset.set('custom');
}

function selectPreset(name: string) {
  if (name === 'default') {
    $particleConfig.set({ ...DEFAULT_CONFIG });
    $preset.set('default');
  } else {
    applyPreset(name);
  }
}

function handleTogglePause() {
  togglePause();
}

function handleReset() {
  resetParticles();
}

function handleRandomize() {
  randomize();
}
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 100%;
  overflow-y: auto;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.control-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-value {
  color: var(--accent-vue);
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.preset-btn {
  padding: 5px 4px;
  font-size: 0.65rem;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: rgba(66, 184, 131, 0.1);
  border-color: var(--accent-vue);
}

.preset-btn.active {
  background: rgba(66, 184, 131, 0.15);
  border-color: var(--accent-vue);
  color: var(--accent-vue);
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: none;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 2px solid var(--border-color);
  border-radius: 6px;
}

.color-swatches {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-swatch:hover {
  transform: scale(1.2);
}

.color-swatch.active {
  border-color: white;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.shape-btn {
  padding: 6px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.shape-btn:hover {
  background: rgba(66, 184, 131, 0.1);
}

.shape-btn.active {
  background: rgba(66, 184, 131, 0.15);
  border-color: var(--accent-vue);
  color: var(--accent-vue);
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: auto;
  padding-top: 0.5rem;
}

.action-btn {
  padding: 8px 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.accent {
  grid-column: 1 / -1;
  background: rgba(66, 184, 131, 0.12);
  border-color: rgba(66, 184, 131, 0.3);
  color: var(--accent-vue);
}

.action-btn.accent:hover {
  background: rgba(66, 184, 131, 0.2);
}
</style>
