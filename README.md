# REY Corporate Group CMS

Multi-company email & marketing platform for **REY Corporate Group** and subsidiaries  
(Rey Homes, Rey Properties, Sandstone Constructions, Stonegrove Homes, Rigid Landscaping, After Build Solutions, Alpha Investment).

| Layer | Stack |
|-------|--------|
| **Backend** | Django 5 · Django REST Framework · JWT · Celery (optional) · GSuite / SMTP |
| **Frontend** | Next.js 14 · React · Tailwind · React Query |
| **Deploy** | API → [Render](https://render.com) · UI → [Vercel](https://vercel.com) |

---

## Table of contents

1. [Features](#features)
2. [Local setup (full)](#1-local-setup-full)
3. [Live template customisation](#2-live-template-customisation)
4. [Deploy backend on Render](#3-deploy-backend-on-render)
5. [Deploy frontend on Vercel](#4-deploy-frontend-on-vercel)
6. [Post-deploy checklist](#5-post-deploy-checklist)
7. [Daily usage](#6-daily-usage)
8. [Environment variables](#7-environment-variables)
9. [Troubleshooting](#8-troubleshooting)

---

## Features

- Multi-company hierarchy (parent + subsidiaries) with **per-brand logos** from [reycorp.com.au](https://www.reycorp.com.au)
- **Compose company switch** automatically updates logo, colours, footer and CTA URLs (one shared template engine for the whole REY Corporate Group — no duplicated templates per subsidiary)
- Email footers: `{Company} — A Part of the REY Corporate Group.`
- **Template Builder** — live preview; every edit (copy, colours, header/footer logos) updates the preview instantly
- Compose / bulk send with recipient select-all, company filter, saved templates
- Smart Excel/CSV import (auto column detection)
- Subscribe / unsubscribe (admin + one-click from email)
- Campaign delivery logs (sent / failed / opens / clicks)
- Companies, subscribers, templates — full CRUD
- JWT auth · Australia-oriented defaults · GSuite SMTP ready

---

## 1. Local setup (full)

### Requirements

- **Python 3.11+** (3.12 recommended)
- **Node.js 18+** and npm
- **Git**
- Optional for fast bulk send: **Redis** + Celery worker

### 1.1 Clone / unzip

```bash
# If using the zip package:
unzip rey-cms-final.zip
cd rey-cms
```

### 1.2 Backend

```bash
cd backend

# Virtualenv (macOS / Linux)
python3 -m venv .venv
source .venv/bin/activate

# Windows
# py -3 -m venv .venv
# .venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env
```

Edit **`backend/.env`** (minimum for local):

```env
SECRET_KEY=dev-change-me-to-something-long
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# GSuite / Google Workspace (App Password required)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@reycorp.com.au
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=REY Corporate Group <noreply@reycorp.com.au>
```

For local testing **without** real email, you can use console backend:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Then migrate and seed:

```bash
python manage.py migrate
python manage.py seed_rey_companies      # companies + official logo URLs
python manage.py fix_brand_footers       # optional: standard footers
python manage.py seed_admins             # default logins
python manage.py seed_templates          # starter email templates
# optional:
python manage.py createsuperuser

python manage.py runserver
```

API: **http://127.0.0.1:8000**  
Admin: **http://127.0.0.1:8000/admin/**  
API docs: **http://127.0.0.1:8000/api/docs/**

**Default logins** (after `seed_admins`):

| Email | Password |
|-------|----------|
| `admin@reycorp.com.au` | `ReyCorp@2026!` |
| `admin@reyhomes.com.au` | `ReyHomes@2026!` |

### 1.3 Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

**`frontend/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

```bash
npm run dev
```

UI: **http://localhost:3000**  
Login with a seeded admin account.

### 1.4 Optional — Redis + Celery (fast bulk send)

```bash
# Terminal A
redis-server

# Terminal B (backend venv active)
cd backend
celery -A config worker -l info --concurrency=2

# Terminal C — already running: python manage.py runserver
# Terminal D — already running: npm run dev
```

Without Redis/Celery, Compose still queues work; sends may run synchronously or stay pending until a worker is available (see `BULK_SEND.md`).

---

## 2. Live template customisation

Every change in the **Template Builder** is reflected in the **live preview** on the right (or below on mobile).

| What you edit | Live result |
|---------------|-------------|
| Subject, eyebrow, heading, body | Updates immediately |
| Header / footer **logo upload** (local file) | Preview uses the image at once |
| Header / footer **background colours** | Preview colours update |
| Logo **width** (px) | Image size updates |
| Brand **footer line** | Footer text updates |
| Primary button text / URL | CTA updates |
| Company selector | Name + default footer / colours follow company |

**Recommended workflow**

1. Open **Email Templates → New Template** (or **Edit**).
2. Select **company** (loads brand footer + colours).
3. Upload **header logo** and optional **footer logo** (or rely on seeded `reycorp.com.au` URLs).
4. Edit copy with merge tags: `{{ full_name }}`, `{{ company.name }}`, `{{ first_name }}`.
5. Watch the preview; when happy, **Save**.
6. In **Compose**, pick that **saved template**, select subscribers, **Send**.

Official logos (seeded):

| Company | URL |
|---------|-----|
| REY Corporate Group | `https://www.reycorp.com.au/Rey-Corp-Group.png` |
| Rey Homes | `https://www.reycorp.com.au/logos/rey-homes.png` |
| Rey Properties | `https://www.reycorp.com.au/logos/rey-properties.png` |
| Sandstone | `https://www.reycorp.com.au/logos/sandstone.svg` |
| Stonegrove Homes | `https://www.reycorp.com.au/logos/stone-grove-homes.png` |
| Rigid Landscaping | `https://www.reycorp.com.au/logos/rigid-landscaping.png` |
| After Build Solutions | `https://www.reycorp.com.au/logos/after-build-solutions.png` |

---

## 3. Deploy backend on Render

### 3.1 Create services

1. Push this repo to **GitHub** (or GitLab).
2. In [Render Dashboard](https://dashboard.render.com) → **New → Blueprint** (uses `backend/render.yaml`)  
   **or** create manually:

| Service | Type | Notes |
|---------|------|--------|
| `rey-cms-api` | Web service | Python, root dir `backend` |
| `rey-cms-db` | PostgreSQL | Starter or higher |
| `rey-cms-redis` | Redis | Optional but recommended for bulk send |
| `rey-cms-worker` | Background worker | Same repo, Celery (optional) |

### 3.2 Web service settings

- **Root directory:** `backend`
- **Runtime:** Python 3.12
- **Build command:**

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

- **Start command:**

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
```

### 3.3 Environment variables (Render)

| Key | Value |
|-----|--------|
| `SECRET_KEY` | Generate (Render can auto-generate) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.onrender.com` and your custom API domain if any |
| `DATABASE_URL` | From Render Postgres (auto-linked) |
| `REDIS_URL` | From Render Redis (if used) |
| `CORS_ALLOWED_ORIGINS` | `https://YOUR-APP.vercel.app` (and preview URLs if needed) |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_HOST_USER` | `noreply@reycorp.com.au` |
| `EMAIL_HOST_PASSWORD` | Google **App Password** |
| `DEFAULT_FROM_EMAIL` | `REY Corporate Group <noreply@reycorp.com.au>` |

### 3.4 One-time seed on Render

Use **Shell** on the web service:

```bash
python manage.py seed_rey_companies
python manage.py seed_admins
python manage.py seed_templates
python manage.py fix_brand_footers
```

### 3.5 Celery worker (optional)

- **Start command:** `celery -A config worker -l info --concurrency=2`
- Same env as the web service (`DATABASE_URL`, `REDIS_URL`, email vars).

API example: `https://rey-cms-api.onrender.com/api/health/` (or your service URL).

---

## 4. Deploy frontend on Vercel

1. [Vercel](https://vercel.com) → **Add New Project** → import the same GitHub repo.
2. **Root directory:** `frontend`
3. **Framework preset:** Next.js (auto)
4. **Build command:** `npm run build` (default)
5. **Output:** default `.next`

### Environment variables (Vercel)

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

**Important:** no trailing slash issues — base must end with `/api` to match the Django routes.

Deploy. Your UI will be e.g. `https://rey-cms.vercel.app`.

### CORS

On Render, set:

```env
CORS_ALLOWED_ORIGINS=https://rey-cms.vercel.app,https://*.vercel.app
```

(If your Django settings only allow exact origins, list each preview URL or your production domain only.)

### Media / logos in production

- Seeded logos load from **reycorp.com.au** (public HTTPS) — fine for email clients.
- Uploaded logos are stored under `MEDIA_ROOT` on Render’s disk (ephemeral on free tier). For production, use **S3 / Cloudflare R2** or re-upload after redeploys. Configure `DEFAULT_FILE_STORAGE` when you move to object storage.

---

## 5. Post-deploy checklist

- [ ] Open Vercel URL → **Login** with seeded admin  
- [ ] **Companies** show logos from reycorp.com.au  
- [ ] **Templates → Builder** — edit text/logo/colour → preview updates live → **Save**  
- [ ] **Subscribers** — import sample CSV from `samples/`  
- [ ] **Compose** — select company, saved template, recipients → Send (or console email in DEBUG)  
- [ ] **Campaigns & Logs** — open a campaign → recipient + event log  
- [ ] Send a real test to yourself with GSuite App Password set  

---

## 6. Daily usage

```text
Subscribers  →  Import Excel / Add contacts
     ↓
Templates    →  Design with live preview + logos
     ↓
Compose      →  Company + saved template + select recipients → Send
     ↓
Campaigns    →  Delivery log, opens, unsubscribes
```

- **Unsubscribe** from email: `/unsubscribe/{token}/`  
- **Public subscribe API:** `POST /api/subscribers/subscribe/`  

---

## 7. Environment variables

### Backend (`backend/.env`)

| Variable | Local example | Production |
|----------|---------------|------------|
| `SECRET_KEY` | any long string | strong random |
| `DEBUG` | `True` | `False` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | `.onrender.com` |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | Render Postgres URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Render Redis URL |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Vercel URL(s) |
| `EMAIL_*` | GSuite or console | GSuite / SendGrid |

### Frontend (`frontend/.env.local`)

| Variable | Local | Production |
|----------|-------|------------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` | `https://….onrender.com/api` |

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend build: `import csv` / Django in `.tsx` | Wrong file in `app/subscribers/page.tsx` — must start with `"use client"` |
| `ModuleNotFoundError: celery` | Install requirements, or use optional Celery stub; Redis worker optional |
| API 401 on all requests | Login again; JWT in `localStorage`; check `NEXT_PUBLIC_API_URL` |
| CORS errors in browser | Add exact frontend origin to `CORS_ALLOWED_ORIGINS` |
| Logos missing in email | Run `seed_rey_companies`; confirm `external_logo_url`; Gmail needs public HTTPS URLs |
| SMTP auth failed | Use Google **App Password**, not account password; enable 2FA |
| Migrations / missing tables | `python manage.py migrate` then seed commands |
| `python` not found on Mac | Use `python3` / `python3 -m venv .venv` |
| Preview not updating | Hard-refresh; ensure Builder state updates (logo width, colours, body) |

---

## Project layout

```text
rey-cms/
├── README.md                 ← this guide
├── SETUP_LOCAL.md            ← short local notes
├── BULK_SEND.md              ← Celery bulk send
├── samples/                  ← example subscriber CSVs
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── render.yaml
│   ├── .env.example
│   ├── config/               ← settings, urls, celery, wsgi
│   └── apps/
│       ├── companies/        ← brands, logos, seed
│       ├── subscribers/      ← import, subscribe
│       ├── templates_app/    ← templates + logo upload API
│       ├── newsletters/      ← campaigns, send, tracking
│       ├── enquiries/
│       └── core/
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── app/(admin)/      ← dashboard, compose, templates, …
        ├── app/(auth)/login/
        ├── components/
        └── lib/              ← api.ts, buildLuxuryEmail.ts, emailTemplates.ts
```

---

## Support contacts (product)

- Group site: [reycorp.com.au](https://www.reycorp.com.au/)  
- Head office: 3/39 Memorial Ave, Liverpool NSW 2170  

---

**REY CMS** — local → Render API → Vercel UI · live template preview on every edit.
