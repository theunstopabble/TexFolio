# System Architecture

**Version:** 2.0.0 | **Last Updated:** September 2026

---

## High-Level Overview

TexFolio is an **npm-workspaces monorepo** following a Service-Oriented Architecture with clear separation between the React frontend, Hono API backend, and infrastructure services.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│  React 19 + Vite (Rolldown) + Tailwind v4 + Zustand + React Query  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS (Clerk JWT)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HONO v4 API SERVER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Request ID│→│  Logger  │→│  CORS +  │→│Tiered RL │→│  Input   │ │
│  │Middleware│ │Structured│ │ SecHdrs  │ │ (memory) │ │Sanitizer │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                              │                                       │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                     ROUTE HANDLERS                             │  │
│  │  /resumes  /ai  /agents  /organizations  /payments  /me       │  │
│  │  /auth  /analytics  /audit-logs  /api-keys  /public            │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                           │
│  │   Auth   │ │   RBAC   │ │  Audit   │                           │
│  │(Clerk JWT│ │requireRole│ │  Trail   │                           │
│  └──────────┘ └──────────┘ └──────────┘                           │
└────────┬──────────────┬──────────────┬──────────────┬───────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐
│  MongoDB     │ │   Redis   │ │  BullMQ   │ │  External APIs    │
│  Atlas       │ │   Cloud   │ │  Workers  │ │                   │
│              │ │           │ │           │ │ • NVIDIA NIM       │
│ • Users      │ │ • Queue   │ │ • PDF Gen │ │ • Google Gemini   │
│ • Resumes    │ │   Backend │ │ • Retries │ │ • Groq            │
│ • Orgs       │ │           │ │ • Progress│ │ • Clerk           │
│ • AuditLogs  │ │           │ │           │ │ • Razorpay        │
│ • ApiKeys    │ │           │ │           │ │ • Brevo           │
│              │ │           │ │           │ │ • Telegram Bot    │
└──────────────┘ └───────────┘ └─────┬─────┘ └───────────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │  pdflatex   │
                              │  (Docker or │
                              │   local)    │
                              └─────────────┘
```

---

## Monorepo Structure

```
TexFolio/
├── apps/
│   ├── api/                    # Hono v4 backend server
│   │   └── src/
│   │       ├── hono.ts         # Entry point, middleware pipeline
│   │       ├── agents/         # LangGraph AI pipelines
│   │       ├── config/         # Zod-validated env, DB connection
│   │       ├── middleware.hono/ # Auth, RBAC, rate limit, sanitizer
│   │       ├── models/         # Mongoose schemas (6 models)
│   │       ├── queues/         # BullMQ PDF worker
│   │       ├── routes.hono/    # REST endpoints (11 route files)
│   │       ├── services/       # Business logic (9 services)
│   │       ├── templates/      # LaTeX .tex templates + .cls
│   │       └── utils/          # Circuit breaker
│   ├── web/                    # React 19 frontend
│   │   └── src/
│   │       ├── assets/         # Static assets
│   │       ├── components/     # Shared UI (Header, OrganizationSwitcher)
│   │       ├── context/        # AuthContext, OrganizationContext
│   │       ├── features/       # Feature modules (create-resume, resume-editor)
│   │       ├── hooks/          # React Query hooks
│   │       ├── lib/            # Query client, structured data, helpers
│   │       ├── pages/          # Route views (17 pages)
│   │       ├── services/       # API client (Axios)
│   │       └── stores/         # Zustand stores (UI, org)
│   └── latex-renderer/         # Docker container for pdflatex
│       └── Dockerfile
├── packages/
│   └── shared/                 # @texfolio/shared — Zod schemas + constants
│       └── src/
│           └── schemas/        # Zod schemas (single source of truth)
├── docker-compose.yml          # Redis + LaTeX renderer orchestration
├── package.json                # Workspace root (npm workspaces)
└── .github/workflows/ci.yml    # CI/CD pipeline
```

---

## Middleware Pipeline

Requests flow through middleware in strict order (defined in `apps/api/src/hono.ts`):

```
Request
  │
  ├─ 1. requestIdMiddleware     → Assign/propagate X-Request-ID (nanoid 16)
  ├─ 2. structuredLogger        → JSON log with correlation ID
  ├─ 3. secureHeaders()         → CSP, X-Frame-Options, nosniff, referrer
  ├─ 4. cors()                  → Origin whitelist, credential support
  ├─ 5. tieredRateLimiter       → In-memory sliding window (Pro 300 / Free 60 / anon 20 per min)
  ├─ 6. inputSanitizer          → XSS/prototype pollution prevention

  ├─ [Route-level middleware]
  │   ├─ authMiddleware         → Clerk JWT verification + user sync
  │   └─ requireRole("admin")   → RBAC enforcement
  │
  └─ Route Handler → Service → Model → Response
```

---

## PDF Generation Pipeline

### Synchronous Path (`GET /api/resumes/:id/pdf`)

```
Client Request
  │
  ├─ Auth + ownership check
  ├─ Fetch resume from MongoDB
  ├─ Transform resume data → Mustache template variables
  ├─ Escape LaTeX special characters
  ├─ Render .tex via Mustache (delimiters: << >>)
  ├─ Write .tex to temp directory
  ├─ spawn pdflatex (Docker or local) — NOT exec (security)
  │   ├─ 60s timeout with SIGKILL
  │   └─ stdout/stderr capped at 50KB
  ├─ Read generated .pdf
  ├─ Cleanup auxiliary files (.aux, .log, .out)
  └─ Return PDF binary
```

### Asynchronous Path (`POST /api/resumes/:id/pdf/queue`)

Production-only (Redis-backed); the web client currently uses the synchronous path above.
Org branding (`lockedTemplateId`, `primaryColor`, `enforceCompanyFont`) is resolved only
here, inside the worker.

```
Client Request
  │
  ├─ Auth + ownership check
  ├─ Enqueue BullMQ job { resumeId, userId, organizationId }
  └─ Return jobId immediately
        │
        ▼ (Worker process)
  ┌─────────────────────────────────────────┐
  │  PDF Worker (concurrency: 2)            │
  │  Rate limit: 5 jobs/minute              │
  │                                         │
  │  1. updateProgress(10%)                 │
  │  2. Fetch resume + verify ownership     │
  │  3. Fetch org branding (if applicable)  │
  │  4. updateProgress(30%)                 │
  │  5. generatePDF(resume, template, org)  │
  │  6. updateProgress(100%)               │
  │  7. Return { outputPath, durationMs }   │
  │                                         │
  │  Retries: 3 attempts, exponential       │
  │  backoff (2s, 4s, 8s)                   │
  └─────────────────────────────────────────┘
        │
        ▼
  Client polls GET /api/resumes/:id/pdf/queue/:jobId
  → { status: "completed", progress: 100 }
  → GET .../download → PDF binary
```

---

## AI Agent Pipeline (LangGraph)

**Source:** `apps/api/src/agents/resume-coach.agent.ts`

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  1. Content Analysis │  Score: 0-100
              │  (30% weight)        │  Feedback items
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  2. ATS Analysis     │  Score: 0-100
              │  (25% weight)        │  Keywords found/missing
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  3. Format Analysis  │  Score: 0-100
              │  (20% weight)        │  Formatting issues
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  4. Impact Analysis  │  Score: 0-100
              │  (25% weight)        │  Suggestions
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  5. Synthesize       │  Weighted average
              │  Final Score + Recs  │  Top 2 from each
              └──────────┬──────────┘
                         │
                         ▼
                    ┌─────────┐
                    │   END   │
                    └─────────┘
```

### LLM Provider Failover Chain

```
NVIDIA NIM (Llama 3.1 70B)  ──[fail]──→  Google Gemini 1.5 Flash  ──[fail]──→  Groq (Llama 3.1 70B)
     │                                          │                                      │
     └── Primary (best free tier)               └── Secondary                          └── Fallback
```

---

## RBAC Resolution Flow

```
HTTP Request
  │
  ├─ authMiddleware (Clerk JWT verification)
  │   ├─ Verify token via verifyToken() (@clerk/backend)
  │   ├─ Sync/create user in MongoDB
  │   └─ If X-Organization-Id header present:
  │       └─ Lookup OrganizationMember → attach { organizationId, role }
  │
  ├─ requireRole("admin") middleware
  │   ├─ Check context for pre-resolved org role
  │   ├─ OR resolve from route param :id → OrganizationMember lookup
  │   ├─ Compare role weight: owner(4) > admin(3) > editor(2) > viewer(1)
  │   └─ 403 if insufficient role
  │
  └─ Route Handler
      ├─ resumeService.findAll(userId, { orgId })
      │   └─ Query: user's resumes + org resumes with visibility in (organization, public)
      ├─ auditService.log({ actorId, action, resourceType })
      └─ Response
```

---

## Rate Limiting

```
┌──────────────────────────────────────────────────────────────┐
│                    Rate Limit Flow                             │
│                                                               │
│  Request → Extract key (userId or IP)                         │
│         → In-memory Map, per process                          │
│         → Sliding window: keep hits newer than windowStart    │
│         → Compare hits vs tier limit                          │
│         → Set X-RateLimit-* headers                           │
│         → 429 if exceeded, else continue                      │
│                                                               │
│  Tiers (configured):                                          │
│    Pro users:      300 req/min                                │
│    Free users:      60 req/min                                │
│    Anonymous (IP):  20 req/min                                │
│    Sensitive routes: 5 req/min (auth, payments)               │
│                                                               │
│  Note: the limiter runs before route-level auth, so every      │
│  request currently resolves to the anonymous tier. State is    │
│  per-instance and not shared across API instances.            │
└──────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
App.tsx
  │
  ├─ ClerkProvider (auth)
  ├─ OrganizationProvider (context)
  │   └─ organizationStore (Zustand + devtools)
  ├─ QueryClientProvider (React Query)
  │
  └─ React Router v7
      ├─ /                    → HomePage
      ├─ /dashboard           → Dashboard (org context banner)
      ├─ /create              → CreateResume (stepper)
      ├─ /edit/:id            → EditResume (drag-and-drop editor)
      ├─ /resumes             → ResumeList
      ├─ /organizations       → Organizations (list, create)
      ├─ /organizations/:id   → OrganizationDetail
      ├─ /organizations/:id/settings → OrganizationSettings
      ├─ /organizations/:id/members  → OrganizationMembers
      ├─ /pricing             → Pricing (Razorpay)
      ├─ /cover-letter        → CoverLetter
      ├─ /templates           → Templates
      ├─ /profile/*           → UserProfile
      ├─ /login/*, /register/* → Clerk auth screens
      ├─ /privacy             → Privacy
      ├─ /terms               → Terms
      ├─ /about               → About
      └─ /r/:shareId          → PublicResume (no auth)
```

### State Management

| Store | Library | Purpose |
|:--|:--|:--|
| `organizationStore` | Zustand (devtools) | Active org, role, org list |
| `uiStore` | Zustand | Active tab, saving/loading flags, mobile menu, modal |
| Server state | React Query | API data caching, mutations |

---

## Deployment Topology

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Vercel    │     │    Render    │     │  MongoDB Atlas   │
│  (Frontend) │────▶│   (Backend)  │────▶│  (Database)      │
│             │     │              │     │                  │
│ React SPA   │     │ Hono + Node  │     │ Replica Set      │
│ CDN + Edge  │     │ Docker       │     │ Connection Pool  │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
                    ┌──────┴───────┐
                    │ Redis Cloud  │
                    │              │
                    │  • BullMQ    │
                    └──────────────┘
```
