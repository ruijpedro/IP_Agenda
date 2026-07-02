import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/IP_RJP/',
  plugins: [react()],
  build: { outDir: 'dist' }
})
