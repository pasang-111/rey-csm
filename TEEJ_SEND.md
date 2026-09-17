# Teej Mahotsav 2026 – Thank You Email (ready to send)

## What is pre-loaded

- **Compose** opens on **Thank You – Event** by default
- Subject, eyebrow, heading and full body text are the Teej Mahotsav 2026 letter
- Luxury HTML template with:
  - Clear **From:** `Rey Corporate Group <…>`
  - Clear **To:** `Recipient Name <email>`
  - Promoted CTA → www.reycorp.com.au
  - Subscribe / Unsubscribe in body + footer

## Run & send

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or your usual env
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_rey_companies   # if available
python manage.py seed_templates       # loads Teej thank_you_event into DB
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Send the Teej email
1. Open **http://localhost:3000** (or your frontend URL) → log in → **Compose**
2. Template should already be **Thank You – Event** with Teej content
3. Select **Rey Corporate Group** as company (or Send as parent)
4. Select recipients (or “All matching”)
5. Check live preview
6. Click **Send**

## Content reference (plain text)

Subject: Thank you for celebrating Teej Mahotsav 2026 with Rey Corporate Group

Body starts: “Thank you for being part of Teej Mahotsav 2026 in Burwood…”

CTA button: VISIT REY CORPORATE GROUP → https://www.reycorp.com.au
