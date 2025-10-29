let TOKEN = localStorage.getItem('token') || '';
export function setToken(t) {
  TOKEN = t; localStorage.setItem('token', t || '');
}
export function clearToken() {
  TOKEN = ''; localStorage.removeItem('token');
}
const PATIENT_ID = 'patient-123';

export async function listDocuments() {
  const res = await fetch('/api/documents', {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'X-Patient-Id': PATIENT_ID,
    },
  });
  if (!res.ok) throw new Error('Failed to list documents');
  return res.json();
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'X-Patient-Id': PATIENT_ID,
    },
    body: form,
  });
  if (res.status === 409) {
    // Duplicate filename per user
    throw new Error('Already uploaded');
  }
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j.error || 'Upload failed');
    } catch (_) {
      throw new Error('Upload failed');
    }
  }
  return res.json();
}

export function downloadUrl(id) {
  return `/api/documents/${id}/download`;
}

export async function deleteDocument(id) {
  const res = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'X-Patient-Id': PATIENT_ID,
    },
  });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

export async function signup(email, password) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function downloadDocumentFile(id) {
  const res = await fetch(`/api/documents/${id}/download`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'X-Patient-Id': PATIENT_ID,
    },
  });
  if (!res.ok) throw new Error('Failed to download');
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  let filename = 'document.pdf';
  const match = cd.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) filename = match[1];
  return { blob, filename };
}


