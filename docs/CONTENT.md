# Editing content

All editable content lives in **`content/`** — no CMS, no database. The site is rebuilt after a
change (`npm run build`).

| File | What it controls |
|---|---|
| `content/site.ts` | Company details, services, products, process steps, FAQ, small copy blocks |
| `content/creds.ts` | The four credential stamps in the About section |
| `content/projects.json` | Portfolio projects, their categories/tags/photos (the archive + home reel) |
| `content/image-manifest.json` | Generated image paths — do not edit by hand |
| `app/layout.tsx` | Page metadata (title/description/OG), JSON-LD business schema |
| `app/work/page.tsx` | Archive page metadata |

> ⚠️ Some sections have intentionally fixed ordering:
> - The **service array** displays `services` in array order (six items).
> - The **home work reel** displays a fixed list of six project slugs — edit `order` at the top of
>   `components/sections/WorkReel.tsx` to choose different projects.
> - The **featured project** artwork lives in `content/projects.json` (`cover`).

---

## Company details

Edit the `site` object in `content/site.ts`:

```ts
export const site = {
  legalName: "Villanueva-Ong Electrical Lights Trading",
  name: "V.O Electrical Lights Trading",
  telephoneDisplay: "0992 659 5090",
  telephoneHref: "+639926595090",
  email: "villanuevaongtrading@gmail.com",
  facebook: "https://www.facebook.com/profile.php?id=100070349910288",
  ...
};
```

These values feed the navigation, footer, contact section, quote form and JSON-LD. The
`NEXT_PUBLIC_SITE_URL` environment variable (see `docs/DEPLOY.md`) controls canonical URLs.

## Services (the home "array")

Each entry in `services` renders as one vertical cell:

```ts
{
  id: "residential",           // stable id
  index: "01",                 // display number
  title: "Residential Solar",  // full title shown when the cell is open
  short: "Rooftop systems for homes",
  navLabel: "Homes",           // short label shown when the cell is collapsed
  description: "…",
  points: ["Roof and load assessment", "…"],
  photoId: "989792480042407",  // a photo id present in content/image-manifest.json
}
```

Keep descriptions factual — they are shown to customers.

## Products (the yellow stockroom)

Each entry in `products`:

```ts
{
  id: "eco-vo-300w",
  name: "ECO V.O 300 W Solar Street Light",
  category: "Street lighting",
  blurb: "…",
  photoId: "874428934912096",
  tag: "In stock",             // optional yellow tag
}
```

The stock note under the list is in `components/sections/experience/Stockroom.tsx`.

## FAQ

Edit the `faqs` array in `content/site.ts`. The FAQ JSON-LD for search engines is generated from
the same array — answers must stay honest and match what the business can deliver.

## Credentials

Edit `content/creds.ts`. The wording should remain tied to evidence (the company's own posts or
certificates on file). The DOE claim is currently written as the company states it; replace with
the precise programme/certificate wording once confirmed by the owner.

---

## Adding a project (the most common update)

### 1. Prepare the photographs

Original photos go in `assets-raw/photos/`, named:

```
<id>-<width>x<height>.jpg
e.g.  my-new-project-01-2048x1536.jpg
```

- `id` must be unique and URL-safe. It becomes the media folder name.
- `width`/`height` are the real pixel dimensions (the pipeline uses them for sanity checks and
  uses the actual file dimensions anyway).
- Use the largest originals you have. The pipeline never upscales beyond the source.
- Photos are cropped for the web, so keep the subject away from the extreme edges.
- Get the owner's permission for photos showing identifiable staff or clients.

### 2. Add the project entry

In `content/projects.json` add an object to `projects`:

```json
{
  "slug": "my-new-project",
  "title": "Rooftop Solar — Example",
  "category": "Commercial",
  "tags": ["Commercial", "Solar"],
  "year": 2026,
  "date": "2026-03-01",
  "location": null,
  "capacity": null,
  "client": null,
  "summary": "One or two sentences shown on the card.",
  "description": "Longer description shown in the lightbox.",
  "cover": "my-new-project-01",
  "photos": ["my-new-project-01", "my-new-project-02"],
  "featured": false,
  "sourceCaption": "",
  "sourceNote": ""
}
```

Fields:

| Field | Notes |
|---|---|
| `slug` | Unique, lowercase, hyphens. Used in `/work/?project=slug`. |
| `category` | Primary label shown on the card (e.g. Residential, Commercial, Government, Agriculture, Street Lighting, Electrical Works, Supply & Delivery). |
| `tags` | Drive the filter chips. Use existing tags where possible: `Solar`, `Street Lighting`, `Electrical Works`, `Supply`, `Government`. |
| `year` / `date` | Use `null` if unknown — the UI hides them. |
| `location` / `capacity` / `client` | Optional; `null` hides them. **Do not guess.** |
| `summary` / `description` | Do not invent performance figures, savings or claims. |
| `cover` | The photo id used on cards/reel. Landscape (4/3 or 16/9) works best. |
| `photos` | Ordered list for the lightbox gallery. |
| `sourceCaption` / `sourceNote` | Optional provenance line (e.g. "Company Facebook post, March 2026"). |

### 3. Build the image variants

```bash
npm run assets
```

This reads every project + extras reference, generates AVIF/WebP/JPG at responsive widths, writes
the LQIP manifest and prunes unused media. See `docs/ASSETS.md` for options (`--force`, `--ids`).

### 4. Check and deploy

```bash
npm run dev     # open http://localhost:3100/work/?project=my-new-project
npm run build   # static site in out/
```

The archive, filters, counts and lightbox pick the new project up automatically. No component
changes are needed.

### Removing a project

Delete its entry from `content/projects.json` and its photos from `assets-raw/photos/`, then run
`npm run assets` — unreferenced media is pruned.

---

## Changing the home reel

Open `components/sections/WorkReel.tsx` and edit `order`:

```ts
const order = [
  "commercial-rooftop-arrays",
  "365kw-rooftop-solar-lgu",
  ...
];
```

Each slug must exist in `content/projects.json`.

## Regenerating the social share image

```bash
npm run assets:og
```

It renders `scripts/make-og.mjs` in headless Chrome (uses the Installed Chrome) and writes
`public/og.jpg` (1200×630).

## Meta titles / descriptions

- Home: `app/layout.tsx` → `metadata`.
- Archive: `app/work/page.tsx` → `metadata`.
- Business JSON-LD: bottom of `app/layout.tsx`.

Rebuild after changes. Test share previews with the Facebook Sharing Debugger / LinkedIn Post
Inspector once the production URL is live.
