import http from 'http';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.webm': 'audio/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  // 1. Audio Speech-to-Text Transcription API Endpoint
  if (pathname === '/api/transcribe' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const { audio, mimeType = 'audio/webm' } = parsed;

        if (!audio) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing base64 audio payload' }));
          return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const audioPart = {
          inlineData: {
            mimeType,
            data: audio,
          },
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              audioPart,
              {
                text: 'You are a sports analytics speech-to-text transcriber. Transcribe this audio query accurately. Return only the transcribed sentence or query.',
              },
            ],
          },
        });

        const text = response.text || '';
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ transcription: text.trim() }));
      } catch (error: any) {
        console.error('Server transcription error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: error?.message || 'Transcription error',
          })
        );
      }
    });
    return;
  }

  // 2. Health check endpoint
  if (pathname === '/healthz' || pathname === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
    return;
  }

  // 3. Static File Serving from dist directory with fallback to public wasm if needed
  let filePath = path.join(DIST_DIR, pathname);

  // Check if file exists in dist
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(filePath, res);
    return;
  }

  // Check if file exists in public/ (e.g. wasm files)
  const publicFallback = path.join(process.cwd(), 'public', path.basename(pathname));
  if (pathname.endsWith('.wasm') && fs.existsSync(publicFallback)) {
    serveFile(publicFallback, res);
    return;
  }

  // 4. SPA Fallback: Serve index.html for client-side routing
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    serveFile(indexHtmlPath, res);
    return;
  }

  // If dist not built yet
  res.statusCode = 503;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Application is building or dist directory not found. Run npm run build.');
});

function serveFile(filePath: string, res: http.ServerResponse) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);

  // Cache static assets with hash in filename or wasm
  if (filePath.includes('/assets/') || ext === '.wasm') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Cricbuzz LiveStats server running on http://0.0.0.0:${PORT}`);
});
