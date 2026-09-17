# Production Deployment Guide — REY CMS

**Frontend → Vercel** · **Backend → Render**  
Goal: zero `npm install` / Django failures.

---

## Prerequisites

- GitHub account (or GitLab / Bitbucket)
- [Vercel](https://vercel.com) account
- [Render](https://render.com) account
- Domain (optional) for custom URLs

---

## 1. Backend on Render (API + Postgres + Redis)

### 1.1 Push the repo

```bash
cd rey-cms
git init
git add .
git commit -m "Production ready REY CMS"
# Create empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/rey-cms.git
git push -u origin main
```

### 1.2 Create services on Render

**Option A — Blueprint (recommended)**

1. Render Dashboard → **New** → **Blueprint**
2. Connect the GitHub repo
3. Select `backend/render.yaml`
4. Render will create:
   - Web service `rey-cms-api`
   - Postgres `rey-cms-db`
   - Redis `rey-cms-redis`

**Option B — Manual**

1. **New PostgreSQL** → name `rey-cms-db` → create  
2. **New Redis** → name `rey-cms-redis` → create  
3. **New Web Service**
   - Root directory: `backend`
   - Runtime: Python 3
   - Build command:
     ```
     pip install --upgrade pip && pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput
     ```
   - Start command:
     ```
     gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
     ```

### 1.3 Environment variables (Web service)

| Key | Value |
|-----|--------|
| `SECRET_KEY` | Generate (or use Render generate) |
| `DEBUG` | `false` |
| `DATABASE_URL` | From Postgres service (connection string) |
| `REDIS_URL` | From Redis service |
| `ALLOWED_HOSTS` | `.onrender.com,your-api-domain.com` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:3000` |
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` (or anymail) |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_HOST_USER` | your GSuite / SMTP user |
| `EMAIL_HOST_PASSWORD` | App password |
| `DEFAULT_FROM_EMAIL` | `noreply@reycorp.com.au` |
| `PUBLIC_BASE_URL` | `https://rey-cms-api.onrender.com` (no trailing slash) |
| `PYTHON_VERSION` | `3.12.0` |

### 1.4 After first deploy

SSH / Shell on Render (or one-off job):

```bash
python manage.py createsuperuser
python manage.py seed_companies   # if available
python manage.py seed_templates
```

Copy the service URL, e.g. `https://rey-cms-api.onrender.com`.

**Health check:** open `https://YOUR-API.onrender.com/api/` or `/admin/`.

---

## 2. Frontend on Vercel

### 2.1 Import project

1. Vercel → **Add New** → **Project**
2. Import the same GitHub repo
3. **Root Directory** → set to `frontend`
4. Framework preset: **Next.js** (auto)
5. Install command (important for zero peer-deps issues):

   ```
   npm install --legacy-peer-deps
   ```

   (already set in `frontend/vercel.json`)

6. Build command: `npm run build` (default)
7. Environment variables:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://rey-cms-api.onrender.com/api` |

8. Deploy.

### 2.2 After deploy

- Update Render `CORS_ALLOWED_ORIGINS` to include your exact Vercel URL  
  (e.g. `https://rey-cms.vercel.app` or the generated `*.vercel.app`).
- Redeploy backend if you changed CORS.

---

## 3. Zero-bug checklist

### npm install

- Use Node 18 or 20 (Vercel default is fine).
- Always prefer `npm install --legacy-peer-deps` if you see peer dependency warnings with React 19 / Next 15.
- `package-lock.json` is committed — do **not** delete it.

### Django / Python

- `psycopg2-binary` is in `requirements.txt` → Postgres works on Render.
- `django-environ` reads `DATABASE_URL` automatically.
- `whitenoise` serves static files; no need for S3 for basic production.
- `DEBUG=false` + strong `SECRET_KEY` required.
- Migrations run in build command; if they fail, check `DATABASE_URL` is linked.

### Common fixes

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'psycopg2'` | Already fixed in this package |
| `npm ERR! peer dep` | Use `--legacy-peer-deps` |
| CORS blocked | Add exact Vercel origin to `CORS_ALLOWED_ORIGINS` |
| 502 on Render | Check logs; ensure `$PORT` binding and migrate succeeded |
| Static 404 | `collectstatic` ran; Whitenoise is enabled |

---

## 4. Local verification before deploy

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit SECRET_KEY, etc.
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install --legacy-peer-deps
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
npm run dev
```

Open http://localhost:3000 → login → **Compose** → switch company → logo, colours and footer update automatically.

---

## 5. Compose / branding behaviour (this release)

- Switching **Company** in Compose applies:
  - Header + footer logo (API upload → external URL → official CDN map)
  - Primary / secondary colours
  - Brand footer line (`X — A Part of the REY Corporate Group.`)
  - Website / CTA URLs
- **Send as parent** forces REY Corporate Group branding.
- Built-in luxury presets live in one place (`emailTemplates.ts` + `buildLuxuryEmail.ts`); company-specific saved templates are optional overlays, not duplicates of the same layout.

---

## Support

If a deploy step fails, copy the **exact build log line** and the env vars you set (redact secrets).


---

## 6. Subscribe / Unsubscribe (email links)

Emails include **Subscribe** and **Unsubscribe** links:

| Link | Behaviour |
|------|-----------|
| **Subscribe** | Opens `https://YOUR-API/subscribe/?company=slug` — public form that **registers or re-activates** the contact |
| **Unsubscribe** | Opens `https://YOUR-API/unsubscribe/<token>/` — one-click **removes** that recipient from the list |

- Template Builder → **List management** section controls whether the block is shown and the URL merge tags.
- Prefer keeping `{{ subscribe_url }}` and `{{ unsubscribe_url }}` so each send injects the correct live URLs.
- Set `PUBLIC_BASE_URL` on Render to your API origin (no trailing slash).

API (JSON) alternative for website forms: `POST /api/subscribers/subscribe/` with `company_slug`, `full_name`, `email`.
