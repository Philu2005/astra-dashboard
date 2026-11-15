// Utilities to handle a safe "returnTo" context across subpages without React Router

export function isSafeInternalPath(p: unknown): p is string {
  if (typeof p !== 'string') return false;
  if (!p.startsWith('/')) return false;
  if (p.startsWith('//')) return false; // protocol-relative external
  if (p.includes('://')) return false; // absolute external
  return true;
}

export function getReturnToFromUrl(url?: string, fallback: string = '/'): string {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(url ?? (typeof window !== 'undefined' ? window.location.href : '/'), base);
    const from = u.searchParams.get('from');
    return isSafeInternalPath(from) ? from : fallback;
  } catch {
    return fallback;
  }
}

export function withFrom(href: string, from: string): string {
  try {
    if (!isSafeInternalPath(href)) return '/';
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(href, base);
    if (isSafeInternalPath(from)) {
      u.searchParams.set('from', from);
    }
    const qs = u.searchParams.toString();
    return u.pathname + (qs ? `?${qs}` : '');
  } catch {
    return href;
  }
}
