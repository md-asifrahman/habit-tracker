import Constants from 'expo-constants';

/**
 * Release builds must talk to an HTTPS API. Over plain HTTP everything here — the password on
 * sign-in, the bearer token on every later call — travels in the clear, readable by anyone on
 * the same coffee-shop Wi-Fi.
 *
 * A release build without a usable HTTPS URL doesn't fail: it runs with no backend at all, which
 * is a perfectly good state for this app — challenges, reminders and reports are all local. Only
 * the optional account/sync features switch off. Set EXPO_PUBLIC_API_BASE_URL to turn them on.
 */
function resolveApiBaseUrl(): string | null {
  const configured =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
    'http://localhost:8080/api';

  if (!__DEV__ && !configured.startsWith('https://')) {
    console.warn(
      `Ignoring non-HTTPS API URL in a release build: ${configured}. ` +
        'Accounts and sync are disabled; everything stays on this device.',
    );
    return null;
  }
  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

/** False when this build has no usable server — the app is then purely local. */
export function isBackendConfigured(): boolean {
  return API_BASE_URL !== null;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Wired up by the session store. The client can't import the store directly — the store already
 * imports this module — so the refresh plumbing is handed in instead.
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

/** The device's zone, so the server agrees with the phone about where one day ends. */
function deviceTimeZone(): string | null {
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

/** One shared refresh, so a burst of parallel 401s doesn't fire a burst of refreshes. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!API_BASE_URL) return false;
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
        // The refresh token itself is dead — only now is the user really signed out.
        authHandlers?.onRefreshFailed();
        return false;
      }
      const auth = await response.json();
      accessToken = auth.accessToken;
      authHandlers?.onRefreshed(auth);
      return true;
    } catch {
      // A network failure is not an auth failure — keep the session and try again later.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function send<T>(path: string, options: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new HttpError('This build has no server configured', 0);
  }
  const timeZone = deviceTimeZone();
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

    // Access tokens last 15 minutes; the app is open for far longer than that.
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
