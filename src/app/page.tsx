import ContactSection from "@/components/ContactSection";
import Image from "next/image";

export default function Home() {
  const projects = [
    {
      title: "Option Pricing & Stochastic Analysis",
      summary:
        "Monte Carlo framework to simulate downside scenarios and quantify tail risk across changing assumptions.",
      tags: ["Python", "Jupyter", "Risk Analysis"],
      link: "https://github.com/lial1/Option-Pricing-Stochastic-Analysis",
      image: "/project-options.png",
      imageClassName: "scale-105",
    },
    {
      title: "Fourier Fund Financial Model Suite",
      summary:
        "Excel-based dashboards tracking financial performance, assumptions, and recurring reporting across projects.",
      tags: ["Excel", "Financial Analysis", "Reporting"],
      image: "/comps-table-omc.png",
      imageClassName: "object-left object-top",
    },
    {
      title: "Product & Data Interface — Jag International Trim",
      summary:
        "Led end-to-end design of an internal data dashboard, combining UI development with data cleaning to streamline reporting and decision-making.",
      tags: ["Dashboard Design", "Data Cleaning", "Reporting"],
      link: "https://jagtrim.com/",
      video: "/website-demo.mov",
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
                {project.video ? (
                  <video
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src={project.video} type="video/mp4" />
                  </video>
                ) : project.image ? (
                  <Image
                    src={project.image}
                    alt={`${project.title} preview`}
                    fill
                    className={`object-cover ${project.imageClassName ?? ""}`}
                    sizes="(min-width: 768px) 720px, 100vw"
                    priority={project.title === "Option Pricing & Stochastic Analysis"}
                  />
                ) : null}
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
