import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    },
    copyPublicDir: true
  },
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@js': resolve(__dirname, 'src/js'),
      '@css': resolve(__dirname, 'src/css'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  plugins: [{
    name: 'copy-libs',
    closeBundle() {
      // Copy library files to dist/assets/libs/
      const srcLibs = resolve(__dirname, 'src/assets/libs');
      const distLibs = resolve(__dirname, 'dist/assets/libs');
      
      if (existsSync(srcLibs)) {
        if (!existsSync(distLibs)) {
          mkdirSync(distLibs, { recursive: true });
        }
        
        const files = ['moment.min.js', 'moment-th.min.js'];
        files.forEach(file => {
          const srcFile = resolve(srcLibs, file);
          const dstFile = resolve(distLibs, file);
          if (existsSync(srcFile)) {
            copyFileSync(srcFile, dstFile);
            console.log(`Copied ${file} to dist/assets/libs/`);
          }
        });
      }
    }
  }]
});
