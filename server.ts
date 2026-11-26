import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiApp } from './server/app.ts';
import { getServerConfig } from './server/lib/config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApiApp();
  const httpServer = http.createServer(app);
  const cfg = getServerConfig();
  const port = Number(process.env.PORT || cfg.port || 3000);
  const isProduction = process.env.NODE_ENV === 'production';
  const disableHmr = process.env.DISABLE_HMR === 'true';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: !disableHmr,
        watch: disableHmr ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req, res) => {
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(404).send('Production build missing. Run npm run build.');
      }
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(
      `TRANSCED TOURS (PRIVATE) LIMITED server listening on http://0.0.0.0:${port} (${isProduction ? 'production' : 'development'})`,
    );
  });
}

void startServer();
