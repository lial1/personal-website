export default function Home() {
  const projects = [
    {
      title: "Option Pricing & Stochastic Analysis",
      summary:
        "Monte Carlo framework to simulate downside scenarios and quantify tail risk across changing assumptions.",
      tags: ["Python", "Jupyter", "Risk Analysis"],
      link: "https://github.com/lial1/Option-Pricing-Stochastic-Analysis",
    },
    {
      title: "Fourier Fund Financial Model Suite",
      summary:
        "Excel-based dashboards tracking financial performance, assumptions, and recurring reporting across projects.",
      tags: ["Excel", "Financial Analysis", "Reporting"],
    },
    {
      title: "BBL Metrics & Governance Dashboards",
      summary:
        "Figma and spreadsheet system used to surface protocol metrics, milestones, and governance risks.",
      tags: ["Figma", "Spreadsheets", "Stakeholder Updates"],
    },
    {
      title: "Jag International Data Consolidation",
      summary:
        "Standardized and cleaned legacy datasets to improve reporting accuracy and operational efficiency by 30%.",
      tags: ["Data Cleaning", "Excel", "Operations"],
    },
  ];

  return (
    <section className="space-y-14">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Projects</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Selected work
        </h1>
        <p className="max-w-2xl text-[1.02rem] leading-7 text-muted">
          A few highlights spanning financial analysis, data reporting, and
          process design.
        </p>
      </div>

      <div className="space-y-14">
        {projects.map((project) => (
          <article key={project.title} className="space-y-5">
            <div className="overflow-hidden rounded-[26px] border border-line bg-card">
              <div className="relative aspect-video w-full bg-gradient-to-br from-white via-white to-sand">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.06),_transparent_60%)]" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-2xl text-ink">
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-transparent decoration-2 underline-offset-4 transition hover:decoration-ink"
                  >
                    {project.title} <span aria-hidden>→</span>
                  </a>
                ) : (
                  <>
                    {project.title} <span aria-hidden>→</span>
                  </>
                )}
              </h2>
              <p className="max-w-2xl text-[1rem] leading-7 text-muted">
                {project.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <ContactSection />
    </section>
  );
}
import ContactSection from "@/components/ContactSection";
