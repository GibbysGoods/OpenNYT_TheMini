/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.BASE_PATH || process.env.BASE_PATH || '/'
  return {
    plugins: [react()],
    // Allow overriding base at build/deploy time for GitHub Pages
    base,
  }
})
