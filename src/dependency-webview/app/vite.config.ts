import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    // elkjs is lazy-loaded (see layout.ts) and is inherently large since it bundles all its layout algorithms.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        dir: '../../../dependency-webview/',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
