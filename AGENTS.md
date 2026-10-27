# Project instructions — vo-electrical-lights-trading

This folder is the **V.O Electrical Lights Trading** website ("SUN, WIRED." industrial-solar
direction), a self-contained benchmark project inside `C:\BechmarkTesting`. Work only inside this
folder; never read, copy from or modify other project folders in the workspace.

## Ownership map

| Area | Files | Owner |
|---|---|---|
| Design system | `app/globals.css`, `app/sections.css` | Lead |
| Layout / nav / footer | `app/layout.tsx`, `components/layout/`, `components/motion/`, `components/ui/` | Lead |
| Home narrative | `app/page.tsx`, `components/sections/*` (hero, ticker, array, reel, people, faq, contact, form) | Lead |
| Hero WebGL | `components/hero/**` | webgl-engineer |
| Portfolio | `app/work/**`, `components/portfolio/**` | portfolio-engineer |
| Stockroom + system map | `components/sections/experience/**` | experience-engineer |
| Media pipeline | `scripts/build-assets.mjs`, `scripts/make-og.mjs`, `public/media/**`, `public/brand/**`, `content/image-manifest.json` | asset-pipeline |
| Content data | `content/site.ts`, `content/creds.ts`, `content/projects.json`, `content/projects.ts` | Lead (owner edits later) |
| QA | `scripts/qa-*.mjs`, `tests/**`, `shots/**`, `docs/QA.md` | QA |

## Conventions

- TypeScript strict; no `any` unless unavoidable and commented.
- All photography via `components/media/VOImage.tsx` and the generated manifest — never hardcode
  image paths in components.
- No new dependencies without a clear need; the bundle is intentionally small.
- Respect `prefers-reduced-motion`: no essential information may depend on animation.
- Never fabricate business claims, project details, testimonials, prices or certifications.
  Unknown facts are omitted or marked as placeholders in the README.
- Static export (`output: 'export'`): no server actions, API routes, dynamic route params or runtime
  image optimisation.
- Run `npm run typecheck` (and `npm run build` when possible) before declaring work complete.

## Design direction

- Palette: `--ink #08090B`, `--paper #F2EDE1`, `--yellow #FFD21E`, `--blue #1B45E8`.
- Type: Archivo Variable (heavy, expanded, uppercase display) + IBM Plex Mono labels. No serifs.
- Hard edges (0–3px radius), hairlines, strong colour blocking, full-bleed photography.
- Motion is purposeful: sun study, array expansion, reel drag, tabbed system map; nothing decorative
  that blocks reading.

## Commands

```bash
npm run dev          # http://localhost:3100 (Lead owns the shared dev server during a build)
npm run build        # static export -> out/
npm run typecheck
npm run assets       # regenerate media + manifest + brand assets
node scripts/qa-smoke.mjs
```

## Benchmark isolation

Never inspect other folders under `C:\BechmarkTesting`. This project must be solved from its own
brief, assets and public references only.
