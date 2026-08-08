export default function MindMapsPage() {
  const nodes = [
    { id: 'root', label: 'Get Fit', x: 50, y: 12, color: 'var(--accent)', ink: 'var(--accent-ink)' },
    { id: 'walk', label: 'Morning walk', x: 14, y: 42, color: 'var(--amber-tint)', ink: 'var(--amber)' },
    { id: 'water', label: 'Drink water', x: 82, y: 42, color: 'var(--teal-tint)', ink: 'var(--teal)' },
    { id: 'sleep', label: 'Sleep 8h', x: 45, y: 62, color: 'var(--accent-tint)', ink: 'var(--accent)' },
    { id: 'screens', label: 'No late screens', x: 30, y: 88, color: 'var(--coral-tint)', ink: 'var(--coral)' },
  ];
  const edges: [string, string][] = [
    ['root', 'walk'],
    ['root', 'water'],
    ['root', 'sleep'],
    ['sleep', 'screens'],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="font-display text-2xl">Mind maps</h1>
        <p className="text-sm text-text-muted">
          Break a goal into the habits that support it. This view is a preview — creating and editing your own maps
          is coming soon.
        </p>
      </div>

      <div className="relative aspect-[4/3] rounded-2xl border border-border bg-surface">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {edges.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={byId[a].x}
              y1={byId[a].y}
              x2={byId[b].x}
              y2={byId[b].y}
              stroke="var(--border)"
              strokeWidth={0.4}
            />
          ))}
        </svg>
        {nodes.map((n) => (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold shadow-sm"
            style={{ left: `${n.x}%`, top: `${n.y}%`, background: n.color, color: n.ink }}
          >
            {n.label}
          </div>
        ))}
      </div>
    </div>
  );
}
