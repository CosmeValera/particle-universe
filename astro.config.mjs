// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import react from '@astrojs/react';
// Angular via @analogjs disabled — causes Vite build conflicts with Vue/React store imports.
// Metrics panel implemented as a client-side Astro island instead.
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    vue(),
    react({
      include: ['**/react/**'],
    }),
    // analog({ include: ['**/angular/**'] }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
