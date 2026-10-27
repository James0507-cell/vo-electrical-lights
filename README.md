# V.O Electrical Lights Trading — website

A production-ready marketing site for **Villanueva-Ong Electrical Lights Trading (V.O)** — a solar
installation and electrical supply company in the Philippines. The site presents the company's
services, stock and completed projects, and turns interest into calls, messages or prepared
enquiries.

> **Concept — "SUN, WIRED."** An industrial-solar art direction: near-black ink, solar yellow and
> cobalt, oversized Archivo display type, technical mono labels, full-bleed project photography and
> hard-edged colour blocks. The hero is a procedural **Three.js solar field** with a draggable
> **sun study** control (dawn → noon → dusk) — an interactive, honest way to show how the work
> follows the sun. The rest of the page is a sequence of distinct scenes, not a stack of identical
> sections: an "array" of services, a draggable field-records reel, a yellow stockroom, an
> interactive system map, the crew and a direct contact block.

The site is a Next.js static export (`out/`), deployable to any static host.

---

## Contents

- [Quick start](#quick-start)
- [Stack](#stack)
- [Information architecture](#information-architecture)
- [Project structure](#project-structure)
- [Editing content](#editing-content)
- [Adding a project + photos](#adding-a-project--photos)
- [Contact form](#contact-form)
- [Environment variables](#environment-variables)
- [Build & deploy](#build--deploy)
- [Quality checks](#quality-checks)
- [Sources, assumptions & placeholders](#sources-assumptions--placeholders)
- [Missing information the owner must provide](#missing-information-the-owner-must-provide)
- [Docs](#docs)

---

## Quick start

```bash
cd vo-electrical-lights-trading
npm install
npm run dev          # http://localhost:3100
```

Node 18.18+ (built on Node 24).

```bash
npm run build        # static export -> out/
npm run start        # serve out/ on http://localhost:3100
npm run typecheck    # TypeScript
npm run assets       # regenerate responsive images + manifest + brand files
npm run assets:og    # regenerate the social share card
```

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, static export) | Static HTML per route for SEO, React for the interactive scenes, no server to maintain. |
| Language | TypeScript (strict) | Reliable content/data handling. |
| Styling | Hand-written CSS design system + CSS modules | Full art direction control, tiny CSS budget, no utility-class noise. |
| Motion | CSS transitions + IntersectionObserver + rAF | The interaction here is spatial (array, reel, sun control), so no animation library was needed. |
| 3D | Three.js (lazy-loaded, procedural, instanced) | A single hero scene, no downloaded models or HDRIs; supports the sun-time control and a static fallback. |
| Smooth scroll | Lenis (desktop only, disabled for reduced motion) | Consistent inertial feel without affecting native touch scrolling. |
| Images | Pre-built AVIF/WebP/JPG variants + LQIP manifest | Fast, layout-stable, static-host friendly. |
| Fonts | Self-hosted Archivo Variable (display/body) + IBM Plex Mono (labels) | Characterful industrial type, no third-party font requests. |

No database, no backend and no external service is required to run the site.

## Information architecture

| Section | What it does |
|---|---|
| **Hero** | "WE WIRE THE SUN." over a procedural solar field. Draggable sun study (05:00–19:00) changes the light; live PHT clock; credentials line; primary CTAs. |
| **Ticker** | Yellow service ticker — the company's full range at a glance. |
| **The Array (services)** | Six expandable vertical cells: residential, commercial & industrial, farms, solar irrigation, street lighting, ground-mounted. Hover/focus/click expands the cell. |
| **Field Records (reel)** | Draggable horizontal reel of six real projects with index, category, capacity where known; arrow keys and buttons supported; link to the full archive. |
| **Stockroom (supply)** | Solar-yellow commerce moment: eight product plates from the company's own stock, supply lists, bulk-orders CTA. |
| **System (process)** | Cobalt technical section: five-step process map as accessible tabs with generated line diagrams and detail panel. |
| **Crew / About** | The team, real photographs, credentials as stamps and factual stats. |
| **Questions** | Five plain answers about coverage, government projects, supply-only orders, quotations and warranty. |
| **Contact** | Giant phone number, email/Facebook, honest quote form that prepares a message (or posts to a configured endpoint). |
| **Field Records archive** (`/work/`) | 17 projects with filter chips, editorial grid (full-width chapter cards), and a full-screen accessible lightbox with project metadata and photo thumbnails. |

## Project structure

```
app/
  layout.tsx              fonts, metadata, JSON-LD, nav/footer, smooth scroll, cursor
  globals.css             tokens, reset, type system, nav, footer, buttons, reveal
  sections.css            section styles (hero, array, reel, people, faq, contact)
  page.tsx                home narrative
  work/page.tsx           Field Records archive (metadata + JSON-LD)
  sitemap.ts robots.ts manifest.ts not-found.tsx
components/
  hero/                   procedural Three.js solar field + CSS fallback
  sections/
    Hero.tsx              hero overlay + sun study control
    Ticker.tsx            yellow service ticker
    ServiceArray.tsx      interactive six-cell services array
    WorkReel.tsx          draggable project reel
    People.tsx            about / crew section
    Faq.tsx               questions + FAQ JSON-LD
    Contact.tsx           contact block
    QuoteForm.tsx         validated, honest enquiry form
    experience/
      Stockroom.tsx       yellow product stockroom section
      SystemDiagram.tsx   cobalt interactive process map
  portfolio/              archive grid + lightbox + types
  media/VOImage.tsx       responsive <picture> wrapper
  layout/ ui/ motion/     nav, footer, cursor, scroll progress, smooth scroll, reveals
content/
  site.ts                 company details, services, products, process, FAQ
  creds.ts                credential stamps
  projects.json           portfolio source data (edit to add projects)
  projects.ts             typed helpers + filters
  image-manifest.json     generated image metadata — do not edit
lib/                      types + image helpers
public/
  media/                  generated responsive photos (do not edit)
  brand/                  logo, favicons, app icons
  og.jpg                  social share image
scripts/
  build-assets.mjs        image/brand pipeline
  make-og.mjs             social card renderer
  shot.mjs / page-review.mjs / qa-smoke.mjs   QA helpers
assets-raw/               original photographs (gitignored)
docs/                     ASSETS.md, CONTENT.md, DEPLOY.md, QA.md
shots/                    QA screenshots (gitignored)
```

## Editing content

All copy lives in **`content/site.ts`**, **`content/creds.ts`** and **`content/projects.json`**.
No CMS needed. See [docs/CONTENT.md](docs/CONTENT.md) for the guided workflow.

Quick map:

- **Phone / email / Facebook / legal name** → `content/site.ts` → `site`.
- **Services (array)** → `services` (title, description, points, `photoId`, `navLabel`).
- **Products (stockroom)** → `products` (name, category, blurb, `photoId`, optional tag).
- **Process steps / FAQ / credential stamps** → `processSteps`, `faqs`, `content/creds.ts`.
- **Project content** → `content/projects.json`.
- **Home reel selection** → the `order` array in `components/sections/WorkReel.tsx`.
- **Metadata / JSON-LD** → `app/layout.tsx`, `app/work/page.tsx`.

## Adding a project + photos

1. Put originals in `assets-raw/photos/` named `<id>-<width>x<height>.jpg`.
2. Add an entry to `content/projects.json` (`slug`, title, category, tags, verified facts, `cover`,
   `photos`). Use `null` for anything you cannot verify — the UI hides those fields.
3. Run `npm run assets` to generate responsive variants + LQIP.
4. Preview `/work/?project=<slug>`, then `npm run build`.

The archive, filters, counts, home reel and lightbox are data-driven — no layout work required.
Full step-by-step: [docs/CONTENT.md](docs/CONTENT.md); pipeline details:
[docs/ASSETS.md](docs/ASSETS.md).

## Contact form

The form validates on the client and **never claims delivery unless it happened**:

- **Default (no configuration):** "Prepare my message" builds an email (with a preview, copy
  button, email-app link and Facebook link) and clearly states nothing was sent automatically.
- **With `NEXT_PUBLIC_QUOTE_ENDPOINT`:** the form POSTs JSON to that endpoint (Formspree, Web3Forms,
  a serverless function) and displays the real result. A honeypot field is included.

See [docs/DEPLOY.md](docs/DEPLOY.md) for endpoint options.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes for production | Canonical/OG/sitemap origin (no trailing slash). |
| `NEXT_PUBLIC_QUOTE_ENDPOINT` | optional | Enables real form submission. |

`NEXT_PUBLIC_*` values are inlined at build time — rebuild after changing them.

## Build & deploy

```bash
NEXT_PUBLIC_SITE_URL="https://www.example.com" npm run build
# upload out/ to any static host (Vercel, Netlify, Cloudflare Pages, cPanel, S3…)
```

Details, caching headers and the launch checklist: [docs/DEPLOY.md](docs/DEPLOY.md).

## Interaction & motion layer

The site has a deliberate micro-interaction layer (no animation library — CSS + a small pointer
effects module, all transform/opacity based):

- **Magnetic CTAs** — buttons, arrows, the burger and the phone number lean toward the cursor.
- **Magnetic headline** — the hero letters lift and glow as the pointer passes through them, with a
  soft pointer "sunlight" wash over the scene.
- **Context cursor** — the custom cursor reports what a thing does: `EXPAND`, `OPEN`, `DRAG`,
  `STOCK`, `CALL`, plus a slow sun-glow trail.
- **Text scramble** — nav links and primary CTA labels briefly decode from glyphs on hover.
- **Click sparks** — a small solar burst + expanding ring on interactive clicks.
- **Button sheen**, gold-fill footer wordmark, logo tilt, ticker reactions.
- **Services array** — specular sweep, opening stagger, baseline marker.
- **Field-reel physics** — cards skew with scroll velocity, sheen on hover, a travelling sun on the
  progress rail.
- **Stockroom plates** lift and grade on hover; system tabs lift and the blueprint catches a sheen;
  crew photos wash cobalt; credential stamps "press"; FAQ rows animate open.
- **Copy phone number** with a `NUMBER COPIED` toast (useful, not just decorative).
- **Scroll image curtains** — figures inside reveals uncover with a clip-path wipe.
- **Scroll-progress sun** rides the top rail.

All of it is disabled under `prefers-reduced-motion`; effects never carry essential information and
do not intercept keyboard or screen-reader navigation.

## Quality checks

- `npm run typecheck` — TypeScript strict.
- `npm run build` — static export must complete.
- `node scripts/qa-smoke.mjs` — Playwright flows, breakpoints, console errors, a11y spot checks.
- `node scripts/qa-effects.mjs` — interaction-layer verification + screenshots (magnetic headline,
  sparks, reel skew, copy toast, menu stagger).
- `node scripts/page-review.mjs <url> <w> <h> <prefix>` — sliced full-page screenshots for design
  review.
- Additional teammate QA harnesses: `shots/portfolio/qa/qa.mjs`,
  `shots/experience/qa-experience.mjs`, and hero captures in `shots/hero/`.
- Tested viewports: 390×844, 768×1024, 1024×768, 1440×900, 1920×1080, short screens (1440×650).
- Reduced motion is supported throughout (hero renders a static composed frame, no auto-reels,
  transitions disabled).
- Keyboard: skip link, nav/menu, services array, project reel, filters, lightbox, process tabs,
  FAQ, form. Visible focus styles everywhere.

**Verified results (production export):** Playwright 70/70 checks passed; Lighthouse desktop
**100 / 100 / 100 / 100** (Accessibility, Best Practices, SEO, Agentic Browsing) on both the home
page and the archive. First Load JS: 148 kB home / 135 kB archive.

Test details and known limitations: [docs/QA.md](docs/QA.md). Design rationale:
[docs/DESIGN.md](docs/DESIGN.md).

## Sources, assumptions & placeholders

**Supplied / verified:** business name, services, phone `0992 659 5090`, email, Facebook page, logo
and project photographs.

**Sourced from the company's public Facebook page** (captured 2026-10-26; quoted in project
`sourceNote` fields):

- The credential **DOE "Certified PV Solar Installer"** — repeated by the company in its own posts.
  The site states it as the company's own claim ("as stated on our project posts" in the About
  section); keep it only if the company can produce current proof.
- **PHILGEPS-ready / complete documents** for private and government projects.
- **Nationwide** equipment delivery.
- Installation experience in **Luzon and Mindanao**.
- Project facts used: 365 kW LGU rooftop, 75 kVA transformer for DENR Region 12, 100-unit solar
  street light batches, CCTV at Northern Maguindanao Police Station, FDAS works, LED walls,
  generator sets, solar road studs.
- The phrase **"Quality is our key."** is the company's own line from its posts.

**Editorial decisions:** project titles, categories and descriptions are written from the
photographs and the company's captions. No locations, capacities, client names, savings or
performance figures were invented. Null fields are hidden. There are **no testimonials, prices,
warranty terms, founding date or address** on the site because none were verified.

**Placeholders to replace before launch:** production domain in `NEXT_PUBLIC_SITE_URL`, optional
form endpoint, and any project fields the owner can now confirm.

## Missing information the owner must provide

1. **Office / warehouse address** and map pin.
2. **Operating hours** and preferred response channel (call, SMS, Messenger, email).
3. **Service-area confirmation** — which provinces are installation-ready vs supply-only.
4. **DOE certification details** — exact programme name, certificate number, validity, so the
   credential can be stated precisely (and proof kept on file).
5. **Warranty and after-sales terms** for panels, inverters, batteries and workmanship.
6. **Financing details** for the "zero-upfront" commercial option, if still offered.
7. **Project metadata** for `content/projects.json` — location, capacity, completion month/year,
   client type where shareable.
8. **Higher-resolution / vector logo** (supplied file is 561×545).
9. **Additional contact channels** (secondary mobile, Viber/WhatsApp, Google Business Profile).
10. **Form destination** — inbox or form-service endpoint for quote submissions.
11. **Privacy notice** if the form is connected.
12. **Photo permissions** — confirm rights/consent for every published photograph, especially
    identifiable staff and clients.

## Docs

- [docs/CONTENT.md](docs/CONTENT.md) — editing copy, adding projects, changing the home reel.
- [docs/ASSETS.md](docs/ASSETS.md) — image pipeline, manifest schema, quality settings.
- [docs/DEPLOY.md](docs/DEPLOY.md) — hosting, domain, env vars, form integration, launch checklist.
- [docs/QA.md](docs/QA.md) — what was tested, how to re-run it, known limitations.

## Credits

Design and build for Villanueva-Ong Electrical Lights Trading. All photography comes from the
company's own project files (public Facebook page), used as authentic reference material. The logo
remains the company's property. Typefaces: Archivo and IBM Plex Mono via Fontsource (open-source
licences).
