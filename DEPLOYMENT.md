# Cricbuzz LiveStats Deployment Guide

Comprehensive instructions for building, containerizing, and deploying the **Cricbuzz LiveStats** application across Docker, Google Cloud Run, Vercel, Netlify, and standard Linux/Node.js servers.

---

## ⚡ Quick Deployment Options

| Platform | Best For | Configuration File | Command / Strategy |
|----------|----------|-------------------|-------------------|
| **Docker Container** | Standard production deployment, microservices | `Dockerfile`, `.dockerignore` | `docker build -t crickazz . && docker run -p 3000:3000 crickazz` |
| **Google Cloud Run** | Scalable serverless container hosting | `Dockerfile` | `gcloud run deploy --source .` |
| **Vercel** | Fast Edge CDN global deployment | `vercel.json` | `vercel deploy` |
| **Netlify** | Static Edge with SPA fallback | `netlify.toml` | `netlify deploy --prod` |
| **Node.js VPS (Linux)**| Self-hosted Ubuntu/Debian with PM2 | `server.ts` | `npm run build && npm start` |

---

## 1. Docker Deployment (Recommended)

The project includes an optimized multi-stage `Dockerfile` (Alpine Linux Node.js 22 runtime) with built-in non-root security context and health check monitoring.

### Step 1: Build the Container Image
```bash
docker build -t crickazz-livestats .
```

### Step 2: Run the Container
```bash
docker run -d \
  --name crickazz \
  -p 3000:3000 \
  -e PORT=3000 \
  -e GEMINI_API_KEY="your_gemini_api_key_here" \
  --restart unless-stopped \
  crickazz-livestats
```

### Step 3: Verify Container Health
```bash
curl http://localhost:3000/healthz
# Returns: {"status":"healthy","uptime":...}
```

---

## 2. Google Cloud Run Deployment

Deploy containerized directly from source using the Google Cloud CLI:

```bash
# 1. Set Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# 2. Deploy directly from repository root
gcloud run deploy crickazz-livestats \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="GEMINI_API_KEY=your_gemini_key_if_applicable"
```

Cloud Run will automatically detect the `Dockerfile`, build the image in Google Cloud Build, and serve it on HTTPS.

---

## 3. Vercel Deployment

The project includes `vercel.json` with automatic SPA route rewrites and custom headers ensuring that WebAssembly (`.wasm`) files are served with the required `application/wasm` MIME type and immutable cache headers.

### Deploying via Vercel CLI:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Deploying via GitHub Git Integration:
1. Connect your repository (`Ishank2301/Crickazz`) in the [Vercel Dashboard](https://vercel.com/new).
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Environment variables (optional): `GEMINI_API_KEY`.
6. Click **Deploy**.

---

## 4. Netlify Deployment

The project includes `netlify.toml` configured with single-page application redirects and `.wasm` header rules.

### Deploying via Netlify CLI:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

---

## 5. Linux Server / VPS Deployment (PM2 or Systemd)

For self-hosted instances on Ubuntu, Debian, or AWS EC2:

### Prerequisites
- Node.js 20.x or 22.x LTS
- PM2 process manager (`npm install -g pm2`)

### Step-by-Step Setup
```bash
# 1. Clone repository
git clone https://github.com/Ishank2301/Crickazz.git
cd Crickazz

# 2. Install dependencies
npm ci

# 3. Build optimized production frontend
npm run build

# 4. Start production server using PM2
pm2 start "npm run start" --name "crickazz-app"

# 5. Save PM2 state for automatic restart on server reboot
pm2 save
pm2 startup
```

### Nginx Reverse Proxy Configuration (Optional):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Ensure WebAssembly MIME type is preserved
    location ~* \.wasm$ {
        proxy_pass http://localhost:3000;
        add_header Content-Type application/wasm;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 6. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Optional | `3000` | Port on which the production server listens. |
| `GEMINI_API_KEY` | Optional | None | Google Gemini API key used by `/api/transcribe` for voice query transcription. |
| `VITE_CRICBUZZ_API_KEY` | Optional | None | RapidAPI Cricbuzz key for live ball-by-ball score feeds. Fallback match streams are used if not provided. |

---

## 7. Critical Runtime Verifications

After deployment, verify that the two core browser runtime requirements are satisfied:

1. **WASM MIME Header Verification**:
   ```bash
   curl -I https://your-deployed-domain.com/sql-wasm.wasm
   # Must return: Content-Type: application/wasm
   ```
2. **Health Check**:
   ```bash
   curl https://your-deployed-domain.com/healthz
   # Must return: {"status":"healthy"}
   ```
3. **In-App Performance Monitor**:
   Navigate to the **Diagnostics** tab to confirm the 60 FPS monitor, JavaScript heap tracker, and sub-millisecond query memoization are active.
