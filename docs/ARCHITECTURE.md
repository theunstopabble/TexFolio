# System Architecture

**Version:** 2.0.0 | **Last Updated:** May 2026

---

## High-Level Overview

TexFolio is a **Turborepo monorepo** following a Service-Oriented Architecture with clear separation between the React frontend, Hono API backend, and infrastructure services.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│  React 19 + Vite (Rolldown) + Tailwind v4 + Zustand + React Query  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS (Clerk JWT / API Key)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HONO v4 API SERVER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Request ID│→│  Logger  │→│  CORS +  │→│Tiered RL │→│  Input   │ │
│  │Middleware│ │Structured│ │ SecHdrs  │ │  (Redis) │ │Sanitizer │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                              │                                       │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                     ROUTE HANDLERS                             │  │
│  │  /resumes  /ai  /agents  /organizations  /payments  /me       │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │   Auth   │ │   RBAC   │ │ API Key  │ │  Audit   │              │
│  │(Clerk JWT│ │requireRole│ │  (HMAC)  │ │  Trail   │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└────────┬──────────────┬──────────────┬──────────────┬──────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐
│  MongoDB     │ │   Redis   │ │  BullMQ   │ │  External APIs    │
│  Atlas       │ │   Cloud   │ │  Workers  │ │                   │
│              │ │           │ │           │ │ • NVIDIA NIM       │
│ • Users      │ │ • Rate    │ │ • PDF Gen │ │ • Google Gemini   │
│ • Resumes    │ │   Limits  │ │ • Retries │ │ • Groq            │
│ • Orgs       │ │ • Queue   │ │ • Progress│ │ • Clerk           │
│ • AuditLogs  │ │   Backend │ │           │ │ • Razorpay        │
│ • ApiKeys    │ │           │ │           │ │ • Brevo           │
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
│   │       ├── models/         # Mongoose schemas (7 models)
│   │       ├── queues/         # BullMQ PDF worker
│   │       ├── routes.hono/    # REST endpoints (11 route files)
│   │       ├── schemas/        # Zod validation schemas
│   │       ├── services/       # Business logic (10 services)
│   │       ├── templates/      # LaTeX .tex templates + .cls
│   │       └── utils/          # Circuit breaker
│   ├── web/                    # React 19 frontend
│   │   └── src/
│   │       ├── components/     # Shared UI (Header, OrganizationSwitcher)
│   │       ├── context/        # AuthContext, OrganizationContext
│   │       ├── features/       # Feature modules (resume editor)
│   │       ├── hooks/          # React Query hooks
│   │       ├── pages/          # Route views (14 pages)
│   │       ├── services/       # API client (Axios)
│   │       └── stores/         # Zustand stores (UI, org, resume)
│   └── latex-renderer/         # Docker container for pdflatex
│       └── Dockerfile
├── packages/
│   └── shared/                 # @texfolio/shared — Zod schemas + TS types
│       └── src/
│           ├── types/          # Legacy TypeScript interfaces
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
  ├─ 5. tieredRateLimiter       → Redis fixed-window (Pro: 300/min, Free: 60/min)
  ├─ 6. inputSanitizer          → XSS/prototype pollution prevention
  │
  ├─ [Route-level middleware]
  │   ├─ authMiddleware         → Clerk JWT verification + user sync
  │   ├─ requireRole("admin")   → RBAC enforcement
  │   └─ apiKeyMiddleware       → HMAC key verification + scope check
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
  ├─ Resolve org branding (lockedTemplateId, primaryColor, enforceCompanyFont)
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
  │   ├─ Verify token via clerkClient.verifyToken()
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
      ├─ resumeService.findAll(userId, { orgId, role })
      │   └─ Query: user's resumes + org resumes (if role >= viewer)
      ├─ auditService.log({ actorId, action, resourceType })
      └─ Response
```

---

## Distributed Rate Limiting

```
┌──────────────────────────────────────────────────────────────┐
│                    Rate Limit Flow                             │
│                                                               │
│  Request → Extract key (userId or IP)                         │
│         → Compute windowId = floor(now / windowMs)            │
│         → Redis key: ratelimit:{key}:{windowId}               │
│         → INCR + PEXPIRE (atomic pipeline)                    │
│         → Compare hits vs tier limit                          │
│         → Set X-RateLimit-* headers                           │
│         → 429 if exceeded, else continue                      │
│                                                               │
│  Tiers:                                                       │
│    Pro users:      300 req/min                                │
│    Free users:      60 req/min                                │
│    Anonymous (IP):  20 req/min                                │
│    Sensitive routes: 5 req/min (auth, payments)               │
│                                                               │
│  Fail-Open: If Redis unreachable → allow request              │
└──────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
App.tsx
  │
  ├─ ClerkProvider (auth)
  ├─ OrganizationProvider (context)
  │   └─ organizationStore (Zustand + persist)
  ├─ QueryClientProvider (React Query)
  │
  └─ React Router v7
      ├─ /                    → HomePage
      ├─ /dashboard           → Dashboard (org context banner)
      ├─ /resumes             → ResumeList
      ├─ /resumes/new         → CreateResume (stepper)
      ├─ /resumes/:id/edit    → EditResume (drag-and-drop editor)
      ├─ /organizations       → Organizations (list, create)
      ├─ /organizations/:id   → OrganizationDetail
      ├─ /organizations/:id/settings → OrganizationSettings
      ├─ /organizations/:id/members  → OrganizationMembers
      ├─ /pricing             → Pricing (Razorpay)
      ├─ /cover-letter        → CoverLetter
      ├─ /templates           → Templates
      ├─ /profile             → UserProfile
      └─ /r/:shareId          → PublicResume (no auth)
```

### State Management

| Store | Library | Purpose |
|:--|:--|:--|
| `organizationStore` | Zustand (persist) | Active org, role, org list |
| `resumeStore` | Zustand | Current resume editing state |
| `uiStore` | Zustand | Sidebar, modals, theme |
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
                    │ • Rate Limits│
                    │ • BullMQ     │
                    └──────────────┘
```
