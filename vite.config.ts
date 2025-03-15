import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of dependencies that should not be bundled (server-only)
const serverOnlyDependencies = [
  'zod',
  'drizzle-orm',
  'drizzle-zod',
  'express',
  '@neondatabase/serverless',
  'multer',
  'passport',
  'ws',
  'connect-pg-simple',
  'express-session',
  'memorystore',
  'passport-local'
];


export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: serverOnlyDependencies,
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-slot'
          ],
          'data-libs': ['@tanstack/react-query']
        }
      }
    },
    // Avoid bundling server-side dependencies
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs', '.mjs'],
      exclude: serverOnlyDependencies.map(d => new RegExp(`node_modules/${d}`))
    }
  },
  optimizeDeps: {
    exclude: serverOnlyDependencies
  }
});
