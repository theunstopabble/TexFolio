# Edge Cases & Error Handling

**Version:** 2.0.0 | **Last Updated:** September 2026

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

Selection is based on which API key is configured (checked at runtime). The `AIService` class wraps its Groq calls (`improve`, `generateBullets`, ATS check, analyze, cover letter) in the circuit breaker.

**Not covered by the breaker:** `apps/api/src/services/linkedin.service.ts` constructs a Groq client directly, and the LangGraph agent has its own `createLLM()` — neither routes through `AIService`, so a LinkedIn-import or agent outage has no breaker protection.

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

**Source:** `apps/api/src/middleware.hono/rate-limit.memory.ts`

### In-Memory Store

The limiter keeps windows in a process-local `Map` with a periodic cleanup sweep.
It is **per instance**, so two API instances do not share counters, and state is
**lost on restart**. There is no Redis dependency and therefore no fail-open
branch — Redis is used by the PDF queue only (`apps/api/src/config/redis.ts`,
`apps/api/src/queues/pdf.queue.ts`).

### IP Resolution Chain

For anonymous users, the rate limiter resolves the client IP in this order:

1. Last IP in `X-Forwarded-For` chain (actual client behind proxies)
2. `X-Real-IP` header (set by trusted reverse proxies like nginx)
3. `REMOTE_ADDR` from connection
4. Fallback: `"unknown"` (all unknowns share a single bucket)

### Tier Boundaries

| Tier | Limit | Key Pattern |
|:--|:--|:--|
| Pro (authenticated) | 300 req/min | `user:<userId>` |
| Free (authenticated) | 60 req/min | `user:<userId>` |
| Anonymous | 20 req/min | `ip:<ip>` |
| Sensitive routes | 5 req/min | IP-based (auth, payments) |

> **Known limitation:** the tiered limiter is registered as global `/api/*`
> middleware and runs *before* route-level authentication, so `c.get("user")` is
> always empty when it executes. Every request is therefore treated as anonymous
> and capped at 20 req/min, with `X-RateLimit-Tier: anonymous`. The pro/free
> values above are the configured intent, not the current effective limit.

### Window Calculation

Sliding window over an array of request timestamps: hits older than `windowStart`
are dropped, then the current timestamp is recorded. `now % windowMs` is used only
to compute the `X-RateLimit-Reset` value.

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

### Temp File Names

Temp `.tex`/`.pdf` names use `randomUUID()`, not a timestamp, so concurrent
generations cannot collide. The generated `.pdf` is unlinked after it is served,
and `.aux`/`.log`/`.out`/`.tex` are cleaned up after each compile. A second
compile pass runs when the resulting PDF is implausibly small (<500 bytes).

### Client-Side Error Surfacing

The web client uses a 120-second timeout for PDF generation. Error responses come
back as blobs, so `apps/web/src/services/api.ts` parses the blob before throwing —
this is what lets a real LaTeX error reach the user instead of a generic message.
Server-side, `pdfErrorResponse()` passes the compiler message through in
development and a generic message in production.

---

## Input Sanitization

**Source:** `apps/api/src/middleware.hono/input-validator.middleware.ts`

> **Note:** the sanitizer writes its result to `c.set("sanitizedBody", ...)`, but
> `getSanitizedBody()` is never called anywhere — handlers read raw bodies through
> `zValidator` / `c.req.json()`. So the rules below describe the sanitizer's
> implementation, not a control that is currently in force. Request validation is
> done by zod.

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

Webhook routes skip input sanitization to preserve raw body for signature verification.
The guard lives in `apps/api/src/hono.ts` (not in the middleware file):

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

> **Not enforced:** `apiKeyMiddleware` and `requireScope` are never imported by any
> route — no endpoint authenticates with an API key today. The mechanics below are
> implemented and correct, but they are dormant. Key creation/listing/revocation
> (`api-key.routes.ts`) still works, behind Clerk auth.

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

## Premium Template Gate

**Source:** `apps/api/src/routes.hono/resume.routes.ts`, `packages/shared/src/constants.ts`

Premium templates (`PRO_TEMPLATES`) are gated **server-side**, not just in the UI.
`proTemplateGate(user, templateId, orgCtx)` returns **403** with
`"Premium templates require a Pro subscription"` for a non-Pro user selecting a
premium template.

It is applied at six call sites: create, update (checking
`body.templateId ?? existing.templateId`, since PUT is partial), synchronous PDF,
queue, queue download, and email.

**Organization resumes are exempt** — an org may set
`branding.lockedTemplateId` to a premium template, which would otherwise 403 every
member.

---

## Form Validation Edge Cases

**Source:** `apps/web/src/features/create-resume/entryValidation.ts`,
`apps/web/src/lib/stepErrors.ts`

### Partially-Filled Array Entries

The create wizard must distinguish "I have nothing here" from "I started this entry
but left it incomplete". `entryValidation.ts` provides:

- `entryStarted` — any field in the entry has content
- `entryComplete` — every required field in the entry has content
- `requireIfStarted` — a `register` rule that blocks only *started* entries, so a
  wholly blank entry stays skippable
- `survivingEntries` — the entries `onSubmit` will keep

`ReviewStep` and the submit payload both use `entryComplete`, so the preview and
the created resume cannot drift apart.

### Username → Canonical Profile URL

Link inputs ask for a username, not a URL: typing `gautam-kr` yields
`https://github.com/gautam-kr`, `in/gautam-kr` yields
`https://www.linkedin.com/in/gautam-kr`, and a pasted `github.com/x` gets its
scheme. The rule lives once — `normalizeProfileLink()` in
`packages/shared/src/developerLinks.ts` — and runs at three points:

1. **Blur** on the input (`PersonalInfoStep`, `BasicInfoSection`,
   `ProfileLinksEditor`): the user watches the handle become the real link.
2. **Zod transform at write** (server): covers API clients, LinkedIn PDF
   import and any path that skips the UI. Unresolvable values (a handle on the
   URL-only `portfolio`/`stackoverflow` platforms, a string with spaces) fail
   with 400 instead of being stored as a dead link.
3. **Render** (preview, PDF, TXT): defensive re-normalise for legacy rows —
   idempotent, so doing it twice is a no-op.

Platforms that map handle→URL are `PROFILE_PLATFORMS` minus Stack Overflow and
Portfolio (full URL only, no reliable mapping). On prefixed platforms a dotted
handle (`j.smith`) is still treated as a handle — host-shape only wins when the
value carries a path — because a confidently wrong `https://j.smith` is worse
than one bare-domain edge case. `profileLinks[]` rows follow the same
`entryValidation` contract as every other repeatable section: blank rows are
skipped, started-but-incomplete rows block Next and are dropped at submit.

Phone numbers are validated (`isPhone`: 7–15 digits, `+`/`()`/`-`/spaces) but
**not** rewritten — the spacing is presentation, the digits are the number.

### Hidden-Step Validation

Every wizard step stays mounted; only the active one is visible (`data-step` +
`hidden`). Combined with `noValidate` on the `<form>`, a field on a step the user
never opened is still validated on submit. The same pattern is used by the editor
(`apps/web/tests/editorMount.test.ts`, `apps/web/tests/wizardMount.test.ts`).

`stepErrors.ts` (`errorPaths`, `firstErrorStep`) maps a validation error to the
step that owns it, so a submit failure scrolls to and focuses the offending step.

### Length Limits

`summary` is capped at `MAX_SUMMARY_CHARS` (1500) in both the wizard
(`SummaryStep`) and the zod schema, so the UI cannot produce a payload the API
rejects. The editor exposes matching limits for resume title (100) and description
(2000).

### Save Failure and PDF Download

`handleDownload` aborts when the save fails, so a PDF is never generated from a
stale server revision. The API interceptor tags already-reported errors, and
`isReportedError()` lets callers log instead of showing a second toast.

### Telegram Founder Alerts Resiliency

**Source:** `apps/api/src/services/telegram.service.ts`

- **Zero Latency Impact:** All Telegram dispatch calls are executed asynchronously using dynamic `import(...).then(...).catch(() => {})`. A slow Telegram connection or failure never blocks HTTP responses.
- **Short Timeout:** Network requests to Telegram Bot API use `AbortSignal.timeout(6000)` (6 seconds) to prevent memory or socket leaks during network partitions.
- **Anti-Spam Debounce Window:** Recruiter public resume views are debounced with a 10-second gate per `shareId` and client IP to prevent message storms from rapid browser reloads.
- **Silent Degradation:** If `TELEGRAM_BOT_TOKEN` is unset or Telegram returns an error, the operation fails silently without logging sensitive user credentials or crashing the API process.

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
