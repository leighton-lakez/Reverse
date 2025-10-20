import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Add middleware for SPA fallback
    middlewareMode: false,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Custom plugin to handle SPA routing
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // If the request is for a file with an extension, let it through
          if (req.url && /\.\w+$/.test(req.url) && !req.url.endsWith('.html')) {
            return next();
          }
          // For all other routes, serve index.html
          if (req.url && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules')) {
            req.url = '/index.html';
          }
          next();
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 8080,
    host: "::",
  },
}));
