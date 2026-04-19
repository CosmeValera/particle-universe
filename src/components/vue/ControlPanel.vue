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
      <label class="control-label">
        Preset
        <span class="hint" title="Pre-configured particle settings you can switch between">(?)</span>
      </label>
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
        <span class="label-with-hint">
          {{ slider.label }}
          <span class="hint" :title="slider.hint">(?)</span>
        </span>
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

    <!-- Gravity Direction -->
    <div class="control-group">
      <label class="control-label">
        Gravity Direction
        <span class="hint" title="The direction gravity pulls particles">(?)</span>
      </label>
      <div class="shape-grid">
        <button
          v-for="d in gravityDirections"
          :key="d.value"
          class="preset-btn"
          :class="{ active: config.gravityDirection === d.value }"
          @click="updateConfig('gravityDirection', d.value)"
        >
          {{ d.icon }}
        </button>
      </div>
    </div>

    <!-- Color -->
    <div class="control-group">
      <label class="control-label">
        Color
        <span class="hint" title="The color of the particles. Pick from swatches or use the color picker">(?)</span>
      </label>
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
      <label class="control-label">
        Shape
        <span class="hint" title="The shape each particle is rendered as">(?)</span>
      </label>
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

    <!-- Color Mode -->
    <div class="control-group">
      <label class="control-label">
        Color Mode
        <span class="hint" title="How particles are colored. Solid uses the selected color. Velocity and Age create a rainbow gradient based on speed or lifetime">(?)</span>
      </label>
      <div class="shape-grid" style="grid-template-columns: repeat(3, 1fr)">
        <button
          v-for="m in colorModes"
          :key="m.value"
          class="preset-btn"
          :class="{ active: config.colorMode === m.value }"
          @click="updateConfig('colorMode', m.value)"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <!-- Boundary -->
    <div class="control-group">
      <label class="control-label">
        Boundary
        <span class="hint" title="What happens when particles reach the edge. Wrap teleports to the other side. Bounce reflects them. None lets them fly off and respawn">(?)</span>
      </label>
      <div class="shape-grid" style="grid-template-columns: repeat(3, 1fr)">
        <button
          v-for="b in boundaryModes"
          :key="b.value"
          class="preset-btn"
          :class="{ active: config.boundary === b.value }"
          @click="updateConfig('boundary', b.value)"
        >
          {{ b.label }}
        </button>
      </div>
    </div>

    <!-- Bounciness (only visible when boundary is bounce) -->
    <div class="control-group" v-if="config.boundary === 'bounce'">
      <label class="control-label">
        <span class="label-with-hint">
          Bounciness
          <span class="hint" title="How much energy is preserved on each wall bounce. At 1.0 particles bounce perfectly, below 1.0 they lose energy each bounce">(?)</span>
        </span>
        <span class="control-value">{{ formatValue(config.bounciness, 2) }}</span>
      </label>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.05"
        :value="config.bounciness"
        @input="updateConfig('bounciness', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Collision -->
    <div class="control-group">
      <label class="control-label">
        <span class="label-with-hint">
          Collision
          <span class="hint" title="When enabled, particles bounce off each other">(?)</span>
        </span>
      </label>
      <div class="shape-grid" style="grid-template-columns: repeat(2, 1fr)">
        <button
          class="preset-btn"
          :class="{ active: !config.collision }"
          @click="updateConfig('collision', 'false')"
        >
          Off
        </button>
        <button
          class="preset-btn"
          :class="{ active: config.collision }"
          @click="updateConfig('collision', 'true')"
        >
          On
        </button>
      </div>
    </div>

    <!-- Particle Lifespan -->
    <div class="control-group">
      <label class="control-label">
        <span class="label-with-hint">
          Lifespan
          <span class="hint" title="Mortal particles fade in and out, then respawn. Immortal particles live forever">(?)</span>
        </span>
      </label>
      <div class="shape-grid" style="grid-template-columns: repeat(2, 1fr)">
        <button
          class="preset-btn"
          :class="{ active: !config.immortal }"
          @click="updateConfig('immortal', 'false')"
        >
          Mortal
        </button>
        <button
          class="preset-btn"
          :class="{ active: config.immortal }"
          @click="updateConfig('immortal', 'true')"
        >
          Immortal
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

    <!-- Utility buttons -->
    <div class="action-row utility-row">
      <button class="action-btn" @click="handleScreenshot" title="Save canvas as PNG">📷 Screenshot</button>
      <button class="action-btn" @click="handleShare" :class="{ copied: showCopied }">
        {{ showCopied ? '✓ Copied!' : '🔗 Share' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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
  encodeConfigToUrl,
} from '../../stores/store';

const config = useStore($particleConfig);
const paused = useStore($isPaused);
const currentPreset = useStore($preset);

const presetNames = Object.keys(PRESETS);

const sliders = [
  { key: 'gravity' as const, label: 'Gravity', min: 0, max: 1, step: 0.01, decimals: 2, hint: 'How strongly particles are pulled downward. Higher values make them fall faster' },
  { key: 'speed' as const, label: 'Speed', min: 0.1, max: 8, step: 0.1, decimals: 1, hint: 'Initial velocity of particles when they spawn. Higher values make them move faster' },
  { key: 'count' as const, label: 'Particles', min: 10, max: 800, step: 10, decimals: 0, hint: 'Total number of particles on screen. More particles look better but can lower FPS' },
  { key: 'size' as const, label: 'Size', min: 1, max: 8, step: 0.5, decimals: 1, hint: 'How large each particle is drawn on screen' },
  { key: 'attraction' as const, label: 'Attraction', min: -1, max: 1, step: 0.05, decimals: 2, hint: 'How particles react to your mouse. Positive values attract, negative values repel' },
  { key: 'friction' as const, label: 'Glide', min: 0.9, max: 1, step: 0.002, decimals: 3, hint: 'How far particles glide before slowing down. Higher values mean less drag, so particles keep their speed longer' },
  { key: 'trail' as const, label: 'Trail', min: 0, max: 0.5, step: 0.01, decimals: 2, hint: 'How much of the previous frame remains visible. Higher values create longer trails behind particles' },
];

const colors = ['#667eea', '#a78bfa', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#14b8a6'];

const shapes = [
  { value: 'circle', icon: '●' },
  { value: 'square', icon: '■' },
  { value: 'star', icon: '★' },
  { value: 'triangle', icon: '▲' },
];

const colorModes = [
  { value: 'solid', label: 'Solid' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'age', label: 'Age' },
];

const boundaryModes = [
  { value: 'wrap', label: 'Wrap' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'none', label: 'None' },
];

const gravityDirections = [
  { value: 'down', icon: '↓' },
  { value: 'up', icon: '↑' },
  { value: 'left', icon: '←' },
  { value: 'right', icon: '→' },
];

const showCopied = ref(false);

function formatValue(val: number | string, decimals: number = 2): string {
  if (typeof val === 'string') return val;
  return val.toFixed(decimals);
}

function updateConfig(key: string, value: string) {
  const numericKeys = ['gravity', 'speed', 'count', 'size', 'attraction', 'friction', 'trail', 'bounciness'];
  const booleanKeys = ['collision', 'immortal'];
  let newValue: any;
  if (numericKeys.includes(key)) newValue = parseFloat(value);
  else if (booleanKeys.includes(key)) newValue = value === 'true';
  else newValue = value;
  $particleConfig.setKey(key as any, newValue);
  if (!['colorMode', 'boundary', 'gravityDirection', 'collision', 'immortal'].includes(key)) {
    $preset.set('custom');
  }
}

function selectPreset(name: string) {
  applyPreset(name);
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

function handleScreenshot() {
  const canvas = document.querySelector('.canvas-wrapper canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `particle-universe-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function handleShare() {
  const url = encodeConfigToUrl();
  navigator.clipboard.writeText(url).then(() => {
    window.history.replaceState(null, '', url.split(window.location.origin)[1]);
    showCopied.value = true;
    setTimeout(() => { showCopied.value = false; }, 2000);
  });
}
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 100%;
  overflow-y: auto;
  padding-right: 6px;
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
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-with-hint {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hint {
  font-size: 0.6rem;
  color: var(--text-secondary);
  opacity: var(--opacity-hint);
  cursor: help;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  position: relative;
  transition: opacity 0.15s;
}

.hint:hover {
  opacity: 1;
  color: var(--accent-vue);
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
  background: var(--surface-overlay);
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
  border-color: var(--text-primary);
  box-shadow: 0 0 8px var(--surface-overlay-hover);
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.shape-btn {
  padding: 6px;
  font-size: 1rem;
  background: var(--surface-overlay);
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
  background: var(--surface-overlay);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--surface-overlay-hover);
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

.utility-row {
  margin-top: 0;
  padding-top: 0;
}

.action-btn.copied {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.35);
  color: #22c55e;
}
</style>
