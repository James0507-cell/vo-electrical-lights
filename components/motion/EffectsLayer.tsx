"use client";

import { useEffect } from "react";

/**
 * "SUN, WIRED." interaction layer:
 *  - magnetic buttons / arrows / phone number
 *  - mono-label scramble on hover ([data-scramble])
 *  - click sparks + expanding ring
 *  - drag-velocity skew on the project reel
 * All effects are pointer-only, transform/opacity based, and fully disabled
 * under prefers-reduced-motion.
 */
export default function EffectsLayer() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce) return;

    const cleanups: Array<() => void> = [];
    const bound = new WeakSet<HTMLElement>();

    /* --------------------------------------------------------------------
       Magnetic elements
       -------------------------------------------------------------------- */
    const magneticSelector = [
      ".btn",
      ".nav__cta",
      ".nav__burger",
      ".reel__arrow",
      ".shelf__arrow",
      ".contact__phone",
      ".copy-phone button",
    ].join(",");

    const bindMagnetic = () => {
      if (!fine) return;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(magneticSelector));
      for (const el of nodes) {
        if (bound.has(el)) continue;
        bound.add(el);
        let raf = 0;
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const tick = () => {
          currentX += (targetX - currentX) * 0.22;
          currentY += (targetY - currentY) * 0.22;
          el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
          if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
            raf = requestAnimationFrame(tick);
          } else {
            raf = 0;
            if (targetX === 0 && targetY === 0) el.style.transform = "";
          }
        };
        const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

        const onMove = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const dx = event.clientX - (rect.left + rect.width / 2);
          const dy = event.clientY - (rect.top + rect.height / 2);
          const max = 10;
          targetX = Math.max(-max, Math.min(max, dx * 0.16));
          targetY = Math.max(-max, Math.min(max, dy * 0.16));
          el.classList.add("is-magnetic");
          kick();
        };
        const onLeave = () => {
          targetX = 0;
          targetY = 0;
          el.classList.remove("is-magnetic");
          kick();
        };

        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          if (raf) cancelAnimationFrame(raf);
        });
      }
    };

    /* --------------------------------------------------------------------
       Text scramble (mono labels / nav links)
       -------------------------------------------------------------------- */
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+×";
    const scrambleBound = new WeakSet<HTMLElement>();
    const bindScramble = () => {
      if (!fine) return;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-scramble]"));
      for (const el of nodes) {
        if (scrambleBound.has(el)) continue;
        scrambleBound.add(el);
        const original = el.textContent ?? "";
        let timer = 0;
        let busy = false;
        const run = () => {
          if (busy || !original.trim()) return;
          busy = true;
          let frame = 0;
          const total = 7;
          window.clearInterval(timer);
          timer = window.setInterval(() => {
            const progress = frame / total;
            el.textContent = original
              .split("")
              .map((char, index) => {
                if (char === " ") return " ";
                if (index / Math.max(1, original.length) < progress) return char;
                return glyphs[Math.floor(Math.random() * glyphs.length)];
              })
              .join("");
            frame += 1;
            if (frame > total) {
              window.clearInterval(timer);
              el.textContent = original;
              busy = false;
            }
          }, 34);
        };
        el.addEventListener("pointerenter", run);
        cleanups.push(() => {
          window.clearInterval(timer);
          el.removeEventListener("pointerenter", run);
          el.textContent = original;
        });
      }
    };

    /* --------------------------------------------------------------------
       Click sparks + ring
       -------------------------------------------------------------------- */
    let sparkLayer: HTMLDivElement | null = null;
    const getSparkLayer = () => {
      if (sparkLayer) return sparkLayer;
      sparkLayer = document.createElement("div");
      sparkLayer.className = "fx-layer";
      sparkLayer.setAttribute("aria-hidden", "true");
      document.body.appendChild(sparkLayer);
      return sparkLayer;
    };

    const burst = (x: number, y: number) => {
      const layer = getSparkLayer();
      const count = 9;
      for (let i = 0; i < count; i += 1) {
        const spark = document.createElement("span");
        spark.className = "fx-spark";
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 34 + Math.random() * 62;
        const size = 3 + Math.random() * 5;
        spark.style.left = x + "px";
        spark.style.top = y + "px";
        spark.style.width = size + "px";
        spark.style.height = size + "px";
        spark.style.background = i % 4 === 0 ? "#1b45e8" : "#ffd21e";
        layer.appendChild(spark);
        const anim = spark.animate(
          [
            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
            {
              transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`,
              opacity: 0,
            },
          ],
          { duration: 520 + Math.random() * 340, easing: "cubic-bezier(.16,1,.3,1)" }
        );
        anim.finished.then(() => spark.remove()).catch(() => spark.remove());
      }
      const ring = document.createElement("span");
      ring.className = "fx-ring";
      ring.style.left = x + "px";
      ring.style.top = y + "px";
      layer.appendChild(ring);
      const ringAnim = ring.animate(
        [
          { transform: "translate(-50%, -50%) scale(.2)", opacity: 0.9, borderWidth: "2px" },
          { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0, borderWidth: "1px" },
        ],
        { duration: 620, easing: "cubic-bezier(.16,1,.3,1)" }
      );
      ringAnim.finished.then(() => ring.remove()).catch(() => ring.remove());
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const hit = target?.closest?.(
        "a, button, [role='button'], .array__cell, .reel__card, #products article"
      );
      if (!hit) return;
      burst(event.clientX, event.clientY);
    };
    document.addEventListener("click", onClick);

    /* --------------------------------------------------------------------
       Reel drag velocity -> skew
       -------------------------------------------------------------------- */
    const reelBound = new WeakSet<HTMLElement>();
    const bindReels = () => {
      const reels = Array.from(document.querySelectorAll<HTMLElement>(".reel"));
      for (const reel of reels) {
        if (reelBound.has(reel)) continue;
        reelBound.add(reel);
        let last = reel.scrollLeft;
        let decay = 0;
        const onScroll = () => {
          const delta = reel.scrollLeft - last;
          last = reel.scrollLeft;
          if (Math.abs(delta) < 0.5) return;
          const skew = Math.max(-3.2, Math.min(3.2, delta * 0.055));
          reel.style.setProperty("--reel-skew", skew.toFixed(2) + "deg");
          window.clearTimeout(decay);
          decay = window.setTimeout(() => reel.style.setProperty("--reel-skew", "0deg"), 140);
        };
        reel.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => {
          reel.removeEventListener("scroll", onScroll);
          window.clearTimeout(decay);
        });
      }
    };

    /* --------------------------------------------------------------------
       Bind + keep in sync with client-rendered content (filter grids, panels)
       -------------------------------------------------------------------- */
    const bindAll = () => {
      bindMagnetic();
      bindScramble();
      bindReels();
    };
    bindAll();

    let mutationTimer = 0;
    const observer = new MutationObserver(() => {
      window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(bindAll, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(mutationTimer);
      document.removeEventListener("click", onClick);
      cleanups.forEach((fn) => fn());
      sparkLayer?.remove();
      sparkLayer = null;
    };
  }, []);

  return null;
}
