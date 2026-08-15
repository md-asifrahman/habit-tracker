import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="h-8 w-8 rounded-xl bg-accent" />
      <h1 className="font-display text-3xl">Daily Challenge Tracker</h1>
      <p className="max-w-md text-text-muted">
        Pick how many days. List what you&apos;ll do daily. Tick it off each night and watch the
        percentage build.
      </p>
      <Link href="/login" className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-ink">
        Get started
      </Link>
    </main>
  );
}
