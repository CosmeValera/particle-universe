# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server at localhost:4321
- `npm run build` — Production build to `./dist/`
- `npm run preview` — Preview production build locally

No test runner or linter is configured.

## Architecture

This is a **Particle Universe** dashboard — a multi-framework demo built with Astro that renders an interactive particle simulation. Three frameworks coexist in a single page, sharing state via nanostores.

### Framework Integration

- **Vue** (`src/components/vue/`): ControlPanel with sliders, presets, color/shape pickers, and action buttons. Uses `@nanostores/vue` for reactive store binding.
- **React** (`src/components/react/`): ParticleCanvas with a `<canvas>` animation loop. Reads config from the store, writes live metrics (FPS, velocity, energy) back. Uses `@nanostores/react`.
- **Astro island** (`src/components/MetricsPanel.astro`): Metrics display with sparkline charts. Subscribes to the metrics store via a `<script>` tag with direct nanostore imports. Originally planned as Angular via `@analogjs/astro-angular`, but that integration causes Vite build conflicts with Vue/React store imports — the Angular component (`src/components/angular/metrics.component.ts`) is kept as reference but is not wired up.

### Shared State

`src/stores/store.ts` is the single source of truth. All framework components import from it directly.

- `$particleConfig` (map) — gravity, speed, count, size, color, shape, attraction, friction, trail
- `$particleMetrics` (map) — fps, particleCount, avgVelocity, energy, fpsHistory, energyHistory
- `$isPaused`, `$preset`, `$resetTrigger` (atoms)
- Helper functions: `applyPreset()`, `resetParticles()`, `togglePause()`, `randomize()`
- `PRESETS` object defines named configs (galaxy, fireworks, rain, matrix, nebula)

Data flows: Vue controls → `$particleConfig` → React canvas reads config and writes → `$particleMetrics` → MetricsPanel reads metrics.

### Routing

React integration is scoped to `**/react/**` files via `include` in `astro.config.mjs` to avoid JSX conflicts with Astro files.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Global styles and CSS custom properties (dark theme, framework accent colors, panel base styles) in `src/styles/global.css`. Component styles use scoped `<style>` blocks.
