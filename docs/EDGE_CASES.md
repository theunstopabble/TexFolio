# Edge Cases & Error Handling

**Version:** 2.0.0 | **Last Updated:** May 2026

Documentation of error handling strategies, security measures, and edge case management across the TexFolio platform.

---

## Circuit Breaker (AI Service Failover)

**Source:** `apps/api/src/utils/circuit-breaker.ts`, `apps/api/src/services/ai.service.ts`

### State Machine

```
         success (threshold met)
    ┌────────────────────────────────┐
    │                                │
    ▼                                │
┌────────┐   failure threshold   ┌───────┐   timeout elapsed   ┌───────────┐
│ CLOSED │ ────────────────────▶ │ OPEN  │ ──────────────────▶ │ HALF_OPEN │
│        │                       │       │                      │           │
└────────┘                       └───────┘                      └─────┬─────┘
    ▲                                ▲                                │
    │                                │         failure                │
    │                                └────────────────────────────────┘
    │                     success (threshold met)
    └─────────────────────────────────────────────────────────────────┘
```

### Configuration

| Parameter | Value | Description |
|:--|:--|:--|
| `failureThreshold` | 5 | Consecutive failures before OPEN |
| `successThreshold` | 2 | Successes in HALF_OPEN to close |
| `timeoutMs` | 30,000 | Time in OPEN before trying HALF_OPEN |

### Behavior

- **CLOSED:** All requests pass through normally
- **OPEN:** Immediately throws error with retry countdown (no API call made)
- **HALF_OPEN:** Allows requests through; 2 successes → CLOSED, 1 failure → OPEN

### LLM Provider Failover Chain

The LangGraph agent (`apps/api/src/agents/resume-coach.agent.ts`) uses a priority-based provider selection:

```
1. NVIDIA NIM (Llama 3.1 70B)  — Primary (best free tier)
2. Google Gemini 1.5 Flash      — Secondary
3. Groq (Llama 3.1 70B)         — Fallback
```

Selection is based on which API key is configured (checked at runtime). The `AIService` class wraps all Groq calls in the circuit breaker.

### Health Monitoring

`GET /health/ai` exposes circuit breaker metrics:
```json
{
  "circuitBreaker": {
    "state": "CLOSED",
    "failures": 0,
    "successes": 0,
    "lastFailureTime": null,
    "totalCalls": 142,
    "totalFailures": 3
  }
}
```

---

## Rate Limiting Edge Cases

**Source:** `apps/api/src/middleware.hono/rate-limit.middleware.ts`

### Fail-Open Strategy

If Redis is unreachable, the rate limiter **allows all requests** to prevent a total outage:

```typescript
} catch (err) {
  console.error("[RateLimit] Redis error, failing open:", err.message);
  return { hits: 0, ttlMs: windowMs }; // Allow request
}
```

**Rationale:** A rate limiter failure should not block legitimate traffic. The risk of temporary over-serving is preferable to a complete service outage.

### IP Resolution Chain

For anonymous users, the rate limiter resolves the client IP in this order:

1. Last IP in `X-Forwarded-For` chain (actual client behind proxies)
2. `X-Real-IP` header (set by trusted reverse proxies like nginx)
3. `REMOTE_ADDR` from connection
4. Fallback: `"unknown-ip"` (all unknowns share a single bucket)

### Tier Boundaries

| Tier | Limit | Key Pattern |
|:--|:--|:--|
| Pro (authenticated) | 300 req/min | `ratelimit:user:<clerkId>:<windowId>` |
| Free (authenticated) | 60 req/min | `ratelimit:user:<clerkId>:<windowId>` |
| Anonymous | 20 req/min | `ratelimit:ip:<ip>:<windowId>` |
| Sensitive routes | 5 req/min | IP-based (auth, payments) |

### Window Calculation

Fixed-window using integer division:
```typescript
const windowId = Math.floor(Date.now() / windowMs);
```

Redis operations are atomic via pipeline (`INCR` + `PEXPIRE`).

---

## PDF Compilation Security

**Source:** `apps/api/src/services/pdf.service.ts`

### spawn vs exec

The PDF service uses `spawn` instead of `exec` to prevent **command injection**:

```typescript
// SECURE: Arguments are passed as array (no shell interpretation)
spawn("docker", ["exec", "texfolio-latex", "pdflatex", "-interaction=nonstopmode", filename]);

// INSECURE (never used): String concatenation allows injection
exec(`pdflatex ${filename}`);  // If filename = "; rm -rf /" → disaster
```

### Path Traversal Prevention

Template IDs are sanitized to prevent directory traversal:

```typescript
const template_id = path.basename(effectiveTemplateId).replace(/[^a-zA-Z0-9_-]/g, "");
if (!template_id) throw new Error("Invalid template ID");
```

### Filename Sanitization (Docker mode)

```typescript
const sanitizedFilename = texFilename.replace(/[^a-zA-Z0-9._-]/g, "");
if (sanitizedFilename !== texFilename) {
  reject(new Error("Invalid filename detected"));
}
```

### Resource Limits

| Protection | Value | Purpose |
|:--|:--|:--|
| Process timeout | 60 seconds | Kill hung pdflatex with SIGKILL |
| stdout/stderr cap | 50 KB | Prevent memory exhaustion from verbose logs |
| BullMQ concurrency | 2 workers | Limit parallel compilations |
| BullMQ rate limit | 5 jobs/min | Prevent resource exhaustion |
| Job retries | 3 attempts | Exponential backoff (2s, 4s, 8s) |

### LaTeX Character Escaping

All user input is escaped before template rendering to prevent LaTeX injection:

```typescript
const escapeLatex = (text: string): string => {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
};
```

Additionally, URL-encoded characters and HTML entities are decoded before escaping.

---

## Input Sanitization

**Source:** `apps/api/src/middleware.hono/input-validator.middleware.ts`

### Prototype Pollution Prevention

Dangerous keys are stripped from all JSON bodies:

```typescript
if (key === "__proto__" || key === "constructor" || key === "prototype") {
  continue; // Skip dangerous keys
}
```

### String Sanitization

| Attack Vector | Mitigation |
|:--|:--|
| Null bytes | Stripped (`\0` removal) |
| Control characters | Removed (except `\n`, `\t`) |
| ReDoS / memory exhaustion | String length capped at 10,000 chars |
| XSS via JSON | Recursive sanitization of all string values |

### Webhook Bypass

Webhook routes skip input sanitization to preserve raw body for signature verification:

```typescript
if (c.req.path.includes("/webhook")) {
  return await next(); // Skip sanitizer
}
```

---

## GDPR Data Handling

**Source:** `apps/api/src/routes.hono/gdpr.routes.ts`

### Right to Erasure (`POST /api/me/delete`)

The deletion process is a **soft-delete with 30-day buffer**:

| Data Type | Action |
|:--|:--|
| Resume titles | Set to `[DELETED]` |
| Personal info (name, email, phone, location) | Set to `[REDACTED]` |
| Resume content (experience, education, etc.) | Cleared to empty arrays |
| Public sharing | Disabled (`isPublic: false`, `shareId: null`) |
| Organization memberships | Status set to `pending` (effectively revoked) |
| Audit log actor IDs | Anonymized to `[DELETED:<userId>]` |

### Data Export (`GET /api/me/export`)

Returns a complete JSON dump including:
- All personal resumes
- Audit log history
- Organizations owned
- Organization memberships

### Edge Cases

- **User is org owner:** Memberships are revoked but the organization itself is NOT deleted. A manual ownership transfer should be done first.
- **Shared resumes:** Public links are immediately broken (`isPublic: false`).
- **Hard deletion:** Not yet automated. A background job should permanently remove records after the 30-day buffer.

---

## Authentication Edge Cases

**Source:** `apps/api/src/middleware.hono/auth.middleware.ts`

### Clerk Configuration Validation

The middleware fails fast if Clerk is misconfigured:

```typescript
if (!env.CLERK_SECRET_KEY || env.CLERK_SECRET_KEY.startsWith("sk_your_")) {
  return c.json({ error: "Server misconfiguration: Clerk secret not set" }, 500);
}
```

### User Sync Strategy

On first authentication, the middleware:
1. Looks up user by `clerkId`
2. If not found, fetches email from Clerk API
3. Tries to link by email (legacy user migration)
4. If no match, creates a new user with a random password

### Stale Organization Headers

If `X-Organization-Id` references a non-existent or revoked membership, the header is **silently ignored** (no error). Route-level RBAC guards enforce access where required.

---

## API Key Edge Cases

**Source:** `apps/api/src/middleware.hono/api-key.middleware.ts`

### Key Format

Keys follow the format: `<prefix>.<hmac_signature>`

- Prefix: random identifier (stored as SHA-256 hash in DB)
- Signature: HMAC-SHA256 of prefix using `API_KEY_SECRET`

### Timing-Safe Comparison

HMAC verification uses `crypto.timingSafeEqual` to prevent timing attacks:

```typescript
const sigValid = crypto.timingSafeEqual(
  Buffer.from(providedSig, "hex"),
  Buffer.from(expectedSig, "hex"),
);
```

### Revocation

Revoked keys have `revokedAt` set. The lookup query excludes them:
```typescript
ApiKey.findOne({ keyHash, revokedAt: { $exists: false } })
```

### Last-Used Tracking

`lastUsedAt` is updated on every successful authentication (fire-and-forget, non-blocking).

---

## Error Response Consistency

### Production vs Development

In production, internal error details are never exposed:

```typescript
const errorMessage = isProduction
  ? "Internal Server Error"
  : err.message || "Internal Server Error";
```

All error responses include the `requestId` for correlation:

```json
{
  "success": false,
  "error": "Internal Server Error",
  "requestId": "abc123xyz"
}
```

### Structured Error Logging

Server-side errors are logged as JSON with full context:

```json
{
  "timestamp": "2026-05-15T10:30:00Z",
  "level": "error",
  "message": "Unhandled exception",
  "requestId": "abc123xyz",
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ..."
}
```

---

## Graceful Shutdown

**Source:** `apps/api/src/hono.ts`

On `SIGINT` or `SIGTERM`:

1. Stop accepting new HTTP connections
2. Close BullMQ queue and worker (drain in-progress jobs)
3. Close Redis connection
4. Disconnect from MongoDB
5. Exit process

```typescript
const gracefulShutdown = async (): Promise<void> => {
  server.close();
  await closePdfQueue();
  await disconnectDatabase();
  process.exit(0);
};
```
