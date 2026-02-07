"use client";

import { useEffect, useRef, useState } from "react";

type TimelineItemProps = {
  className?: string;
  children: React.ReactNode;
};

export default function TimelineItem({ className, children }: TimelineItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => setIsVisible(true), 120);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -20% 0px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`timeline-item ${isVisible ? "is-visible" : ""} ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
