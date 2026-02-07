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

  useEffect(() => {
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash) {
      setActive(currentHash);
    }

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
    window.addEventListener("hashchange", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", updateActive);
    };
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    let mouseTimeout: number | null = null;

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
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      if (mouseTimeout) {
        window.clearTimeout(mouseTimeout);
      }
    };
  }, []);

  return (
    <header className="site-header" data-visible={isVisible}>
      <div className="site-header-inner">
        <nav className="flex items-center justify-end text-xs uppercase tracking-[0.3em]">
          <div className="nav-stack flex items-center gap-7">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                data-active={active === link.id}
                className="nav-link"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
