# Deployment Guide

**Version:** 2.0.0 | **Last Updated:** May 2026

Step-by-step deployment guide for TexFolio across Vercel (frontend), Render (backend), MongoDB Atlas, Redis Cloud, and Docker (LaTeX renderer).

---

## Architecture Overview

| Component | Platform | URL |
|:--|:--|:--|
| Frontend | Vercel | `https://texfolio.vercel.app` |
| Backend API | Render | `https://texfolio-api.onrender.com` |
| Database | MongoDB Atlas | Managed cluster |
| Cache/Queue | Redis Cloud | Managed instance |
| LaTeX Renderer | Docker (on Render) | Sidecar container |

---

## Prerequisites

- Node.js >= 18
- npm (workspace support)
- Git
- Accounts: Vercel, Render, MongoDB Atlas, Redis Cloud (Upstash or Redis Labs)
- API Keys: Clerk, NVIDIA NIM / Groq, Razorpay, Brevo

---

## 1. MongoDB Atlas Setup

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Whitelist IP addresses (or use `0.0.0.0/0` for Render's dynamic IPs)
4. Get the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/texfolio?retryWrites=true&w=majority
   ```
5. The application auto-creates collections and indexes on first connection

---

## 2. Redis Cloud Setup

1. Create a free Redis instance at [redis.io/cloud](https://redis.io/cloud) or [upstash.com](https://upstash.com)
2. Note the connection URL:
   ```
   redis://default:<password>@<host>:<port>
   ```
3. Redis is used for:
   - BullMQ job queue (PDF generation)
   - Distributed rate limiting (fixed-window counters)

---

## 3. Clerk Authentication Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Configure sign-in methods (email, Google, GitHub)
3. Note the keys:
   - `CLERK_PUBLISHABLE_KEY` (frontend + backend)
   - `CLERK_SECRET_KEY` (backend only)
4. Set the frontend URL in Clerk dashboard for redirect handling

---

## 4. Backend Deployment (Render)

### 4.1 Create Web Service

1. Connect your GitHub repo to Render
2. Configure the service:

| Setting | Value |
|:--|:--|
| Name | `texfolio-api` |
| Root Directory | `./` |
| Build Command | `npm ci && npm run build:deploy` |
| Start Command | `npm run start:deploy` |
| Node Version | 20 |
| Instance Type | Free or Starter |

The `build:deploy` script builds the shared package first, then the API:
```bash
npm run build --workspace=@texfolio/shared && npm run build --workspace=@texfolio/api
```

### 4.2 Environment Variables

Set these in Render's dashboard:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://default:...@host:port

# Auth
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# AI (at least one required)
NVIDIA_API_KEY=nvapi-...
GROQ_API_KEY=gsk_...
GOOGLE_AI_API_KEY=AIza...

# PDF
PDFLATEX_PATH=pdflatex
USE_DOCKER_LATEX=true

# Payments
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email
BREVO_API_KEY=xkeysib-...
SENDER_EMAIL=hello@texfolio.app

# CORS (frontend URL)
CORS_ORIGIN=https://texfolio.vercel.app

# API Keys (generate a random 64-char hex string)
API_KEY_SECRET=<random_64_char_hex>
```

### 4.3 Docker LaTeX Renderer on Render

For PDF generation on Render, you have two options:

**Option A: Install TeX Live in the Render build (simpler)**

Add to Render's build command:
```bash
apt-get update && apt-get install -y texlive-latex-base texlive-fonts-recommended texlive-latex-extra
```
Set `USE_DOCKER_LATEX=false` and `PDFLATEX_PATH=pdflatex`.

**Option B: Docker service (recommended for isolation)**

Deploy the LaTeX renderer as a separate Docker service on Render:
1. Create a new "Docker" service pointing to `apps/latex-renderer/Dockerfile`
2. Mount a shared volume for the temp directory
3. Set `USE_DOCKER_LATEX=true`

The Dockerfile (`apps/latex-renderer/Dockerfile`):
```dockerfile
FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*
CMD ["tail", "-f", "/dev/null"]
```

---

## 5. Frontend Deployment (Vercel)

### 5.1 Connect Repository

1. Import the GitHub repo in Vercel
2. Configure:

| Setting | Value |
|:--|:--|
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && npm ci && npm run build:shared && cd apps/web && npm run build` |
| Output Directory | `dist` |
| Node Version | 20 |

### 5.2 Environment Variables

```env
VITE_API_URL=https://texfolio-api.onrender.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### 5.3 Vercel Configuration

The frontend uses `rolldown-vite` (Vite with Rolldown bundler). Vercel handles this automatically since it's aliased in `package.json`:
```json
"overrides": { "vite": "npm:rolldown-vite@7.2.5" }
```

---

## 6. Docker Compose (Local Development)

For local development with Docker-based LaTeX rendering:

```bash
# Start Redis + LaTeX renderer
docker-compose up -d

# Verify containers
docker ps
# Should show: texfolio-redis, texfolio-latex
```

`docker-compose.yml`:
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: texfolio-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis-data:/data

  latex-renderer:
    build:
      context: ./apps/latex-renderer
    container_name: texfolio-latex
    volumes:
      - ./apps/api/temp:/app/temp
    working_dir: /app/temp
    restart: unless-stopped

volumes:
  redis-data:
```

---

## 7. CI/CD Pipeline

**Source:** `.github/workflows/ci.yml`

The pipeline runs on push/PR to `main`:

```
┌─────────────────────────────────────┐
│  Job 1: Security & Code Quality     │
│                                     │
│  1. npm ci                          │
│  2. npm audit --production          │
│  3. Lint (API + Web workspaces)     │
│  4. npm run build:deploy            │
└──────────────────┬──────────────────┘
                   │ (depends on)
                   ▼
┌─────────────────────────────────────┐
│  Job 2: Build Verification          │
│                                     │
│  1. npm ci                          │
│  2. npm run build (full)            │
│  3. Verify dist/ artifacts exist    │
└─────────────────────────────────────┘
```

---

## 8. Post-Deployment Checklist

- [ ] Verify `/health` returns 200
- [ ] Verify `/health/ai` shows `groqKeyConfigured: true`
- [ ] Verify `/health/pdf` shows `pdflatex: true, redis: true`
- [ ] Test Clerk auth flow (sign up → sign in → JWT)
- [ ] Test PDF generation (create resume → download PDF)
- [ ] Test rate limiting (exceed 60 req/min as free user)
- [ ] Verify CORS allows only the frontend origin
- [ ] Test Razorpay webhook signature verification
- [ ] Verify audit logs are being written
- [ ] Check MongoDB Atlas metrics for connection pool usage

---

## 9. Scaling Considerations

| Component | Scaling Strategy |
|:--|:--|
| API Server | Horizontal (Render auto-scaling or multiple instances) |
| PDF Worker | Increase BullMQ concurrency or add worker instances |
| Rate Limiting | Redis-backed, works across multiple API instances |
| Database | MongoDB Atlas auto-scaling, add read replicas |
| Frontend | Vercel Edge CDN (automatic) |

---

## 10. Environment Variable Reference

| Variable | Required | Default | Description |
|:--|:--|:--|:--|
| `NODE_ENV` | — | `development` | `development` \| `production` \| `test` |
| `PORT` | — | `5000` | API server port |
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `REDIS_URL` | — | `redis://localhost:6379` | Redis connection URL |
| `CLERK_SECRET_KEY` | ✅ | — | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | ✅ | — | Clerk publishable key |
| `NVIDIA_API_KEY` | — | — | NVIDIA NIM API key |
| `GROQ_API_KEY` | — | — | Groq API key |
| `GOOGLE_AI_API_KEY` | — | — | Google Gemini key |
| `CORS_ORIGIN` | — | `http://localhost:5173` | Comma-separated origins |
| `PDFLATEX_PATH` | — | `pdflatex` | Path to pdflatex binary |
| `USE_DOCKER_LATEX` | — | — | Set `true` for Docker rendering |
| `RAZORPAY_KEY_ID` | — | — | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | — | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | — | Webhook signature secret |
| `BREVO_API_KEY` | — | — | Brevo email API key |
| `SENDER_EMAIL` | — | — | From address for emails |
| `API_KEY_SECRET` | — | — | HMAC signing secret for API keys |
