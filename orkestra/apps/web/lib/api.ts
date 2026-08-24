const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_KEY = 'orkestra_access_token';

/**
 * The refresh token now lives ONLY in an httpOnly cookie set by the
 * backend (apps/api/src/auth/auth.controller.ts) — it is never readable
 * by JS, never stored here, and never sent as a request body field.
 * Every fetch below uses `credentials: 'include'` so the browser attaches
 * that cookie automatically on refresh calls. This is strictly simpler
 * than the old localStorage-token-pair approach, not just more secure.
 */

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_KEY);
}

export function isAuthed() {
  return !!getAccessToken();
}

const AUTH_LOST_EVENT = 'orkestra:auth-lost';

function announceAuthLost() {
  clearAccessToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_LOST_EVENT));
  }
}

export function onAuthLost(handler: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_LOST_EVENT, handler);
  return () => window.removeEventListener(AUTH_LOST_EVENT, handler);
}

let refreshInFlight: Promise<boolean> | null = null;

/** POSTs to /auth/refresh with credentials included — the browser sends
 *  the httpOnly cookie automatically; nothing here ever touches the
 *  refresh token's value. De-duped across concurrent 401s. */
async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (!data.accessToken) return false;
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // sends the refresh cookie where relevant (e.g. /auth/refresh, /auth/logout)
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options, true); // retry exactly once with the new access token
    }
    announceAuthLost();
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(body.message ?? 'Request failed.', res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; expiresIn: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
  productions: () => apiFetch('/productions'),
  production: (id: string) => apiFetch(`/productions/${id}`),
  createProduction: (data: Record<string, unknown>) =>
    apiFetch('/productions', { method: 'POST', body: JSON.stringify(data) }),
  startWorkflow: (productionId: string, brief?: string) =>
    apiFetch('/workflows/start', { method: 'POST', body: JSON.stringify({ productionId, brief }) }),
  workflow: (id: string) => apiFetch(`/workflows/${id}`),
  approvals: () => apiFetch('/approvals'),
  approve: (id: string) => apiFetch(`/approvals/${id}/approve`, { method: 'POST', body: '{}' }),
  reject: (id: string) => apiFetch(`/approvals/${id}/reject`, { method: 'POST', body: '{}' }),
  dashboard: () => apiFetch('/analytics/dashboard'),
  productionIntelligence: (genre?: string, budget?: number) => {
    const params = [];
    if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
    if (budget) params.push(`budget=${budget}`);
    const q = params.length > 0 ? `?${params.join('&')}` : '';
    return apiFetch(`/analytics/production-intelligence${q}`);
  },
  analyticsPerformance: () => apiFetch('/analytics/performance'),
  agents: () => apiFetch('/agents'),
  analyticsAgents: () => apiFetch('/analytics/agents'),
  notifications: () => apiFetch('/notifications'),
  markNotificationRead: (id: string) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  users: () => apiFetch('/users'),
  createUser: (data: Record<string, unknown>) =>
    apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  organization: (id: string) => apiFetch(`/organizations/${id}`),
  updateOrganization: (id: string, data: { name?: string; logoUrl?: string }) =>
    apiFetch(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
