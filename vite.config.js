import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(input) {
  const raw = (input || '/').trim()
  if (!raw || raw === '/') return '/'

  // Collapse repeated slashes and remove trailing slash.
  const collapsed = raw.replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  const withLeading = collapsed.startsWith('/') ? collapsed : `/${collapsed}`
  return `${withLeading}/`
}

export default defineConfig(({ mode }) => {
  // load .env.* + env dari system (GitHub Actions)
  const env = loadEnv(mode, process.cwd(), '')

  // default '/' untuk production biasa
  const base = normalizeBasePath(env.VITE_BASE_PATH || '/')

  return {
    plugins: [react()],
    base,
  }
})
