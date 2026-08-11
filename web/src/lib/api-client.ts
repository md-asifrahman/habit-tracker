const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Wired up by the auth context. Kept as handlers rather than a direct import because the auth
 * context already imports this module.
 */
export interface AuthHandlers {
  getRefreshToken: () => string | null;
  onRefreshed: (auth: { accessToken: string; refreshToken: string }) => void;
  onRefreshFailed: () => void;
}

let authHandlers: AuthHandlers | null = null;

export function setAuthHandlers(handlers: AuthHandlers | null) {
  authHandlers = handlers;
}

/** The browser's zone, so the server agrees with the user about where one day ends. */
function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** One shared refresh, so a page firing several queries at once doesn't refresh several times. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = authHandlers?.getRefreshToken();
  if (!refreshToken) return false;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        authHandlers?.onRefreshFailed();
        return false;
      }
      const auth = await response.json();
      accessToken = auth.accessToken;
      authHandlers?.onRefreshed(auth);
      return true;
    } catch {
      // Network trouble is not an auth failure — don't sign the user out over it.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function send<T>(path: string, options: RequestInit): Promise<T> {
  const timeZone = browserTimeZone();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(timeZone ? { 'X-Time-Zone': timeZone } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: '' }));
    // An empty body is normal for 401/403, and fetch often leaves statusText blank — so fall
    // all the way through to something a person can actually read.
    const message = body.message || response.statusText || `Request failed (${response.status})`;
    throw new HttpError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await send<T>(path, options);
  } catch (error) {
    const isExpiredToken =
      error instanceof HttpError &&
      (error.status === 401 || error.status === 403) &&
      !path.startsWith('/auth/');
    if (!isExpiredToken) throw error;

    // Access tokens last 15 minutes; a tab is usually open much longer.
    const refreshed = await refreshAccessToken();
    if (!refreshed) throw error;
    return send<T>(path, options);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
