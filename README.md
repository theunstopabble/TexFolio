# <div align="center"> <img src="apps/web/public/TexFolio-Banner.png" alt="TexFolio Banner" width="100%" /> </div>

<div align="center">

# TexFolio - AI-Powered LaTeX Resume Builder

[![Live Demo](https://img.shields.io/badge/Live-Demo-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://texfolio.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite-61DAFB?style=for-the-badge&logo=react)](apps/web)
[![Backend](https://img.shields.io/badge/Backend-Hono_%7C_Node.js-339933?style=for-the-badge&logo=nodedotjs)](apps/api)
[![AI](https://img.shields.io/badge/AI-Groq_%7C_Llama_3-FF6F00?style=for-the-badge&logo=openai)](apps/api/src/services/ai.service.ts)

**Build professional, ATS-friendly resumes in minutes with the power of LaTeX rendering and AI assistance.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 🚀 Overview

**TexFolio** is a modern SaaS application that combines the precision of LaTeX document rendering with the intelligence of Large Language Models (LLMs). It solves the problem of formatting complex resumes while ensuring they are optimized for Applicant Tracking Systems (ATS).

Unlike traditional resume builders that generate clunky HTML-to-PDF exports, TexFolio compiles real LaTeX code in the background to produce industry-standard, typography-perfect PDFs.

## ✨ Features

### 🤖 AI-Powered Intelligence

- **Smart Resume Analysis:** Get real-time feedback on your resume with a 0-100 ATS score.
- **Bullet Point Generator:** Generate action-oriented, quantified bullet points for any job title (Powered by Groq/Llama-3).
- **Text Improver:** Instantly rewrite summary or descriptions to be more professional.
- **Cover Letter Generator:** Auto-write tailored cover letters based on your resume and a job description.

### 📄 LaTeX Precision

- **Real LaTeX Rendering:** Uses `pdflatex` to compile high-quality PDFs.
- **FAANG-Ready Templates:** Includes the popular "FAANGPath" and "Classic" templates used by top tech companies.
- **Clean URLs:** Automatic formatting of LinkedIn and GitHub links for a cleaner look.

### 🛠️ Powerful Editor

- **Interactive Stepper:** A guided, step-by-step form experience.
- **Drag & Drop:** Easily reorder sections (Education, Experience, Skills, etc.).
- **Live Preview:** (Coming Soon) Real-time feedback on your edits.

### 🔐 Secure & Scalable

- **Authentication:** powered by **Clerk** for secure user management.
- **Database:** MongoDB for flexible schema design.
- **Monorepo:** Managed with efficient npm workspaces.

---

## 🛠 Tech Stack

### Frontend (`apps/web`)

- **Core:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand, React Query (@tanstack/query)
- **Forms:** React Hook Form
- **UI Components:** Headless UI, Lucide React
- **Authentication:** Clerk React SDK

### Backend (`apps/api`)

- **Server:** Hono (Node.js adapter) - Ultra-fast web standard framework
- **Database:** MongoDB (Mongoose)
- **AI Engine:** LangChain + Groq SDK (Llama-3.1-8b-instant)
- **PDF Engine:** `pdflatex` (via Docker or Local MiKTeX)
- **Validation:** Zod
- **Templating:** Mustache (for LaTeX variable injection)

---

## 🚀 Getting Started

Follow these steps to set up TexFolio locally.

### Prerequisites

- Node.js >= 18
- MongoDB (Local or Atlas)
- LaTeX Distribution (MiKTeX or TeX Live) OR Docker (for containerized rendering) - _Recommended_
- Groq API Key (for AI features)
- Clerk API Keys (for Auth)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/theunstopabble/TexFolio.git
   cd TexFolio
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env` files in `apps/api` and `apps/web`.

   **`apps/api/.env`**

   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   GROQ_API_KEY=your_groq_api_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   FRONTEND_URL=http://localhost:5173
   # Set to true if using Docker for LaTeX
   USE_DOCKER_LATEX=true
   ```

   **`apps/web/.env`**

   ```env
   VITE_API_URL=http://localhost:3000
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

4. **Run the Application**
   Run both frontend and backend concurrently:

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

---

## 🏗️ Architecture

TexFolio follows a **Service-Oriented Architecture** within a Monorepo.

```
TexFolio/
├── apps/
│   ├── api/                 # Backend Server (Hono)
│   │   ├── src/
│   │   │   ├── services/    # Business Logic (AI, PDF)
│   │   │   ├── templates/   # .tex LaTeX Templates
│   │   │   ├── models/      # Mongoose Models
│   │   │   └── routes/      # API Endpoints
│   │   └── ...
│   └── web/                 # Frontend Client (React)
│       ├── src/
│       │   ├── features/    # Feature-based folders (Resume Editor)
│       │   ├── components/  # Shared Components
│       │   └── pages/       # Route Views
│       └── ...
└── packages/                # Shared libraries (Optional)
```

### PDF Generation Pipeline

1.  **Data Ingestion:** User data is sent from Frontend → Backend.
2.  **Transformation:** `PDFService` cleans inputs (Latex escaping) and maps them to Mustache tags.
3.  **Rendering:** Mustache renders the `.tex` file with the data.
4.  **Compilation:** `pdflatex` compiles the `.tex` file to `.pdf`.
5.  **Delivery:** The generated PDF path/blob is returned to the user.

---

## 📚 API Documentation

### **Resume**

| Method | Endpoint              | Description             |
| :----- | :-------------------- | :---------------------- |
| `POST` | `/api/resume`         | Create a new resume     |
| `GET`  | `/api/resume/:id`     | Get resume details      |
| `PUT`  | `/api/resume/:id`     | Update resume           |
| `POST` | `/api/resume/:id/pdf` | Generate & Download PDF |

### **AI Services**

| Method | Endpoint               | Description                        |
| :----- | :--------------------- | :--------------------------------- |
| `POST` | `/api/ai/analyze`      | Analyze resume (ATS Score)         |
| `POST` | `/api/ai/improve`      | Improve text (Summary/Description) |
| `POST` | `/api/ai/bullets`      | Generate bullet points             |
| `POST` | `/api/ai/cover-letter` | Generate cover letter              |

---

## 🤝 Contributing & Contact

Contributions are welcome! Please feel free to submit a Pull Request.

**Author:** Gautam Kumar  
**LinkedIn:** [linkedin.com/in/gautamkr62](https://www.linkedin.com/in/gautamkr62/)  
**Website:** [texfolio.vercel.app](https://texfolio.vercel.app/)

---

<div align="center">
  <sub>Built with ❤️ using React, Node.js, and LaTeX.</sub>
</div>
