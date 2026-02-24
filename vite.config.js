import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Jika di GitHub Actions (production), gunakan /ikatancinta/
  base: process.env.NODE_ENV === 'production' ? '/ikatancinta/' : '/',
})