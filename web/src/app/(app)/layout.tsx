'use client';

import { AppShell } from '@/components/AppShell';
import { useRequireAuth } from '@/lib/auth-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useRequireAuth();

  if (!isReady || !session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
