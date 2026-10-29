import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/exceljs')) {
            return 'vendor-exceljs';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-jspdf';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  }
});
