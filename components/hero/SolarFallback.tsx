/**
 * CSS poster used as the first paint of the hero scene and as the graceful
 * no-WebGL fallback. Mirrors the WebGL composition with the "SUN, WIRED." palette:
 * ink sky, deep cobalt upper air, hot orange -> solar-yellow horizon, amber rimmed
 * panel rows, big low sun right of centre (upper-right on portrait).
 */
const CSS = `
.vo-solar { position: absolute; inset: 0; overflow: hidden; background: #08090b; }
.vo-solar-poster {
  position: absolute; inset: 0; overflow: hidden;
  background:
    radial-gradient(120% 90% at 69% 55%, rgba(255, 122, 47, 0.62) 0%, rgba(255, 157, 46, 0.30) 22%, rgba(255, 157, 46, 0) 58%),
    linear-gradient(180deg, #070a14 0%, #060b22 20%, #0a1a4e 38%, #143070 52%, #3a2540 61%, #7a321c 65%, #d05a1f 68%, #ff7a2f 70.5%, #ffb52c 72%, #ffd21e 73%, #6a4418 75.5%, #2a1d12 79%, #0b0b0c 86%, #08090b 100%);
  transition: opacity 1400ms cubic-bezier(0.16, 1, 0.3, 1);
}
.vo-solar-poster__horizon {
  position: absolute; left: -10%; right: -10%; top: 58%; height: 19%;
  background:
    radial-gradient(58% 100% at 69% 50%, rgba(255, 216, 46, 0.75) 0%, rgba(255, 122, 47, 0.42) 44%, rgba(255, 122, 47, 0) 78%),
    linear-gradient(180deg, transparent 0%, rgba(255, 140, 40, 0.22) 55%, transparent 100%);
  filter: blur(12px);
}
.vo-solar-poster__sun {
  position: absolute; left: 69%; top: 55%; width: 10vmin; height: 10vmin;
  transform: translate(-50%, -50%); border-radius: 50%;
  background: radial-gradient(circle, #fffdf4 0%, #fff3c8 26%, #ffd21e 52%, rgba(255, 160, 40, 0) 74%);
  box-shadow: 0 0 12vmin 6vmin rgba(255, 160, 52, 0.42), 0 0 34vmin 16vmin rgba(255, 122, 47, 0.22);
}
.vo-solar-poster__ground {
  position: absolute; left: 0; right: 0; bottom: 0; height: 34%;
  background:
    radial-gradient(58% 86% at 68% 0%, rgba(255, 150, 50, 0.14) 0%, transparent 70%),
    linear-gradient(180deg, #1c150e 0%, #0e0c0a 30%, #08090b 70%, #06070a 100%);
}
.vo-solar-poster__rows { position: absolute; left: -24%; right: -24%; bottom: 1%; height: 31%; overflow: hidden; }
.vo-solar-poster__row {
  position: absolute; left: 0; right: 0; height: 9%;
  background: linear-gradient(180deg, rgba(26, 22, 17, 0.94) 0%, rgba(9, 10, 12, 0.97) 46%, rgba(6, 7, 10, 0.99) 100%);
  border-top: 1px solid rgba(255, 210, 30, 0.34);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.55);
}
.vo-solar-poster__row:nth-child(1) { bottom: 2%; height: 15%; border-top-color: rgba(255, 210, 30, 0.18); }
.vo-solar-poster__row:nth-child(2) { bottom: 21%; height: 11%; border-top-color: rgba(255, 210, 30, 0.24); }
.vo-solar-poster__row:nth-child(3) { bottom: 35%; height: 8%; border-top-color: rgba(255, 210, 30, 0.34); }
.vo-solar-poster__row:nth-child(4) { bottom: 46%; height: 6%; border-top-color: rgba(255, 210, 30, 0.44); }
.vo-solar-poster__veil {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(8, 9, 11, 0.42) 0%, transparent 30%, transparent 58%, rgba(8, 9, 11, 0.36) 86%, rgba(8, 9, 11, 0.62) 100%);
}
@media (max-aspect-ratio: 1 / 1) {
  .vo-solar-poster {
    background:
      radial-gradient(120% 70% at 73% 31%, rgba(255, 122, 47, 0.60) 0%, rgba(255, 157, 46, 0.30) 26%, rgba(255, 157, 46, 0) 60%),
      linear-gradient(180deg, #070a14 0%, #060b22 18%, #0a1a4e 34%, #143070 47%, #3a2540 53%, #7a321c 57%, #d05a1f 59%, #ff7a2f 60.5%, #ffb52c 61.5%, #ffd21e 62.5%, #5e3c14 65%, #211510 69%, #08090b 100%);
  }
  .vo-solar-poster__horizon { top: 52%; height: 16%; }
  .vo-solar-poster__sun { left: 73%; top: 31%; width: 14vmin; height: 14vmin; }
  .vo-solar-poster__ground { height: 42%; }
  .vo-solar-poster__rows { height: 27%; bottom: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .vo-solar-poster { transition: none; }
}
`;

export default function SolarFallback({ dim = false }: { dim?: boolean }) {
  return (
    <div
      className="vo-solar-poster"
      aria-hidden="true"
      style={{ opacity: dim ? 0 : 1 }}
    >
      <div className="vo-solar-poster__horizon" />
      <div className="vo-solar-poster__sun" />
      <div className="vo-solar-poster__ground" />
      <div className="vo-solar-poster__rows">
        <div className="vo-solar-poster__row" />
        <div className="vo-solar-poster__row" />
        <div className="vo-solar-poster__row" />
        <div className="vo-solar-poster__row" />
      </div>
      <div className="vo-solar-poster__veil" />
      <style>{CSS}</style>
    </div>
  );
}
