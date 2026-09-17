# Local setup (short)

Full guide: see **[README.md](./README.md)**.

```bash
# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
python manage.py migrate
python manage.py seed_rey_companies && python manage.py seed_admins && python manage.py seed_templates
python manage.py runserver

# Frontend (new terminal)
cd frontend && npm install && cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
npm run dev
```

Login: http://localhost:3000 — `admin@reycorp.com.au` / `ReyCorp@2026!`

Template Builder: every edit (text, colours, logos) updates the **live preview** before you save.
