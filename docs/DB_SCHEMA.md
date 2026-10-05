# Database Schema

**Version:** 2.0.0 | **Last Updated:** September 2026

MongoDB database schema documentation. All models use Mongoose and are located in `apps/api/src/models/`.

---

## Overview

| Collection | Model File | Purpose |
|:--|:--|:--|
| `users` | `user.model.ts` | User accounts (Clerk-linked) |
| `resumes` | `resume.model.ts` | Resume documents with all sections |
| `organizations` | `organization.model.ts` | Multi-tenant organizations |
| `organizationmembers` | `organization-member.model.ts` | Membership + RBAC roles |
| `auditlogs` | `audit-log.model.ts` | Immutable audit trail |
| `apikeys` | `api-key.model.ts` | Service-to-service HMAC keys |

---

## User

**Collection:** `users`  
**Source:** `apps/api/src/models/user.model.ts`

| Field | Type | Required | Description |
|:--|:--|:--|:--|
| `email` | String | ✅ | Unique, lowercase, validated |
| `password` | String | ✅ | Random placeholder (`crypto.randomUUID()`), `select: false` — never used for login, auth is handled by Clerk |
| `fullName` | String | ✅ | Max 100 chars |
| `isPro` | Boolean | — | Default: `false` |
| `clerkId` | String | — | Unique, sparse (Clerk user ID) |
| `subscriptionId` | String | — | Razorpay one-time payment ID |
| `createdAt` | Date | auto | Mongoose timestamps |
| `updatedAt` | Date | auto | Mongoose timestamps |

**Indexes:**
- `email`: unique
- `clerkId`: unique, sparse

---

## Resume

**Collection:** `resumes`  
**Source:** `apps/api/src/models/resume.model.ts`

### Main Document

| Field | Type | Required | Description |
|:--|:--|:--|:--|
| `userId` | String | ✅ | Clerk user ID (indexed) |
| `title` | String | ✅ | Default: "My Resume", max 100 |
| `templateId` | String | — | Default: "classic" |
| `sectionOrder` | String[] | — | Ordered section keys, default: `["summary","experience","education","skills","projects","certifications"]` |
| `customization` | Object | — | `{ primaryColor, fontFamily }`, defaults `#2563EB` / `serif` |
| `personalInfo` | Object | ✅ | Contact details (see below) |
| `summary` | String | — | Max 2000 chars (model) — API rejects >1500 (see note below) |
| `experience` | Experience[] | — | Work history |
| `education` | Education[] | — | Academic background |
| `projects` | Project[] | — | Portfolio projects |
| `skills` | SkillCategory[] | — | Categorized skills |
| `certifications` | Certification[] | — | Professional certs |
| `languages` | String[] | — | Spoken languages |
| `atsScore` | Number | — | 0-100, AI-calculated |
| `isPublic` | Boolean | — | Default: `false` |
| `shareId` | String | — | Unique, sparse (nanoid) |
| `organizationId` | String | — | Org scope (indexed, sparse) |
| `visibility` | Enum | — | `private` \| `organization` \| `public` (default: `private`) |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

> **Note on `summary`:** the Mongoose model caps it at **2000** chars, but the application-level zod schema (`packages/shared/src/schemas/resume.schema.ts`) caps it at **1500**. Payloads over 1500 are rejected by the API before they reach MongoDB, so 1500 is the effective limit for new writes.

### Sub-documents

**personalInfo:**
```typescript
{
  fullName: string;    // required
  email: string;       // required (trimmed, lowercase domain)
  phone: string;       // required — 7-15 digits, +/()/-/spaces allowed
  location: string;    // required
  linkedin?: string;   // canonical URL (see Profile links below)
  github?: string;     // canonical URL
  portfolio?: string;  // canonical URL
}
```

**profileLinks[] (no _id)** — extra developer platforms (LeetCode, CodeChef,
Codeforces, HackerRank, Kaggle, GitLab, X, Behance, Dribbble, Stack Overflow):
```typescript
{
  platform: string;  // enum, see shared developerLinks.ts
  url: string;       // canonical https:// URL
}
```
Defaults to `[]`; resumes predating the field simply lack it.

**Profile links — username in, canonical URL out.**
The form asks for a username (`gautam-kr`, or `in/gautam-kr` for LinkedIn) and
stores `https://github.com/gautam-kr`. One source of truth —
`packages/shared/src/developerLinks.ts`, `normalizeProfileLink()` — runs in
three places so they cannot drift: the zod schema (normalise-at-write, so API
clients and imports are covered), the inputs' blur handler (the user watches
the handle become the real link), and the preview/PDF/TXT renderers
(defensive re-normalise for legacy rows; it is idempotent). Stack Overflow and
Portfolio take a full URL only — there is no handle→URL rule for them, and an
unresolvable value is rejected rather than guessed into a dead link.
`phone` is validated (`isPhone`) but never rewritten: the spacing is
presentation, the digits are the number.

**experience[] (no _id):**
```typescript
{
  company: string;      // required
  position: string;     // required
  startDate?: string;
  endDate?: string;
  description: string[];
  location?: string;
  isCurrent?: boolean;  // default: false
}
```

**education[] (no _id):**
```typescript
{
  institution: string;  // required
  degree: string;       // required
  field: string;        // required
  startDate?: string;
  endDate?: string;
  gpa?: string;
  location?: string;
}
```

**projects[] (no _id):**
```typescript
{
  name: string;         // required
  description?: string;
  technologies: string[];
  link?: string;        // legacy
  github?: string;      // legacy
  sourceCode?: string;
  liveUrl?: string;
}
```

**skills[] (no _id):**
```typescript
{
  category: string;     // required (e.g., "Languages", "Frameworks")
  skills: string[];
}
```

**certifications[] (no _id):**
```typescript
{
  name: string;         // required
  issuer?: string;
  date?: string;
}
```

**Indexes:**
- `{ userId: 1 }` — single field
- `{ userId: 1, createdAt: -1 }` — compound (user's resumes sorted by date)
- `{ organizationId: 1, createdAt: -1 }` — org resumes sorted
- `{ organizationId: 1, visibility: 1 }` — org-visible resumes
- `{ shareId: 1 }` — unique, sparse (public sharing)
- `{ organizationId: 1 }` — single field, sparse (field-level `index: true, sparse: true`)

---

## Organization

**Collection:** `organizations`  
**Source:** `apps/api/src/models/organization.model.ts`

| Field | Type | Required | Description |
|:--|:--|:--|:--|
| `name` | String | ✅ | Max 100 chars, trimmed |
| `slug` | String | ✅ | Unique, lowercase, `^[a-z0-9-]+$` |
| `ownerId` | String | ✅ | Clerk user ID (indexed) |
| `branding.primaryColor` | String | — | Default: "#2563EB" |
| `branding.logoUrl` | String | — | Organization logo |
| `branding.lockedTemplateId` | String | — | Force template for org resumes |
| `settings.disableAI` | Boolean | — | Default: `false` |
| `settings.enforceCompanyFont` | Boolean | — | Default: `false` |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:**
- `slug`: unique (field-level `unique: true`)
- `ownerId`: single field (field-level `index: true`)

---

## OrganizationMember

**Collection:** `organizationmembers`  
**Source:** `apps/api/src/models/organization-member.model.ts`

| Field | Type | Required | Description |
|:--|:--|:--|:--|
| `organizationId` | String | ✅ | References Organization (indexed) |
| `userId` | String | ✅ | Clerk user ID (indexed) |
| `role` | Enum | ✅ | `owner` \| `admin` \| `editor` \| `viewer` (default: viewer) |
| `invitedBy` | String | ✅ | Clerk user ID of inviter |
| `status` | Enum | — | `active` \| `pending` (default: active) |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Role Weight System:**
```
owner: 4 → admin: 3 → editor: 2 → viewer: 1
```

**Indexes:**
- `{ organizationId: 1, userId: 1 }` — unique compound (one membership per user per org)
- `{ userId: 1, status: 1 }` — fast "my active orgs" lookup
- `{ organizationId: 1 }` — list org members

---

## AuditLog

**Collection:** `auditlogs`  
**Source:** `apps/api/src/models/audit-log.model.ts`

| Field | Type | Required | Description |
|:--|:--|:--|:--|
| `actorId` | String | ✅ | Clerk user ID (indexed) |
| `action` | Enum | ✅ | See actions below |
| `resourceType` | Enum | ✅ | See resource types below |
| `resourceId` | String | — | MongoDB ObjectId (sparse index) |
| `before` | Mixed | — | State before change |
| `after` | Mixed | — | State after change |
| `metadata.requestId` | String | ✅ | Correlation ID (indexed) |
| `metadata.ip` | String | — | Client IP |
| `metadata.userAgent` | String | — | Browser/client UA |
| `metadata.method` | String | ✅ | HTTP method |
| `metadata.path` | String | ✅ | Request path |
| `metadata.statusCode` | Number | ✅ | Response status |
| `metadata.durationMs` | Number | — | Request duration |
| `createdAt` | Date | auto | Only `createdAt` is tracked (`updatedAt` disabled) |

**Actions:** `CREATE`, `UPDATE`, `DELETE`, `READ`, `SHARE`, `EXPORT`, `LOGIN`, `PAYMENT`, `INVITE_MEMBER`, `UPDATE_MEMBER_ROLE`, `REMOVE_MEMBER`

**Resource Types:** `Resume`, `User`, `Payment`, `Template`, `System`, `Organization`

**Indexes:**
- `{ actorId: 1, createdAt: -1 }` — user's activity history
- `{ resourceType: 1, resourceId: 1, createdAt: -1 }` — resource history
- `{ action: 1, createdAt: -1 }` — action-based queries
- `{ metadata.requestId: 1 }` — correlation lookup
- `{ createdAt: 1 }` — **TTL: 90 days** (auto-delete)

---

## ApiKey

**Collection:** `apikeys`  
**Source:** `apps/api/src/models/api-key.model.ts`

| Field | Type | Required | Description |
|:--|:--|:--|:--|
| `keyHash` | String | ✅ | SHA-256 hash of key prefix (indexed) |
| `name` | String | ✅ | Human-readable label, max 100 |
| `userId` | String | ✅ | Owner's Clerk ID (indexed) |
| `organizationId` | String | — | Org scope (sparse index) |
| `scopes` | String[] | ✅ | Permission scopes, default: `["read:resumes"]` |
| `lastUsedAt` | Date | — | Updated on each use |
| `expiresAt` | Date | — | Optional expiration |
| `revokedAt` | Date | — | Soft-revoke timestamp |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Scopes:** `read:resumes`, `write:resumes`, `read:analytics`, `admin`

**Indexes:**
- `{ keyHash: 1, revokedAt: 1 }` — fast active key lookup
- `{ userId: 1, createdAt: -1 }` — user's keys
- `{ keyHash: 1 }` — single field
- `{ organizationId: 1 }` — sparse

---

## Entity Relationships

```
User (clerkId)
  │
  ├── 1:N ──→ Resume (userId = clerkId)
  │               └── organizationId? ──→ Organization._id
  │
  ├── 1:N ──→ Organization (ownerId = clerkId)
  │
  ├── 1:N ──→ OrganizationMember (userId = clerkId)
  │               └── organizationId ──→ Organization._id
  │
  ├── 1:N ──→ AuditLog (actorId = clerkId)
  │
  └── 1:N ──→ ApiKey (userId = clerkId)
                  └── organizationId? ──→ Organization._id
```

---

## Connection Configuration

**Source:** `apps/api/src/config/database.ts`

- Connection pooling via Mongoose defaults
- MongoDB Atlas replica set
- Graceful disconnect on SIGINT/SIGTERM
- Connection string validated via Zod (`config/env.ts`)
