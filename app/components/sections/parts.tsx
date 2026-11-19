// Small pieces shared by the section contents

export function SubHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-2xl font-bold uppercase tracking-wide">
      {children}
    </h2>
  );
}

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-bg-raised/40 px-3 py-2.5">
          <dd className="font-display text-3xl font-bold leading-none text-gold">{item.value}</dd>
          <dt className="mt-1 text-xs leading-snug text-ink-soft">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function Chips({ items, label }: { items: string[]; label: string }) {
  return (
    <ul role="list" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="chip">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ExternalLink({ href, children, className = "link" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12 12 4M6 4h6v6" />
    </svg>
  );
}
