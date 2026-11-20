"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

// Tabs: a long section split into two or three parts, with one part on
// screen at a time. Used where a section ran to several screens of
// scrolling (Awards, In the News, Skills, an open project).
//
// It follows the usual keyboard pattern: Tab reaches the selected tab,
// the left and right arrows move between tabs, Home and End jump to the
// first and last. The parts that are not showing stay in the page, so a
// search engine and a screen reader's page search still find them.

export type TabItem = { id: string; title: string; content: ReactNode };

export default function Tabs({ label, tabs }: { label: string; tabs: TabItem[] }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0].id);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const go = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    setActive(next.id);
    buttons.current[next.id]?.focus();
  };

  const key = (e: KeyboardEvent) => {
    const at = tabs.findIndex((tab) => tab.id === active);
    if (e.key === "ArrowRight") go(at + 1);
    else if (e.key === "ArrowLeft") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(tabs.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} className="tabs-list" onKeyDown={key}>
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${base}-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className="tab"
            >
              {tab.title}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${base}-${tab.id}`} aria-labelledby={`${base}-${tab.id}-tab`} hidden={tab.id !== active} className="tab-panel">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
