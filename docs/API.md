# API Reference

**Version:** 2.0.0 | **Last Updated:** May 2026

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

Alternatively, service-to-service calls can use **API Key** auth:

```
X-API-Key: <prefix>.<hmac_signature>
```

## Common Headers

| Header | Purpose |
|:--|:--|
| `Authorization` | Clerk JWT or `ApiKey <key>` |
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
  "error": "Human-readable error message",
  "requestId": "abc123xyz"
}
```

## Rate Limiting Headers

Every `/api/*` response includes:

| Header | Description |
|:--|:--|
| `X-RateLimit-Limit` | Max requests for current window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | ISO timestamp when window resets |
| `X-RateLimit-Tier` | `pro`, `free`, or `anonymous` |
| `Retry-After` | Seconds until retry (only on 429) |

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

```json
{
  "title": "My Resume",
  "templateId": "classic",
  "personalInfo": {
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/janesmith",
    "github": "github.com/janesmith"
  },
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

**Response:** `201 Created`

### GET /api/resumes/:id

Get a single resume by ID. Respects org visibility rules.

### PUT /api/resumes/:id

Update a resume. Partial updates supported. Requires ownership or Editor+ role in org.

### DELETE /api/resumes/:id

Delete a resume. Requires ownership or Admin+ role in org.

### GET /api/resumes/:id/pdf

**Synchronous** PDF generation. Compiles LaTeX and returns the PDF binary.

**Response:** `application/pdf` binary with `Content-Disposition: attachment`

### POST /api/resumes/:id/pdf/queue

**Async** PDF generation via BullMQ. Returns a job ID for polling.

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

**Body:**
```json
{ "email": "recipient@example.com" }
```

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

Quick ATS score without the full LangGraph pipeline. Returns a single score.

**Auth:** Clerk JWT  
**Body:**
```json
{ "resumeData": { ... } }
```

### POST /api/agents/import/linkedin

Parse a LinkedIn PDF export and extract structured resume data.

**Auth:** Clerk JWT  
**Body:** `multipart/form-data` with PDF file

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
{ "resumeData": { ... }, "jobDescription": "We are looking for..." }
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

List all resumes with `visibility: "organization"` in this org.

---

## API Keys

**Source:** `apps/api/src/routes.hono/api-key.routes.ts`

### POST /api/api-keys

Generate a new HMAC-signed API key. The raw key is returned **only once**.

**Body:**
```json
{
  "name": "CI Pipeline Key",
  "scopes": ["read:resumes", "write:resumes"],
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "txf_abc123.hmac_signature_hex",
    "name": "CI Pipeline Key",
    "scopes": ["read:resumes", "write:resumes"]
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

Query the immutable audit trail. Supports filtering by `action`, `resourceType`, and date range.

**Query Params:** `?action=CREATE&resourceType=Resume&from=2026-01-01&to=2026-06-01`

---

## Payments

**Source:** `apps/api/src/routes.hono/payment.routes.ts`

### POST /api/payments/create-order

Create a Razorpay order for Pro upgrade.

### POST /api/payments/verify

Verify Razorpay payment signature and upgrade user to Pro tier.

### POST /api/payments/webhook

Razorpay webhook handler (no auth — validated by HMAC signature). Processes payment events and triggers Pro upgrades.

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
  "checks": { "pdflatex": true, "redis": true },
  "timestamp": "..."
}
```

Returns `503` if any check fails.
