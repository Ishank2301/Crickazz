# Cricbuzz LiveStats Deployment Guide

A step-by-step deployment guide for **Cricbuzz LiveStats: Real-Time Cricket Insights & SQL-Based Analytics**.

This guide covers:
- System prerequisites and installing dependencies
- Setting up environment variables (local, staging, and production)
- Building the project with Vite and TypeScript
- Deploying to Edge/Cloud platforms (**Vercel**, **Netlify**, **Docker**, **Google Cloud Run**, and **Linux VPS**)
- Serving SQLite WebAssembly (`.wasm`) binaries with mandatory `application/wasm` MIME types
- Post-deployment verification and troubleshooting

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installing Dependencies](#2-installing-dependencies)
3. [Environment Variables Setup](#3-environment-variables-setup)
4. [Building the Project with Vite](#4-building-the-project-with-vite)
5. [Local Production Preview](#5-local-production-preview)
6. [Deploying to Vercel](#6-deploying-to-vercel)
7. [Deploying to Netlify](#7-deploying-to-netlify)
8. [Deploying with Docker](#8-deploying-with-docker)
9. [Deploying to Google Cloud Run](#9-deploying-to-google-cloud-run)
10. [Deploying to Linux / VPS with PM2 & Nginx](#10-deploying-to-linux--vps-with-pm2--nginx)
11. [WASM & Routing Architecture](#11-wasm--routing-architecture)
12. [Troubleshooting Common Issues](#12-troubleshooting-common-issues)

---

## 1. Prerequisites

Before building or deploying, ensure the target environment meets the following specifications:

- **Node.js**: Version `18.x`, `20.x`, or `22.x LTS` (Node 22 LTS recommended)
- **Package Manager**: `npm` (v9+ or v10+), `yarn`, `pnpm`, or `bun`
- **Git**: Installed and configured
- **Browser Compatibility**: Any modern browser supporting WebAssembly and WebGL 2.0 (Chrome, Edge, Firefox, Safari)

Verify versions on your system:
```bash
node -v   # Expected: v18.0.0 or higher (e.g. v22.13.0)
npm -v    # Expected: v9.0.0 or higher
```

---

## 2. Installing Dependencies

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ishank2301/Crickazz.git
   cd Crickazz
   ```

2. **Clean Install**:
   Use `npm ci` for deterministic, clean installs in continuous integration and production environments:
   ```bash
   npm ci
   ```
   *Alternatively, in development environments*:
   ```bash
   npm install
   ```

3. **Verify Dependencies**:
   Ensure all dependencies (React 19, Three.js, sql.js, Recharts, Lucide, Tailwind CSS) are resolved without peer dependency conflicts.

---

## 3. Environment Variables Setup

The application uses minimal environment configuration. All variables are optional with sensible fallbacks:

### Variable Definitions

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `PORT` | Server | Optional | `3000` | Port for the production Node server (`server.ts`). |
| `GEMINI_API_KEY` | Server | Optional | None | Google Gemini API key used by `/api/transcribe` for voice query transcription. |
| `VITE_CRICBUZZ_API_KEY` | Client (Vite) | Optional | None | RapidAPI Cricbuzz key for live match feeds. If omitted, the app smoothly uses realistic internal match streams and zero-latency local state. |

### Setting Up Local Environment

Copy the provided `.env.example` template to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your preferred editor:
```env
# Server port
PORT=3000

# Optional: Google Gemini API key for audio speech transcription
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: RapidAPI Cricbuzz key for live ball-by-ball score streams
VITE_CRICBUZZ_API_KEY=your_rapidapi_cricbuzz_key_here
```

> **Security Note**: Never commit your actual `.env` file containing private API keys to git. `.env` is listed in `.gitignore`.

---

## 4. Building the Project with Vite

The build pipeline performs TypeScript validation followed by Vite bundling and asset minification:

```bash
npm run build
```

Under the hood, this executes:
```bash
tsc && vite build
```

### Build Artifacts
Upon completion, the optimized production bundles are generated inside the `dist/` directory:
```
dist/
├── index.html                 # Minified HTML entrypoint with preloaded fonts
├── sql-wasm.wasm              # SQLite WebAssembly binary (copied from public/)
├── sql-wasm-browser.wasm      # Browser-specific SQLite WebAssembly binary
├── assets/
│   ├── index-[hash].js        # Code-split JavaScript bundle
│   ├── index-[hash].css       # Compiled Tailwind CSS bundle
│   └── ...
```

---

## 5. Local Production Preview

To test your production build locally before deploying to remote servers:

### Option A: Using Vite Preview
```bash
npm run preview
```
Runs the Vite preview server at `http://localhost:3000`.

### Option B: Using the Full-Stack Production Server (`server.ts`)
```bash
npm start
```
Runs the production HTTP server (which also powers the `/api/transcribe` speech endpoint and serves `.wasm` assets with immutable cache headers) at `http://localhost:3000`.

---

## 6. Deploying to Vercel

Vercel provides edge network hosting for Vite single-page applications.

The repository includes a ready-to-use `vercel.json` file:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*).wasm",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Method 1: Deploying via Vercel Git Integration (Recommended)
1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** > **"Project"**.
3. Import your GitHub repository: `Ishank2301/Crickazz`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
5. Under **Environment Variables**, add any optional keys (`GEMINI_API_KEY`, `VITE_CRICBUZZ_API_KEY`).
6. Click **Deploy**.

### Method 2: Deploying via Vercel CLI
```bash
# 1. Install CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod
```

---

## 7. Deploying to Netlify

Netlify hosts the Vite SPA across its global application delivery network.

The repository includes `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*.wasm"
  [headers.values]
    Content-Type = "application/wasm"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
```

### Method 1: Deploying via Netlify Git Integration
1. Log in to [netlify.com](https://app.netlify.com).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Authorize GitHub and select `Ishank2301/Crickazz`.
4. Netlify will automatically detect settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Set environment variables under **Site configuration > Environment variables**.
6. Click **Deploy Crickazz**.

### Method 2: Deploying via Netlify CLI
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Authenticate
netlify login

# 3. Build project
npm run build

# 4. Deploy to production
netlify deploy --prod --dir=dist
```

---

## 8. Deploying with Docker

The project contains a multi-stage `Dockerfile` based on Alpine Linux with built-in non-root security context.

### Build and Run Container
```bash
# 1. Build the Docker image
docker build -t crickazz-livestats:latest .

# 2. Run container on port 3000
docker run -d \
  --name crickazz \
  -p 3000:3000 \
  -e PORT=3000 \
  -e GEMINI_API_KEY="your_optional_gemini_key" \
  --restart unless-stopped \
  crickazz-livestats:latest

# 3. Check health status
docker ps
curl http://localhost:3000/healthz
# Returns: {"status":"healthy","uptime":...}
```

---

## 9. Deploying to Google Cloud Run

Deploy directly from source without managing Docker daemons manually:

```bash
# 1. Select Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# 2. Deploy from source
gcloud run deploy crickazz-livestats \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --min-instances 0 \
  --max-instances 10
```

Google Cloud Build will automatically compile the multi-stage Docker container and provision an autoscaling HTTPS URL.

---

## 10. Deploying to Linux / VPS with PM2 & Nginx

For dedicated virtual private servers (Ubuntu 22.04 / 24.04, Debian, AWS EC2, DigitalOcean):

### Step 1: Install System Prerequisites
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx

# Install PM2 process manager
sudo npm install -g pm2
```

### Step 2: Clone and Build
```bash
cd /var/www
sudo git clone https://github.com/Ishank2301/Crickazz.git
cd Crickazz
sudo chown -R $USER:$USER /var/www/Crickazz

# Install dependencies and build
npm ci
npm run build
```

### Step 3: Run with PM2
```bash
# Start background service
pm2 start "npm run start" --name "crickazz-production"

# Configure PM2 to start on system boot
pm2 save
pm2 startup
```

### Step 4: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/crickazz`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # CRITICAL: Preserve WebAssembly MIME headers
    location ~* \.wasm$ {
        proxy_pass http://127.0.0.1:3000;
        add_header Content-Type application/wasm;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/crickazz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 11. WASM & Routing Architecture

### The SQLite WebAssembly Requirement
The in-browser cricket analytics engine requires two static binaries:
1. `sql-wasm.wasm`
2. `sql-wasm-browser.wasm`

These files reside in `/public/` and are automatically copied to `/dist/` during `npm run build`.

**MIME Requirement**: Browsers will reject WebAssembly compilation if the server responds with `Content-Type: text/html`. Both `vercel.json` and `netlify.toml` explicitly configure:
```
Content-Type: application/wasm
```

### Single-Page Application (SPA) Routing
Because routing is managed client-side by React, direct navigations or page refreshes must rewrite all non-asset requests to `/index.html`. Both platform configs include 200 rewrites for `/*` -> `/index.html`.

---

## 12. Troubleshooting Common Issues

### Issue 1: "WebAssembly: Response has unsupported MIME type 'text/html'"
- **Cause**: The server returned the fallback `index.html` instead of the actual `.wasm` binary file.
- **Fix**: Verify that `public/sql-wasm.wasm` and `public/sql-wasm-browser.wasm` are present in your deployment and that your platform's `.wasm` header rule is active. Verify via:
  ```bash
  curl -I https://your-domain.com/sql-wasm.wasm
  ```

### Issue 2: 404 Not Found on Page Refresh
- **Cause**: Missing SPA rewrite configuration.
- **Fix**: Ensure `vercel.json` (rewrites section) or `netlify.toml` (redirects section) is committed to your repository.

### Issue 3: 3D Pitch WebGL Context Warning
- **Cause**: Hardware acceleration disabled or outdated browser drivers.
- **Fix**: The codebase uses `THREE.PCFShadowMap` and includes automated context recovery handlers (`webglcontextrestored`). Ensure hardware acceleration is enabled in browser settings.

### Issue 4: Verifying System Health Post-Deploy
Open the deployed application in your browser and click on the **Diagnostics** tab in the navigation bar to run live latency benchmarks and verify that all 10 system test suites show green checkmarks.
