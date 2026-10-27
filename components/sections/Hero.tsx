"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SolarField from "@/components/hero/SolarField";

declare global {
  interface Window {
    __solarSetTime?: (value: number) => void;
  }
}

const START_MINUTES = 5 * 60;
const END_MINUTES = 19 * 60;

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function Line({ text, accentFrom = -1 }: { text: string; accentFrom?: number }) {
  return (
    <span className="hero__line-inner">
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={`hero__char ${accentFrom > -1 && index >= accentFrom ? "hero__char--sun" : ""}`}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const [sun, setSun] = useState(0.16);
  const [clock, setClock] = useState<string>("--:--");
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const minutes = START_MINUTES + sun * (END_MINUTES - START_MINUTES);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now)
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent("vo:solar-time", { detail: { value: sun } }));
    } catch {
      /* noop */
    }
    if (typeof window.__solarSetTime === "function") window.__solarSetTime(sun);

    const media = mediaRef.current;
    if (media) {
      const arc = Math.sin(Math.PI * Math.min(1, Math.max(0, sun)));
      media.style.filter = `brightness(${(0.86 + arc * 0.22).toFixed(3)}) saturate(${(0.98 + arc * 0.18).toFixed(3)}) hue-rotate(${(-3 + sun * 10).toFixed(1)}deg) contrast(${(1.04 + arc * 0.04).toFixed(3)})`;
    }
  }, [sun]);

  // Magnetic headline + pointer sunlight. Pointer-only, reduced-motion safe.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const chars = Array.from(section.querySelectorAll<HTMLElement>(".hero__char"));
    let raf = 0;
    let px = 0;
    let py = 0;

    const update = () => {
      raf = 0;
      section.style.setProperty("--hx", px + "px");
      section.style.setProperty("--hy", py + "px");
      for (const char of chars) {
        const rect = char.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const distance = Math.hypot(px - cx, py - cy);
        const proximity = Math.max(0, 1 - distance / 280);
        const eased = proximity * proximity * (3 - 2 * proximity);
        char.style.setProperty("--lift", (eased * 14).toFixed(2));
        char.style.setProperty("--glow", (eased * 0.9).toFixed(3));
        char.style.setProperty("--tilt", (((px - cx) / 320) * eased * 4).toFixed(2));
      }
    };

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onLeave = () => {
      for (const char of chars) {
        char.style.setProperty("--lift", "0");
        char.style.setProperty("--glow", "0");
        char.style.setProperty("--tilt", "0");
      }
      section.style.setProperty("--hx", "-999px");
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSun(Number(event.target.value));
  };

  return (
    <section className="hero" ref={sectionRef} aria-labelledby="hero-title">
      <div className="hero__media" ref={mediaRef}>
        <SolarField />
      </div>
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__spot" aria-hidden="true" />

      <div className="hero__content shell">
        <div className="hero__top">
          <p className="mono hero__top-left">Solar installation — Electrical supply — Philippines</p>
          <p className="mono hero__top-right">
            <span className="hero__dot" aria-hidden="true" /> PHT {clock}
          </p>
        </div>

        <h1 id="hero-title" className="hero__title">
          <span className="sr-only">We wire the sun.</span>
          <span aria-hidden="true">
            <span className="hero__row"><Line text="We wire" /></span>
            <span className="hero__row"><Line text="The sun." accentFrom={4} /></span>
          </span>
        </h1>

        <div className="hero__bottom">
          <div className="hero__intro">
            <p className="hero__lede">
              Solar systems, street lighting and electrical supply for homes, farms, businesses
              and government projects.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--yellow" href="/#contact">
                <span data-scramble>Start a project</span>
                <span className="arr" aria-hidden="true">↗</span>
              </Link>
              <Link className="btn hero__btn-ghost" href="/#work">
                <span data-scramble>See the work</span>
              </Link>
            </div>
            <ul className="hero__creds">
              <li>DOE “Certified PV Solar Installer”</li>
              <li>Private &amp; government projects</li>
              <li>Supply · Delivery · Installation</li>
            </ul>
          </div>

          <div className="hero__sun">
            <div className="hero__sun-head">
              <span className="mono">Sun study</span>
              <span className="hero__sun-time" aria-hidden="true">{formatTime(minutes)}</span>
            </div>
            <input
              className="hero__range"
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={sun}
              onChange={onChange}
              aria-label="Change the time of day in the hero solar field"
              aria-valuetext={`${formatTime(minutes)} — drag to move the sun`}
            />
            <div className="hero__sun-foot">
              <span className="mono">05:00</span>
              <span className="mono hero__drag">Drag to move the sun</span>
              <span className="mono">19:00</span>
            </div>
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <span className="mono">Scroll</span>
          <i />
        </div>
      </div>
    </section>
  );
}
