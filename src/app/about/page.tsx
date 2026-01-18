import ContactSection from "@/components/ContactSection";

export default function AboutPage() {
  return (
    <section className="space-y-12">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">About</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Lia Li
        </h1>
        <p className="text-sm italic text-muted-red">Student, Queens, NY</p>
        <p className="max-w-2xl text-[1.02rem] leading-7 text-muted">
          I am an Junior Applied Mathematics and Statistics student at Stony Brook
          University with a minor in Electrical Engineering. I work on finance,
          reporting, and operational analysis that helps teams make faster, more
          informed decisions.
        </p>
        <p className="max-w-2xl text-[1.02rem] leading-7 text-muted">
          Recently, I have supported the Fourier Fund as a Finance Analyst,
          building models and summaries for a 30+ member student-run fund. I
          also partner with teams on structured reporting, documentation, and
          stakeholder updates.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="font-display text-2xl text-ink">Experience</h2>
        <div className="space-y-8">
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Oct 2025 — Present
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Finance Analyst · Fourier Fund of Stony Brook University
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Financial statement review, Excel model maintenance, and weekly
              meeting materials for a student-run fund.
            </p>
          </div>
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Aug 2025 — Dec 2025
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Undergraduate Teaching Assistant · Stony Brook University
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Coursework grading, schedule coordination, and student support
              for AMS 210: Linear Algebra.
            </p>
          </div>
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Jan 2025 — May 2025
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Project Analyst · Blockchain Business Lab (BBL)
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Project timelines, stakeholder reporting, and dashboard upkeep in
              Figma and spreadsheets.
            </p>
          </div>
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Jun 2024 — Sept 2024
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Project Data Intern · Jag International Trim
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cleaned and consolidated legacy datasets to improve reporting
              accuracy and consistency.
            </p>
          </div>
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Apr 2024 — May 2025
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Event Operations & Sales · Chan Bai Mei
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              On-site coordination and customer communication for high-volume
              hospitality events.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-display text-2xl text-ink">Education</h2>
        <div className="space-y-8">
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Sep 2023 — May 2027
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Stony Brook University
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              B.S. in Applied Math & Statistics; Minor in
              Electrical Engineering.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              GPA 3.5/4.0. Relevant coursework: Financial Accounting,
              Managerial Finance, Probability Theory, Data Analysis, Statistics,
              Linear Algebra.
            </p>
          </div>
          <div className="border-l border-muted-red/60 pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Jun 2025 — Jul 2025
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              The Hong Kong University of Science and Technology
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Study abroad summer program.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Focus: Applied Generative AI in Interdisciplinary Projects.
            </p>
          </div>
          <div className="border-l border-line pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Sep 2020 — Jul 2023
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink">
              Bayside High School
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              High School Diploma, Engineering.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Activities: Student Organization, ARISTA National Honor Society,
              Key Club, Track Team.
            </p>
          </div>
        </div>
      </div>
      <ContactSection />
    </section>
  );
}
