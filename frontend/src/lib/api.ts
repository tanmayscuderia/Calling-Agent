const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; query?: Record<string, string> } = {}
): Promise<T> {
  const url = new URL(API_BASE + path);
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  try {
    const res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'include', // ← Send httpOnly auth cookies
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    // Network error — backend not running or unreachable
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('BACKEND_UNREACHABLE');
    }
    throw err;
  }
}

export async function uploadCsv(file: File): Promise<any> {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch(`${API_BASE}/api/upload/properties-csv`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('BACKEND_UNREACHABLE');
    }
    throw err;
  }
}

export const apiBase = API_BASE;