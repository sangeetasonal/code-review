<p align="center">
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-Free_Tier-8E75FF?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Monaco_Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" />
</p>

# 🤖 AI Code Reviewer

> An instant, AI-powered code review tool built with **Gemini 2.5 Flash (Free Tier)**. Paste any code, get senior-developer-level feedback in seconds — streamed in real-time.

<p align="center">
  <strong>🔗 Live Demo:</strong> <a href="https://code-review-omega-five.vercel.app/">code-review-omega-five.vercel.app</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <strong>🔗 GitHub Repository:</strong> <a href="https://github.com/sangeetasonal/code-review">github.com/sangeetasonal/code-review</a>
</p>

---

## ✨ Features

### Core
| Feature | Description |
|---------|-------------|
| **Real-time SSE Streaming** | Reviews stream token-by-token like ChatGPT — no waiting for the full response |
| **Monaco Editor** | The same editor that powers VS Code — syntax highlighting, minimap, bracket pairs, and IntelliSense |
| **18 Languages** | JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, and more |
| **4 Review Modes** | Standard, Nitpicky, Security-Focused, and Performance-Focused — each injects a tailored system prompt |

### Intelligence
| Feature | Description |
|---------|-------------|
| **Auto Language Detection** | Automatically identifies the programming language from code content using pattern-matching heuristics |
| **Review Score Dashboard** | Parses the AI's overall score (X/10) and renders it as an animated SVG progress ring |
| **Structured Output** | AI returns organized sections: Score → Issues (by severity) → Strengths → Recommendations |

### UX & Design
| Feature | Description |
|---------|-------------|
| **Dark / Light Mode** | Toggle with zero flash-of-wrong-theme via inline `<script>` in HTML |
| **Skeleton Loading** | Shimmering placeholder blocks while the AI generates the first token |
| **Toast Notifications** | Non-intrusive feedback for copy, export, errors, and rate limits |
| **Keyboard Shortcuts** | `Ctrl+Enter` to review, `Ctrl+L` to clear, `Ctrl+/` for shortcut cheat-sheet |
| **Review History** | Last 10 reviews saved to `localStorage` with per-item delete |
| **Copy & Export** | One-click copy to clipboard or export as `.md` file |
| **PWA Support** | Installable as a desktop/mobile app with offline shell caching |

### Backend & Security
| Feature | Description |
|---------|-------------|
| **Rate Limiting** | 10 requests/minute per IP via `express-rate-limit` — protects the free API quota |
| **Input Validation** | 15,000 char limit, language allowlist, strictness allowlist, and type checks |
| **CORS Allowlist** | Dynamic origin validation instead of wildcard `*` |
| **Global Error Handler** | Catches unhandled errors and returns clean JSON responses |
| **Dockerized** | Multi-stage Dockerfiles for both frontend (nginx) and backend (Node Alpine) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React 19 · Tailwind v4 · Monaco Editor · Lucide Icons      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Sidebar  │  │ Toolbar  │  │ Code Editor │  │ Review   │ │
│  │ History  │  │ Lang/Mode│  │ Monaco      │  │ Markdown │ │
│  │ Delete   │  │ AutoLang │  │ SSE Stream  │  │ Score    │ │
│  └──────────┘  └──────────┘  └──────────┐  │  └──────────┘ │
│                                          │  │               │
│                              POST /ai/get-review (SSE)      │
└──────────────────────────────────────┬──────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────┐
│                        BACKEND                              │
│  Express 5 · Node.js · Rate Limiter · Input Validation      │
│                                                             │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │ aiControllers.js   │  │ aiService.js                 │   │
│  │ Validate input     │──│ Build system prompt           │   │
│  │ Language allowlist  │  │ Stream from Gemini API       │   │
│  │ Char limit (15K)   │  │ Forward SSE chunks to client │   │
│  └────────────────────┘  └──────────────────────────────┘   │
│                                       │                     │
│                          Gemini 2.5 Flash (Free Tier)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Gemini API Key** — [Get one free here](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/sangeetasonal/code-review.git
cd code-review

# Install root + backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Root .env (backend)
PORT=8000
GOOGLE_API_KEY=your_gemini_api_key_here
```

```bash
# frontend/.env
VITE_BACKEND_API=http://localhost:8000/ai/get-review
```

### 3. Run

```bash
npm run dev
```

This starts both backend (port 8000) and frontend (port 5173) concurrently.

---

## 🐳 Docker

```bash
# Build and run everything
docker compose up --build

# Backend: http://localhost:3000
# Frontend: http://localhost:80
```

> Set `GOOGLE_API_KEY` in your environment or a `.env` file before running.

---


## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Submit code for review |
| `Ctrl + L` | Clear the editor |
| `Ctrl + /` | Toggle shortcuts panel |
| `Escape` | Close sidebar / modal |

---

## 🛡️ API Rate Limits

| Parameter | Value |
|-----------|-------|
| Window | 60 seconds |
| Max Requests | 10 per IP |
| Max Code Length | 15,000 characters |
| Response | `429 Too Many Requests` with JSON error |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Tailwind CSS v4, Monaco Editor, Lucide Icons |
| **Markdown** | react-markdown + rehype-highlight |
| **Backend** | Express 5, Node.js |
| **AI Model** | Gemini 2.5 Flash (Free Tier — no paid APIs) |
| **Streaming** | Server-Sent Events (SSE) |
| **DevOps** | Docker, docker-compose, nginx |
| **PWA** | Service Worker, Web App Manifest |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 📄 License

MIT — Built by [Sangeeta Sonal](https://github.com/sangeetasonal)
