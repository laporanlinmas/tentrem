import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration to process.env at config/dev-server startup
function loadEnv() {
  const envFiles = ['.env', '.env.local'];
  envFiles.forEach(file => {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const eqIdx = line.indexOf('=');
        if (eqIdx > -1) {
          const key = line.substring(0, eqIdx).trim();
          let val = line.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      });
      console.log(`[ENV] Loaded ${file} configuration successfully.`);
    }
  });
}

loadEnv();

// Vite plugin to run API handlers as local dev/preview server middleware
function localApiPlugin(): Plugin {
  // SPA fallback: non-API, non-asset requests → serve index.html
  const spaFallback = (req: any, res: any, next: () => void) => {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const p = parsedUrl.pathname;
    // Pass through API routes, static assets, and Vite internals
    if (
      p.startsWith('/api/') ||
      p.startsWith('/@') ||
      p.startsWith('/node_modules/') ||
      /\.\w{2,5}$/.test(p) // has a file extension (.js, .css, .png …)
    ) {
      return next();
    }
    // Everything else → SPA entry point
    req.url = '/';
    next();
  };

  const createApiMiddleware = (server?: any) => async (req: any, res: any, next: () => void) => {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/')) {
      console.log(`[API Request]: ${req.method} ${pathname}`);

      // Inject Vercel-compatible helper functions
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return res;
      };
      res.send = (data: any) => {
        res.end(data);
        return res;
      };
      res.redirect = (statusOrUrl: number | string, targetUrl?: string) => {
        const code = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
        const redirectUrl = typeof statusOrUrl === 'string' ? statusOrUrl : targetUrl;
        res.writeHead(code, { Location: redirectUrl });
        res.end();
        return res;
      };

      // Parse query parameters
      const query: Record<string, string> = {};
      parsedUrl.searchParams.forEach((val, key) => {
        query[key] = val;
      });
      req.query = query;

      try {
        // Resolve the API handler
        const endpoint = pathname.replace('/api/', '').split('?')[0];
        const handlerPath = path.join(__dirname, 'api', `${endpoint}.ts`);

        if (!fs.existsSync(handlerPath)) {
          res.status(404).json({ error: `API route /api/${endpoint} not found.` });
          return;
        }

        // Dynamically import the API handler via Vite's ssrLoadModule (supports TypeScript on-the-fly)
        let handlerModule: any;
        if (server && server.ssrLoadModule) {
          handlerModule = await server.ssrLoadModule(handlerPath);
        } else {
          handlerModule = await import(handlerPath);
        }
        const handler = handlerModule.default || handlerModule;

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
            } catch (e) {
              req.body = {};
            }
            try {
              await handler(req, res);
            } catch (err: any) {
              console.error('[API Middleware Error]:', err);
              if (!res.writableEnded) {
                res.status(500).json({ error: 'Server Error: ' + err.message });
              }
            }
          });
        } else {
          try {
            await handler(req, res);
          } catch (err: any) {
            console.error('[API Middleware Error]:', err);
            if (!res.writableEnded) {
              res.status(500).json({ error: 'Server Error: ' + err.message });
            }
          }
        }
      } catch (err: any) {
        console.error('[API Load Error]:', err);
        if (!res.writableEnded) {
          res.status(500).json({ error: 'Failed to load API route: ' + err.message });
        }
      }
    } else {
      next();
    }
  };

  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use(createApiMiddleware(server));
      server.middlewares.use(spaFallback);
    },
    configurePreviewServer(server) {
      server.middlewares.use(createApiMiddleware(server));
      server.middlewares.use(spaFallback);
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  define: {
    'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
    'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
    'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
    'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
    'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID),
    'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID),
    'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.FIREBASE_MEASUREMENT_ID),
    'process.env.CLOUDINARY_CLOUD_NAME': JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME),
    'process.env.CLOUDINARY_UPLOAD_PRESET': JSON.stringify(process.env.CLOUDINARY_UPLOAD_PRESET || 'sapapedestrian'),
    'process.env.VITE_VIDEO_URL': JSON.stringify(process.env.VITE_VIDEO_URL || 'https://player.cloudinary.com/embed/?cloud_name=dym9koebf&public_id=profil_pedestrian_qq1i9h'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Chunk size warning threshold (kB) — Three.js memang besar, ini normal
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Gunakan contenthash 10 karakter untuk cache busting yang efisien
        entryFileNames:  'assets/[name]-[hash:10].js',
        chunkFileNames:  'assets/[name]-[hash:10].js',
        assetFileNames:  'assets/[name]-[hash:10][extname]',
        manualChunks(id: string) {
          // ── Vendor core: react & react-dom (di-cache tersendiri, jarang berubah) ──
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // ── Firebase SDK (besar, jarang berubah) ──
          if (id.includes('node_modules/firebase/')) {
            return 'vendor-firebase';
          }
          // ── Three.js (sangat besar, pisah sendiri) ──
          if (id.includes('node_modules/three/')) {
            return 'vendor-three';
          }
          // ── Photo Sphere Viewer ──
          if (id.includes('@photo-sphere-viewer')) {
            return 'vendor-panorama';
          }
          // ── UI libs: lucide, styled-components ──
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/styled-components')) {
            return 'vendor-ui';
          }
          // ── Leaflet (hanya dipakai di PetaPage) ──
          if (id.includes('node_modules/leaflet')) {
            return 'vendor-leaflet';
          }
          // ── App chunks (berdasarkan komponen lazy) ──
          if (id.includes('src/lib/tentrem-knowledge')) return 'knowledge';
          if (id.includes('src/components/ChatbotUnified')) return 'chatbot';
          if (id.includes('src/components/AduanPage')) return 'aduan';
          if (id.includes('src/components/SurveySection') || id.includes('src/components/SurveyPage')) return 'survey';
          if (id.includes('src/components/PanoramaViewer')) return 'panorama';
          if (id.includes('src/components/GaleriPage')) return 'galeri';
          if (id.includes('src/components/BeritaPage')) return 'berita';
          if (id.includes('src/components/LaporRondaPage') || id.includes('src/components/RondaAuthGate')) return 'ronda';
          if (id.includes('src/components/KentonganPage') || id.includes('src/components/KentonganSection')) return 'kentongan';
          if (id.includes('src/components/PetaPage') || id.includes('src/components/MapSection')) return 'peta';
          if (id.includes('src/components/StrukturPage') || id.includes('src/components/StrukturSection')) return 'struktur';
          if (id.includes('src/components/ProfilPage')) return 'profil';
        },
      },
    },
  },
});
