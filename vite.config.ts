import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function cricketBackendPlugin(): Plugin {
  return {
    name: 'cricket-backend-plugin',
    configureServer(server) {
      // 1. Explicitly serve any .wasm file with application/wasm to prevent HTML fallback
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('.wasm')) {
          const cleanUrl = req.url.split('?')[0];
          const fileName = path.basename(cleanUrl);
          const possiblePaths = [
            path.resolve('public', fileName),
            path.resolve('node_modules/sql.js/dist', fileName),
            path.resolve('public/sql-wasm.wasm'),
            path.resolve('node_modules/sql.js/dist/sql-wasm.wasm'),
          ];
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/wasm');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              fs.createReadStream(p).pipe(res);
              return;
            }
          }
        }
        next();
      });

      // 2. Audio transcription endpoint with gemini-3.5-transcribe
      server.middlewares.use('/api/transcribe', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

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
              apiKey: apiKey,
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
                    text: 'You are a sports analytics speech-to-text transcriber. Transcribe this audio query or match commentary accurately. Return only the transcribed sentence or query.',
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
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cricketBackendPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
