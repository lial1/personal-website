"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#about", label: "about", id: "about" },
  { href: "#projects", label: "projects", id: "projects" },
  { href: "#extras", label: "extras", id: "extras" },
  { href: "#contact", label: "contact", id: "contact" },
];

export default function SiteNav() {
  const [active, setActive] = useState("about");
  const [isVisible, setIsVisible] = useState(true);
  const [isEngaged, setIsEngaged] = useState(false);

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return;
    }

    const updateActive = () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        const clampOffset = Math.max(0, aboutSection.offsetTop - 160);
        if (window.scrollY < clampOffset) {
          window.scrollTo({ top: clampOffset, behavior: "auto" });
        }
      }

      const marker = window.scrollY + 80;
      let currentId = sections[0]?.id ?? "about";
      sections.forEach((section) => {
        if (section.offsetTop <= marker) {
          currentId = section.id;
        }
      });
      setActive(currentId);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActive);
    };
  }, []);

  const handleNavClick = (id: string) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState({}, "", window.location.pathname);
  };

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    let mouseTimeout: number | null = null;
    let engageTimeout: number | null = null;

    const setEngaged = () => {
      setIsEngaged(true);
      if (engageTimeout) {
        window.clearTimeout(engageTimeout);
      }
      engageTimeout = window.setTimeout(() => {
        setIsEngaged(false);
        engageTimeout = null;
      }, 1800);
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (currentY < 80) {
          setIsVisible(true);
        } else if (delta > 8) {
          setIsVisible(false);
        } else if (delta < -8) {
          setIsVisible(true);
        }

        lastY = currentY;
        ticking = false;
      });

      setEngaged();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (event.clientY <= 90) {
        setIsVisible(true);
        if (mouseTimeout) {
          window.clearTimeout(mouseTimeout);
        }
        mouseTimeout = window.setTimeout(() => {
          mouseTimeout = null;
        }, 250);
      }

      setEngaged();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      if (mouseTimeout) {
        window.clearTimeout(mouseTimeout);
      }
      if (engageTimeout) {
        window.clearTimeout(engageTimeout);
      }
    };
  }, []);

  return (
    <header
      className="site-header"
      data-visible={isVisible}
      data-engaged={isEngaged}
    >
      <div className="site-header-inner">
        <nav className="flex items-center justify-end text-xs uppercase tracking-[0.3em]">
          <div className="nav-stack flex items-center gap-7">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                data-active={active === link.id}
                className="nav-link"
              >
                {link.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
