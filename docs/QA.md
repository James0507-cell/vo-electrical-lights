# QA report — V.O Electrical Lights Trading website

Final verification run against the **production static export** served at
`http://localhost:3100` (built with `npm run build`, served with `node scripts/serve.mjs`).

Date: 2026-10-27 · Dataset: 17 projects / 56 project photographs · Node 24 · Chrome 156 (headless)

---

## Automated functional + accessibility suite

```bash
npm run build
npm run start          # serves out/ on :3100
node scripts/qa-smoke.mjs
```

**Result: 72 / 72 checks passed, 0 console errors, 0 page errors, 0 failed network requests.**

Covered flows:

| Area | Checks |
|---|---|
| Meta | title, one `h1`, landmarks, skip link, heading order, all images have `alt`, all buttons named, all form fields labelled |
| Layout | no horizontal overflow at 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 |
| Hero | WebGL scene ready (desktop + mobile), `data-hero-scene=webgl`, **sun-study slider visibly changes the render**, `__solarTime` API updates, time label updates, live PHT clock |
| Services array | 6 cells, click/keyboard expands, detail copy present |
| Work reel | 6 featured projects, drag/arrow controls scroll the reel |
| Stockroom | 8 product cards, conveyor prev/next works, keyboard-scrollable region |
| System map | 5 tabs, click activates, arrow keys move activation, panel content updates |
| FAQ | native details/summary opens |
| Quote form | empty submit shows inline errors; valid submit produces the prepared-message panel and states **nothing was sent**; mailto built with the company address |
| Mobile | quote CTA hidden on small screens, burger visible, menu opens and locks scroll, Escape closes and returns focus |
| Reduced motion | page loads and renders without errors |
| Archive | 17 cards, 6 filter chips, filters reduce results + `aria-pressed`, lightbox opens with `role=dialog aria-modal`, arrow advances photo, Escape closes, **focus returns to the opening card**, deep link `?project=` reopens, archive images load |
| 404 | real 404 status and helpful copy |
| Images | all homepage + archive images decode (no missing media) |

Re-runnable screenshots: `shots/qa/`, plus teammate harnesses:
`shots/portfolio/qa/qa.mjs` (66 checks), `shots/experience/qa-experience.mjs` (53 checks),
hero captures in `shots/hero/`, final captures in `shots/final/`.

---

## Lighthouse (desktop navigation, production export)

| Page | Accessibility | Best practices | SEO | Agentic browsing |
|---|---|---|---|---|
| Home `/` | **100** | **100** | **100** | **100** |
| Archive `/work/` | **100** | **100** | **100** | **100** |

Fixes made from the audits: ticker given decorative semantics, nav accessible-name mismatch,
service-array invalid list roles, contrast raised across mono labels on ink/blue/yellow, stockroom
and archive micro-labels already token-based. Zero failed audits on the final run.

---

## Performance

- **First Load JS:** 148 kB home / 135 kB archive (shared 103 kB) — Three.js is lazy-loaded.
- **Hero WebGL:** 60 fps at 1440×900 and 390×844 (headless Chrome), 11 draw calls desktop / 9
  mobile, ~106k triangles. DPR capped (1.5 desktop / 1.25 mobile), render loop pauses when the
  scene is offscreen or the tab is hidden, full GPU disposal on unmount.
- **Media:** 393 optimised files, 32.9 MB total across AVIF/WebP/JPG. Pages load only the images in
  view (lazy + responsive srcset + LQIP placeholders). **The homepage does not download the whole
  media library.**
- **Fonts:** self-hosted variable Archivo + IBM Plex Mono, no third-party requests.

---

## Interaction-layer verification (second pass)

```bash
node scripts/qa-effects.mjs
```

Verified in headless Chrome against the production export:

- magnetic headline lifts 6+ characters under the pointer; pointer sunlight is active
- click on an array cell spawns 9 spark particles + 1 expanding ring
- quick reel scroll sets the drag-skew CSS variable (`--reel-skew` ≈ 3.2°), then decays to 0
- text scramble visibly runs on nav hover and restores the original label
- copy-phone writes to clipboard and shows the toast ("NUMBER COPIED")
- menu links stagger in on open; FAQ disclosure animates; image curtains reveal
- zero console/page errors while exercising all effects

Screenshots: `shots/effects/` (hero magnetic, CTA hover, array click/open, reel drag, stockroom
hover, system tab, FAQ open, contact copy, menu open). Reduced-motion run confirms all effects are
inert and content remains visible.

## Manual / visual verification

- Screenshots at 1440, 390 and 768 for home, archive, lightbox, mobile menu, system, stockroom and
  contact are in `shots/final/` (reviewed during the build).
- Keyboard walk-through: skip link → nav → menu → array → reel → stockroom → tabs → FAQ → form →
  archive filters → lightbox → close. All interactive states show visible focus.
- Reduced motion: hero renders a static composed frame; no auto animation that carries meaning.

---

## Known limitations (honest list)

1. **Quote form delivery is not configured.** Without `NEXT_PUBLIC_QUOTE_ENDPOINT` the form
   prepares an email/message and says so — it does **not** claim to send. Set an endpoint
   (Formspree/Web3Forms/serverless) to enable real submission and test it end-to-end.
2. **Hero is WebGL.** A CSS poster fallback and a static reduced-motion frame are provided, and the
   component degrades gracefully, but users with WebGL disabled get the fallback rather than the
   sun-study interaction.
3. **Business facts are owner-verifiable only.** Contents were sourced from the supplied brief and
   the company's public Facebook posts. DOE certification wording, service area, warranty terms and
   project metadata must be confirmed by the owner (see README).
4. **Portfolio filter state is not URL-encoded** (only the open project + photo are). Deep links to a
   filtered view are not supported; this is deliberate to keep the URL contract small.
5. **Photos are 561–2048 px Facebook downloads.** Large full-width crops on very wide screens can be
   soft; supply the original camera files to improve them.
6. **Lighthouse mobile was not run** (desktop scores shown). All viewports were exercised in
   Playwright; run PageSpeed Insights against the deployed URL for field/mobile data.
7. **Static hosting only.** There is no server runtime; form delivery, analytics or a CMS would be
   external services, documented in `docs/DEPLOY.md`.
