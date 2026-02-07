import BackToTopButton from "@/components/BackToTopButton";
import ContactSection from "@/components/ContactSection";
import TimelineItem from "@/components/TimelineItem";
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
      video: "/website-demo.mp4",
    },
  ];

  return (
    <div className="space-y-20">
      <section id="about" className="scroll-mt-[-8em] space-y-12">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-muted">About</p>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Lia Li
          </h2>
          <p className="text-sm italic text-muted-red">Student, Queens, NY</p>
          <p className="max-w-2xl text-[1.02rem] leading-7 text-muted">
            I am a junior Applied Mathematics and Statistics student at Stony
            Brook University with a minor in Electrical Engineering. I work on
            finance, reporting, and operational analysis that helps teams make
            faster, more informed decisions.
          </p>
          <p className="max-w-2xl text-[1.02rem] leading-7 text-muted">
            Recently, I have supported the Fourier Fund as a Finance Analyst,
            building models and summaries for a 30+ member student-run fund. I
            also partner with teams on structured reporting, documentation, and
            stakeholder updates.
          </p>
          <a
            href="/resume.pdf"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-muted underline decoration-accent-2 decoration-2 underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Resume PDF
          </a>
        </div>

        <div className="space-y-6">
          <h3 className="font-display text-2xl text-ink">Experience</h3>
          <div className="space-y-8">
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Oct 2025 — Present
              </p>
              <h4 className="mt-2 text-base font-semibold text-ink">
                Finance Analyst ·{" "}
                <a
                  href="https://sbuinvestmentclub.vercel.app/aboutff.html"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-transparent decoration-2 underline-offset-4 transition hover:decoration-ink"
                >
                  Fourier Fund of Stony Brook University
                </a>
              </h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                Financial statement review, Excel model maintenance, and weekly
                meeting materials for a student-run fund.
              </p>
            </TimelineItem>
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Aug 2025 — Dec 2025
              </p>
              <h4 className="mt-2 text-base font-semibold text-ink">
                Undergraduate Teaching Assistant · Stony Brook University
              </h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                Coursework grading, schedule coordination, and student support
                for AMS 210: Linear Algebra.
              </p>
            </TimelineItem>
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Jan 2025 — May 2025
              </p>
              <h4 className="mt-2 text-base font-semibold text-ink">
                Project Analyst · Blockchain Business Lab (BBL)
              </h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                Project timelines, stakeholder reporting, and dashboard upkeep
                in Figma and spreadsheets.
              </p>
            </TimelineItem>
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Jun 2024 — Sept 2024
              </p>
              <h4 className="mt-2 text-base font-semibold text-ink">
                Project Data Intern · Jag International Trim
              </h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                Cleaned and consolidated legacy datasets to improve reporting
                accuracy and consistency.
              </p>
            </TimelineItem>
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Apr 2024 — May 2025
              </p>
              <h4 className="mt-2 text-base font-semibold text-ink">
                Event Operations & Sales · Chan Bai Mei
              </h4>
              <p className="mt-2 text-sm leading-6 text-muted">
                On-site coordination and customer communication for high-volume
                hospitality events.
              </p>
            </TimelineItem>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-display text-2xl text-ink">Education</h3>
          <div className="space-y-8">
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Sep 2023 — May 2027
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Image
                  src="/Stony_Brook_University.png"
                  alt="Stony Brook University logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <h4 className="text-base font-semibold text-ink">
                  Stony Brook University
                </h4>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                B.S. in Applied Math & Statistics; Minor in Electrical
                Engineering.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">GPA 3.5/4.0.</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Relevant coursework: Financial Accounting, Managerial Finance,
                Probability Theory, Data Analysis, Statistics, Linear Algebra.
              </p>
            </TimelineItem>
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Jun 2025 — Jul 2025
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Image
                  src="/Hong_Kong_University_of_Science_and_Technology_symbol.svg"
                  alt="The Hong Kong University of Science and Technology logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <h4 className="text-base font-semibold text-ink">
                  The Hong Kong University of Science and Technology
                </h4>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Study abroad summer program.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Focus: Applied Generative AI in Interdisciplinary Projects.
              </p>
            </TimelineItem>
            <TimelineItem className="pl-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Sep 2020 — Jul 2023
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Image
                  src="/baysidehighschoool.webp"
                  alt="Bayside High School logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <h4 className="text-base font-semibold text-ink">
                  Bayside High School
                </h4>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                High School Diploma, Engineering.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Activities: Student Organization, ARISTA National Honor Society,
                Key Club, Track Team.
              </p>
            </TimelineItem>
          </div>
        </div>

        <div />
      </section>

      <section id="projects" className="scroll-mt-[-8rem] space-y-14">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-muted">
            Projects
          </p>
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
                      priority={
                        project.title === "Option Pricing & Stochastic Analysis"
                      }
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

        <div />
      </section>

      <section id="extras" className="scroll-mt-[-8rem] space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Extras
          </p>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            2026 Reading List
          </h2>
        </div>
        <p className="text-[1rem] leading-7 text-muted">
          A running list of what I’m reading this year.
        </p>

        <div className="space-y-8 border-t border-line pt-8">
          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-[0.3em] text-muted">
              Read this year
            </h3>
            <ul className="space-y-2 text-base text-muted">
              <li>Kafka on the Shore — Haruki Murakami</li>
              <li>The Catcher in the Rye — J.D. Salinger</li>
            </ul>
          </div>

          <div className="space-y-3 border-t border-line pt-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-muted">
              Currently reading
            </h3>
            <ul className="space-y-2 text-base text-muted">
              <li>1984 — George Orwell</li>
              <li>Crime and Punishment — Fyodor Dostoevsky</li>
            </ul>
          </div>

          <div className="space-y-3 border-t border-line pt-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-muted">
              Up next
            </h3>
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

        <div />
      </section>

      <section id="contact" className="scroll-mt-[-10em]">
        <ContactSection />
        <footer className="mt-16 border-t border-line pt-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-display text-4xl text-ink">Lia Li</p>
              <p className="text-sm text-muted">
                Applied Math & Statistics · Stony Brook University
              </p>
            </div>
            <div />
            <div className="space-y-2 text-sm text-muted sm:text-right">
              <p className="uppercase tracking-[0.3em] text-xs text-muted">
                Links
              </p>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <a
                  href="https://www.linkedin.com/in/liali1"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 underline decoration-transparent decoration-2 underline-offset-4 transition hover:decoration-ink"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.65-1.85 3.4-1.85 3.63 0 4.3 2.39 4.3 5.5v6.24ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45Z" />
                  </svg>
                  LinkedIn
                </a>
                <a
                  href="https://github.com/lial1"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 underline decoration-transparent decoration-2 underline-offset-4 transition hover:decoration-ink"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M12 .5a11.5 11.5 0 0 0-3.63 22.42c.57.1.78-.25.78-.55v-2.1c-3.18.7-3.85-1.36-3.85-1.36-.52-1.31-1.28-1.66-1.28-1.66-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.72-1.55-2.54-.29-5.22-1.27-5.22-5.66 0-1.25.45-2.27 1.18-3.08-.12-.29-.5-1.45.11-3.03 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.2-1.49 3.15-1.18 3.15-1.18.61 1.58.23 2.74.11 3.03.74.81 1.18 1.83 1.18 3.08 0 4.4-2.69 5.36-5.25 5.64.41.35.77 1.03.77 2.09v3.1c0 .3.2.66.79.55A11.5 11.5 0 0 0 12 .5Z" />
                  </svg>
                  GitHub
                </a>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-transparent decoration-2 underline-offset-4 transition hover:decoration-ink"
                >
                  Resume
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start gap-4 border-t border-line/60 pt-6 text-xs uppercase tracking-[0.3em] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Last updated: Feb 2026</span>
            <BackToTopButton />
          </div>
        </footer>
      </section>
    </div>
  );
}
