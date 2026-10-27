"use client";

import { useEffect, useRef } from "react";

function labelFor(el: Element | null): string {
  if (!el?.closest) return "";
  const explicit = el.closest("[data-cursor-label]");
  if (explicit) return explicit.getAttribute("data-cursor-label") || "";
  if (el.closest(".reel__card")) return "Open";
  if (el.closest(".array__cell")) return "Expand";
  if (el.closest("#products article")) return "Stock";
  if (el.closest('button[aria-label^="Open project"]')) return "Open";
  if (el.closest(".hero__range")) return "Sun";
  if (el.closest(".contact__phone")) return "Call";
  if (el.closest(".reel")) return "Drag";
  if (el.closest(".work-card")) return "Open";
  return "";
}

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !glow || !label) return;

    document.documentElement.classList.add("has-cursor");
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let gx = mx;
    let gy = my;
    let raf = 0;
    let visible = false;

    const onMove = (event: PointerEvent) => {
      mx = event.clientX;
      my = event.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        glow.style.opacity = "0.5";
      }
    };
    const onOver = (event: PointerEvent) => {
      const el = event.target as Element | null;
      const interactive = el?.closest?.(
        'a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"]'
      );
      ring.classList.toggle("is-hover", Boolean(interactive));
      const nextLabel = labelFor(el);
      ring.classList.toggle("has-label", Boolean(nextLabel));
      label.textContent = nextLabel;
    };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      glow.style.opacity = "0";
    };
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      gx += (mx - gx) * 0.06;
      gy += (my - gy) * 0.06;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div className="cursor-glow" ref={glowRef} aria-hidden="true" />
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true">
        <span className="cursor-label" ref={labelRef} />
      </div>
    </>
  );
}
