import ContactSection from "@/components/ContactSection";

export default function ExtrasPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Extras</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          2026 Reading List
        </h1>
      </div>
      <p className="text-[1rem] leading-7 text-muted">
        A running list of what I’m reading this year.
      </p>

      <div className="space-y-8 border-t border-line pt-8">
        <div className="space-y-3">
          <h2 className="text-sm uppercase tracking-[0.3em] text-muted">
            Read this year
          </h2>
          <ul className="space-y-2 text-base text-muted">
            <li>Kafka on the Shore — Haruki Murakami</li>
            <li>The Catcher in the Rye — J.D. Salinger</li>
          </ul>
        </div>

        <div className="space-y-3 border-t border-line pt-6">
          <h2 className="text-sm uppercase tracking-[0.3em] text-muted">
            Currently reading
          </h2>
          <ul className="space-y-2 text-base text-muted">
            <li>1984 — George Orwell</li>
            <li>Crime and Punishment — Fyodor Dostoevsky</li>
          </ul>
        </div>

        <div className="space-y-3 border-t border-line pt-6">
          <h2 className="text-sm uppercase tracking-[0.3em] text-muted">
            Up next
          </h2>
          <ul className="space-y-2 text-base text-muted">
            <li>Norwegian Wood — Haruki Murakami</li>
            <li>The Bell Jar — Sylvia Plath</li>
            <li>The Alchemist — Paulo Coelho</li>
            <li>Never Let Me Go — Kazuo Ishiguro</li>
          </ul>
        </div>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-muted">
        Last updated: Jan 2026
      </p>
      <ContactSection />
    </section>
  );
}
