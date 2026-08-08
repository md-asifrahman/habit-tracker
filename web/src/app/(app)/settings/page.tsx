'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { session, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="font-display text-2xl">Settings</h1>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Account</p>
        <p className="mt-2 text-sm font-bold">{session?.name}</p>
        <p className="text-sm text-text-muted">{session?.email}</p>
      </div>

      <button
        onClick={handleLogout}
        className="self-start rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-danger"
      >
        Sign out
      </button>
    </div>
  );
}
