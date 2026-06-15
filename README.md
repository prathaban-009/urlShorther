# ⚡ LinkZap — URL Shortener with Analytics

> **Built & Designed with ♥ by [Yashiladevi](mailto:yashiladevi09@gmail.com)**  
> Contact: yashiladevi09@gmail.com

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Live Features](#live-features)
3. [Tech Stack](#tech-stack)
4. [Architecture Flow](#architecture-flow)
5. [Database Design](#database-design)
6. [Project Structure](#project-structure)
7. [How to Run (Step by Step)](#how-to-run-step-by-step)
8. [API Reference](#api-reference)
9. [Environment Variables](#environment-variables)

---

## Overview

**LinkZap** is a full-stack URL shortener application with real-time analytics. Users can create branded short links, track every click, view device/browser/country breakdowns, and download QR codes — all from a sleek dark-mode dashboard.

---

## Live Features

### ✅ Mandatory
| Feature | Details |
|---------|---------|
| User Authentication | Signup/Login with JWT + bcrypt password hashing |
| Protected Routes | Dashboard only accessible when logged in |
| URL Shortening | Unique 6-char alphanumeric short codes |
| Short URL Redirect | `GET /:shortCode` → 301 redirect to original URL |
| URL Validation | Frontend + backend validation |
| Dashboard | View all links, total clicks, creation date |
| Delete URLs | One-click delete with confirmation |
| Copy to Clipboard | Animated copy button |
| Analytics | Clicks, last visited, visit history table |

### ⭐ Bonus
| Feature | Details |
|---------|---------|
| Custom Aliases | Choose your own short code (e.g. `/my-campaign`) |
| QR Code | Preview + Download PNG — modal with image |
| Link Expiry | Set expiry date; expired links show 410 page |
| Device Analytics | Desktop / Mobile / Tablet tracking |
| Browser Analytics | Chrome, Firefox, Safari etc. |
| Country Tracking | IP geolocation via ip-api.com (async) |
| Click Trend Chart | Area chart — last 30 days |
| Device Pie Chart | Recharts PieChart breakdown |
| Edit Destination | Change original URL without breaking short link |
| Bulk CSV Upload | Upload CSV of URLs to shorten in one go |
| Search & Filter | Live search across dashboard links |
| Pagination | Server-side pagination |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite, React Router v6 |
| **Styling** | Vanilla CSS — custom dark-mode design system |
| **Charts** | Recharts (AreaChart, PieChart) |
| **Icons** | Lucide React |
| **HTTP Client** | Axios with JWT interceptors |
| **Notifications** | React Hot Toast |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL 18 |
| **Auth** | JWT (jsonwebtoken) + bcrypt (12 salt rounds) |
| **QR Codes** | `qrcode` npm package |
| **User-Agent** | `ua-parser-js` for device/browser detection |
| **File Upload** | Multer + csv-parser (bulk CSV) |
| **Dev Tools** | Nodemon |

---

## Architecture Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                           │
│                                                                  │
│  Landing Page ──► Register/Login ──► Dashboard ──► Analytics    │
│                        │                 │              │        │
│                    AuthContext      urlsAPI.js      urlsAPI.js   │
│                   (JWT stored)     Axios + JWT     Axios + JWT   │
└──────────────────────────┬───────────────┬──────────────┬───────┘
                           │               │              │
                    HTTP REST API   HTTP REST API   HTTP REST API
                           │               │              │
┌──────────────────────────▼───────────────▼──────────────▼───────┐
│                    EXPRESS SERVER (Port 3001)                     │
│                                                                  │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  /api/auth/*   │  │  /api/urls/*    │  │  /:shortCode     │  │
│  │  ─────────     │  │  ─────────      │  │  ─────────────   │  │
│  │  POST /register│  │  POST  / create │  │  GET redirect    │  │
│  │  POST /login   │  │  GET   / list   │  │  → 301 redirect  │  │
│  │  GET  /me      │  │  PATCH / update │  │  + async track   │  │
│  └────────┬───────┘  │  DELETE/ delete │  └──────┬───────────┘  │
│           │          │  GET  /:id/qr   │          │              │
│    ┌──────▼──────┐   │  GET  /analytics│          │              │
│    │ JWT verify  │   │  POST /bulk     │          │              │
│    │ middleware  │   └────────┬────────┘          │              │
│    └─────────────┘            │                   │              │
│                               │                   │              │
└───────────────────────────────┼───────────────────┼─────────────┘
                                │                   │
┌───────────────────────────────▼───────────────────▼─────────────┐
│                      POSTGRESQL DATABASE                          │
│                                                                  │
│   ┌──────────┐       ┌──────────────┐       ┌─────────────────┐ │
│   │  users   │──1:N──│     urls     │──1:N──│    analytics    │ │
│   └──────────┘       └──────────────┘       └─────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  ip-api.com (async)  │
                    │  Geo IP lookup       │
                    └──────────────────────┘
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│               users                 │
├──────────────┬──────────────────────┤
│ id           │ UUID (PK)            │
│ email        │ VARCHAR(255) UNIQUE  │
│ password_hash│ VARCHAR(255)         │
│ name         │ VARCHAR(255)         │
│ created_at   │ TIMESTAMPTZ          │
│ updated_at   │ TIMESTAMPTZ          │
└──────────────┴──────────────────────┘
        │ 1
        │
        │ N
┌─────────────────────────────────────┐
│                urls                 │
├──────────────┬──────────────────────┤
│ id           │ UUID (PK)            │
│ user_id      │ UUID (FK → users.id) │
│ original_url │ TEXT                 │
│ short_code   │ VARCHAR(20) UNIQUE   │
│ custom_alias │ VARCHAR(50) UNIQUE   │
│ title        │ VARCHAR(500)         │
│ expires_at   │ TIMESTAMPTZ          │
│ is_active    │ BOOLEAN DEFAULT true │
│ created_at   │ TIMESTAMPTZ          │
│ updated_at   │ TIMESTAMPTZ          │
└──────────────┴──────────────────────┘
        │ 1
        │
        │ N
┌─────────────────────────────────────┐
│             analytics               │
├──────────────┬──────────────────────┤
│ id           │ UUID (PK)            │
│ url_id       │ UUID (FK → urls.id)  │
│ visited_at   │ TIMESTAMPTZ          │
│ ip_address   │ VARCHAR(45)          │
│ user_agent   │ TEXT                 │
│ referrer     │ TEXT                 │
│ country      │ VARCHAR(100)         │
│ city         │ VARCHAR(100)         │
│ device_type  │ VARCHAR(50)          │
│ browser      │ VARCHAR(100)         │
│ os           │ VARCHAR(100)         │
└──────────────┴──────────────────────┘
```

### Indexes
```sql
idx_urls_user_id       ON urls(user_id)
idx_urls_short_code    ON urls(short_code)
idx_urls_custom_alias  ON urls(custom_alias) WHERE custom_alias IS NOT NULL
idx_analytics_url_id   ON analytics(url_id)
idx_analytics_visited  ON analytics(visited_at)
```

---

## Project Structure

```
UrlShortner/
│
├── .gitignore                     # Git ignore rules
├── README.md                      # This file
│
├── client/                        # React Frontend (Vite)
│   ├── .env                       # Frontend env vars (not committed)
│   ├── .env.example               # Env template
│   ├── index.html                 # HTML entry + SEO meta tags
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx               # React DOM entry
│       ├── App.jsx                # Routes + Layout + Footer
│       ├── index.css              # Dark-mode design system (CSS vars)
│       │
│       ├── api/
│       │   └── client.js          # Axios instance + JWT interceptors
│       │
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state (login/logout/register)
│       │
│       ├── components/
│       │   ├── Navbar.jsx         # Top navigation with auth state
│       │   └── ProtectedRoute.jsx # Redirects unauthenticated users
│       │
│       └── pages/
│           ├── LandingPage.jsx    # Hero + inline URL shortener + features
│           ├── LoginPage.jsx      # Email + password login
│           ├── RegisterPage.jsx   # Signup with password strength indicator
│           ├── DashboardPage.jsx  # URL management + Create + Bulk upload
│           └── AnalyticsPage.jsx  # Charts + visit history for a URL
│
└── server/                        # Node.js / Express Backend
    ├── .env                       # Server env vars (not committed)
    ├── .env.example               # Env template
    ├── package.json
    └── src/
        ├── index.js               # Express app entry + middleware
        │
        ├── db/
        │   ├── pool.js            # PostgreSQL connection pool
        │   └── migrate.js         # Schema migration (run once)
        │
        ├── routes/
        │   ├── auth.js            # POST /register, /login · GET /me
        │   ├── urls.js            # Full URL CRUD + analytics + QR + bulk
        │   └── redirect.js        # GET /:shortCode → 301 + analytics
        │
        └── utils/
            ├── jwt.js             # Token generation + auth middleware
            └── shortCode.js       # Unique code generator + URL validator
```

---

## How to Run (Step by Step)

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) v14 or higher
- [Git](https://git-scm.com/)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

### Step 2 — Create the PostgreSQL Database

Open your PostgreSQL client (psql / pgAdmin / DBeaver) and run:

```sql
CREATE DATABASE urlshortener;
```

---

### Step 3 — Configure the Server Environment

```bash
cd server
copy .env.example .env
```

Open `server/.env` and update these values:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=urlshortener
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD   ← Change this

JWT_SECRET=pick_a_long_random_string_here   ← Change this
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
BASE_URL=http://localhost:3001
```

---

### Step 4 — Install Server Dependencies

```bash
# Still inside the server/ folder
npm install
```

---

### Step 5 — Run Database Migrations

```bash
npm run migrate
```

Expected output:
```
🔄 Running database migrations...

  → Drop old tables (if any)... ✅
  → Enable pgcrypto extension... ✅
  → Create users table... ✅
  → Create urls table... ✅
  → Create analytics table... ✅
  → Index: urls.user_id... ✅
  → Index: urls.short_code... ✅
  → Index: urls.custom_alias... ✅
  → Index: analytics.url_id... ✅
  → Index: analytics.visited_at... ✅

✅ All migrations completed successfully!
```

---

### Step 6 — Start the Backend Server

```bash
npm run dev
```

The server starts at: `http://localhost:3001`

Test it:
```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}
```

---

### Step 7 — Configure the Frontend Environment

Open a **new terminal** window:

```bash
cd client
copy .env.example .env      # Windows
# or
cp .env.example .env        # Mac/Linux
```

The default `client/.env` is:
```env
VITE_API_URL=http://localhost:3001/api
VITE_BASE_URL=http://localhost:3001
```

*(No changes needed for local development)*

---

### Step 8 — Install Frontend Dependencies

```bash
# Inside client/ folder
npm install
```

---

### Step 9 — Start the Frontend Dev Server

```bash
npm run dev
```

The app opens at: **http://localhost:5173**

---

### ✅ You're Live!

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| 🚀 Backend API | http://localhost:3001/api |
| 🔗 Short link redirect | http://localhost:3001/:shortCode |

---

### Quick Usage
1. Go to http://localhost:5173/register → Create an account
2. Go to Dashboard → Paste a long URL → Click **Shorten**
3. Copy the short link and visit it — it redirects + tracks the click
4. Click **📊** (Analytics) on any URL to see the charts

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | `{email, password, name}` | Create account |
| POST | `/api/auth/login` | ❌ | `{email, password}` | Login, get JWT |
| GET | `/api/auth/me` | ✅ | — | Get current user |

### URLs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/urls` | ✅ | Create short URL |
| GET | `/api/urls` | ✅ | List user's URLs (paginated) |
| GET | `/api/urls/:id` | ✅ | Get one URL |
| PATCH | `/api/urls/:id` | ✅ | Edit destination URL / title |
| DELETE | `/api/urls/:id` | ✅ | Delete URL |
| GET | `/api/urls/:id/analytics` | ✅ | Full analytics for a URL |
| GET | `/api/urls/:id/qr` | ✅ | QR code as PNG image |
| POST | `/api/urls/bulk` | ✅ | Bulk CSV upload |

### Redirect
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:shortCode` | ❌ | Redirect to original URL + track visit |

### CSV Bulk Upload Format
```csv
url,title,alias
https://google.com,Google,google
https://github.com,GitHub,gh
https://example.com/very/long/url,My Campaign,camp1
```

---

## Environment Variables

### server/.env
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `urlshortener` | Database name |
| `DB_USER` | `postgres` | DB username |
| `DB_PASSWORD` | — | **Required: your DB password** |
| `JWT_SECRET` | — | **Required: random secret string** |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `BASE_URL` | `http://localhost:3001` | Base URL for short links |

### client/.env
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |
| `VITE_BASE_URL` | `http://localhost:3001` | Base URL for short links |

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds) — never stored in plain text
- JWT tokens signed with a secret key from `.env` (7-day expiry)
- All mutations verify `user_id` ownership — users can only manage their own URLs
- SQL uses **parameterized queries** — no SQL injection risk
- Backend validation via `express-validator` on all inputs
- CORS restricted to `CLIENT_URL` from environment variable
- `.env` files are **never committed** to Git (excluded by `.gitignore`)

---

## License

MIT — Free to use, modify, and distribute.

---

*Built for Hackathon · © 2026 Yashiladevi · yashiladevi09@gmail.com*
