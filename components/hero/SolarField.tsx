"use client";

import { useEffect, useRef, useState } from "react";
import type { SolarSceneHandle } from "./solar/SolarScene";
import SolarFallback from "./SolarFallback";

/**
 * Hero visual: the procedural Three.js solar field.
 *
 * SSR renders the CSS poster; the three.js bundle is imported lazily inside the
 * effect so it never touches the server bundle or the window at module scope.
 * The canvas container carries data-hero-ready="true" after the first real frame
 * (or immediately for the no-WebGL fallback) for QA and e2e tests.
 */
export default function SolarField() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "webgl" | "fallback">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let handle: SolarSceneHandle | null = null;

    (async () => {
      try {
        const { createSolarScene } = await import("./solar/SolarScene");
        if (disposed) return;
        handle = createSolarScene(host, {
          onFirstFrame: () => {
            if (!disposed) setStatus("webgl");
          },
          onFail: () => {
            if (!disposed) setStatus("fallback");
          },
        });
      } catch (error) {
        console.warn("[hero] solar scene failed to initialise; keeping CSS poster.", error);
        if (!disposed) setStatus("fallback");
      }
    })();

    return () => {
      disposed = true;
      handle?.dispose();
      handle = null;
    };
  }, []);

  const settled = status !== "loading";

  return (
    <div
      ref={hostRef}
      className="vo-solar"
      aria-hidden="true"
      role="presentation"
      data-hero-ready={settled ? "true" : undefined}
      data-hero-scene={status === "loading" ? undefined : status}
    >
      <SolarFallback dim={status === "webgl"} />
    </div>
  );
}
