'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/auth-api';

export default function SettingsPage() {
  const { session, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  // The remedy when the phone is the thing you lost: revoke from here instead.
  async function handleSignOutEverywhere() {
    if (
      !window.confirm(
        'Sign out on all devices? Every phone and browser signed into this account will be signed out.',
      )
    ) {
      return;
    }
    try {
      await authApi.logoutAll();
    } finally {
      logout();
      router.push('/login');
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="font-display text-2xl">Settings</h1>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Account</p>
        <p className="mt-2 text-sm font-bold">{session?.name}</p>
        <p className="text-sm text-text-muted">{session?.email}</p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handleLogout}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-danger"
        >
          Sign out
        </button>
        <button onClick={handleSignOutEverywhere} className="text-sm font-bold text-danger underline">
          Sign out on all devices
        </button>
        <p className="text-xs text-text-muted">
          Lost a phone? This immediately invalidates every saved sign-in for your account.
        </p>
      </div>
    </div>
  );
}
