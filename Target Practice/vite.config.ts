import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration
export default defineConfig({
  plugins: [react()],
  root: './',  // Ensure the root is set to the project root (if applicable)
  base: '/',   // Ensure the base path is correctly set for deployment (change if necessary)
});
