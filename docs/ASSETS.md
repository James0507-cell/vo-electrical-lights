# Asset pipeline — V.O Electrical Lights Trading

Every image the site serves is generated from the company's own photographs.
The pipeline is deterministic, idempotent and read-only on the originals:
photos are only ever **cropped, resized and recompressed** — no generative
edits, no retouching, no stock substitutes.

---

## TL;DR

```powershell
npm run assets       # media + brand assets + content/image-manifest.json
npm run assets:og    # public/og.jpg (headless Chrome render)
```

Run both from the project root after changing anything in `content/projects.json`
or `assets-raw/photos/`. The site imports the manifest directly, so a rebuild
is all it needs — no app code changes.

---

## 1. Source of truth

| Path | What it is | Edited by |
| --- | --- | --- |
| `content/projects.json` | Curated projects + extras. Photo ids and their roles live here. | Owner / content editor |
| `assets-raw/photos/<photoId>-<W>x<H>.jpg` | 156 originals downloaded from the company's public Facebook page (2026-10-26). **Never modified.** | download only |
| `assets-raw/facebook-*.json` | Raw Facebook Graph responses used during curation (captions, timestamps, ids). | curation scripts |
| `content/image-manifest.json` | **Generated.** Dimensions, dominant colour, LQIP, width list and paths per id. | `npm run assets` |
| `public/media/` | **Generated.** Responsive AVIF/WebP/JPG derivatives. | `npm run assets` |
| `public/brand/`, `public/favicon.ico`, `public/icon-*.png`, `public/apple-touch-icon.png` | **Generated.** Logo + app icons. | `npm run assets` |
| `public/og.jpg` | **Generated.** 1200x630 social share card. | `npm run assets:og` |

The photo id is the Facebook photo id (digits only). Filename dimensions are the
**stored** pixel dimensions of the JPEG and are only used to pick the largest
original if a photo was downloaded more than once; the pipeline reads the real
dimensions with sharp and never upscales.

### Which ids are processed

The script walks `content/projects.json` and collects every id in:

- `projects[].cover` and `projects[].photos[]`
- `extras.heroPoster`, `extras.og`, `extras.fieldStrip[]`
- `extras.about.*`, `extras.services.*`, `extras.products[].id`

Currently **70 unique ids** are referenced and every one of them has a manifest
entry and files. The run ends with a coverage proof line
(`coverage proof: 70 referenced ids / 71 manifest keys -> complete`) and exits
non-zero if an original or an output is missing.

---

## 2. Photo derivatives — width and quality policy

### Widths

Requested target widths: **480 / 960 / 1600 / 2400**.

A target is only produced when it fits inside the source image — **nothing is
ever upscaled**. Sources narrower than 960 px also get their native width, so a
640 px original becomes `[480, 640]` instead of being stretched to 960.
The largest original is 2048 px wide, so no photo gets a 2400 px variant; large
sources top out at 1600 px. The exact list is published per id in the manifest's
`widths` array and consumed by `lib/images.ts#buildSrcSet`.

### Formats and quality

| Format | Settings | Purpose |
| --- | --- | --- |
| AVIF | `quality: 54, effort: 4` | primary format — best bytes/quality for these photographs |
| WebP | `quality: 76, effort: 6` | second source for browsers without AVIF |
| JPEG | `quality: 80, mozjpeg: true`, width `min(960, sourceWidth)` | one universal fallback per photo |
| LQIP | 24 px wide WebP, `quality: 55`, inlined as `data:image/webp;base64,…` | instant blurred placeholder, no extra request |

The brief's nominal quality is q≈58 / q≈80 / q≈82 and a straight run at those
values produced **60.2 MB** for the photo set. The values above are the measured
compromise that keeps a premium look at roughly half the bytes; they live in one
`QUALITY` constant at the top of `scripts/build-assets.mjs`. Change them
there and rerun with `--force`.

Sharp is told to `.rotate()` first (EXIF orientation applied) and every
derivative is written without metadata, so no EXIF/GPS leaves the originals.

### Output layout

```
public/media/<photoId>/<photoId>-480.avif
public/media/<photoId>/<photoId>-480.webp
public/media/<photoId>/<photoId>-960.avif
public/media/<photoId>/<photoId>-960.webp
public/media/<photoId>/<photoId>-960.jpg      # fallback
public/media/<photoId>/<photoId>-1600.avif    # only when the source allows it
…
```

Filenames are stable and content-addressed only by id + width — that is what the
manifest, the site and QA all rely on.

### Hero poster set (optional art assets)

`npm run assets` also writes a poster set from `extras.heroPoster` (currently
`876920137996309`):

```
public/media/hero/poster-960.{avif,webp,jpg}
public/media/hero/poster-1600.{avif,webp,jpg}
public/media/hero/poster-2400.{avif,webp,jpg}
```

The source is 2048 px wide. The **poster-2400 files are the single documented
resample in the pipeline** (1.17× Lanczos upscale) because the brief explicitly
asks for a 2400 px poster slot. `hero.nativeWidth: 2048` in the manifest
records the true source width; treat poster-2400 as a scaled slot, not new detail.

---

## 3. `content/image-manifest.json`

Flat map: one key per photo id plus `hero`. Regenerated on every media run
(cheap) so it can never drift from the files on disk.

```json
{
  "871987788489544": {
    "width": 1536,
    "height": 2048,
    "aspect": 0.75,
    "color": "#1d2530",
    "lqip": "data:image/webp;base64,…",
    "widths": [480, 960],
    "hasJpg": true,
    "avif": { "480": "/media/…/871987788489544-480.avif", "960": "…-960.avif" },
    "webp": { "480": "/media/…/871987788489544-480.webp", "960": "…-960.webp" },
    "src": "/media/871987788489544/871987788489544-960.webp",
    "jpg": "/media/871987788489544/871987788489544-960.jpg"
  },
  "…": {},
  "hero": {
    "id": "876920137996309",
    "width": 2048,
    "height": 1152,
    "aspect": 1.7778,
    "color": "#22391b",
    "lqip": "data:image/webp;base64,…",
    "widths": [960, 1600, 2400],
    "nativeWidth": 2048,
    "avif": { "960": "/media/hero/poster-960.avif", "…": "…" },
    "webp": { "…": "…" },
    "jpg":  { "…": "…" },
    "poster": "/media/hero/poster-1600.jpg"
  }
}
```

| Field | Meaning |
| --- | --- |
| `width` / `height` | original (post-rotation) pixel size |
| `aspect` | `width / height`, 4 decimal places — use for layout/padding |
| `color` | dominant colour, quantised 32×32 histogram (5 bits/channel), averaged in the winning bucket |
| `lqip` | 24 px wide WebP as data URI; assign to CSS `background-image` behind the img |
| `widths` | exactly the widths produced for this photo (ascending) |
| `hasJpg` | true when the 960-or-native JPEG fallback exists |
| `avif` / `webp` | width → URL maps used to build `<source srcset>` |
| `src` | sensible single default (1600 WebP when available, else largest) |
| `jpg` | JPEG fallback URL |
| `poster` | (hero only) JPEG to pass to `<video poster>`, 1600 px |

Consumers: `lib/images.ts#getImage` and `lib/images.ts#buildSrcSet`.
Unknown ids fall back to the hero entry, and the manifest is validated by the
pipeline (JSON parse, colour format, LQIP data URI, aspect consistency, file
existence) — the run prints the coverage proof.

---

## 4. Brand assets (logo, favicons, app icons)

All generated by `npm run assets` from the one authentic logo photo:
`assets-raw/photos/563955069292819-561x545.jpg`. The mark is **not
redesigned** — it is the company's yellow/blue circular badge, cropped and
re-composited.

### What that file actually is

The JPEG is the Facebook profile picture rendered on top of the page's cover
photo: a circular badge on a blue photographic background, with leftover
promotional text ("…ES", "CON…", "Lighting Solutions") in the bottom corners
**outside the circle**. A plain square crop therefore keeps slivers of that
watermark and the blue banner corners.

### What the pipeline does

1. Crop a 545×545 square starting at x = 8 (as briefed) — the badge is
   vertically centred there.
2. Detect the badge circle on the crop with a radial edge scan (yellow ring vs
   blue background) plus a robust Kåsa circle fit:
   centre ≈ (279.4, 272.8), radius ≈ 260.4 px in the 545 crop.
3. Extract a square window centred on that circle, resize and apply an
   anti-aliased circular alpha mask inset 1.6 px so no blue anti-alias fringe
   survives. The mark is re-centred in the output canvas.
4. Export the transparent circular mark at 512 / 256 / 128 px (PNG8 palette,
   quality 100) plus `logo-64.webp` and `logo.webp`. The palette PNG is
   visually identical here and ~5× smaller than truecolour
   (128 KB instead of 670 KB at 512 px).
5. Opaque app icons (`icon-192.png`, `icon-512.png`,
   `apple-touch-icon.png`) place the badge on the ink `#070A0F` canvas at
   ~78–80% size, keeping a maskable safe margin and avoiding the black background
   iOS puts behind transparency.
6. `favicon.ico` is a standard ICO container holding PNG payloads at
   **16, 32 and 48 px** (understood by current browsers and Windows Vista+).
   Sharp has no ICO writer, so the container is assembled in the script — no new
   dependency.

The transparent circular mark is used because the badge *is* the authentic logo;
the blue banner corners and corner watermark are Facebook page furniture, not
logo artwork. Nothing is redrawn, recoloured or retouched.

### Files

| File | Size | Use |
| --- | --- | --- |
| `public/brand/logo-512.png` | 512², transparent | JSON-LD organisation logo, large lockups |
| `public/brand/logo-256.png` | 256², transparent | large header / footer lockups |
| `public/brand/logo-128.png` | 128², transparent | header logo, OG lockup, social avatar |
| `public/brand/logo-64.webp` | 64², transparent | small UI marks |
| `public/brand/logo.webp` | 512², transparent | WebP variant for `<picture>` |
| `public/favicon.ico` | 16/32/48 | browser tab |
| `public/icon-192.png`, `public/icon-512.png` | ink canvas | PWA / Android (see `app/layout.tsx` icons) |
| `public/apple-touch-icon.png` | 180², ink canvas | iOS home screen |

---

## 5. Social share image — `public/og.jpg`

Generated by `scripts/make-og.mjs` / `npm run assets:og`:

- A designed 1200×630 HTML page — ink `#08090B`, solar yellow `#FFD21E`,
  warm paper `#F2EDE1`; **Archivo Variable** (heavy, expanded, uppercase) for
  the headline and IBM Plex Mono for labels — rendered in **headless Chrome via
  Playwright**, screenshotted at 2× and downsampled with sharp, then saved as a
  mozjpeg JPEG (~110 KB).
- Fonts come from `node_modules/@fontsource/…` and are inlined as base64, so the
  render is offline and deterministic. Chrome launches with
  `channel: 'chrome'` and falls back to Playwright's bundled Chromium if Chrome
  is not installed (no new npm dependency, no browser download needed).
- Background is the company's own aerial rooftop photograph (`876920137996309`,
  green commercial roofs), graded darker under a left-to-right ink wash so the
  type reads. The script crops the frame to keep the Facebook corner badge out
  of shot. Text: brand lockup, headline `WE WIRE THE SUN.` (yellow "SUN."),
  deck `SOLAR INSTALLATION · ELECTRICAL SUPPLY · STREET LIGHTING`, phone
  `0992 659 5090` and a "PHILIPPINES" tag.
- Re-run `npm run assets:og` whenever the OG photo id, palette or headline
  changes. The 2× capture is temporary and deleted by the script.

---

## 6. Adding new photos / projects (owner workflow)

1. Save the original into `assets-raw/photos/` as
   `<photoId>-<W>x<H>.jpg` (W/H = actual pixel dimensions; ids must be
   stable — use the Facebook photo id or a slug id).
2. Reference the id from `content/projects.json` — as a project cover, inside
   `photos[]`, or in an `extras` slot (heroPoster, og, fieldStrip, about,
   services, products).
3. Run `npm run assets`. New derivatives appear under
   `public/media/<id>/`, the manifest gains the entry, stale outputs from old
   width policies are pruned automatically.
4. If the new image becomes the OG image, update the photo path in
   `scripts/make-og.mjs` and run `npm run assets:og`; the hero poster set is
   rebuilt by step 3.
5. `npm run build` to verify the static export.

Deleting a photo id from `content/projects.json` does not delete its files —
the manifest only advertises referenced ids, and the orphan folder can be removed
by hand when the image is no longer used at all.

### Rules of thumb

- Keep `assets-raw/` in the repo — it is the only source for regenerating
  assets and is only a few MB of JPEGs.
- Do not hand-edit anything under `public/media`, `public/brand` or
  `content/image-manifest.json`; the next run overwrites it.
- Re-run with `--force` after changing `QUALITY`, `MEDIA_TARGET_WIDTHS` or
  the logo crop; pruning removes orphans from the previous policy.

---

## 7. Flags, idempotency and pruning

```powershell
node scripts/build-assets.mjs                 # media + brand, skip fresh outputs
node scripts/build-assets.mjs --force         # rebuild every derivative
node scripts/build-assets.mjs --only=media    # photos + hero poster + manifest
node scripts/build-assets.mjs --only=brand    # logo + icons only
node scripts/build-assets.mjs --ids=871987788489544,876920137996309 --force
node scripts/build-assets.mjs --concurrency=4
node scripts/build-assets.mjs --quiet
```

- Outputs newer than their source are skipped unless `--force`.
- `--ids` re-encodes only those ids; the manifest is still rebuilt in full.
- Each id directory is pruned to exactly the files the current manifest
  advertises, so old 2048/2400 variants from earlier policies cannot linger.
- Exit code is non-zero if an encode fails, an original is missing, or the
  manifest coverage check fails.
- A warm run with nothing to do takes ~5 s (manifest + LQIP only). A cold
  `--force` run takes ~2 min on this machine.

---

## 8. Measured output (last run)

| Metric | Value |
| --- | --- |
| Photo ids referenced / manifest keys | 70 / 71 (70 ids + `hero`) |
| Files under `public/media` | **393** |
| Total `public/media` | **32.87 MB** |
| AVIF bytes | 10.80 MB |
| WebP bytes | 12.71 MB |
| JPEG fallback bytes | 9.35 MB |
| Hero poster set (9 files) | 2.10 MB |
| Brand folder + favicons/app icons | ≈ 0.38 MB (`public/brand` 248 KB, icons 131 KB) |
| `content/image-manifest.json` | 71 KB (~380-byte LQIP per entry) |
| Cold `--force` build | ~116 s |
| Warm idempotent run | ~5 s, 393 files skipped, 0 failures |

The stated acceptance target was <25 MB for `public/media`, but that is not
reachable at the brief's nominal q≈58/q≈80 for 70 detail-dense photographs
across 2–3 widths × 2 formats: a literal q58/q80 run measured **60.2 MB**.
This pipeline already trades ~7% quality (q54 AVIF / q76 WebP), strict
source-capped widths (no native 2048 variants) and palette-optimised brand PNGs
to reach **32.9 MB**. To push toward ~25 MB, lower
`QUALITY.avif.quality` to 46 and `QUALITY.webp.quality` to 70 and rerun
`npm run assets -- --force`; expect a visible softness on the largest
aerial photos. Pages only reference the manifest, so the trade can be tuned
without touching app code.

---

## 9. Provenance and licensing (important)

- All photographs come from the **company's own public Facebook page**, downloaded
  on 2026-10-26; ids are Facebook photo ids. Captions and posting dates are kept
  in `content/projects.json` (`sourceCaption` / `sourceNote`) for provenance.
- Copyright remains with **Villanueva-Ong Electrical Lights Trading**. Using the
  photos on the company's own website is the intended use; this repository is a
  demonstration build and does **not** grant any third-party licence to reuse,
  resell or redistribute the photography or the logo.
- Facebook's terms do not transfer ownership. Before a public launch the owner
  should confirm in writing that their site may use every selected photo (a few
  show identifiable staff or client sites).
- No generative or content-altering edits are performed: only crop, resize,
  format conversion, metadata stripping and the circular logo crop for icons.
  The OG and hero poster imagery comes from real company photographs; the
  headline/text over the OG is added design, not a depiction of a different
  installation.

---

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Missing curated source: content/projects.json` | run from the project root; the pipeline resolves the project folder from its own path |
| `no original in assets-raw/photos` | the id is referenced but has no `<id>-<W>x<H>.jpg`; add the original or remove the reference |
| `MISSING output files` at the end of a run | usually a sharp failure — read the `FAILED` lines and rerun `--force --ids=<id>` |
| Chrome not found for `assets:og` | Playwright falls back to bundled Chromium; otherwise `npx playwright install chromium` (no package.json change) |
| OG fonts look like Times | `node_modules/@fontsource/…` is missing — `npm ci` in the project root |
| Sharp install errors on Windows | `npm rebuild sharp` |
| Media folder unexpectedly large | an older width policy is still on disk — rerun `npm run assets -- --force`; pruning removes orphans |
| Manifest and disk disagree after a manual delete | `npm run assets` regenerates missing files and the manifest |

---

## 11. Decisions worth knowing

- **Strict width capping** — target widths above the source are dropped rather
  than upscaled; that is why a 1536 px photo has `[480, 960]` and a 2048 px photo
  `[480, 960, 1600]`. Photographs below 960 px keep their native width.
- **Hero poster 2400** — the only resample in the pipeline (documented above).
- **LQIP** is a 24 px WebP data URI (not a hash string): no client decoder and
  no extra request.
- **Dominant colour** is a quantised histogram of a 32×32 thumbnail (most
  frequent 5-bit RGB bucket, averaged within the bucket).
- **Logo transparency** — the circular mask removes Facebook page furniture
  (cover-photo corners + corner watermark) while keeping the badge artwork
  pixel-for-pixel.
- **Package scripts** `assets` / `assets:og` already existed in `package.json`;
  this pipeline fills them in without adding dependencies (sharp + playwright
  were already installed).
- **OG crop** — the corner badge watermark is a real part of the downloaded
  photos; it is cropped out of the OG framing only (no retouching). Other site
  photos keep the watermark because it is part of the authentic company capture.
