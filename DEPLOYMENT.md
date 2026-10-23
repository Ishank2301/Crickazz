# Cricbuzz LiveStats: Dual-Format Deployment Guide

A deployment guide for **Cricbuzz LiveStats: Real-Time Cricket Insights & SQL-Based Analytics**.

This repository is architected for **dual-format deployment**:
1. **Enterprise Full-Stack Track**: React 19 + TypeScript + Vite + Three.js 3D Stadium + SQLite WASM + Node.js (Production Server on Port `3000`)
2. **Python Streamlit Analytics Track**: Streamlit Multi-Page App + SQLite + Pandas + Three.js WebGL Hawkeye Component (Production Server on Port `8501`)

---

## ⚡ Deployment Matrix

| Track | Tech Stack | Production Port | Primary Deployment Platforms | Command |
|---|---|---|---|---|
| **Track A: Enterprise Web** | React 19, TypeScript, Three.js, SQLite WASM, Node.js | `3000` | Docker, Cloud Run, Vercel, Netlify, VPS | `npm run build && npm start` |
| **Track B: Python Streamlit** | Python 3.11, Streamlit, Pandas, Plotly | `8501` | Streamlit Community Cloud, Docker, Cloud Run, VPS | `streamlit run main.py` |

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Track A: Enterprise React / TypeScript / Node.js Deployment](#2-track-a-enterprise-react--typescript--nodejs-deployment)
   - [Dependency Installation & Building](#dependency-installation--building)
   - [Deploying to Vercel](#deploying-to-vercel)
   - [Deploying to Netlify](#deploying-to-netlify)
   - [Containerized Docker Deployment](#containerized-docker-deployment)
   - [Deploying to Google Cloud Run](#deploying-to-google-cloud-run)
   - [Linux VPS with PM2 & Nginx](#linux-vps-with-pm2--nginx)
3. [Track B: Python Streamlit Application Deployment](#3-track-b-python-streamlit-application-deployment)
   - [Local Environment Setup](#local-environment-setup)
   - [Deploying to Streamlit Community Cloud](#deploying-to-streamlit-community-cloud)
   - [Containerized Streamlit with Docker](#containerized-streamlit-with-docker)
   - [Deploying Streamlit to Cloud Run](#deploying-streamlit-to-cloud-run)
4. [3D Hawkeye Stadium & Preset Camera Views Architecture](#4-3d-hawkeye-stadium--preset-camera-views-architecture)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Post-Deployment Health Checks & Troubleshooting](#6-post-deployment-health-checks--troubleshooting)

---

## 1. Prerequisites

- **For Track A (React/Node)**: Node.js 18.x, 20.x, or 22.x LTS (Node 22 recommended) and npm v9+.
- **For Track B (Python Streamlit)**: Python 3.10+ or 3.11+ and pip.
- **For Docker**: Docker Desktop or Docker Engine 24+.
- **Browser Compatibility**: Any modern browser supporting WebGL 2.0 and WebAssembly.

---

## 2. Track A: Enterprise React / TypeScript / Node.js Deployment

### Dependency Installation & Building
```bash
# 1. Clone repository
git clone https://github.com/Ishank2301/Crickazz.git
cd Crickazz

# 2. Install dependencies cleanly
npm ci

# 3. Build optimized production bundle
npm run build

# 4. Launch production server
npm start
```
The application will be served on `http://localhost:3000`.

### Deploying to Vercel
The repository includes `vercel.json` configured with SPA rewrites and `.wasm` headers.

- **Vercel CLI**:
  ```bash
  npm install -g vercel
  vercel --prod
  ```
- **Vercel Git Integration**:
  1. Connect `Ishank2301/Crickazz` in [Vercel Dashboard](https://vercel.com/new).
  2. Framework Preset: **Vite**.
  3. Build Command: `npm run build`.
  4. Output Directory: `dist`.
  5. Click **Deploy**.

### Deploying to Netlify
The repository includes `netlify.toml` with single-page redirects and immutable `.wasm` headers.

- **Netlify CLI**:
  ```bash
  npm install -g netlify-cli
  npm run build
  netlify deploy --prod --dir=dist
  ```
- **Netlify Git Integration**:
  Import repository in [Netlify Dashboard](https://app.netlify.com); build settings are automatically read from `netlify.toml`.

### Containerized Docker Deployment
The multi-stage `Dockerfile` provides a `node-runner` target:

```bash
# Build image
docker build --target node-runner -t crickazz-node:latest .

# Run container on port 3000
docker run -d \
  --name crickazz-web \
  -p 3000:3000 \
  -e PORT=3000 \
  -e GEMINI_API_KEY="optional_gemini_key" \
  --restart unless-stopped \
  crickazz-node:latest

# Verify health check
curl http://localhost:3000/healthz
# Returns: {"status":"healthy"}
```

### Deploying to Google Cloud Run
```bash
gcloud run deploy crickazz-web \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000
```

### Linux VPS with PM2 & Nginx
```bash
# Install PM2
sudo npm install -g pm2

# Build & launch
npm ci
npm run build
pm2 start "npm run start" --name "crickazz-web"
pm2 save && pm2 startup
```

Nginx configuration block:
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
        proxy_cache_bypass $http_upgrade;
    }

    # Ensure WebAssembly MIME type is preserved
    location ~* \.wasm$ {
        proxy_pass http://127.0.0.1:3000;
        add_header Content-Type application/wasm;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 3. Track B: Python Streamlit Application Deployment

The Streamlit track provides an interactive multi-page Python dashboard with full access to the SQLite database, statistical analysis, and an embedded Three.js 3D Hawkeye stadium.

### Local Environment Setup
```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch Streamlit
streamlit run main.py
```
Streamlit opens automatically at `http://localhost:8501`.

### Deploying to Streamlit Community Cloud (1-Click)
1. Fork or push this repository to your GitHub account (`Ishank2301/Crickazz`).
2. Visit [share.streamlit.io](https://share.streamlit.io/).
3. Click **"New app"**.
4. Select Repository: `Ishank2301/Crickazz`, Branch: `main`, Main file path: `main.py`.
5. Click **"Deploy!"**.

### Containerized Streamlit with Docker
The repository includes a dedicated `streamlit-runner` target inside `Dockerfile`:

```bash
# Build Streamlit image
docker build --target streamlit-runner -t crickazz-streamlit:latest .

# Run container on port 8501
docker run -d \
  --name crickazz-streamlit \
  -p 8501:8501 \
  --restart unless-stopped \
  crickazz-streamlit:latest

# Verify health status
curl http://localhost:8501/_stcore/health
# Returns: ok
```

### Deploying Streamlit to Cloud Run
```bash
gcloud run deploy crickazz-streamlit \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8501
```

---

## 4. 3D Hawkeye Stadium & Preset Camera Views Architecture

Both tracks integrate the Three.js 3D physics viewport with official **Preset Camera Views**:

| Camera Preset | Coordinates & Elevation | Vantage Perspective |
|---|---|---|
| **🦅 Bird's Eye** | Pos: `(0, 36, 0.05)`, Target: `(0, 0, 0)` | 360° top-down aerial overview of the 22-yard pitch and boundary ropes. |
| **🎯 Bowler's End** | Pos: `(0, 3.8, -19)`, Target: `(0, 0.8, 8)` | Behind the bowling crease following outswing, inswing, and seam deviation down the pitch. |
| **⚖️ Umpire View** | Pos: `(0, 1.75, -12.5)`, Target: `(0, 0.71, 10)` | Official 1.75m eye level behind non-striker stumps evaluating the head-on LBW line & length. |

### Cinematic Gliding
When toggling views, the camera executes smooth cinematic vector interpolation (`lerp`) over ~800ms before releasing manual orbital control back to the user's mouse/trackpad.

---

## 5. Environment Variables Reference

| Variable | Scope | Required | Default | Description |
|---|---|---|---|---|
| `PORT` | Node server | Optional | `3000` | Port for the production Node server (`server.ts`). |
| `GEMINI_API_KEY` | Server | Optional | None | Google Gemini API key used by `/api/transcribe` for audio transcription. |
| `VITE_CRICBUZZ_API_KEY` | Client / Streamlit | Optional | None | RapidAPI Cricbuzz key for live match feeds. Realistic match streams are used if not provided. |

---

## 6. Post-Deployment Health Checks & Troubleshooting

### Verification Checklist
1. **WASM MIME Header (Track A)**:
   ```bash
   curl -I https://your-domain.com/sql-wasm.wasm
   # Must return: Content-Type: application/wasm
   ```
2. **Node Server Health Check**:
   ```bash
   curl https://your-domain.com/healthz
   # Must return: {"status":"healthy"}
   ```
3. **Streamlit Health Check (Track B)**:
   ```bash
   curl https://your-streamlit-domain.com/_stcore/health
   # Must return: ok
   ```
4. **In-App Diagnostics Dashboard**:
   Open the web app and click the **Diagnostics** tab to view real-time 60 FPS charts, JavaScript memory gauges, and sub-millisecond query benchmark results.
