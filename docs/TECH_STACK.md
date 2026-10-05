# Technology Stack

**Version:** 2.0.0 | **Last Updated:** September 2026

Complete technology inventory for the TexFolio platform with versions and rationale.

> **Versions** below are the *declared* ranges from each workspace's `package.json` (what npm resolves on a fresh install); the lockfile may pin newer patch versions (e.g. `hono` 4.13.1, `mongoose` 8.24.2).

---

## Frontend (`apps/web`)

| Technology | Version | Purpose | Rationale |
|:--|:--|:--|:--|
| React | 19.2 | UI framework | Latest concurrent features, server components ready |
| Vite (Rolldown) | 7.2.5 | Build tool | Rolldown bundler for 10x faster builds than esbuild |
| TypeScript | 5.9 | Type safety | Strict mode, shared types with backend |
| Tailwind CSS | 4.1 | Styling | Utility-first, v4 with CSS-first config |
| Zustand | 5.0 | Client state | Minimal boilerplate, `devtools` middleware |
| React Query | 5.90 | Server state | Caching, mutations, optimistic updates |
| React Hook Form | 7.71 | Form handling | Performant uncontrolled forms |
| Headless UI | 2.2 | Accessible components | Unstyled, WAI-ARIA compliant |
| Lucide React | 0.563 | Icons | Tree-shakeable, consistent design |
| React Router | 7.13 | Routing | Declarative `<BrowserRouter>` + `<Routes>` |
| Clerk React SDK | 5.60 | Authentication | Drop-in auth UI, session management |
| dnd-kit | 6.3 / 10.0 | Drag and drop | Section reordering in editor |
| Recharts | 3.7 | Charts | Analytics dashboard visualizations |
| Axios | 1.13 | HTTP client | Interceptors for org header injection |
| React Hot Toast | 2.6 | Notifications | Lightweight toast system |
| Vercel Analytics | 1.6 | Web analytics | Zero-config performance tracking |
| react-helmet-async | 3.0 | SEO meta tags | Per-page title/description/canonical/OG via `SeoMeta` |

---

## Backend (`apps/api`)

| Technology | Version | Purpose | Rationale |
|:--|:--|:--|:--|
| Hono | 4.11 | Web framework | Ultra-fast (Web Standards), middleware-first |
| @hono/node-server | 2.1 | Node.js adapter | Production HTTP server for Hono |
| @hono/zod-validator | 0.7 | Request validation | Type-safe validation at route level |
| TypeScript | 5.7 | Type safety | Shared types via `@texfolio/shared` |
| Mongoose | 8.9 | MongoDB ODM | Schema validation, middleware, timestamps |
| BullMQ | 5.76 | Job queue | Reliable async PDF generation with retries |
| ioredis | 5.10 | Redis client | BullMQ queue backend only (not rate limiting) |
| Zod | 3.24 | Schema validation | Env config + request body validation |
| Mustache | 4.2 | Template engine | LaTeX template rendering (logic-less) |
| nanoid | 3.3 | ID generation | Short unique IDs for share links, request IDs |
| JSON (Clerk `verifyToken`) | JWT handling | Token verification via `@clerk/backend` (the `jsonwebtoken` package is declared but unused) |
| Hono `secureHeaders` | Security headers | CSP, X-Frame-Options (the `helmet` package is declared but unused) |
| dotenv | 16.4 | Env loading | Development environment variables |
| pdf-parse | 1.1 | PDF parsing | LinkedIn PDF import extraction |
| tsx | 4.19 | Dev runner | TypeScript execution without compilation |
| @clerk/backend | 3.7 | Auth (server) | Clerk JWT verification + user lookup |

### Declared but unused

`cors` (Hono's `hono/cors` is used instead), `helmet`, `jsonwebtoken`.

---

## AI & LLM

| Technology | Version | Purpose | Rationale |
|:--|:--|:--|:--|
| LangChain Core | 1.1 | LLM framework | Composable chains, structured output |
| LangGraph | 1.1 | Agent orchestration | Multi-node state graph for resume coach |
| @langchain/openai | 1.2 | OpenAI-compatible | Adapter for NVIDIA NIM, Groq, Gemini |
| Groq SDK | 0.37 | Groq API | Direct SDK for AI service (circuit-breaker wrapped) |
| NVIDIA NIM | — | Primary LLM | Llama 3.1 70B, best free tier performance |
| Google Gemini | — | Secondary LLM | Gemini 1.5 Flash via OpenAI-compatible endpoint |
| Groq | — | Fallback LLM | Llama 3.1 70B/8B, ultra-low latency |

### LLM Model Selection

| Provider | Model | Use Case |
|:--|:--|:--|
| NVIDIA NIM | `meta/llama-3.1-70b-instruct` | LangGraph agent (primary) |
| Google Gemini | `gemini-1.5-flash` | LangGraph agent (secondary) |
| Groq | `llama-3.1-70b-versatile` | LangGraph agent (fallback) |
| Groq | `llama-3.1-8b-instant` | AI service (improve, bullets, ATS, analyze, cover letter) |

---

## PDF Generation

| Technology | Version | Purpose | Rationale |
|:--|:--|:--|:--|
| pdflatex | TeX Live | LaTeX → PDF compilation | Industry-standard typesetting |
| Docker (node:20-bookworm-slim) | — | Isolated LaTeX environment | Security isolation, reproducible builds |
| texlive-latex-base | — | Core LaTeX packages | Minimal footprint |
| texlive-fonts-recommended | — | Standard fonts | Professional typography |
| texlive-latex-extra | — | Extended packages | hyperref, xcolor, geometry |
| Mustache | 4.2 | Template rendering | Logic-less, custom delimiters (`<< >>`) |

### Templates

| Template | File | Description |
|:--|:--|:--|
| Classic | `apps/api/src/templates/classic.tex` | Clean, traditional layout |
| FAANGPath | `apps/api/src/templates/faangpath.tex` | Tech-industry optimized (uses `resume.cls`) |
| Premium | `apps/api/src/templates/premium.tex` | Modern design with color accents |

---

## Infrastructure

| Technology | Purpose | Rationale |
|:--|:--|:--|
| MongoDB Atlas | Database | Managed, auto-scaling, global clusters |
| Redis Cloud | Queue backend | Managed Redis for BullMQ (rate limiting is in-process) |
| Vercel | Frontend hosting | Edge CDN, automatic deployments |
| Render | Backend hosting | Docker support, auto-deploy from Git |
| Docker Compose | Local orchestration | Redis + LaTeX renderer for development |

---

## Authentication & Security

| Technology | Purpose | Rationale |
|:--|:--|:--|
| Clerk | Auth provider | Managed auth, JWT, social login, webhooks |
| HMAC-SHA256 | API key signing | Tamper-proof service-to-service keys |
| SHA-256 | Key hashing | Secure storage (raw key shown once) |
| crypto.timingSafeEqual | Signature comparison | Timing attack prevention |
| Zod | Input validation | Runtime type checking at boundaries |

---

## Payments & Email

| Technology | Purpose | Rationale |
|:--|:--|:--|
| Razorpay | Payment processing | Indian market support, webhook verification |
| Brevo (Sendinblue) | Transactional email | PDF attachment delivery, reliable API |

---

## Development Tools

| Technology | Version | Purpose |
|:--|:--|:--|
| npm workspaces | — | Package management |
| ESLint | 9.39 | Code linting |
| Concurrently | 8.2 | Parallel dev scripts |
| GitHub Actions | — | CI/CD pipeline |

### Testing

| Technology | Version | Purpose |
|:--|:--|:--|
| `node:test` + `node:assert` | built-in | Test runner and assertions |
| jsdom | 30.1 | DOM environment for component tests |

Run with `node --experimental-strip-types --test apps/web/tests/*.test.ts` — there is no
`test` script in any workspace `package.json`. Nine test files live under
`apps/web/tests/`.

---

## Shared Package (`packages/shared`)

| Export | Purpose |
|:--|:--|
| Zod schemas | Single source of truth for validation (resume, API, AI) |
| Inferred types | `z.infer<>` types derived from Zod schemas |
| Constants | `PRO_TEMPLATES`, `isProTemplate()`, `FREE_TEMPLATE_ID` |

---

## Key Architecture Decisions

| Decision | Choice | Alternative Considered | Rationale |
|:--|:--|:--|:--|
| Web framework | Hono v4 | Express, Fastify | Web Standards, 3x faster, built-in middleware |
| Bundler | Rolldown (via Vite) | esbuild, webpack | 10x faster builds, Vite-compatible |
| State management | Zustand | Redux, Jotai | Minimal API, `devtools` middleware, no boilerplate |
| PDF rendering | pdflatex (spawn) | Puppeteer, wkhtmltopdf | True LaTeX quality, ATS-friendly output |
| Job queue | BullMQ | Agenda, pg-boss | Redis-backed, progress tracking, rate limiting |
| Rate limiting | Custom in-memory (sliding window) | express-rate-limit | Tiered, zero infrastructure; per-instance (not shared, not restart-safe) |
| AI orchestration | LangGraph | Custom chains | State machine, multi-agent, debuggable |
| Template engine | Mustache | Handlebars, EJS | Logic-less (safe for LaTeX), custom delimiters |
| Auth | Clerk | Auth0, Firebase Auth | Best DX, React SDK, JWT verification |
| Monorepo | npm workspaces | pnpm, Nx, Turborepo | Simple, npm-native, no extra tooling |
