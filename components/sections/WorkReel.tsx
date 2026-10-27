"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import VOImage from "@/components/media/VOImage";
import { projectSource } from "@/content/projects";

const order = [
  "commercial-rooftop-arrays",
  "365kw-rooftop-solar-lgu",
  "gold-refinery-solar",
  "solar-powered-irrigation",
  "eco-vo-300w-street-lights",
  "75kva-transformer-denr-r12",
];

const projects = order
  .map((slug) => projectSource.find((project) => project.slug === slug))
  .filter((project): project is (typeof projectSource)[number] => Boolean(project));

export default function WorkReel() {
  const track = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: 0 });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const nudge = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 1100), behavior: "smooth" });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!el || event.pointerType === "touch") return;
    drag.current = { down: true, startX: event.clientX, startScroll: el.scrollLeft, moved: 0 };
    el.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!el || !drag.current.down) return;
    const delta = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(delta));
    el.scrollLeft = drag.current.startScroll - delta;
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = track.current;
    if (!el) return;
    drag.current.down = false;
    try { el.releasePointerCapture(event.pointerId); } catch { /* noop */ }
  };
  const onClickCapture = (event: React.MouseEvent) => {
    if (drag.current.moved > 8) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = 0;
    }
  };

  return (
    <section id="work" className="section theme-ink reel-section" aria-labelledby="work-title">
      <div className="shell">
        <div className="sec-head">
          <div className="sec-head__left">
            <p className="mono">02 / Field records</p>
            <h2 id="work-title" className="d-xl">Proof of<br />work.</h2>
          </div>
          <div className="sec-head__right">
            <p className="lede">Real photographs from our project files — rooftops, refineries, farms and street lights.</p>
            <Link className="u-link mono--yellow" href="/work/"><span data-scramble>All 17 projects</span> <span className="arr" aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>

      <div className="reel-shell">
        <div
          className="reel"
          ref={track}
          tabIndex={0}
          role="region"
          aria-label="Featured project reel — drag or use arrow keys"
          data-cursor-label="Drag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") { event.preventDefault(); nudge(1); }
            if (event.key === "ArrowLeft") { event.preventDefault(); nudge(-1); }
          }}
        >
          {projects.map((project, i) => (
            <Link className="reel__card" href={`/work/?project=${project.slug}`} key={project.slug}>
              <VOImage
                id={project.cover}
                alt={`${project.title} — ${project.category} project photograph`}
                ratio="16 / 10"
                sizes="(max-width: 900px) 92vw, 80vw"
                className="reel__img"
              />
              <span className="reel__shade" aria-hidden="true" />
              <span className="reel__index">{String(i + 1).padStart(2, "0")}</span>
              <span className="reel__tags">
                <span className="mono">{project.category}</span>
                {project.year ? <span className="mono">{project.year}</span> : null}
                {project.capacity ? <span className="mono mono--yellow">{project.capacity}</span> : null}
              </span>
              <span className="reel__content">
                <span className="reel__title">{project.title}</span>
                <span className="reel__summary">{project.summary}</span>
                <span className="reel__open mono">Open project <span aria-hidden="true">↗</span></span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="shell">
        <div className="reel__foot">
          <div className="reel__progress" aria-hidden="true">
            <span className="reel__progress-fill" style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} />
            <i className="reel__progress-sun" style={{ left: `${Math.max(2, progress * 100).toFixed(2)}%` }} />
          </div>
          <div className="reel__controls">
            <button type="button" className="reel__arrow" onClick={() => nudge(-1)} aria-label="Previous projects">←</button>
            <button type="button" className="reel__arrow" onClick={() => nudge(1)} aria-label="Next projects">→</button>
            <span className="mono reel__hint">Drag / arrow keys</span>
          </div>
        </div>
      </div>
    </section>
  );
}
