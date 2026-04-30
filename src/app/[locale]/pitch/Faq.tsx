"use client";

import { useState, useId } from "react";

type Item = { q: string; a: string };

export function Faq({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const idBase = useId();

  return (
    <ul className="border-t border-[rgba(197,160,89,0.18)]">
      {items.map((item, i) => {
        const open = i === openIndex;
        const buttonId = `${idBase}-q-${i}`;
        const panelId = `${idBase}-a-${i}`;
        return (
          <li
            key={i}
            className="border-b border-[rgba(197,160,89,0.18)] transition-colors duration-300"
          >
            <button
              id={buttonId}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : i)}
              className="group flex w-full items-start gap-2 py-7 text-left transition-colors hover:bg-[rgba(197,160,89,0.04)]"
            >
              <span className="pitch-faq-marker pt-1">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span className="pitch-faq-q">{item.q}</span>
              <span
                aria-hidden
                className="ml-4 mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.32)] text-[var(--color-accent-gold)] transition-transform duration-500"
                style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pb-7 pl-[3.65rem] pr-12">
                  <p className="pitch-dropcap text-base leading-relaxed text-[#d4cabc] sm:text-lg">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
