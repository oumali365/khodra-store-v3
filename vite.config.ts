import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function productImagesAliasPlugin() {
  return {
    name: 'product-images-alias',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (req.url) {
          if (req.url.startsWith('/images/products/vegetables/')) {
            req.url = req.url.replace('/images/products/vegetables/', '/products/veg/');
          } else if (req.url.startsWith('/products/vegetables/')) {
            req.url = req.url.replace('/products/vegetables/', '/products/veg/');
          } else if (req.url.startsWith('/images/products/fruits/')) {
            req.url = req.url.replace('/images/products/fruits/', '/products/fruit/');
          } else if (req.url.startsWith('/products/fruits/')) {
            req.url = req.url.replace('/products/fruits/', '/products/fruit/');
          } else if (req.url.startsWith('/images/products/')) {
            req.url = req.url.replace('/images/products/', '/products/');
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), productImagesAliasPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion/react', 'leaflet', 'canvas-confetti'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/leaflet')) {
              return 'leaflet';
            }
            if (id.includes('node_modules/canvas-confetti')) {
              return 'confetti';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
