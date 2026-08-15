'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { TodayIcon, ChallengesIcon, SettingsIcon } from './icons';

const navItems = [
  { href: '/today', label: 'Today', icon: TodayIcon },
  { href: '/challenges', label: 'Challenges', icon: ChallengesIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-56 flex-none flex-col gap-7 border-r border-border bg-surface-2 p-5">
        <Link href="/today" className="flex items-center gap-2 px-1.5">
          <span className="h-5.5 w-5.5 rounded-md bg-accent" />
          <span className="font-display text-[15px]">Challenges</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold ${
                  active ? 'bg-accent-tint text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon className="h-[17px] w-[17px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        {session && (
          <div className="mt-auto rounded-xl bg-surface px-3 py-2.5 text-xs">
            <p className="font-bold text-text">{session.name}</p>
            <p className="truncate text-text-muted">{session.email}</p>
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
