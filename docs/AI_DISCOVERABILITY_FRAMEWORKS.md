# AI Discoverability & Search Optimization Frameworks

**Version:** 2.0.0 | **Last Updated:** June 2026

A comprehensive documentation of the six discoverability frameworks implemented in TexFolio to ensure maximum visibility across traditional search engines, generative AI platforms, large language models, and AI-powered search experiences.

---

## Table of Contents

1. [SEO — Search Engine Optimization](#1-seo--search-engine-optimization)
2. [AEO — Answer Engine Optimization](#2-aeo--answer-engine-optimization)
3. [GEO — Generative Engine Optimization](#3-geo--generative-engine-optimization)
4. [LLMO — Large Language Model Optimization](#4-llmo--large-language-model-optimization)
5. [AISEO — AI Search Optimization](#5-aiseo--ai-search-optimization)
6. [EEAT — Experience, Expertise, Authoritativeness, Trustworthiness](#6-eeat--experience-expertise-authoritativeness-trustworthiness)

---

## 1. SEO — Search Engine Optimization

### Objective

Maximize organic visibility on traditional search engines (Google, Bing, Yandex) through technical optimization, semantic markup, and content structuring.

### Implementation Details

#### 1.1 Global Meta Tags (`apps/web/index.html`)

```html
<title>TexFolio | AI-Powered LaTeX Resume Builder</title>
<meta
  name="description"
  content="Build professional, ATS-friendly LaTeX resumes..."
/>
<meta
  name="keywords"
  content="resume builder, AI resume, LaTeX resume, ATS friendly..."
/>
<meta name="author" content="Gautam Kumar" />
<meta name="robots" content="index, follow" />
<meta name="language" content="English" />
<link rel="canonical" href="https://texfolio.vercel.app/" />
```

#### 1.2 Dynamic Per-Page Meta Tags (`apps/web/src/components/SeoMeta.tsx`)

A reusable `SeoMeta` component wraps `react-helmet-async` to inject page-specific meta tags at runtime:

| Page          | Title                           | Description                                                   |
| ------------- | ------------------------------- | ------------------------------------------------------------- |
| `/`           | AI-Powered LaTeX Resume Builder | Build professional, ATS-friendly LaTeX resumes...             |
| `/templates`  | Resume Templates                | Choose from FAANGPath, Premium, and Classic...                |
| `/pricing`    | Pricing                         | Start for free, upgrade to Pro for ₹499/lifetime...           |
| `/about`      | About                           | Learn about TexFolio — the AI-powered LaTeX resume builder... |
| `/privacy`    | Privacy Policy                  | How we collect, use, and protect your personal data...        |
| `/terms`      | Terms of Service                | Terms and conditions for using TexFolio...                    |
| `/r/:shareId` | {Name} - Resume                 | Dynamic per-resume meta tags with candidate name              |

#### 1.3 Open Graph & Twitter Cards

Every page includes OG and Twitter Card meta tags for rich social previews:

```typescript
// SeoMeta.tsx — auto-injected per page
<meta property="og:type" content={ogType} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content="https://texfolio.vercel.app/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```

#### 1.4 Sitemap (`apps/web/public/sitemap.xml`)

Static sitemap covering all indexable routes with priority and change frequency:

```
https://texfolio.vercel.app/           (1.0 — weekly)
https://texfolio.vercel.app/templates   (0.9 — weekly)
https://texfolio.vercel.app/pricing     (0.8 — monthly)
https://texfolio.vercel.app/about       (0.7 — monthly)
https://texfolio.vercel.app/privacy     (0.5 — yearly)
https://texfolio.vercel.app/terms       (0.5 — yearly)
https://texfolio.vercel.app/login       (0.3 — yearly)
https://texfolio.vercel.app/register    (0.3 — yearly)
```

#### 1.5 Robots.txt (`apps/web/public/robots.txt`)

```
User-agent: *
Allow: /  Allow: /templates  Allow: /pricing  Allow: /about
Allow: /privacy  Allow: /terms  Allow: /login  Allow: /register  Allow: /r/
Disallow: /dashboard  Disallow: /create  Disallow: /edit/
Disallow: /resumes  Disallow: /cover-letter  Disallow: /profile
Disallow: /organizations
Sitemap: https://texfolio.vercel.app/sitemap.xml
```

#### 1.6 hreflang Tags

```html
<link rel="alternate" href="https://texfolio.vercel.app/" hreflang="en" />
<link
  rel="alternate"
  href="https://texfolio.vercel.app/"
  hreflang="x-default"
/>
```

#### 1.7 Search Console Verification

```html
<meta
  name="google-site-verification"
  content="N7Wz1Ta9dmB6G5JGUTIwCvHKG-7Lpf-EuF3zVkdGxKw"
/>
```

- Google Search Console: Verified and configured
- Bing Webmaster: Meta tag placeholder ready for production key

#### 1.8 Performance Optimization

| Technique      | Implementation                                       |
| -------------- | ---------------------------------------------------- |
| Code Splitting | Vite `manualChunks` in `vite.config.ts`              |
| Lazy Loading   | `React.lazy()` for all non-landing pages             |
| DNS Prefetch   | `<link rel="dns-prefetch">` for Clerk and Render     |
| Bundling       | Rolldown Vite with tree-shaking                      |
| Caching        | Vite content-hashed chunk names (`[name]-[hash].js`) |

#### 1.9 Structured Data (index.html)

Three inline JSON-LD blocks at the global level:

1. **WebApplication** — Full app metadata with author, offers, version
2. **Organization** — Knowledge Graph entity with founder and sameAs
3. **WebSite** — Sitelinks search box enablement

---

## 2. AEO — Answer Engine Optimization

### Objective

Structure content so it can be extracted as featured snippets, "People also ask" answers, and direct answers in search engine result pages (SERPs).

### Implementation Details

#### 2.1 FAQPage Schema (`apps/web/src/pages/HomePage.tsx`)

Eight question-answer pairs embedded as `FAQPage` JSON-LD via the `faqSchema()` helper:

```typescript
// apps/web/src/lib/structuredData.ts
export function faqSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
```

**Covered Questions:**

1. _What is TexFolio and how does it work?_
2. _Is TexFolio free to use?_
3. _What is ATS and why does it matter?_
4. _How does the AI resume coach work?_
5. _What makes TexFolio different from other resume builders?_
6. _Can I import my LinkedIn profile?_
7. _Is my data secure and private?_
8. _What templates are available?_

#### 2.2 Visual FAQ Section

The same questions are rendered as an interactive `<details>` / `<summary>` accordion on the homepage, providing both machine-readable (JSON-LD) and human-readable (HTML) FAQ content — a best practice for featured snippet extraction.

#### 2.3 Step-by-Step "How It Works" Section

A four-step guide targets "How-to" featured snippets:

```
1. Choose a Template → 2. Fill in Your Details
→ 3. Optimize with AI → 4. Export as PDF
```

#### 2.4 Concise, Answerable Content

All FAQ answers are 1–3 sentences with direct, scannable language optimized for voice search and featured snippet extraction.

---

## 3. GEO — Generative Engine Optimization

### Objective

Optimize content for citation and reference by generative AI engines (ChatGPT, Google Gemini, Perplexity, Claude) by establishing entity authority and structured relationships.

### Implementation Details

#### 3.1 Entity Schema Layer

Multiple interconnected schema.org types create a rich knowledge graph:

```json
// WebApplication (describes the SaaS product)
{ "@type": "WebApplication", "name": "TexFolio", "offers": { "price": "0" } }

// Organization (business entity)
{ "@type": "Organization", "name": "TexFolio", "founder": { "@type": "Person" } }

// Person (creator / author)
{ "@type": "Person", "name": "Gautam Kumar", "sameAs": ["GitHub", "LinkedIn", ...] }

// Product (paid tier)
{ "@type": "Product", "name": "TexFolio Pro", "offers": { "price": "499" } }
```

#### 3.2 Entity Relationships

```
Organization
  ├── founder → Person (Gautam Kumar)
  ├── sameAs → GitHub Repository
  └── sameAs → LinkedIn Profile

Person
  ├── knowsAbout → React, TypeScript, LangChain, LLMs, MongoDB, LaTeX
  ├── sameAs → GitHub, LinkedIn, Portfolio
  └── jobTitle → Full-Stack Developer


WebApplication
  ├── author → Person
  ├── offers → Offer (Free + Pro)
  └── applicationCategory → BusinessApplication
```

#### 3.3 Author Authority Signals

- Personal portfolio: `https://gautam-kr.vercel.app`
- GitHub: `https://github.com/theunstopabble`
- LinkedIn: `https://www.linkedin.com/in/gautamkr62`
- Code repository: `https://github.com/theunstopabble/TexFolio`

These are referenced in JSON-LD `sameAs` arrays across all schema types, creating a verifiable entity trail that generative AI models use for attribution.

#### 3.4 Search Console Integration

- Google Search Console: Verified with site ownership meta tag
- Bing Webmaster: Meta tag placeholder for verification

#### 3.5 Content Formatting for AI Citation

- Semantic HTML (h1 → h2 → h3 hierarchy)
- Descriptive meta descriptions (<160 chars for snippet extraction)
- Footer contains structured attribution ("Built by Gautam Kumar")

---

## 4. LLMO — Large Language Model Optimization

### Objective

Format content and metadata so LLMs (GPT-4, Claude, Gemini) can efficiently extract, understand, and reference TexFolio in training data and inference responses.

### Implementation Details

#### 4.1 Comprehensive JSON-LD Knowledge Graph

Five schema.org types provide full entity coverage:

| Schema Type      | Location                           | Purpose                                  |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| `WebApplication` | `index.html`                       | Product description, pricing, tech stack |
| `Organization`   | `index.html`                       | Business entity, founder, social links   |
| `WebSite`        | `index.html`                       | Search action enablement                 |
| `Person`         | `HomePage.tsx`, `PublicResume.tsx` | Author/resume owner expertise            |
| `Product`        | `Pricing.tsx`                      | Paid tier offering                       |
| `FAQPage`        | `HomePage.tsx`                     | Question-answer pairs for training       |
| `BreadcrumbList` | `Templates.tsx`, `Pricing.tsx`     | Navigation hierarchy                     |

#### 4.2 Person Schema with Expertise (`apps/web/src/lib/structuredData.ts`)

```typescript
export function personSchema() {
  return {
    "@type": "Person",
    name: "Gautam Kumar",
    url: "https://gautam-kr.vercel.app",
    jobTitle: "Full-Stack Developer"
",
    knowsAbout: [
      "React", "TypeScript", "Node.js", "LangChain",
      "Large Language Models", "MongoDB", "LaTeX",
      "Resume Optimization", "ATS Compatibility",
    ],
    sameAs: [
      "https://github.com/theunstopabble",
      "https://www.linkedin.com/in/gautamkr62",
      "https://gautam-kr.vercel.app",
    ],
  };
}
```

The `knowsAbout` array explicitly lists domains of expertise for LLM entity extraction.

#### 4.3 Dynamic Person Schema on Public Resumes

Shared resume URLs (`/r/:shareId`) inject a personalized `Person` schema with the candidate's name, summary, and skills:

```typescript
<SeoMeta
  jsonLd={[
    {
      "@type": "Person",
      name: personName,
      knowsAbout: resume?.skills?.flatMap(...) || [],
    },
    personSchema(),
  ]}
/>
```

This ensures individual resume pages are discoverable as personal entity pages.

#### 4.4 Clean Entity Boundaries

- Each schema object is self-contained with `@context` and `@type`
- Entities link to each other through sameAs, author, founder references
- No conflicting or duplicate entity definitions

#### 4.5 Structured Content for LLM Parsing

- FAQ content uses discrete Q&A pairs (ideal for LLM fine-tuning)
- Feature descriptions follow consistent pattern (icon + title + description)
- Pricing tables have clear key-value structure

---

## 5. AISEO — AI Search Optimization

### Objective

Optimize for AI-powered search experiences (Google SGE, Bing Chat, Perplexity, You.com) by providing schema-rich content that AI search engines can synthesize into direct answers.

### Implementation Details

#### 5.1 Google SGE (Search Generative Experience) Readiness

| Requirement         | Implementation                                   |
| ------------------- | ------------------------------------------------ |
| Structured Data     | WebApplication, Product, FAQPage, BreadcrumbList |
| Content Freshness   | Weekly sitemap updates for `/` and `/templates`  |
| Mobile Optimization | Full responsive design via Tailwind CSS          |
| Page Speed          | Vite code-splitting, lazy loading, DNS prefetch  |
| Secure Connection   | HTTPS via Vercel + Hono security headers         |
| Author Credibility  | Person schema with sameAs verification           |

#### 5.2 Product Schema for AI Shopping (`apps/web/src/pages/Pricing.tsx`)

```typescript
productSchema(
  "TexFolio Pro - Lifetime Resume Builder",
  "Unlimited resumes, AI coach analysis, cover letter generator...",
  "499",
);
```

This enables AI search engines to surface TexFolio Pro as a purchasable product in AI-powered shopping experiences.

#### 5.3 BreadcrumbList for Context (`apps/web/src/pages/Templates.tsx`)

```typescript
breadcrumbSchema([
  { name: "Home", url: "https://texfolio.vercel.app/" },
  { name: "Templates", url: "https://texfolio.vercel.app/templates" },
]);
```

Breadcrumb JSON-LD helps AI search engines understand site hierarchy and page context.

#### 5.4 FAQPage for AI Answer Boxes

The `FAQPage` schema (8 questions) is specifically designed for AI search engines to pull direct answers into their response interfaces — whether Google SGE answer cards, Perplexity citations, or Bing Chat responses.

#### 5.5 Semantic HTML Structure

All pages follow proper heading hierarchy:

- `h1` → Page title (unique per page)
- `h2` → Section headers (Features, How It Works, FAQ, Pricing)
- `h3` → Individual item titles (template names, feature names)

#### 5.6 Social Signals for AI Search

- Open Graph tags for link previews
- Twitter Cards for platform sharing
- OG image (`og-image.png`) for visual preview in AI responses

---

## 6. EEAT — Experience, Expertise, Authoritativeness, Trustworthiness

### Objective

Demonstrate first-hand experience, deep expertise, authoritative presence, and trustworthiness to satisfy Google's Quality Rater Guidelines and improve ranking for YMYL (Your Money or Your Life) content.

### Implementation Details

#### 6.1 Experience

| Signal               | Implementation                                     |
| -------------------- | -------------------------------------------------- |
| Product Experience   | Working SaaS deployed to Vercel + Render           |
| Real User Base       | Authentication via Clerk, MongoDB Atlas            |
| Monetization         | Razorpay payment integration (₹499 Pro tier)       |
| Production AI        | LangGraph agents + NVIDIA NIM + Groq in production |
| Years of Development | Multiple version releases (V2.0+)                  |

Demonstrated in:

- **About page** (`apps/web/src/pages/About.tsx`): "TexFolio is a solo project built by Gautam Kumar... demonstrates production-level SaaS architecture"
- **HomePage tech stats**: "React 19 + Hono v4 + LangGraph + NVIDIA NIM"

#### 6.2 Expertise

| Signal                  | Implementation                                  |
| ----------------------- | ----------------------------------------------- | ---------------------------- | -------------- |
| Author Credentials      | Full-Stack Developer                            | Solo-shipped 4 SaaS products | AI integration |
| (in JSON-LD)            |
| Technology Mastery      | React 19, Hono v4, LangChain, MongoDB, LaTeX    |
| AI Expertise            | LangGraph multi-agent systems, NVIDIA NIM, Groq |
| Resume/Domain Knowledge | ATS analysis, LaTeX typography, FAANG templates |
| Open Source             | Public GitHub repository                        |

Files demonstrating expertise:

- `apps/web/src/pages/About.tsx` — Full tech stack and capabilities listing
- `apps/web/src/lib/structuredData.ts` — `personSchema()` with `knowsAbout` array
- `apps/web/index.html` — Author JSON-LD with job title and sameAs

#### 6.3 Authoritativeness

| Signal            | Implementation                               |
| ----------------- | -------------------------------------------- |
| Personal Brand    | `https://gautam-kr.vercel.app` portfolio     |
| GitHub Presence   | `github.com/theunstopabble` with public code |
| LinkedIn Profile  | `linkedin.com/in/gautamkr62`                 |
| Open Source Code  | Full repository visible on GitHub            |
| Third-party Links | sameAs arrays linking to verified profiles   |
| Clear Attribution | "Built by Gautam Kumar" in Footer            |

Schema representation:

```json
{
  "@type": "Person",
  "name": "Gautam Kumar",
  "url": "https://gautam-kr.vercel.app",
  "sameAs": [
    "https://github.com/theunstopabble",
    "https://www.linkedin.com/in/gautamkr62",
    "https://gautam-kr.vercel.app"
  ]
}
```

#### 6.4 Trustworthiness

| Signal                   | Implementation                                                                                | Location                                  |
| ------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Privacy Policy**       | Full 9-section policy covering data collection, AI processing, GDPR rights, cookies, security | `/privacy`                                |
| **Terms of Service**     | Full 10-section terms covering accounts, payments, AI content, liability                      | `/terms`                                  |
| **GDPR Compliance**      | Data export/deletion routes (`/api/me/export`, `/api/me/delete`)                              | `apps/api/src/routes.hono/gdpr.routes.ts` |
| **Data Encryption**      | TLS/SSL, MongoDB Atlas encryption at rest                                                     | `apps/api/src/hono.ts:40`                 |
| **Security Headers**     | Helmet secureHeaders middleware                                                               | `apps/api/src/hono.ts:40`                 |
| **CORS Hardening**       | Origin whitelist per environment                                                              | `apps/api/src/hono.ts:48-63`              |
| **Rate Limiting**        | Tiered (Free/Pro/Anonymous) + strict for auth/payments                                        | `apps/api/src/hono.ts:66-86`              |
| **Input Sanitization**   | Global middleware for XSS prevention                                                          | `apps/api/src/hono.ts:89-94`              |
| **Audit Logging**        | Enterprise audit trail for all operations                                                     | `apps/api/src/services/audit.service.ts`  |
| **Authentication**       | Clerk with Google/GitHub SSO                                                                  | `apps/web/src/App.tsx:98`                 |
| **Payment Security**     | Razorpay (no credit card storage)                                                             | `apps/web/src/hooks/useRazorpay.ts`       |
| **Contact Availability** | Developer portfolio and social links                                                          | Footer + About page                       |
| **AI Transparency**      | Clear disclosure of AI-generated content limitations                                          | Terms of Service Section 6                |

#### 6.5 E-E-A-T Content Pages

| Page             | URL        | E-E-A-T Contribution                                      |
| ---------------- | ---------- | --------------------------------------------------------- |
| About            | `/about`   | Experience + Expertise (creator bio, tech stack, mission) |
| Privacy Policy   | `/privacy` | Trustworthiness (data handling transparency)              |
| Terms of Service | `/terms`   | Trustworthiness (legal framework, liability)              |
| Homepage         | `/`        | All four pillars (FAQ, features, trust section)           |

#### 6.6 Footer Trust Signals

```
TexFolio
├── Product: Templates, Pricing, About
├── Resources: About TexFolio, Resume Templates, Pricing
└── Legal: Privacy Policy, Terms of Service
    └── Built by: Gautam Kumar (GitHub | LinkedIn)
```

---

## Cross-Framework Matrix

| Feature                       | SEO | AEO | GEO | LLMO | AISEO | EEAT |
| ----------------------------- | :-: | :-: | :-: | :--: | :---: | :--: |
| JSON-LD WebApplication        | ✅  |  —  | ✅  |  ✅  |  ✅   |  ✅  |
| JSON-LD Organization          | ✅  |  —  | ✅  |  ✅  |  ✅   |  ✅  |
| JSON-LD Person                |  —  |  —  | ✅  |  ✅  |   —   |  ✅  |
| JSON-LD FAQPage               |  —  | ✅  |  —  |  ✅  |  ✅   |  —   |
| JSON-LD Product               |  —  |  —  | ✅  |  ✅  |  ✅   |  —   |
| JSON-LD BreadcrumbList        | ✅  |  —  |  —  |  —   |  ✅   |  —   |
| Meta Tags per Page            | ✅  | ✅  | ✅  |  ✅  |  ✅   |  ✅  |
| Open Graph / Twitter          | ✅  |  —  |  —  |  —   |  ✅   |  —   |
| Sitemap.xml                   | ✅  |  —  |  —  |  —   |   —   |  —   |
| Robots.txt                    | ✅  |  —  |  —  |  —   |   —   |  —   |
| hreflang                      | ✅  |  —  |  —  |  —   |   —   |  —   |
| Search Console                | ✅  |  —  | ✅  |  —   |  ✅   |  —   |
| Privacy Policy                |  —  |  —  |  —  |  —   |   —   |  ✅  |
| Terms of Service              |  —  |  —  |  —  |  —   |   —   |  ✅  |
| About Page                    | ✅  |  —  | ✅  |  ✅  |   —   |  ✅  |
| FAQ Section (visible)         |  —  | ✅  |  —  |  ✅  |  ✅   |  —   |
| How It Works Section          |  —  | ✅  |  —  |  —   |   —   |  —   |
| Author sameAs                 |  —  |  —  | ✅  |  ✅  |   —   |  ✅  |
| Author Expertise (knowsAbout) |  —  |  —  |  —  |  ✅  |   —   |  ✅  |
| GDPR / Security               |  —  |  —  |  —  |  —   |   —   |  ✅  |

---

## Verification & Testing

### Build Validation

```bash
# Frontend type check
cd apps/web && npx tsc --noEmit

# Frontend production build
cd apps/web && npx vite build

# Backend type check
cd apps/api && npx tsc --noEmit

# Vulnerability scan
npm audit
```

### Structured Data Testing

Use the following tools to validate all JSON-LD implementations:

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Google PageSpeed Insights**: https://pagespeed.web.dev/

### Expected Rich Results

| Page          | Expected Rich Result                                             |
| ------------- | ---------------------------------------------------------------- |
| `/`           | FAQ (8 questions), WebApplication, Person, Organization, WebSite |
| `/templates`  | BreadcrumbList                                                   |
| `/pricing`    | Product, BreadcrumbList, Organization                            |
| `/about`      | Person, Organization                                             |
| `/r/:shareId` | Person (dynamic per resume)                                      |

---

## Maintenance

### Monthly Tasks

1. Update sitemap `lastmod` dates
2. Review Google Search Console for indexing errors
3. Run `npm audit` and fix vulnerabilities
4. Verify structured data with Schema.org validator
5. Check Google Rich Results report for any issues

### Quarterly Tasks

1. Review and update FAQ questions based on user inquiries
2. Audit meta descriptions for click-through rate optimization
3. Update author information and sameAs links if needed
4. Review legal pages for regulatory changes (GDPR, etc.)
5. Test with latest versions of ChatGPT, Gemini, Perplexity for citation accuracy

### Deployment Checklist

- [ ] TypeScript compiles (`tsc --noEmit` in both apps)
- [ ] Vite production build succeeds
- [ ] Zero npm vulnerabilities
- [ ] sitemap.xml includes all public routes
- [ ] robots.txt has correct Allow/Disallow rules
- [ ] All JSON-LD blocks are valid
- [ ] OG image exists and is accessible
- [ ] Canonical URLs match deployed domain
- [ ] Search console verification tag present
- [ ] Footer legal links point to active pages

---

_Documentation maintained as part of TexFolio's discoverability infrastructure._
