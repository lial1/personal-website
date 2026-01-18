"use client";

import { useState } from "react";

export default function ContactSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("liali5385work@gmail.com");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="border-t border-line pt-10">
      <h2 className="font-display text-2xl text-ink">Contact</h2>
      <ul className="mt-3 space-y-2 text-base text-muted">
        <li className="flex flex-wrap items-center gap-2">
          <span aria-hidden>•</span>
          <span>Reach me at</span>
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded bg-[#f2f2f2] px-2 py-1 text-sm text-ink underline decoration-transparent decoration-2 underline-offset-2 transition hover:decoration-ink"
              aria-label="Copy email address to clipboard"
            >
              liali5385work@gmail.com
            </button>
            <span
              className={`rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.25em] text-link transition-opacity ${
                copied ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={!copied}
            >
              Copied
            </span>
          </span>
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span aria-hidden>•</span>
          <span>Connect with me on</span>
          <a
            className="underline decoration-accent-2 decoration-2 underline-offset-4"
            href="https://www.linkedin.com/in/liali1"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </li>
      </ul>
    </section>
  );
}
