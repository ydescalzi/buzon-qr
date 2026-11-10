import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true -> la app es accesible desde otros equipos/celulares de la misma red (necesario para escanear QR)
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
