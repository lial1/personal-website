import ContactSection from "@/components/ContactSection";

export default function ExtrasPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Extras</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">
          A quiet corner for experiments.
        </h1>
      </div>
      <ContactSection />
    </section>
  );
}
