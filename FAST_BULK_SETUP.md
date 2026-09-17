# Rey CMS – Fast bulk send (up to 500)

## One-time backend setup

```bash
cd rey-cms/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: EMAIL_* for real SMTP when ready

python manage.py migrate
python manage.py seed_rey_companies
python manage.py seed_admins
python manage.py seed_templates
```

## Every time you send bulk mail – 3 terminals

```bash
# Terminal A – Redis
redis-server
# macOS: brew services start redis

# Terminal B – API
cd rey-cms/backend && source venv/bin/activate
python manage.py runserver

# Terminal C – Celery worker (REQUIRED for speed)
cd rey-cms/backend && source venv/bin/activate
celery -A config worker -l info --concurrency=4
```

## Frontend

```bash
cd rey-cms/frontend
npm install
npm run dev
```

Login → Compose → Thank You Event (Teej) → Select all matching → Send.

API returns in ~1 second. Worker delivers in batches of 50.

## Speed settings (.env optional)

```
EMAIL_BATCH_SIZE=50
EMAIL_BATCH_PAUSE=0.6
```

For Gmail SMTP keep concurrency=2–4. For Amazon SES/Postmark you can use concurrency=4–8.

## Cap

Max **500** recipients per send (covers your ~458 Teej list in one click).
