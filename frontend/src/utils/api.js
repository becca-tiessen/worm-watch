// Thin wrapper around fetch() – points at your Express backend.
// In development this hits localhost:3000; in production, your Render URL.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getReports() {
  const res = await fetch(`${BASE_URL}/api/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function submitReport({ lat, lng, intensity, notes }) {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, intensity, notes: notes || null }),
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
