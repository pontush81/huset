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

// Create a plugin to handle server-side module imports
const serverModulesPlugin = () => {
  return {
    name: 'server-modules-plugin',
    resolveId(id) {
      // Check if this is a server-only module
      if (id === 'drizzle-zod' || id.startsWith('drizzle-zod/')) {
        return path.resolve(__dirname, 'src/lib/drizzle-zod/index.ts');
      }
      if (id === 'drizzle-orm/pg-core') {
        return path.resolve(__dirname, 'src/lib/drizzle-orm/pg-core/index.ts');
      }
      if (id === 'drizzle-orm' || id.startsWith('drizzle-orm/')) {
        return path.resolve(__dirname, 'src/lib/drizzle-orm/index.ts');
      }
      return null;
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    serverModulesPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      // Add aliases for server modules to point to shims
      "drizzle-zod": path.resolve(__dirname, "src", "lib", "drizzle-zod"),
      "drizzle-orm": path.resolve(__dirname, "src", "lib", "drizzle-orm"),
      "drizzle-orm/pg-core": path.resolve(__dirname, "src", "lib", "drizzle-orm", "pg-core"),
      "@neondatabase/serverless": path.resolve(__dirname, "src", "lib", "server-module-shims.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: {
      polyfill: true,
    },
    // Avoid bundling server-side dependencies
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs', '.mjs'],
      exclude: serverOnlyDependencies.map(d => new RegExp(`node_modules/${d}`))
    },
    // Add better chunk naming and prevent module resolution errors
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
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
      },
      external: serverOnlyDependencies,
      onwarn(warning: any, warn: any) {
        // Ignore "Module level directives" warnings from packages
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        // Ignore circular dependency warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    exclude: serverOnlyDependencies
  }
}); 