"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import VOImage from "@/components/media/VOImage";
import { beyondSolar, products, site } from "@/content/site";
import styles from "./Stockroom.module.css";

const pad = (value: number) => String(value).padStart(2, "0");
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const supplyGroups = beyondSolar.groups;
const supplyCount = supplyGroups.reduce((total, group) => total + group.items.length, 0);

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className={styles.arrowIcon} viewBox="0 0 18 12" aria-hidden="true" focusable="false">
      <path
        d={direction === "left" ? "M17 6H2M6 1L1 6l5 5" : "M1 6h15M12 1l5 5-5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function UpRightIcon() {
  return (
    <svg className={styles.ctaArrow} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2 10 10 2M4.2 2H10v5.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}

export default function Stockroom() {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const sync = useCallback(() => {
    const track = scroller.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setProgress(max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0);
  }, []);

  useEffect(() => {
    const track = scroller.current;
    if (!track) return;
    sync();
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(track);
    return () => {
      track.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      observer?.disconnect();
    };
  }, [sync]);

  const nudge = useCallback((direction: 1 | -1) => {
    const track = scroller.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("." + styles.card);
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : Math.round(track.clientWidth * 0.8);
    const max = track.scrollWidth - track.clientWidth;
    const raw = track.scrollLeft + direction * step;
    const target = raw > max ? 0 : raw < 0 ? max : raw;
    track.scrollBy({ left: target - track.scrollLeft, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  const current = products.length > 1 ? Math.round(progress * (products.length - 1)) + 1 : 1;

  return (
    <section id="products" className={styles.section} aria-labelledby="products-title">
      <div className={styles.inner}>
        <div className={styles.meta} data-reveal>
          <p className={cx(styles.mono, styles.metaLabel)}>03 / Supply</p>
          <p className={cx(styles.mono, styles.metaAside)}>Stockroom — solar &amp; electrical</p>
        </div>

        <div className={styles.head}>
          <h2 id="products-title" className={styles.title}>
            <span className={styles.titleLine} data-reveal>We keep the</span>
            <span className={styles.titleLine} data-reveal style={{ "--d": "90ms" } as CSSProperties}>
              Shelf stocked.
            </span>
          </h2>

          <div className={styles.introRow}>
            <ul className={styles.facts} data-reveal style={{ "--d": "160ms" } as CSSProperties}>
              <li className={styles.fact}>
                <span className={cx(styles.mono, styles.factNum)}>{pad(products.length)}</span>
                <span className={cx(styles.mono, styles.factLabel)}>Product lines</span>
              </li>
              <li className={styles.fact}>
                <span className={cx(styles.mono, styles.factNum)}>{pad(supplyCount)}</span>
                <span className={cx(styles.mono, styles.factLabel)}>Supply items</span>
              </li>
              <li className={styles.fact}>
                <span className={cx(styles.mono, styles.factNum)}>PH</span>
                <span className={cx(styles.mono, styles.factLabel)}>Nationwide delivery</span>
              </li>
            </ul>

            <div className={styles.intro} data-reveal style={{ "--d": "220ms" } as CSSProperties}>
              <p className={styles.introText}>{beyondSolar.intro}</p>
              <p className={cx(styles.mono, styles.bulk)}>
                <span className={styles.bulkMark} aria-hidden="true" />
                <span>
                  Bulk orders welcome —{" "}
                  <a className={styles.bulkLink} href={"tel:" + site.telephoneHref}>
                    {site.telephoneDisplay}
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.belt}>
          <div className={styles.beltHead} data-reveal>
            <div className={styles.beltLeft}>
              <p className={cx(styles.mono, styles.beltLabel)}>The shelf</p>
              <p className={cx(styles.mono, styles.beltCount)} aria-hidden="true">
                <strong>{pad(current)}</strong>
                <span className={styles.beltSlash}>/</span>
                {pad(products.length)}
              </p>
            </div>
            <div className={styles.arrows}>
              <button type="button" className={styles.arrow} onClick={() => nudge(-1)} aria-label="Show previous products">
                <ArrowIcon direction="left" />
              </button>
              <button type="button" className={styles.arrow} onClick={() => nudge(1)} aria-label="Show next products">
                <ArrowIcon direction="right" />
              </button>
            </div>
          </div>

          <div
            ref={scroller}
            className={styles.scroller}
            tabIndex={0}
            role="region"
            aria-label="Product conveyor — scroll sideways with the arrow keys"
          >
            {products.map((product, index) => (
              <article className={styles.card} key={product.id}>
                <div className={styles.plate}>
                  <VOImage
                    id={product.photoId}
                    alt={product.name + " — supplied by V.O Electrical Lights Trading"}
                    ratio="3 / 4"
                    sizes="(max-width: 640px) 82vw, (max-width: 1100px) 40vw, 24vw"
                    className={styles.img}
                  />
                  <span className={cx(styles.mono, styles.num)} aria-hidden="true">{pad(index + 1)}</span>
                  {product.tag ? <span className={cx(styles.mono, styles.tag)}>{product.tag}</span> : null}
                  <span className={cx(styles.mono, styles.chip)}>{product.category}</span>
                </div>
                <div className={styles.body}>
                  <h3 className={styles.name}>{product.name}</h3>
                  <p className={styles.blurb}>{product.blurb}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.progress} aria-hidden="true">
            <span className={styles.progressFill} style={{ "--progress": progress } as CSSProperties} />
          </div>
        </div>

        <div className={styles.extras}>
          <div className={styles.extrasHead} data-reveal>
            <h3 className={styles.extrasTitle}>Also in stock</h3>
            <p className={cx(styles.mono, styles.extrasMeta)}>
              {pad(supplyGroups.length)} groups — {pad(supplyCount)} lines
            </p>
          </div>

          <div className={styles.groups}>
            {supplyGroups.map((group, groupIndex) => {
              const prefix = group.title
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase())
                .join("");
              return (
                <section className={styles.group} key={group.title} aria-labelledby={"supply-group-" + groupIndex}>
                  <div className={styles.groupHead}>
                    <h4 id={"supply-group-" + groupIndex} className={styles.groupTitle}>{group.title}</h4>
                    <span className={cx(styles.mono, styles.groupCount)}>{pad(group.items.length)} lines</span>
                  </div>
                  <ul className={styles.list}>
                    {group.items.map((item, itemIndex) => (
                      <li className={styles.row} key={item}>
                        <span className={cx(styles.mono, styles.rowIndex)} aria-hidden="true">
                          {prefix}.{pad(itemIndex + 1)}
                        </span>
                        <span className={styles.rowName}>{item}</span>
                        <span className={styles.rowMark} aria-hidden="true">+</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <div className={styles.foot} data-reveal>
          <div className={styles.footNote}>
            <span className={cx(styles.mono, styles.noteLabel)}>Stock note</span>
            <p className={styles.note}>
              Models and stock change with supply. Ask us for current availability, capacities and bulk pricing.
            </p>
          </div>
          <div className={styles.footActions}>
            <Link className={styles.cta} href="/#contact">
              Ask for stock
              <UpRightIcon />
            </Link>
            <a className={cx(styles.mono, styles.call)} href={"tel:" + site.telephoneHref}>
              Call {site.telephoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
