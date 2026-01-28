---
description: TexFolio (A Premium AI-Powered LaTeX Resume Builder)
---

# TexFolio Development Workflow

## 🎯 Core Principle: MANUAL APPROACH
**NEVER automatically edit code. Always provide code snippets for the user to copy-paste manually.**

---

## 📋 Development Process

### 1. Feature Request
- User describes what they want
- I analyze and plan the implementation

### 2. Code Provision (MANUAL)
- I provide clear code snippets with:
  - File path
  - What to find/replace
  - Complete code blocks
- **User copies and pastes the code themselves**

### 3. Testing
- User runs the app
- User shares screenshots/errors
- I debug based on their feedback

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)
- React + TypeScript + Vite
- Tailwind CSS v4
- react-hook-form (forms)
- react-hot-toast (notifications)
- react-router-dom (routing)
- axios (API calls)

### Backend (`apps/api`)
- Express.js + TypeScript
- MongoDB + Mongoose
- Mustache (LaTeX templating)
- MiKTeX pdflatex (PDF generation)

### Shared (`packages/shared`)
- TypeScript types

---

## 📁 Key Files

### Frontend
- `apps/web/src/App.tsx` - Main app with routes
- `apps/web/src/pages/CreateResume.tsx` - Multi-step form
- `apps/web/src/services/api.ts` - API calls
- `apps/web/src/index.css` - Tailwind + styles

### Backend
- `apps/api/src/index.ts` - Express server
- `apps/api/src/routes/resume.routes.ts` - Resume CRUD + PDF
- `apps/api/src/services/pdf.service.ts` - LaTeX PDF generation
- `apps/api/src/templates/premium.tex` - LaTeX template
- `apps/api/src/models/resume.model.ts` - Mongoose schema

---

## 🚀 Running the Project

// turbo-all
```bash
# Terminal 1: Frontend
npm run dev --workspace=@texfolio/web

# Terminal 2: Backend  
npm run dev:api
```

---

## 📝 Code Snippet Format

When providing code to user:

```
**📁 File:** `path/to/file.tsx`

**Find:**
```code
// old code
```

**Replace with:**
```code
// new code
```
```

---

## ✅ Completed Features
- Multi-step wizard form (8 steps)
- Calendar date picker
- Date formatting (Jan 2024)
- Toast notifications
- PDF generation
- Professional LaTeX template
- Clickable links
- Dynamic add/remove sections
- Empty fields filter
- Conditional rendering

## 🔜 Pending Features
- Resume List Page
- Edit Resume
- Template Preview
- Authentication (Login/Signup)