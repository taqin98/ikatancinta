import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // load .env.* + env dari system (GitHub Actions)
  const env = loadEnv(mode, process.cwd(), '')

  // default '/' untuk production biasa
  const base = env.VITE_BASE_PATH || '/'

  return {
    plugins: [react()],
    base,
  }
})