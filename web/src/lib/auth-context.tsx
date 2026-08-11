'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken, setAuthHandlers } from './api-client';
import { authApi } from './auth-api';

interface Session {
  email: string;
  name: string;
}

interface StoredAuth extends Session {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  session: Session | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'habittracker.session';

function readStored(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as StoredAuth) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ session: Session | null; isReady: boolean }>({
    session: null,
    isReady: false,
  });

  // Auth state lives in localStorage, which only exists on the client and isn't
  // part of the server-rendered HTML — this must run once after mount, before
  // any redirect decision is made. (The alternative, useSyncExternalStore, races
  // with Next's hydration correction here and fires a spurious redirect.)
  // Lets the API client renew an expired access token by itself. Tokens are good for 15
  // minutes, so without this a tab left open would start failing every request.
  useEffect(() => {
    setAuthHandlers({
      getRefreshToken: () => readStored()?.refreshToken ?? null,
      onRefreshed: (auth) => {
        const stored = readStored();
        if (stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, ...auth }));
        }
      },
      // Only when the refresh token itself is rejected — a network blip leaves you signed in.
      onRefreshFailed: () => {
        localStorage.removeItem(STORAGE_KEY);
        setAccessToken(null);
        setState({ session: null, isReady: true });
      },
    });
    return () => setAuthHandlers(null);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAuth;
      setAccessToken(parsed.accessToken);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ session: { email: parsed.email, name: parsed.name }, isReady: true });
    } else {
      setState((s) => ({ ...s, isReady: true }));
    }
  }, []);

  function persist(auth: StoredAuth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setAccessToken(auth.accessToken);
    setState({ session: { email: auth.email, name: auth.name }, isReady: true });
  }

  async function login(email: string, password: string) {
    const auth = await authApi.login({ email, password });
    persist(auth);
  }

  async function register(email: string, password: string, name: string) {
    const auth = await authApi.register({ email, password, name });
    persist(auth);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
    setState({ session: null, isReady: true });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth() {
  const { session, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !session) {
      router.replace('/login');
    }
  }, [isReady, session, router]);

  return { session, isReady };
}
