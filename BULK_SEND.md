# Bulk send (up to 400 subscribers)

Compose no longer sends emails inside the HTTP request.
It queues a Celery job and returns **202 Accepted** immediately.

## How to use

1. Open **Compose**
2. Choose template (e.g. Thank You – Event / Teej)
3. Select company (Rey Corporate Group)
4. Click **Select all matching** (or pick individuals)
5. Click **Send**

You should see: *Queued N email(s)… Sending in the background*

## Required processes

```bash
# 1. Redis
redis-server
# or: brew services start redis

# 2. Django API
cd backend && source venv/bin/activate
python manage.py runserver

# 3. Celery worker (required for actual delivery)
cd backend && source venv/bin/activate
celery -A config worker -l info --concurrency=2
```

Without the worker, the API still returns 202 but emails stay `pending` until a worker runs.

## Behaviour

| Step | What happens |
|------|----------------|
| API | Creates campaign + pending rows, enqueues task, returns 202 |
| Worker | Sends in batches of 40, reuses one SMTP connection per batch |
| Pause | ~1.5s between batches (rate-limit friendly) |
| Cap | Max 400 recipients per send |

## Check progress

Django admin → Newsletters, or API `GET /api/newsletters/{campaign_id}/`

Status: `queued` → `sending` → `sent`
