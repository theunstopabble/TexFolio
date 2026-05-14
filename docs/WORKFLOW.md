# Development Workflow

**Version:** 2.0.0 | **Last Updated:** May 2026

Development workflows, pipeline documentation, and operational procedures for the TexFolio platform.

---

## Local Development Setup

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/theunstopabble/TexFolio.git
cd TexFolio
npm install

# 2. Environment setup
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Fill in API keys (see DEPLOYMENT.md for details)

# 3. Start infrastructure (Redis + LaTeX renderer)
docker-compose up -d

# 4. Run both frontend and backend
npm run dev
```

### Available Scripts

| Script | Command | Description |
|:--|:--|:--|
| `npm run dev` | `concurrently "dev:api" "dev:web"` | Start both services |
| `npm run dev:api` | `tsx watch src/hono.ts` | API with hot reload |
| `npm run dev:web` | `vite` | Frontend with HMR |
| `npm run build` | Build shared → API → Web | Full production build |
| `npm run build:deploy` | Build shared → API | Backend-only deploy build |
| `npm run build:shared` | `tsc` in shared package | Compile shared types |

### Development URLs

| Service | URL |
|:--|:--|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |
| API Health | `http://localhost:5000/health` |

---

## BullMQ PDF Generation Pipeline

**Source:** `apps/api/src/queues/pdf.queue.ts`

### Flow Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────▶│  API Route   │────▶│  BullMQ      │────▶│  Worker  │
│          │     │  POST .../   │     │  Queue       │     │          │
│          │     │  pdf/queue   │     │              │     │          │
└──────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
     │                                                          │
     │  Poll: GET .../pdf/queue/:jobId                          │
     │◀─────────────────────────────────────────────────────────┤
     │  { status: "active", progress: 30 }                      │
     │                                                          │
     │  GET .../pdf/queue/:jobId/download                       │
     │◀─────────────────────────────────────────────────────────┤
     │  PDF binary                                              │
     └──────────────────────────────────────────────────────────┘
```

### Job Lifecycle

```
WAITING → ACTIVE → COMPLETED
                 → FAILED (retry up to 3x)
```

### Worker Configuration

```typescript
{
  concurrency: 2,              // Max parallel jobs
  limiter: {
    max: 5,                    // Max 5 jobs
    duration: 60000,           // Per 60 seconds
  },
  defaultJobOptions: {
    attempts: 3,               // Retry count
    backoff: {
      type: "exponential",     // 2s → 4s → 8s
      delay: 2000,
    },
    removeOnComplete: { count: 100 },  // Keep last 100 completed
    removeOnFail: { count: 50 },       // Keep last 50 failed
  }
}
```

### Progress Tracking

| Progress | Stage |
|:--|:--|
| 10% | Job started, fetching resume |
| 30% | Resume fetched, org branding resolved, starting compilation |
| 100% | PDF generated successfully |

### Error Handling

- **Resume not found:** Job fails immediately (no retry)
- **pdflatex timeout (60s):** Process killed with SIGKILL, job retried
- **pdflatex non-zero exit:** Check if PDF was still created (LaTeX warnings are non-fatal)
- **Redis connection lost:** Worker pauses, resumes when reconnected

---

## LangGraph Agent Pipeline

**Source:** `apps/api/src/agents/resume-coach.agent.ts`

### State Graph

```
START → content → ats → format → impact → synthesize → END
```

### Node Details

| Node | Purpose | Output | Weight |
|:--|:--|:--|:--|
| `content` | Content quality analysis | score + feedback[] | 30% |
| `ats` | ATS compatibility check | score + keywords + missing | 25% |
| `format` | Structure/layout review | score + issues[] | 20% |
| `impact` | Overall effectiveness | score + suggestions[] | 25% |
| `synthesize` | Combine all results | finalScore + recommendations | — |

### State Schema

```typescript
{
  resumeData: Record<string, unknown>;   // Input resume JSON
  jobDescription: string;                 // Optional target JD
  messages: Message[];                    // Conversation history
  currentPhase: string;                   // Current node
  analysisResults: {                      // Accumulated results
    contentAnalysis?: { score, feedback[] };
    atsAnalysis?: { score, keywords[], missing[] };
    formatAnalysis?: { score, issues[] };
    impactAnalysis?: { score, suggestions[] };
  };
  finalScore: number;                     // Weighted average (0-100)
  recommendations: string[];             // Top 2 from each category
  error: string | null;
}
```

### LLM Invocation Pattern

Each node:
1. Creates an LLM instance (provider selected by available API keys)
2. Sends a system prompt with resume data
3. Requests JSON-only response
4. Parses JSON from response (regex extraction for robustness)
5. Returns partial state update

### Error Recovery

If any node fails to parse LLM output, it returns a zero score and continues to the next node. The pipeline never halts on a single node failure.

---

## RBAC Resolution Flow

**Source:** `apps/api/src/middleware.hono/auth.middleware.ts`, `apps/api/src/middleware.hono/rbac.middleware.ts`

### Full Request Flow

```
1. Request arrives with:
   - Authorization: Bearer <clerk_jwt>
   - X-Organization-Id: <org_id> (optional)

2. authMiddleware:
   ├─ Verify JWT via clerkClient.verifyToken()
   ├─ Extract clerkId (sub claim)
   ├─ Find/create user in MongoDB
   ├─ If X-Organization-Id present:
   │   └─ Lookup OrganizationMember { orgId, userId, status: "active" }
   │       └─ Attach { organizationId, role } to context
   └─ Set user context: { userId, mongoUserId, email, isPro, organizationId?, role? }

3. requireRole("admin") (route-level):
   ├─ Check if org role already resolved (from step 2)
   ├─ OR resolve from route param :id:
   │   └─ Lookup OrganizationMember { orgId: param.id, userId }
   ├─ Compare: ORG_ROLE_WEIGHT[actual] >= ORG_ROLE_WEIGHT[required]
   │   owner(4) >= admin(3) → PASS
   │   editor(2) >= admin(3) → FAIL (403)
   └─ Enrich context with resolved { organizationId, role }

4. Route Handler:
   └─ Access user.organizationId and user.role for business logic
```

### Role Permissions Matrix

| Action | Owner (4) | Admin (3) | Editor (2) | Viewer (1) |
|:--|:--|:--|:--|:--|
| View org resumes | ✅ | ✅ | ✅ | ✅ |
| Create org resumes | ✅ | ✅ | ✅ | ❌ |
| Edit any org resume | ✅ | ✅ | ✅ | ❌ |
| Delete org resumes | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Update org settings | ✅ | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

### Ownership Transfer

1. Current owner calls `PUT /api/organizations/:id/members/:userId` with `{ role: "owner" }`
2. Service validates caller is current owner
3. Target member promoted to `owner`
4. Previous owner demoted to `admin`
5. Audit log records both role changes

---

## CI/CD Pipeline

**Source:** `.github/workflows/ci.yml`

### Trigger

- Push to `main` branch
- Pull requests targeting `main`

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Security & Code Quality                           │
│                                                             │
│  ┌─────────┐  ┌──────────────┐  ┌──────┐  ┌────────────┐  │
│  │ Checkout│→ │ npm ci       │→ │ Audit│→ │ Lint (both)│  │
│  └─────────┘  └──────────────┘  └──────┘  └────────────┘  │
│                                                             │
│  • npm audit --production --audit-level=high (non-blocking) │
│  • ESLint on @texfolio/api and @texfolio/web                │
│  • npm run build:deploy (shared + API)                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ depends on
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 2: Build Verification                                │
│                                                             │
│  ┌─────────┐  ┌──────────────┐  ┌───────┐  ┌───────────┐  │
│  │ Checkout│→ │ npm ci       │→ │ Build │→ │ Verify    │  │
│  └─────────┘  └──────────────┘  └───────┘  │ artifacts │  │
│                                              └───────────┘  │
│  • Full build (shared + API + Web)                          │
│  • Check apps/api/dist/ exists                              │
│  • Check apps/web/dist/ exists                              │
└─────────────────────────────────────────────────────────────┘
```

### Node.js Version

CI uses Node.js 20 with npm caching enabled.

---

## Audit Trail

**Source:** `apps/api/src/services/audit.service.ts`

### Logged Actions

Every state-changing operation is logged with:

```typescript
await auditService.log({
  actorId: user.userId,          // Who
  action: "CREATE",              // What
  resourceType: "Resume",       // On what type
  resourceId: resume._id,       // Which one
  before: existingState,         // Previous state (for updates)
  after: newState,               // New state
  metadata: {
    requestId,                   // Correlation ID
    ip,                          // Client IP
    userAgent,                   // Browser/client
    method: "POST",              // HTTP method
    path: "/api/resumes",        // Route
    statusCode: 201,             // Response code
    durationMs: 45,              // Request duration
  },
});
```

### Retention

Audit logs have a **90-day TTL** via MongoDB TTL index:
```typescript
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

---

## Development Best Practices

### Adding a New Route

1. Create route file in `apps/api/src/routes.hono/`
2. Define Zod validation schemas
3. Apply `authMiddleware` and `requireRole()` as needed
4. Use service layer for business logic
5. Log audit events for state changes
6. Register route in `apps/api/src/hono.ts`

### Adding a New Model

1. Create model in `apps/api/src/models/`
2. Define TypeScript interface + Mongoose schema
3. Add compound indexes for common query patterns
4. Export from `apps/api/src/models/index.ts`
5. Add Zod schema to `packages/shared/src/schemas/`

### Frontend Feature Development

1. Create page in `apps/web/src/pages/`
2. Add React Query hook in `apps/web/src/hooks/`
3. Use `organizationStore` for org-aware features
4. Add route to `App.tsx`
5. Use `ProtectedRoute` wrapper for auth-required pages

### Environment Variable Changes

1. Add to `apps/api/src/config/env.ts` Zod schema
2. Add to `.env.example`
3. Update `DEPLOYMENT.md` environment reference
4. Add to Render/Vercel dashboard

---

## Monitoring & Observability

### Health Endpoints

| Endpoint | Checks |
|:--|:--|
| `GET /health` | API liveness |
| `GET /health/ai` | Circuit breaker state, Groq key configured |
| `GET /health/pdf` | pdflatex binary/Docker available, Redis connected |

### Request Tracing

Every request gets a unique `X-Request-ID` (nanoid 16 chars). This ID:
- Is set on the response header
- Is stored in audit logs
- Is included in error responses
- Can be provided by the client (forwarded from load balancer)

### Structured Logging

All logs are JSON-serialized with:
- Timestamp
- Level (info, warn, error)
- Request ID (correlation)
- Duration
- Error stack traces (server-side only)
