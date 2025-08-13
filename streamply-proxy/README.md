# Express Proxy Server for Streamply

A lightweight Express proxy server that routes requests between the frontend and backend services.

## Features
- Routes API requests to the backend service
- Serves static frontend files
- Handles CORS and security headers
- Request logging and monitoring
- Health checks

## Configuration

The proxy server uses these environment variables:

```bash
# Backend service URL (Railway backend)
BACKEND_URL=https://streamply-backend-production-4ce8.up.railway.app

# Frontend build directory
FRONTEND_BUILD_PATH=../streamply-frontend/build

# Proxy server port
PORT=3000

# Environment
NODE_ENV=production
```

## Routes

- `/api/*` → Proxied to backend service
- `/health` → Proxy health check
- `/*` → Serves frontend static files

## Deployment

This proxy can be deployed on Railway alongside the backend, or as a separate service.

## Usage

```bash
npm install
npm start
```

The proxy will be available at `http://localhost:3000`
