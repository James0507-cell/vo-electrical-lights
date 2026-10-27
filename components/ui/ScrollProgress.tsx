"use client";

import { useEffect, useRef } from "react";

/** Thin solar-yellow reading-progress line with a travelling sun. */
export default function ScrollProgress() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const sunRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    const sun = sunRef.current;
    if (!fill || !sun) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = `scaleX(${p.toFixed(4)})`;
      sun.style.left = `${(p * 100).toFixed(2)}%`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scrollbar-top" aria-hidden="true">
      <span className="scrollbar-top__fill" ref={fillRef} />
      <i className="scrollbar-top__sun" ref={sunRef} />
    </div>
  );
}
