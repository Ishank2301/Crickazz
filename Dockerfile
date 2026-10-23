# =========================================================================
# Multi-Stage, Multi-Target Dockerfile for Cricbuzz LiveStats
# Supports dual deployment targets:
# 1. Enterprise React / Node.js / Three.js (default: target=node-runner, port 3000)
# 2. Python Streamlit Analytics Dashboard (target=streamlit-runner, port 8501)
# =========================================================================

# -------------------------------------------------------------------------
# TARGET 1 (DEFAULT): Enterprise React / Vite / TypeScript / Node.js Stack
# -------------------------------------------------------------------------

FROM node:22-alpine AS node-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS node-runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=node-builder /app/package*.json ./
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/dist ./dist
COPY --from=node-builder /app/public ./public
COPY --from=node-builder /app/server.ts ./server.ts

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

CMD ["npm", "start"]

# -------------------------------------------------------------------------
# TARGET 2: Python Streamlit Application
# -------------------------------------------------------------------------

FROM python:3.11-slim AS streamlit-runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV STREAMLIT_SERVER_PORT=8501
ENV STREAMLIT_SERVER_ADDRESS=0.0.0.0

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8501/_stcore/health')" || exit 1

CMD ["streamlit", "run", "main.py"]
