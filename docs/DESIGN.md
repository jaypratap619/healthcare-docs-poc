# Healthcare Document Management PoC (No Docker / No Redis)

## 1. Tech Stack and Architecture Choice

- Frontend: React (Vite) — fast dev server, simple state needs.
- Backend: Python Flask — lightweight REST APIs, simple file handling.
- DB: SQLite (local dev) — zero-setup relational DB.
- Storage: Local disk under `backend/storage/` — simple for PoC; paths never exposed.
- Auth: JWT (HS256) + bcrypt password hashing; patient scoping via `X-Patient-Id`.

Roles:

- `admin` (seeded: `admin@gmail.com`/`admin`) can access all documents.
- `user` sees only their own documents. Admin role is enforced per request.

High-level components:

- UI: Upload PDFs, list, download, delete; progress and messages.
- API: Validates PDFs, enforces max size 10MB, persists metadata.
- DB: Stores metadata only; binary files go to storage directory.
- File Storage: Streams downloads by document id, never returns real path.

Architecture Diagram (logical)
[Browser React] ⇄ [Flask API] ⇄ [SQLite]
⇵
[Local Storage]

## 2. Data Flow

- Upload: User logs in to obtain JWT → UI selects a PDF → POST multipart/form-data with Bearer token → Flask validates type/size → saves file to storage with UUID filename → inserts metadata (original name, stored name, size, mime, patient_id) → returns JSON.
- List: UI → GET documents with auth + `X-Patient-Id` → returns patient-scoped list.
- Download: UI opens `GET /api/documents/:id/download` → API authorizes and streams file with `download_name`.
- Delete: UI → DELETE by id → API authorizes → deletes file (if exists) and removes metadata.

Metadata and binary files are separate: DB holds metadata; disk holds binaries.

## 3. API Specification

Auth endpoints:

- POST `/api/auth/signup` JSON `{ email, password }` → 201
- POST `/api/auth/login` JSON `{ email, password }` → 200 `{ token, user }`

Misc endpoints:

- GET `/api/health` → `{ status: "ok" }`

Authenticated requests must include:

- Header: `Authorization: Bearer <JWT>`
- Header: `X-Patient-Id: <string>`

- POST `/api/documents/upload`

  - Content-Type: `multipart/form-data` with field `file` (PDF, ≤10MB)
  - 201 Response JSON: `{ id, patient_id, filename, size_bytes, content_type, created_at }`
  - Behavior: If `X-Patient-Id` header is omitted, backend defaults to current user id.
  - Constraint: Duplicate `original_filename` per user returns 409.

- GET `/api/documents`

  - 200 Response JSON: `[ { id, patient_id, filename, size_bytes, content_type, created_at }, ... ]`

- GET `/api/documents/:id/download`

  - 200: Streams binary PDF with `Content-Disposition: attachment; filename="<original>"`

- DELETE `/api/documents/:id`
  - 200 Response JSON: `{ status: "deleted" }`

Errors: JSON `{ error: string }` with appropriate status (400, 401, 403, 404, 410, 413).

## 4. Key Considerations

- Scalability: For 100k+ uploads, migrate storage to S3-compatible service; switch DB to Postgres with proper indexing; move to async workers for virus scan and thumbnails; add pagination to list API.
- File Storage: PoC uses local disk. In production, use object storage (S3) with private buckets and signed URLs.
- Error Handling: If disk file is missing but metadata exists, return 410 and optionally queue a repair task; validate input and handle size/type issues.
- Security: Mock auth for PoC; in production use JWT with scopes, TLS everywhere, per-tenant isolation, audit logging, and strict MIME and content sniffing.

Rate limiting and CSRF are not implemented in this PoC. For production, add gateway or app-level rate limiting and CSRF protections for state-changing endpoints where cookies are used.

## 5. CI/CD Pipeline (conceptual)

- Lint & Test: Python (pytest), frontend build check.
- Build: Create backend wheel and frontend static assets.
- Validate Artifacts: Run minimal smoke tests against ephemeral environment.
- Deploy: Not covered here (no Docker per constraint); would typically push to a staging environment first.

## 6. IaC Snippets

- Omitted per instruction (no Docker). In practice: a docker-compose would define API, frontend, and a Postgres service with a mounted volume for storage.

## 7. Design Justifications

- Storage approach: Local storage is simplest for PoC and keeps code focused on core flows; easily swappable to S3 by abstracting the save/load layer.
- HIPAA: Add full audit trails, encrypted storage at rest, key management (KMS), strict access controls, BAA with cloud vendor, PHI minimization, disaster recovery, WORM policies, comprehensive logging and monitoring, secure backups.
- Antivirus: Integrate a sidecar scanner (e.g., ClamAV) via async queue; API stores as quarantined, scan result promotes to available state; failed scans notify and auto-delete.
