// Small pieces shared by the section contents. Every section is built
// from these, so the gaps, text sizes and cards match from one section
// to the next. Their looks are the "Inside a section" rules in
// app/globals.css.

// A titled part of a section. A rule separates it from the part above.
export function Block({ title, id, children }: { title?: string; id?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className="part">
      {title && (
        <h2 id={id} className="part-title">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

// The highlighted numbers: "6,000+ companies screened"
export function Stats({ items }: { items: { value: string; label: string }[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="stats">
      {items.map((item) => (
        <div key={item.label} className="stat">
          <dd className="stat-value">{item.value}</dd>
          <dt className="stat-label">{item.label}</dt>
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

// A list of points. With `show`, only that many are on screen at first
// and the rest open with one click. `more` is the wording of that
// link, with {n} standing for the full count.
export function Bullets({ items, show, more }: { items: string[]; show?: number; more?: string }) {
  const first = show && items.length > show ? items.slice(0, show) : items;
  const rest = show && items.length > show ? items.slice(show) : [];
  const list = (lines: string[]) => (
    <ul className="bullets">
      {lines.map((line) => (
        <li key={line.slice(0, 40)}>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
  if (rest.length === 0) return list(first);
  return (
    <div className="grid gap-2">
      {list(first)}
      <details className="more">
        <summary>{(more ?? "Show all {n}").replace("{n}", String(items.length))}</summary>
        {list(rest)}
      </details>
    </div>
  );
}

// A line of my own, set large, with where it was published
export function Quote({ text, source }: { text: string; source: string }) {
  return (
    <figure className="quote">
      <blockquote>“{text}”</blockquote>
      <figcaption>{source}</figcaption>
    </figure>
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
