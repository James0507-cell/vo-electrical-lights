"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import VOImage from "@/components/media/VOImage";
import Lightbox from "./Lightbox";
import styles from "./portfolio.module.css";
import { FILTERS, coverAlt, pad2, photoCount, type Project } from "./types";

/**
 * Field records: discipline filter, two-column editorial archive with
 * full-width chapter cards, and the project viewer. Filtering is client-side
 * on the canonical projects data.
 */

const CELL_SIZES = "(min-width: 981px) 46vw, (min-width: 641px) 48vw, 100vw";
const FULL_SIZES = "100vw";

type Cell = {
  project: Project;
  full: boolean;
  offset: boolean;
  sizes: string;
  delay: number;
};

/**
 * Layout rhythm: the first record and (on long archives) a middle record break
 * out to full width; the final record also breaks out when the item count is
 * even so no lone card is left dangling in a row.
 */
export default function WorkArchive({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("all");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [urlReady, setUrlReady] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: projects.length };
    for (const item of FILTERS) {
      if (!item.match) continue;
      map[item.id] = projects.filter((project) => project.tags.includes(item.match as string)).length;
    }
    return map;
  }, [projects]);

  const archivePosition = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((project, index) => map.set(project.slug, index + 1));
    return map;
  }, [projects]);

  const activeFilter = FILTERS.find((item) => item.id === filter) ?? FILTERS[0];
  const visible = useMemo(() => {
    const match = activeFilter.match;
    return match ? projects.filter((project) => project.tags.includes(match)) : projects;
  }, [projects, activeFilter]);

  const cells = useMemo<Cell[]>(() => {
    const count = visible.length;
    let column = 0;
    return visible.map((project, index) => {
      const isLast = index === count - 1;
      const wantsFull =
        index === 0 ||
        (count >= 13 && index === 9) ||
        (isLast && column === 0);
      const full = wantsFull && column === 0;
      let offset = false;

      if (full) {
        column = 0;
      } else if (column === 0) {
        column = 1;
      } else {
        offset = true;
        column = 0;
      }

      return {
        project,
        full,
        offset,
        sizes: full ? FULL_SIZES : CELL_SIZES,
        delay: Math.min(index, 8),
      };
    });
  }, [visible]);

  /* ---------------------------------------------------------------- viewer */

  const activeProject = activeSlug
    ? projects.find((project) => project.slug === activeSlug) ?? null
    : null;

  const projectOrder = useMemo(() => {
    if (!activeProject) return projects;
    return visible.some((project) => project.slug === activeProject.slug) ? visible : projects;
  }, [activeProject, visible, projects]);

  const orderIndex = activeProject
    ? projectOrder.findIndex((project) => project.slug === activeProject.slug)
    : -1;
  const prevProject = orderIndex > 0 ? projectOrder[orderIndex - 1] : null;
  const nextProject =
    orderIndex >= 0 && orderIndex < projectOrder.length - 1 ? projectOrder[orderIndex + 1] : null;

  const openProject = useCallback((slug: string) => {
    const focused = document.activeElement;
    openerRef.current = focused instanceof HTMLElement ? focused : null;
    setActiveSlug(slug);
    setPhotoIndex(0);
  }, []);

  const closeProject = useCallback(() => {
    const opener = openerRef.current;
    setActiveSlug(null);
    setPhotoIndex(0);
    openerRef.current = null;
    window.requestAnimationFrame(() => {
      if (opener && opener.isConnected) opener.focus();
    });
  }, []);

  const changeProject = useCallback((slug: string) => {
    setActiveSlug(slug);
    setPhotoIndex(0);
  }, []);

  /* ----------------------------------------------- URL sync + back/forward */

  useEffect(() => {
    const applyFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("project");
      if (!slug) {
        setActiveSlug(null);
        return;
      }
      const project = projects.find((item) => item.slug === slug);
      if (!project) {
        setActiveSlug(null);
        return;
      }
      const requested = Number.parseInt(params.get("photo") ?? "1", 10);
      const index = Number.isFinite(requested)
        ? Math.min(Math.max(requested - 1, 0), project.photos.length - 1)
        : 0;
      setActiveSlug(slug);
      setPhotoIndex(index);
    };

    applyFromUrl();
    window.addEventListener("popstate", applyFromUrl);
    setUrlReady(true);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, [projects]);

  useEffect(() => {
    if (!urlReady) return;
    const base = window.location.pathname;
    const target = activeSlug
      ? `${base}?project=${encodeURIComponent(activeSlug)}&photo=${photoIndex + 1}`
      : base;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) window.history.replaceState(null, "", target);
  }, [urlReady, activeSlug, photoIndex]);

  /* ----------------------------------------------------------------- render */

  return (
    <>
      <section className={styles.archive} aria-labelledby="archive-heading">
        <h2 id="archive-heading" className="sr-only">
          Project archive
        </h2>

        <div className={styles.filterBar}>
          <div className={`shell ${styles.filterInner}`}>
            <span className={styles.filterLead} aria-hidden="true">
              Filter
            </span>

            <div
              className={styles.filterScroll}
              role="group"
              aria-label="Filter projects by discipline"
            >
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.filterBtn}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  <span>{item.label}</span>
                  <span className={styles.filterNum} aria-hidden="true">
                    {pad2(counts[item.id] ?? 0)}
                  </span>
                </button>
              ))}
            </div>

            <p className={styles.filterLive} aria-live="polite" aria-atomic="true">
              <span className={styles.filterLiveNow} aria-hidden="true">
                {pad2(visible.length)}
              </span>
              <span className={styles.filterLiveTotal} aria-hidden="true">
                <span>/</span>
                {pad2(projects.length)}
              </span>
              <span className={styles.filterLiveLabel} aria-hidden="true">
                projects
              </span>
              <span className="sr-only">
                {visible.length} of {projects.length} projects shown
              </span>
            </p>
          </div>
        </div>

        <div className={`shell ${styles.gridWrap}`}>
          <ul className={styles.grid} key={filter} aria-label="Projects">
            {cells.map((cell, index) => {
              const project = cell.project;
              const position = archivePosition.get(project.slug) ?? index + 1;
              return (
                <li
                  key={project.slug}
                  className={[
                    styles.cell,
                    cell.full ? styles.cellFull : "",
                    cell.offset ? styles.cellOffset : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ "--d": cell.delay } as CSSProperties}
                >
                  <article className={styles.card}>
                    <div className={styles.cardMedia}>
                      <VOImage
                        id={project.cover}
                        alt={coverAlt(project)}
                        sizes={cell.sizes}
                        priority={index < 2}
                      />
                      <span className={styles.cardTag} aria-hidden="true">
                        {pad2(position)}
                      </span>
                      <span className={styles.cardFrame} aria-hidden="true" />
                      <span className={styles.cardOpen} aria-hidden="true">
                        Open <span aria-hidden="true">↗</span>
                      </span>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{project.title}</h3>
                      <p className={styles.cardMetaRow}>
                        <span className={styles.chip}>{project.category}</span>
                        {project.year ? <span className={styles.chip}>{project.year}</span> : null}
                        <span className={styles.cardPhotos}>{photoCount(project.photos.length)}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.cardButton}
                      aria-label={`Open project: ${project.title}`}
                      onClick={() => openProject(project.slug)}
                    />
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {activeProject ? (
        <Lightbox
          project={activeProject}
          archivePosition={archivePosition.get(activeProject.slug) ?? 1}
          archiveTotal={projects.length}
          photoIndex={Math.min(photoIndex, activeProject.photos.length - 1)}
          onPhotoIndexChange={setPhotoIndex}
          prevProject={prevProject}
          nextProject={nextProject}
          onProjectChange={changeProject}
          onClose={closeProject}
        />
      ) : null}
    </>
  );
}
