// ============================================================
// server.ts - الخادم الرئيسي المتكامل لمنصة خُضرة — فاس
// يدمج Express API الخلفية مع وسائط تطوير Vite
// ============================================================

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pricingRouter } from './src/server/pricingRoutes';
import { aiRouter } from './src/server/aiRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // معالجة نصوص JSON مع حد حجم آمن
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // مسار فحص الصحة
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Khodra Fès Fullstack Server',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ربط مسارات الواجهة الخلفية
  app.use(pricingRouter);
  app.use(aiRouter);

  if (!isProduction) {
    // وضع التطوير: تركيب وسائط Vite داخل Express
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('⚡ Vite dev middleware mounted successfully in Express');
  } else {
    // وضع الإنتاج: تقديم الملفات المبنية من مجلد dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`📦 Serving production build from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 خُضرة — Khodra Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Khodra server:', err);
  process.exit(1);
});
