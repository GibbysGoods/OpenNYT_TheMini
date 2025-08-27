/// <reference types="node" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow overriding base at build/deploy time for GitHub Pages
  base: process.env.BASE_PATH || '/',
})
