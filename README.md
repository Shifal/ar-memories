# AR Memories

An AR app that plays a video memory when a physical photo is scanned, with an AI-powered one-shot Q&A per memory.

Point your phone's camera at a printed photo, and the linked video plays directly overlaid on top of it in the live camera view — tracked in real time as the phone moves.

**Live deployments:**
- Backend API: https://ar-memories.onrender.com
- AR web (scan page): https://ar-memories-web.vercel.app

---

## Demo

**Video walkthrough:**

https://github.com/user-attachments/assets/0a46ed83-cd37-4f3d-ba58-1efc94724ec5

**Screenshots:**

| Splash | Home | Add Memory |
|---|---|---|
| ![Splash](docs\screenshots\splash.jpeg) | ![Home](docs/screenshots/homepage.jpeg) | ![Add Memory](docs/screenshots/upload.jpeg) |

| Scan | Profile |
|---|---|
| ![Scan](docs/screenshots/scan.jpeg) | ![Profile](docs/screenshots/profile.jpeg) |

---

## Table of Contents

- [Demo](#demo)
- [Concept](#concept)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features Implemented](#features-implemented)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)

---

## Concept

Two experiences live in one app:

- **Add a Memory** — pick a photo + video from the phone's library, add a caption, upload.
- **Scan** — open the camera, point at a known photo, watch its video play over it.

The live AR photo-tracking itself is **not AI-driven**. A JavaScript library (MindAR) pre-compiles each reference photo into a compact feature-map file (a `.mind` file) ahead of time using classical computer vision, and the phone matches the live camera feed against it entirely on-device, frame by frame, with zero network calls mid-scan.

AI (Google Gemini) is used in exactly two places:
- **Embeddings** — the memory's caption is embedded and stored (pgvector) at upload time.
- **One-shot "Ask about this memory" Q&A** — a RAG-style pattern (retrieve the memory's caption → generate an answer → verify groundedness) scoped to a single memory. One question in, one answer out — no multi-turn conversation memory. *(Backend complete; not yet wired into any UI — see Future Enhancements.)*

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   Expo Mobile App    │        │   ar-web (Vercel)    │
│  (iOS / Android)     │        │  index.html + scan.html│
│                      │        │  MindAR + Three.js    │
│  Home / Add / Scan / │        │  Camera AR overlay    │
│  Profile screens     │        │  (HTTPS required for  │
└──────────┬───────────┘        │   camera access)      │
           │                    └──────────┬───────────┘
           │  HTTPS (fetch)                │  HTTPS (fetch,
           │                                │  photo/video/mind URLs
           ▼                                ▼  via query params)
┌────────────────────────────────────────────────────┐
│         FastAPI Backend (Render, Docker)            │
│  - Auth (JWT)                                       │
│  - Memory CRUD (photo + video + caption)            │
│  - .mind file generation (Node.js subprocess)       │
│  - Gemini embeddings                                │
│  - "Ask about this memory" Q&A endpoint             │
└───────────┬───────────────────────────┬────────────┘
            │                            │
            ▼                            ▼
┌────────────────────────┐   ┌───────────────────────────┐
│  Supabase Postgres      │   │  Supabase Storage          │
│  + pgvector              │   │  (photos, videos,          │
│  users / memories /      │   │   mind-files buckets)      │
│  memory_embeddings /     │   └───────────────────────────┘
│  query_logs              │
└────────────────────────┘
            ▲
            │  subprocess call
┌────────────────────────────┐
│  mind-compiler (Node.js)    │
│  mind-ar OfflineCompiler +   │
│  node-canvas                │
│  Compiles uploaded photo →   │
│  .mind tracking file         │
└────────────────────────────┘
```

**Why a Node.js subprocess inside a Python backend?** MindAR's `.mind` compiler only runs in a browser-like environment (Canvas/Image APIs). The `mind-ar` npm package bundles `node-canvas`, letting its `OfflineCompiler` run in plain Node.js — so FastAPI shells out to a small Node script (`mind-compiler/compile.js`) per upload, downscales large phone photos first for speed, and uploads the resulting `.mind` file to storage.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend framework | FastAPI (Python) |
| Database | PostgreSQL + pgvector (Supabase) |
| File storage | Supabase Storage (photos, videos, mind-files buckets) |
| AR engine | MindAR + Three.js (web-based, open source) |
| `.mind` compiler | Node.js 20 + `mind-ar`'s `OfflineCompiler` + `node-canvas` |
| App shell | Expo / React Native (Expo Router, SDK 54) |
| AR web page hosting | Vercel (static hosting, HTTPS required for camera access) |
| Backend hosting | Render (Docker, free tier) |
| AI (embeddings + Q&A) | Google Gemini (`google-genai` SDK) |
| Auth | JWT (`python-jose`) + bcrypt (`passlib`) |
| Mobile navigation | Expo Router (file-based routing) |
| Mobile fonts | Fraunces, Caveat, IBM Plex Sans/Mono (Google Fonts via `@expo-google-fonts`) |

---

## Project Structure

```
ar-memories/
├── backend/                        FastAPI + Python
│   ├── app/
│   │   ├── main.py                 App entrypoint, CORS config
│   │   ├── database.py             SQLAlchemy engine/session
│   │   ├── models.py                User, Memory, MemoryEmbedding, QueryLog
│   │   ├── schemas.py               Pydantic request/response models
│   │   ├── config.py                Settings (reads .env)
│   │   ├── deps.py                  get_current_user (HTTPBearer JWT auth)
│   │   ├── routers/
│   │   │   ├── auth.py              signup, login, /me, change-password
│   │   │   ├── memories.py          upload, list, update, delete
│   │   │   └── query.py             one-shot "ask about this memory"
│   │   └── services/
│   │       ├── auth_service.py      Password hashing, JWT creation
│   │       ├── storage_service.py   Supabase Storage upload helper
│   │       ├── media_validation.py  Photo/video size + duration limits (ffmpeg)
│   │       ├── mind_file_service.py Calls mind-compiler subprocess
│   │       ├── embedding_service.py Gemini embeddings
│   │       ├── generation_service.py Gemini answer generation
│   │       └── groundedness_service.py Verifies answer is grounded
│   ├── alembic/                     DB migrations
│   ├── requirements.txt
│   ├── Dockerfile                   Python + Node 20 + canvas system libs
│   └── .env.example
│
├── mind-compiler/                   Node.js — compiles .mind tracking files
│   ├── compile.js                   CLI: node compile.js <photo> <output.mind>
│   └── package.json                 mind-ar, canvas
│
├── ar-web/                           MindAR + Three.js AR page (deployed to Vercel)
│   ├── index.html                    Full app: login, memory picker, AR scan
│   └── scan.html                     Camera-only scan page (used by mobile app,
│                                      takes ?mind=&video=&photo= query params)
│
├── mobile-app/                       Expo Router app (iOS + Android)
│   ├── app/
│   │   ├── _layout.tsx               Auth gate + splash screen + font loading
│   │   └── (tabs)/
│   │       ├── _layout.tsx           Tab bar: Home, Add Memory, Scan, Profile
│   │       ├── index.tsx             Home tab
│   │       ├── add.tsx               Add Memory tab
│   │       ├── scan.tsx              Scan tab
│   │       └── profile.tsx           Profile tab
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx            Polaroid grid + memory detail view (edit/delete)
│   │   ├── AddMemoryScreen.tsx       Photo/video picker, upload with progress
│   │   ├── ScanScreen.tsx            Memory picker → AR camera (WebView/browser)
│   │   └── ProfileScreen.tsx         Editable name, change password, logout
│   ├── components/
│   │   └── AnimatedSplash.tsx        Custom animated splash screen
│   ├── contexts/
│   │   └── AuthContext.tsx           Shares JWT token across the app
│   └── config.ts                     API_BASE, AR_WEB_URL, AR_SCAN_URL
│
└── README.md
```

---

## Features Implemented

- Email/password auth (signup, login, JWT), editable display name, change password
- Upload a memory: photo + video + caption, with size/duration validation (ffmpeg)
- Automatic `.mind` AR tracking file generation on upload
- Automatic caption embedding (Gemini) for future Q&A retrieval
- Home tab: Polaroid-style grid of memories, tap for detail view, edit caption, delete
- Add Memory tab: native photo/video picker, upload progress indicator
- Scan tab: pick a memory, camera opens, AR video overlay plays when the photo is recognized
  - Android: fully embedded in-app (WebView)
  - iOS: opens in an in-app Safari sheet (Expo Go's WebView can't access the camera; see Known Limitations)
- Profile tab: view/edit name, change password, logout
- Custom animated splash screen
- One-shot "Ask about this memory" Q&A endpoint — **backend only, no UI yet**
- Backend deployed on Render (Docker), AR web page deployed on Vercel

---

## Setup Instructions

### Prerequisites
- Python 3.12+, Node.js 20.x (a *different* Node version can break `node-canvas` — see note below), `ffmpeg`/`ffprobe` on PATH, a Supabase project (Postgres + Storage), a Google Gemini API key.

> **Node version note:** `node-canvas` (used by `mind-compiler`) needs prebuilt binaries that aren't always available for the newest Node release. Node 20 LTS is confirmed working; if you hit `node-pre-gyp`/`ERR_DLOPEN_FAILED` errors, install Node 20 alongside your default version (e.g. via `nvm`) and point `NODE_EXECUTABLE_PATH` in `.env` at it directly.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows; source venv/bin/activate on Mac/Linux
pip install -r requirements.txt --break-system-packages
cp .env.example .env         # then fill in real values, see below
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0
```

### mind-compiler

```bash
cd mind-compiler
npm install mind-ar canvas   # requires Node 20, see note above
node compile.js path/to/photo.jpg test-output.mind   # standalone test
```

### ar-web

No build step — plain HTML/JS. Serve locally with VS Code's Live Server extension, or deploy to Vercel:
```bash
cd ar-web
vercel --prod
```
**Important:** camera access (`getUserMedia`) requires HTTPS or `localhost` — a plain local network IP over `http://` will silently fail to open the camera on iOS Safari/WKWebView.

### mobile-app

```bash
cd mobile-app
npm install
npx expo start
```
Scan the QR code with Expo Go (update `config.ts` with your backend/AR web URLs first).

---

## Environment Variables

`backend/.env`:

```properties
DATABASE_URL=postgresql://user:password@host:5432/postgres
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(32))">
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
GEMINI_API_KEY=<your Gemini API key>
STORAGE_DIR=./storage
SUPABASE_URL=https://<your-ref>.supabase.co
SUPABASE_SERVICE_KEY=<your service_role key — never expose in frontend/mobile code>
ALLOWED_ORIGINS=http://localhost:5500,https://ar-memories-web.vercel.app
NODE_EXECUTABLE_PATH=node   # override with a full path locally if needed, see setup note
```

`mobile-app/config.ts`:
```typescript
export const API_BASE = "https://ar-memories.onrender.com";
export const AR_WEB_URL = "https://ar-memories-web.vercel.app/index.html";
export const AR_SCAN_URL = "https://ar-memories-web.vercel.app/scan.html";
```

---

## Deployment

- **Backend:** Render, Docker runtime, `Dockerfile` at `backend/Dockerfile` (root directory set to repo root so it can `COPY` both `backend/` and `mind-compiler/`). Free tier — sleeps after ~15 min idle, first request after that takes 30-60s to wake up.
- **ar-web:** Vercel, deployed manually via `vercel --prod` from the `ar-web/` folder (not auto-deployed from GitHub pushes — remember to redeploy after changes).
- **mobile-app:** currently runs via Expo Go for development. Not yet published to the App Store / Play Store — see Future Enhancements re: EAS Build.

---

## API Reference

Base URL: `https://ar-memories.onrender.com` (interactive docs at `/docs`)

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Create account (email, password, name) |
| POST | `/auth/login` | Get JWT access token |
| GET | `/auth/me` | Current user's profile |
| PATCH | `/auth/me` | Update display name |
| POST | `/auth/change-password` | Change password |
| POST | `/memories/` | Upload a memory (multipart: photo, video, caption) |
| GET | `/memories/` | List current user's memories |
| PATCH | `/memories/{id}` | Update a memory's caption |
| DELETE | `/memories/{id}` | Delete a memory |
| POST | `/memories/{id}/ask` | Ask a question about a memory (Q&A, backend only) |
| GET | `/health` | Health check |

Auth: Bearer token in the `Authorization` header for all routes except signup/login.

---

## Known Limitations

- **iOS camera-in-WebView:** Expo Go's bundled WebView doesn't support in-app camera access (`getUserMedia`), so on iOS the Scan feature opens the AR page in an in-app Safari sheet instead of embedding it directly. A custom EAS development build would fix this (compiles the app's own up-to-date WebView with full camera support) — free for Android, requires either a Mac + free Apple ID (7-day reinstall cycle) or a $99/year Apple Developer account for iOS device installs.
- **No phone-rotation handling** during AR scanning — the Scan camera view is portrait-only; rotating mid-scan is not gracefully handled.
- **Deleting a memory** removes its database rows but **not** the underlying photo/video/`.mind` files in Supabase Storage — these accumulate over time.
- **Render free tier cold starts** — first request after ~15 minutes of inactivity takes 30-60 seconds.
- **No automated tests** exist yet for the backend or mobile app.
- Video overlay uses the photo's real aspect ratio (read client-side before scanning), but very long videos (up to 60s/50MB, enforced at upload) can make the initial photo→camera "lock-on" less forgiving to hold steady for.

---

## Future Enhancements

Roughly in order of likely value:

1. **Wire up the "Ask about this memory" Q&A feature** in the mobile app / ar-web UI — fully built on the backend, currently has zero UI anywhere.
2. **Video playback in Home detail view** — let users watch a memory's video directly (no camera/AR needed) as a quick "relive it" option.
3. **Storage cleanup on delete** — remove the associated photo/video/`.mind` files from Supabase Storage when a memory is deleted, not just the DB rows.
4. **Automated tests** — mocked Gemini/subprocess calls, basic endpoint coverage for auth, memories, and Q&A.
5. **EAS custom dev client** — replaces Expo Go for testing, fixes iOS camera-in-WebView limitation, is a required step before publishing to the App Store/Play Store anyway.
6. **Custom app icon** — currently uses Expo's default icon.
7. **Haptic feedback** — on upload success, scan target-found, delete confirmation, etc.
8. **Phone rotation handling** during AR scan (currently portrait-only, explicitly deferred).
9. **Search/filter memories** on the Home tab as collections grow.
10. **Share a memory** — shareable link/QR so someone else could scan the same physical photo.
11. **Multiple photos per memory** — currently strictly one photo + one video per memory.
12. **Auto-redeploy `ar-web` from GitHub** instead of manual `vercel --prod` pushes.