"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { processSteps } from "@/content/site";
import styles from "./SystemDiagram.module.css";

const TOTAL = processSteps.length;
const pad = (value: number) => String(value).padStart(2, "0");
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className={styles.navIcon} viewBox="0 0 14 12" aria-hidden="true" focusable="false">
      <path
        d={direction === "left" ? "M13 6H1M5 1L1 6l4 5" : "M1 6h12M9 1l4 5-4 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * Technical line drawings, one per process step. Only paths carry the draw-on
 * animation (pathLength normalises the dash pattern); the faint construction
 * geometry is static so the drawing reads as a document, not a loader.
 */
function Figure({ index, live }: { index: number; live: boolean }) {
  const ink = styles.ink;
  const ghost = styles.ghost;
  const dash = styles.dash;

  const figures: ReactNode[] = [
    /* 01 — Survey: site extents, footprint, sun path, compass, dimension */
    <>
      <rect className={ghost} x="76" y="146" width="356" height="188" />
      <rect className={dash} x="100" y="170" width="308" height="140" />
      <path className={ink} pathLength={1} d="M128 212H304V288H128Z" />
      <path className={ghost} d="M128 250H304M216 212V288" />
      <path className={ink} pathLength={1} d="M524 88a24 24 0 1 0 0 48a24 24 0 1 0 0-48" />
      <path className={ghost} d="M524 72V58M524 152V166M484 112H470M564 112H578M496 84l-10-10M552 140l10 10M552 84l10-10M496 140l-10 10" />
      <path className={dash} d="M452 166Q524 32 596 166" />
      <circle className={ghost} cx="556" cy="300" r="22" />
      <path className={ghost} d="M556 270V330M526 300H586" />
      <path className={ink} pathLength={1} d="M556 278l8 22l-8 22l-8-22Z" />
      <path className={ghost} d="M76 358H432M76 350V366M432 350V366" />
      <path className={ink} pathLength={1} d="M212 246h8v8h-8Z" />
    </>,
    /* 02 — Design: roof plan, panel grid, inverter, dimensions */
    <>
      <path className={ink} pathLength={1} d="M84 132H460V320H84Z" />
      <path className={ink} pathLength={1} d="M178 132V320M272 132V320M366 132V320M84 196H460M84 258H460" />
      <rect className={dash} x="190" y="206" width="70" height="40" />
      <path className={ink} pathLength={1} d="M520 228H582V308H520Z" />
      <path className={ghost} d="M532 252H570M532 270H560M532 288H550" />
      <path className={ink} pathLength={1} d="M460 292H500V268H520" />
      <path className={ghost} d="M84 344H460M84 336V352M460 336V352" />
      <circle className={ghost} cx="76" cy="86" r="20" />
      <path className={ink} pathLength={1} d="M76 68V104M76 68l-7 12M76 68l7 12" />
    </>,
    /* 03 — Supply: crates, stacked panels, route */
    <>
      <path className={ink} pathLength={1} d="M150 214L226 180L302 214L226 248Z" />
      <path className={ink} pathLength={1} d="M150 214V296L226 330V248M302 214V296L226 330" />
      <path className={ink} pathLength={1} d="M330 258L372 240L414 258L372 276Z" />
      <path className={ink} pathLength={1} d="M330 258V310L372 332V276M414 258V310L372 332" />
      <path className={ink} pathLength={1} d="M486 300V196L596 156V260Z" />
      <path className={ghost} d="M500 206V278M530 194V266M560 182V254" />
      <path className={ghost} d="M132 318H320M126 330H326" />
      <path className={dash} d="M60 358H606" />
      <path className={ink} pathLength={1} d="M580 348L606 358L580 368" />
      <path className={ghost} d="M60 352V364M200 352V364M340 352V364M480 352V364" />
    </>,
    /* 04 — Install: elevation, posts, tilted array, angle */
    <>
      <path className={ghost} d="M40 340H600" />
      <path className={ink} pathLength={1} d="M178 340V246M446 340V206" />
      <path className={ink} pathLength={1} d="M146 262L438 178L470 216L178 300Z" />
      <path className={ghost} d="M166 276L458 192M186 290L478 206" />
      <path className={ink} pathLength={1} d="M178 300V316M470 216V232" />
      <path className={ink} pathLength={1} d="M96 94a22 22 0 1 0 0 44a22 22 0 1 0 0-44" />
      <path className={ghost} d="M96 80V66M96 152V166M60 116H46M132 116H146" />
      <path className={ghost} d="M178 356H470M178 348V364M470 348V364" />
      <path className={dash} d="M446 206a60 60 0 0 1 24 44" />
    </>,
    /* 05 — Test & hand over: meter, waveform, checklist */
    <>
      <path className={ink} pathLength={1} d="M110 204a78 78 0 1 0 156 0a78 78 0 1 0-156 0" />
      <circle className={ghost} cx="188" cy="204" r="58" />
      <path className={ghost} d="M188 132V146M188 262V276M112 204H126M250 204H264M134 150l10 10M232 248l10 10M134 258l10-10M232 160l10-10" />
      <path className={ink} pathLength={1} d="M188 204L232 162" />
      <path className={ink} pathLength={1} d="M183 199h10v10h-10Z" />
      <path className={ghost} d="M300 204H588" />
      <path className={ink} pathLength={1} d="M300 204H336L360 148L386 258L410 182L434 204H588" />
      <path className={ink} pathLength={1} d="M322 284H420V318H322Z" />
      <path className={ink} pathLength={1} d="M332 301L340 309L356 291" />
      <path className={ghost} d="M432 284H584M432 318H560M440 301H520M550 301H584" />
    </>,
  ];

  return (
    <svg
      className={cx(styles.figureSvg, live && styles.figureSvgLive)}
      viewBox="0 0 640 400"
      aria-hidden="true"
      focusable="false"
    >
      {figures[index]}
    </svg>
  );
}

export default function SystemDiagram() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Draw the technical figure only once the section is actually on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const step = processSteps[active];
  const prev = (active - 1 + TOTAL) % TOTAL;
  const next = (active + 1) % TOTAL;

  const activate = (index: number, moveFocus: boolean) => {
    const normalized = ((index % TOTAL) + TOTAL) % TOTAL;
    setActive(normalized);
    if (moveFocus) tabRefs.current[normalized]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let target: number | null = null;
    if (event.key === "ArrowRight") target = active + 1;
    else if (event.key === "ArrowLeft") target = active - 1;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = TOTAL - 1;
    if (target === null) return;
    event.preventDefault();
    activate(target, true);
  };

  return (
    <section ref={sectionRef} id="process" className={styles.section} aria-labelledby="process-title">
      <div className={styles.bgWord} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.meta} data-reveal>
          <p className={cx(styles.mono, styles.metaLabel)}>04 / System</p>
          <p className={cx(styles.mono, styles.metaAside)}>Survey to switch-on — five fixed steps</p>
        </div>

        <h2 id="process-title" className={styles.title}>
          <span className={styles.titleLine} data-reveal>From survey</span>
          <span className={styles.titleLine} data-reveal style={{ "--d": "90ms" } as CSSProperties}>
            To <span className={styles.titleAccent}>switch-on.</span>
          </span>
        </h2>

        <div className={styles.headRow}>
          <ul className={styles.facts} data-reveal style={{ "--d": "160ms" } as CSSProperties}>
            <li className={styles.fact}>
              <span className={cx(styles.mono, styles.factNum)}>{pad(TOTAL)}</span>
              <span className={cx(styles.mono, styles.factLabel)}>Fixed steps</span>
            </li>
            <li className={styles.fact}>
              <span className={cx(styles.mono, styles.factNum)}>01</span>
              <span className={cx(styles.mono, styles.factLabel)}>Own crew</span>
            </li>
            <li className={styles.fact}>
              <span className={cx(styles.mono, styles.factNum)}>PH</span>
              <span className={cx(styles.mono, styles.factLabel)}>Nationwide delivery</span>
            </li>
          </ul>
          <p className={styles.intro} data-reveal style={{ "--d": "220ms" } as CSSProperties}>
            A solar system is a construction project before it is an energy bill. Five steps in a fixed
            order — we survey, design, supply, install, and test the system before hand-over.
          </p>
        </div>

        <div className={styles.railBlock}>
          <div className={styles.railHead} data-reveal>
            <p className={cx(styles.mono, styles.railLabel)}>Process map</p>
            <p className={cx(styles.mono, styles.railHint)}>Left / right arrow keys to step through</p>
          </div>

          <div className={styles.rail}>
            <span
              className={styles.fill}
              aria-hidden="true"
              style={{ "--fill": ((active + 0.5) / TOTAL) * 100 + "%" } as CSSProperties}
            />
            <div
              className={styles.tabs}
              role="tablist"
              aria-label="Installation process"
              aria-orientation="horizontal"
              onKeyDown={onTabKeyDown}
            >
              {processSteps.map((item, index) => (
                <button
                  key={item.index}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={"process-tab-" + index}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-controls="process-panel"
                  tabIndex={index === active ? 0 : -1}
                  className={styles.tab}
                  onClick={() => activate(index, false)}
                >
                  <span className={cx(styles.mono, styles.tabNum)}>{item.index}</span>
                  <span className={styles.tabLabel}>{item.title}</span>
                  <span className={cx(styles.mono, styles.tabNote)}>{item.note}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelRule} aria-hidden="true">
            <span className={styles.ruleLead} />
            <span className={styles.ruleLine} />
          </div>

          <div
            id="process-panel"
            role="tabpanel"
            aria-labelledby={"process-tab-" + active}
            className={styles.panelGrid}
          >
            <div className={styles.panelLeft}>
              <p className={styles.stepMeta}>
                <span className={cx(styles.mono, styles.stepIndex)}>Step {step.index} / {pad(TOTAL)}</span>
                <span className={cx(styles.mono, styles.stepNote)}>{step.note}</span>
              </p>
              <h3 key={"title-" + active} className={styles.stepTitle}>{step.title}</h3>
              <span className={cx(styles.mono, styles.stepBodyLabel)}>What happens</span>
              <p key={"body-" + active} className={styles.stepBody}>{step.body}</p>
              <div className={styles.stepGauge} aria-hidden="true">
                {processSteps.map((item, index) => (
                  <span key={item.index} className={index <= active ? styles.gaugeOn : styles.gaugeOff} />
                ))}
              </div>
            </div>

            <div className={styles.panelRight}>
              <figure className={styles.figure}>
                <span className={cx(styles.corner, styles.cornerTL)} aria-hidden="true" />
                <span className={cx(styles.corner, styles.cornerTR)} aria-hidden="true" />
                <span className={cx(styles.corner, styles.cornerBL)} aria-hidden="true" />
                <span className={cx(styles.corner, styles.cornerBR)} aria-hidden="true" />
                <div className={styles.figureCanvas}>
                  <Figure key={"fig-" + active} index={active} live={inView} />
                </div>
                <figcaption className={styles.figureCap}>
                  <span className={cx(styles.mono, styles.figCapMain)}>Fig. {step.index} — {step.note}</span>
                  <span className={cx(styles.mono, styles.figCapSide)}>N.T.S.</span>
                </figcaption>
              </figure>
            </div>
          </div>

          <div className={styles.panelNav}>
            <span className={cx(styles.mono, styles.panelNavCount)} aria-hidden="true">
              {step.index} / {pad(TOTAL)} — {step.title}
            </span>
            <div className={styles.panelNavBtns}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => activate(prev, false)}
                aria-label={"Previous step: " + processSteps[prev].title}
              >
                <ArrowIcon direction="left" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => activate(next, false)}
                aria-label={"Next step: " + processSteps[next].title}
              >
                <span>Next</span>
                <ArrowIcon direction="right" />
              </button>
            </div>
          </div>

          <p className={styles.srOnly} aria-live="polite">Step {active + 1} of {TOTAL}: {step.title}</p>
        </div>

        <div className={styles.footNote} data-reveal>
          <p>
            <span className={styles.footTag}>Note — </span>
            Scope, equipment and after-sales terms are confirmed in writing before work begins.
          </p>
          <p className={styles.footMeta}>Process map — {pad(TOTAL)} steps</p>
        </div>
      </div>
    </section>
  );
}
