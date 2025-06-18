import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Vercel'de GEMINI_API_KEY environment variable'ı direkt olarak process.env'den al
    // Hem GEMINI_API_KEY hem de VITE_GEMINI_API_KEY'i destekle
    const geminiApiKey = process.env.GEMINI_API_KEY || 
                         process.env.VITE_GEMINI_API_KEY ||
                         env.GEMINI_API_KEY || 
                         env.VITE_GEMINI_API_KEY;
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        // Global object için de tanımla
        'globalThis.process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'globalThis.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Production build için optimizasyon
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined,
          }
        }
      }
    };
});
