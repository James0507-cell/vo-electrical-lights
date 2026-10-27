"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import VOImage from "@/components/media/VOImage";
import { getImage } from "@/lib/images";
import styles from "./portfolio.module.css";
import { pad2, photoCount, type Project } from "./types";

/**
 * Full-screen project viewer.
 * - image stage + meta panel on desktop, stage-over-sheet on mobile
 * - photo navigation by buttons, arrow keys, thumbnails and horizontal swipe
 * - focus trap, scroll lock, focus restore, URL sync is owned by WorkArchive
 */

const TITLE_ID = "lightbox-project-title";
const DESC_ID = "lightbox-project-description";

type Props = {
  project: Project;
  archivePosition: number;
  archiveTotal: number;
  photoIndex: number;
  onPhotoIndexChange: (index: number) => void;
  prevProject: Project | null;
  nextProject: Project | null;
  onProjectChange: (slug: string) => void;
  onClose: () => void;
};

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true" focusable="false">
      <path
        d={direction === "left" ? "M10.6 2.4 4.9 8.5l5.7 6.1" : "M6.4 2.4l5.7 6.1-5.7 6.1"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Lightbox({
  project,
  archivePosition,
  archiveTotal,
  photoIndex,
  onPhotoIndexChange,
  prevProject,
  nextProject,
  onProjectChange,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);

  const photoTotal = project.photos.length;
  const safeIndex = Math.min(Math.max(photoIndex, 0), photoTotal - 1);
  const photoId = project.photos[safeIndex];
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < photoTotal - 1;
  const isSingle = photoTotal === 1;

  const photoAlt = `${project.title} — ${project.category}, photograph ${safeIndex + 1} of ${photoTotal}`;

  const facts = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [];
    if (project.capacity) list.push({ label: "Capacity", value: project.capacity });
    if (project.location) list.push({ label: "Location", value: project.location });
    if (project.client) list.push({ label: "Client", value: project.client });
    return list;
  }, [project]);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), photoTotal - 1);
      if (next !== safeIndex) onPhotoIndexChange(next);
    },
    [onPhotoIndexChange, photoTotal, safeIndex]
  );

  const requestClose = useCallback(() => {
    if (closing) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, reduce ? 0 : 250);
  }, [closing, onClose]);

  /* Scroll lock (html overflow + Lenis parity with the site nav). */
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    window.__lenis?.stop();
    return () => {
      root.style.overflow = previous;
      window.__lenis?.start();
    };
  }, []);

  /* Clear the close timer if the viewer is removed some other way. */
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  /* Focus starts on the close control. */
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  /* Keep the active thumbnail visible. */
  useEffect(() => {
    const thumb = thumbRefs.current[safeIndex];
    if (!thumb) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    thumb.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [safeIndex]);

  /* Reset the meta panel when moving between projects. */
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  /* Preload the neighbouring photographs. */
  useEffect(() => {
    const neighbours = [project.photos[safeIndex - 1], project.photos[safeIndex + 1]].filter(
      (id): id is string => Boolean(id)
    );
    neighbours.forEach((id) => {
      const image = new Image();
      image.decoding = "async";
      image.src = getImage(id).src;
    });
  }, [project, safeIndex]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        if (!hasPrev) return;
        event.preventDefault();
        goTo(safeIndex - 1);
        return;
      }
      if (event.key === "ArrowRight") {
        if (!hasNext) return;
        event.preventDefault();
        goTo(safeIndex + 1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        goTo(photoTotal - 1);
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    },
    [requestClose, hasPrev, hasNext, goTo, safeIndex, photoTotal]
  );

  const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx > 0 && hasPrev) goTo(safeIndex - 1);
      else if (dx < 0 && hasNext) goTo(safeIndex + 1);
    },
    [goTo, hasPrev, hasNext, safeIndex]
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      className={`${styles.lb} ${closing ? styles.lbClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      aria-describedby={DESC_ID}
      onKeyDown={onKeyDown}
    >
      <button
        ref={closeRef}
        type="button"
        className={styles.lbClose}
        onClick={requestClose}
        aria-label="Close project viewer"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
          <path d="M1 1l12 12M13 1 1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      <div className={styles.lbGrid}>
        <div className={styles.lbStage}>
          <div className={styles.lbMedia}>
            <div
              key={photoId}
              className={styles.lbImage}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <VOImage
                id={photoId}
                alt={photoAlt}
                sizes="(min-width: 900px) 64vw, 100vw"
                priority
              />
            </div>

            <button
              type="button"
              className={`${styles.lbArrow} ${styles.lbArrowPrev}`}
              aria-label="Previous photograph"
              onClick={() => goTo(safeIndex - 1)}
              disabled={!hasPrev}
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className={`${styles.lbArrow} ${styles.lbArrowNext}`}
              aria-label="Next photograph"
              onClick={() => goTo(safeIndex + 1)}
              disabled={!hasNext}
            >
              <Chevron direction="right" />
            </button>
          </div>

          <div className={styles.lbBar}>
            <p className={styles.lbCounter}>
              <span aria-hidden="true">
                <span className={styles.lbCounterNow}>{pad2(safeIndex + 1)}</span>
                <span className={styles.lbCounterSlash}>/</span>
                {pad2(photoTotal)}
              </span>
              <span className="sr-only">
                Photograph {safeIndex + 1} of {photoTotal}
              </span>
            </p>

            <div
              className={styles.lbThumbs}
              role="group"
              aria-label={`Photographs of ${project.title}`}
            >
              {project.photos.map((id, index) => (
                <button
                  key={`${id}-${index}`}
                  ref={(node) => {
                    thumbRefs.current[index] = node;
                  }}
                  type="button"
                  className={styles.lbThumb}
                  aria-label={`Show photograph ${index + 1} of ${photoTotal}`}
                  aria-current={index === safeIndex ? "true" : undefined}
                  onClick={() => goTo(index)}
                >
                  <VOImage id={id} alt="" decorative sizes="90px" />
                </button>
              ))}
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            Photograph {safeIndex + 1} of {photoTotal}
          </p>
        </div>

        <aside ref={panelRef} className={styles.lbPanel} aria-label="Project details">
          <div className={styles.lbPanelInner}>
            <div className={styles.lbTopline}>
              <span>
                Index {pad2(archivePosition)} / {pad2(archiveTotal)}
              </span>
              <span>{photoCount(photoTotal)}</span>
            </div>

            <h2 id={TITLE_ID} className={styles.lbTitle}>
              {project.title}
            </h2>

            <div className={styles.lbChips}>
              <span className={styles.lbChip}>{project.category}</span>
              {project.year ? <span className={styles.lbChip}>{project.year}</span> : null}
            </div>

            {facts.length > 0 ? (
              <dl className={styles.lbFacts}>
                {facts.map((fact) => (
                  <div key={fact.label} className={styles.lbFact}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <p id={DESC_ID} className={styles.lbDesc}>
              {project.description}
            </p>

            <p className={styles.lbSource}>
              Source — {project.sourceNote ?? "Photographs from the company's project files."}
            </p>

            <div className={styles.lbCtaWrap}>
              <div className={styles.lbProjects}>
                <button
                  type="button"
                  className={styles.lbProjectBtn}
                  onClick={() => prevProject && onProjectChange(prevProject.slug)}
                  disabled={!prevProject}
                  aria-label={prevProject ? `Previous project: ${prevProject.title}` : "No previous project"}
                >
                  <span className={styles.lbProjectDir}>← Previous</span>
                  <span className={styles.lbProjectName}>
                    {prevProject ? prevProject.title : "Start of archive"}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.lbProjectBtn}
                  onClick={() => nextProject && onProjectChange(nextProject.slug)}
                  disabled={!nextProject}
                  aria-label={nextProject ? `Next project: ${nextProject.title}` : "No next project"}
                >
                  <span className={styles.lbProjectDir}>Next →</span>
                  <span className={styles.lbProjectName}>
                    {nextProject ? nextProject.title : "End of archive"}
                  </span>
                </button>
              </div>

              <Link className={styles.lbCta} href="/#contact">
                <span>Start a similar project</span>
                <span className={styles.ctaArrow} aria-hidden="true">
                  ↗
                </span>
              </Link>

              <p className={styles.lbKeys} aria-hidden="true">
                {isSingle ? null : (
                  <>
                    <kbd>←</kbd>
                    <kbd>→</kbd>
                    <span>photographs</span>
                  </>
                )}
                <kbd>Esc</kbd>
                <span>close</span>
              </p>
            </div>
          </div>
        </aside>
      </div>

      <p className="sr-only">
        Use the left and right arrow keys to browse photographs. Press Escape to close this viewer.
      </p>
    </div>,
    document.body
  );
}
