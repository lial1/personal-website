"use client";

export default function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById("about")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
      className="underline decoration-transparent decoration-2 underline-offset-4 transition hover:decoration-ink"
    >
      Back to top ↑
    </button>
  );
}
