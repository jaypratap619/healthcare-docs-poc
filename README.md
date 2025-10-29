# Healthcare Docs PoC (Flask + SQLite + React)

No Redis, no Docker (per instructions). Admin user is auto-seeded.

## Prerequisites

- Python 3.10+
- Node.js 18+

## Backend Setup

```bash
cd backend
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Windows (CMD): .venv\Scripts\activate
pip install -r requirements.txt
python -c "from backend.app import create_app; app=create_app(); print('DB ready')"
python -m flask --app backend.app run
```

- API runs on http://localhost:5000
- Files stored under `backend/storage/`
- Health check: `GET /api/health` → `{ "status": "ok" }`
- Default admin (seeded): email `admin@gmail.com`, password `admin`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- UI on http://localhost:5173 (dev server proxies `/api` to backend)

## Auth and Patient Scope

1) Sign up and log in to obtain a JWT
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Passw0rd!"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Passw0rd!"}'
# => { "token": "<JWT>", "user": { ... } }
```

2) Use headers for protected requests
- `Authorization: Bearer <JWT>`
- `X-Patient-Id: patient-123` (frontend uses a demo value). If omitted on upload, backend defaults patient id to the current user id.

## cURL Examples

```bash
# List (admin sees all, regular users see only their own; optional patient filter)
curl -H "Authorization: Bearer $TOKEN" -H "X-Patient-Id: patient-123" http://localhost:5000/api/documents

# Upload (PDF only; duplicate filename per user is rejected with 409)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "X-Patient-Id: patient-123" \
  -F file=@sample.pdf http://localhost:5000/api/documents/upload

# Download (replace :id)
curl -L -H "Authorization: Bearer $TOKEN" -H "X-Patient-Id: patient-123" \
  http://localhost:5000/api/documents/1/download --output out.pdf

# Delete
curl -X DELETE -H "Authorization: Bearer $TOKEN" -H "X-Patient-Id: patient-123" \
  http://localhost:5000/api/documents/1
```

## Tests

Frontend (Jest + Testing Library):
```bash
cd frontend
npm test
```

Backend tests removed per request.

## Deployment

Minimal, Docker-less deployment suggestion:

- Backend (Flask) on Render
  1. Commit and push this repo to GitHub.
  2. Create a new Web Service in Render, connect the repo, set Root Directory to `backend`.
  3. Environment: Python 3.11; Build Command: `pip install -r requirements.txt`.
  4. Start Command: `gunicorn backend.app:create_app()`.
  5. Add Environment Variables:
     - `SECRET_KEY` (generate a strong random string)
     - Optionally `FLASK_ENV=production`
  6. Create a persistent disk and mount to `/opt/render/project/src/backend/storage` if you need durable files.

- Frontend (Vite) on Netlify or Vercel
  - Build Command: `npm run build`
  - Publish Directory: `frontend/dist`
  - Set `NODE_VERSION` to 18 or higher
  - Configure API URL in frontend when deploying (set a `VITE_API_BASE` and use it in fetch calls or create a Netlify/Vercel rewrite proxy to your backend).

## Git Quickstart

```bash
git init
git add .
git commit -m "Initial commit: healthcare-docs-poc"
git branch -M main
git remote add origin <your-git-remote-url>
git push -u origin main
```

## Assumptions

- JWT auth via bcrypt-hashed users (no roles or refresh tokens in PoC).
- SQLite for local dev; easy to swap to Postgres.
- PDF validation based on MIME and extension; deep content sniffing can be added.

## Design Document

See `docs/DESIGN.md`.
