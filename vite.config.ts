import { defineConfig } from 'vite';

export default defineConfig({
  root: './', // Ensure Vite knows your root directory
  resolve: {
    alias: {
      // This ensures that the src folder is properly resolved
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      input: '/index.html', // Specify the entry point explicitly
    },
  },
});
