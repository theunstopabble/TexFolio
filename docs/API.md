# API Reference

**Version:** 2.0.0 | **Last Updated:** September 2026

Complete REST API documentation for the TexFolio backend (`apps/api/src/routes.hono/`).

---

## Base URL

| Environment | URL |
|:--|:--|
| Production | `https://texfolio-api.onrender.com/api` |
| Development | `http://localhost:5000/api` |

## Authentication

All protected routes require a **Clerk JWT** Bearer token:

```
Authorization: Bearer <clerk_session_token>
```

**API Key auth is not active.** The HMAC key middleware (`apiKeyMiddleware`,
`requireScope` in `apps/api/src/middleware.hono/api-key.middleware.ts`) is implemented
but **not mounted on any route** — no endpoint accepts `X-API-Key` today. Keys can be
created, listed and revoked (see [API Keys](#api-keys)), but every protected route
requires a Clerk `Bearer` JWT.

## Common Headers

| Header | Purpose |
|:--|:--|
| `Authorization` | Clerk JWT (`Bearer <token>`) |
| `X-Organization-Id` | Active organization context (optional) |
| `X-Request-ID` | Client-provided correlation ID (auto-generated if absent) |
| `Content-Type` | `application/json` |

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

`requestId` is added by the global 500 handler only; route-level 4xx bodies
(for example a 400 from zod validation or a 404 from a missing resource) contain
`success` and `error` alone.

## Rate Limiting Headers

Every `/api/*` response includes:

| Header | Description |
|:--|:--|
| `X-RateLimit-Limit` | Max requests for current window |
| `Retry-After` | Seconds until retry (only on 429) |

The limiter (`apps/api/src/middleware.hono/rate-limit.memory.ts`) is an in-process
**sliding-window** counter, and it runs as global `/api/*` middleware **before**
route-level auth. As a result the caller is always resolved as anonymous and the
effective limit is `unauthenticatedMax` (20/min) today; the configured tiers
(pro 300 / free 60 / anon 20 per 60s) are not reached until the limiter can read
the authenticated user. The response also carries `X-RateLimit-Remaining`,
`X-RateLimit-Reset` and `X-RateLimit-Tier` (`pro` | `free` | `anonymous`), but CORS
only exposes `X-RateLimit-Limit` and `Retry-After` to browser JavaScript.

---

## Resumes API

**Source:** `apps/api/src/routes.hono/resume.routes.ts`

### GET /api/resumes

Get all resumes for the authenticated user (includes org-visible resumes if `X-Organization-Id` is set).

**Auth:** Clerk JWT

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "6789abc...",
      "title": "Software Engineer Resume",
      "templateId": "faangpath",
      "personalInfo": { "fullName": "John Doe", ... },
      "visibility": "private",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/resumes

Create a new resume.

**Auth:** Clerk JWT  
**Body:** (validated with Zod)

Premium templates (`PRO_TEMPLATES`) are rejected with **403** for non-Pro users —
see [Premium templates](#premium-templates).

```json
{
  "title": "My Resume",
  "templateId": "classic",
  "personalInfo": {
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA",
    "linkedin": "gautamkr62",
    "github": "janesmith"
  },
  "profileLinks": [
    { "platform": "leetcode", "url": "janesmith" },
    { "platform": "codechef", "url": "jane_smith" }
  ],
  "summary": "Senior software engineer with 5+ years...",
  "experience": [
    {
      "company": "TechCorp",
      "position": "Senior Engineer",
      "startDate": "Jan 2022",
      "endDate": "Present",
      "description": ["Led team of 5 engineers...", "Reduced latency by 40%..."],
      "location": "Remote"
    }
  ],
  "education": [{ "institution": "MIT", "degree": "B.S.", "field": "CS" }],
  "skills": [{ "category": "Languages", "skills": ["TypeScript", "Python"] }],
  "projects": [{ "name": "TexFolio", "description": "...", "technologies": ["React"] }],
  "certifications": [{ "name": "AWS SAA", "issuer": "Amazon" }],
  "customization": { "primaryColor": "#2563EB", "fontFamily": "serif" },
  "sectionOrder": ["summary", "experience", "education", "skills", "projects"]
}
```

**Profile link fields normalise at write.** `personalInfo.linkedin|github|portfolio`
and every `profileLinks[].url` accept a bare username, a host without a scheme
(`github.com/janesmith`) or a full URL, and are stored as the platform's
canonical `https://` URL — via `normalizeProfileLink()` in
`packages/shared/src/developerLinks.ts`, the same function the web form's blur
handler runs. A value that resolves to no URL (e.g. `not a handle!` on a
prefixed platform, or a bare handle on `portfolio`/`stackoverflow`) is rejected
with **400** rather than stored as a dead link. `personalInfo.phone` must
contain 7–15 digits (`isPhone`); its spacing is preserved as typed.
`profileLinks[].platform` must be one of the `PROFILE_PLATFORMS` enum values;
rows the UI never sends (blank platform or URL) fail validation here.

**Response:** `201 Created`

### GET /api/resumes/:id

Get a single resume by ID. Respects org visibility rules.

### PUT /api/resumes/:id

Update a resume. Partial updates supported. Requires ownership or Editor+ role in org.
Gated by [Premium templates](#premium-templates) — the check uses `body.templateId`
if sent, otherwise the resume's existing `templateId`.

### DELETE /api/resumes/:id

Delete a resume. Requires ownership or Admin+ role in org.

### PATCH /api/resumes/:id/ats-score

Persist a computed ATS score on the resume.

**Body:**
```json
{ "atsScore": 78 }
```

### GET /api/resumes/:id/pdf

**Synchronous** PDF generation. Compiles LaTeX and returns the PDF binary.
This is the path the web client uses.
Gated by [Premium templates](#premium-templates).

**Response:** `application/pdf` binary with `Content-Disposition: attachment`

### POST /api/resumes/:id/pdf/queue

**Async** PDF generation via BullMQ. Returns a job ID for polling.
Production-only: returns **503** when the queue is unavailable (local development
without Redis). Not currently used by the web client.
Gated by [Premium templates](#premium-templates).

**Response:**
```json
{
  "success": true,
  "message": "PDF generation queued",
  "jobId": "12345"
}
```

### GET /api/resumes/:id/pdf/queue/:jobId

Poll async PDF job status.

**Response:**
```json
{
  "success": true,
  "jobId": "12345",
  "status": "active",
  "progress": 30,
  "result": null,
  "failedReason": null
}
```

Status values: `waiting` → `active` → `completed` | `failed`

### GET /api/resumes/:id/pdf/queue/:jobId/download

Download the completed async PDF.

**Response:** `application/pdf` binary (409 if job not yet completed)
Gated by [Premium templates](#premium-templates).

### PATCH /api/resumes/:id/visibility

Toggle public sharing. Generates a `shareId` (nanoid) on first share.

**Response:**
```json
{
  "success": true,
  "data": { "isPublic": true, "shareId": "abc123xyz0", "url": "/r/abc123xyz0" }
}
```

### POST /api/resumes/:id/email

Email the generated PDF via Brevo.
Gated by [Premium templates](#premium-templates).

**Body:**
```json
{ "email": "recipient@example.com" }
```

### Premium templates

`PRO_TEMPLATES` (`["premium", "faangpath", "developer"]` in `packages/shared/src/constants.ts`) are gated server-side by
`proTemplateGate` (`apps/api/src/routes.hono/resume.routes.ts`). `classic` is the free-tier template. A non-Pro user
selecting one gets:

```json
{ "success": false, "error": "Premium templates require a Pro subscription" }
```

with status **403**. The gate covers create, update, sync PDF, queue, queue
download and email. Resumes created inside an organization are exempt (the org's
`branding.lockedTemplateId` may legitimately be a premium template).

---

## AI Services API

**Source:** `apps/api/src/routes.hono/ai.routes.ts`, `apps/api/src/routes.hono/agent.routes.ts`

### POST /api/agents/coach

Full LangGraph multi-agent resume analysis (Content → ATS → Format → Impact → Synthesis).

**Auth:** Clerk JWT  
**Body:**
```json
{
  "resumeData": { ... },
  "jobDescription": "Optional target job description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "finalScore": 78,
    "breakdown": {
      "content": { "score": 82, "feedback": ["..."] },
      "ats": { "score": 75, "keywords": ["React"], "missing": ["Docker"] },
      "format": { "score": 80, "issues": ["..."] },
      "impact": { "score": 74, "suggestions": ["..."] }
    },
    "recommendations": ["📝 Content: ...", "🔍 ATS: Add keyword \"Docker\""]
  }
}
```

### POST /api/agents/quick-score

Quick ATS score without the full LangGraph pipeline.

**Auth:** Clerk JWT  
**Body:**
```json
{ "resumeData": { ... }, "jobDescription": "optional" }
```

**Response:**
```json
{ "success": true, "data": { "score": 78, "atsScore": 75, "topRecommendations": ["..."] } }
```

### POST /api/agents/import/linkedin

Parse a LinkedIn PDF export and extract structured resume data.

**Auth:** Clerk JWT  
**Body:** `multipart/form-data` with a `file` field (PDF only)  
**Errors:** `413` if over 10MB, `400` if the file is not a PDF

### POST /api/ai/analyze

Analyze a resume and return structured feedback.

**Auth:** Clerk JWT

### POST /api/ai/ats-check

Run ATS compatibility check against a job description.

**Auth:** Clerk JWT

### POST /api/ai/improve

Improve text (grammar or professional rewrite).

**Body:**
```json
{ "text": "I did stuff at company", "type": "professional" }
```

### POST /api/ai/generate-bullets

Generate action-oriented bullet points for a job title.

**Body:**
```json
{ "jobTitle": "Senior Software Engineer", "skills": ["React", "Node.js"] }
```

**Response:**
```json
{ "success": true, "data": { "bullets": ["Architected microservices...", "Reduced deploy time by 60%..."] } }
```

### POST /api/ai/cover-letter

Generate a tailored cover letter.

**Body:**
```json
{ "resume": { ... }, "jobDescription": "We are looking for...", "jobTitle": "optional", "company": "optional" }
```

---

## Organizations API

**Source:** `apps/api/src/routes.hono/organization.routes.ts`

### POST /api/organizations

Create a new organization. Caller becomes `owner`.

**Body:**
```json
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "branding": { "primaryColor": "#FF5733", "lockedTemplateId": "faangpath" },
  "settings": { "enforceCompanyFont": true }
}
```

### GET /api/organizations

List all organizations the user belongs to (with roles).

### GET /api/organizations/:id

Get organization details. Requires membership.

### PUT /api/organizations/:id

Update org branding/settings. **Requires:** `admin` role or higher.

### DELETE /api/organizations/:id

Delete organization and all memberships. **Requires:** `owner` role.

### GET /api/organizations/:id/members

List all members. Requires membership.

### POST /api/organizations/:id/members

Invite a member. **Requires:** `admin` role or higher.

**Body:**
```json
{ "userId": "user_clerk_id", "role": "editor" }
```

### PUT /api/organizations/:id/members/:userId

Change a member's role. Supports ownership transfer (only current owner can promote to `owner`).

**Body:**
```json
{ "role": "admin" }
```

### DELETE /api/organizations/:id/members/:userId

Remove a member. Admin+ can remove others; any member can remove themselves.

### GET /api/organizations/:id/resumes

List every resume scoped to this org (`Resume.find({ organizationId })`) — no
visibility filter is applied.

---

## API Keys

**Source:** `apps/api/src/routes.hono/api-key.routes.ts`

### POST /api/api-keys

Generate a new HMAC-signed API key. The raw key is returned **only once**.
Keys can be minted and revoked, but no endpoint validates one yet — see
[Authentication](#authentication).

**Body:**
```json
{
  "name": "CI Pipeline Key",
  "scopes": ["read:resumes", "write:resumes"],
  "organizationId": "optional",
  "expiresInDays": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "<64-hex-random>.<hmac_signature_hex>",
    "name": "CI Pipeline Key",
    "scopes": ["read:resumes", "write:resumes"],
    "expiresAt": "2027-01-01T00:00:00Z"
  }
}
```

### GET /api/api-keys

List active keys (metadata only, no raw key).

### DELETE /api/api-keys/:id

Revoke a key (sets `revokedAt` timestamp).

---

## GDPR & Data

**Source:** `apps/api/src/routes.hono/gdpr.routes.ts`

### GET /api/me/export

Full JSON dump of all personal data (resumes, audit logs, orgs, memberships).

### POST /api/me/delete

Soft-delete with 30-day buffer. Anonymizes PII, revokes memberships, anonymizes audit logs.

**Response:**
```json
{
  "success": true,
  "message": "Personal data scheduled for deletion (30-day buffer).",
  "details": {
    "resumesAnonymized": true,
    "membershipsRevoked": true,
    "auditLogsAnonymized": true,
    "hardDeletionDate": "2026-07-01T00:00:00Z"
  }
}
```

---

## Audit Logs

**Source:** `apps/api/src/routes.hono/audit-log.routes.ts`

### GET /api/audit-logs

Query the immutable audit trail. Supports filtering by `action`, `resourceType`, `resourceId`, and a date range.

**Query Params:** `?action=CREATE&resourceType=Resume&startDate=2026-01-01&endDate=2026-06-01&limit=50&offset=0`

**Response:** `{ "success": true, "data": { "logs": [...], "total": 12, "limit": 50, "offset": 0 } }`

### GET /api/audit-logs/activity

Last-24-hour activity summary for the current user.

---

## Payments

**Source:** `apps/api/src/routes.hono/payment.routes.ts`

### POST /api/payments/create-order

Create a Razorpay order for Pro upgrade.

**Body:**
```json
{ "amount": 49900 }
```

Rate limited to **5 req/min** per IP.

### POST /api/payments/verify

Verify Razorpay payment signature and upgrade user to Pro tier.

**Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

Rate limited to **5 req/min** per IP.

### POST /api/payments/webhook

Razorpay webhook handler (no auth — validated by HMAC signature). Processes payment events and triggers Pro upgrades. Rate limited to **10 req/min**.

---

## Analytics

**Source:** `apps/api/src/routes.hono/analytics.routes.ts`

### GET /api/analytics

Get dashboard analytics (total resumes, chart data, top skills, avg ATS score).

**Auth:** Clerk JWT

---

## Auth

**Source:** `apps/api/src/routes.hono/auth.routes.ts`

### GET /api/auth/me

Get current authenticated user info.

**Auth:** Clerk JWT

---

## Public Routes

**Source:** `apps/api/src/routes.hono/public.routes.ts`

### GET /api/public/r/:shareId

View a publicly shared resume by share ID. No authentication required.

---

## Health Checks (Public)

No authentication required.

### GET /health

```json
{ "success": true, "message": "TexFolio API is running!", "timestamp": "...", "runtime": "Hono" }
```

### GET /health/ai

```json
{
  "success": true,
  "groqKeyConfigured": true,
  "circuitBreaker": { "state": "CLOSED", "failures": 0, "totalCalls": 142 },
  "timestamp": "..."
}
```

### GET /health/pdf

```json
{
  "success": true,
  "checks": { "pdflatex": true },
  "timestamp": "..."
}
```

Returns `503` if any check fails.
