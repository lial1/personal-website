"use client";

import { useState } from "react";

export default function ContactSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("Website contact");
    const body = encodeURIComponent(`From: ${email}\n\n${message}`);
    window.location.href = `mailto:liali5385work@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="border-t border-line pt-16 pb-28">
      <div className="max-w-2xl text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Contact</p>
        <h2 className="mt-3 font-display text-3xl text-ink">Contact Me</h2>
        <p className="mt-3 text-sm text-muted">
          Feel free to contact me at{" "}
          <a
            href="mailto:liali5385work@gmail.com"
            className="underline decoration-accent-2 decoration-2 underline-offset-4"
          >
            liali5385work@gmail.com
          </a>{" "}
          or submit the form below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex max-w-2xl flex-col gap-4"
      >
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          className="rounded-xl border border-line bg-[#f7f7f7] px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
        />
        <textarea
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Your message"
          required
          rows={8}
          className="min-h-[230px] rounded-xl border border-line bg-[#f7f7f7] px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          className="mt-2 w-fit rounded-full border border-[#0b1b2b] bg-[#0b1b2b] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(12,24,44,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(12,24,44,0.22)]"
        >
          Send message
        </button>
      </form>
    </section>
  );
}
