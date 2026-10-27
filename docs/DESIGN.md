# Design rationale — "SUN, WIRED."

A working note on the decisions behind the site: the direction, the references that shaped it, the
interaction model, and the trade-offs. Useful for the owner, a future designer, or anyone extending
the project.

---

## 1. The brief behind the brief

V.O Electrical Lights Trading is not a solar startup with a seed round; it is a family-run trading
house and installation crew in the Philippines that installs solar for homes, farms, businesses and
government clients, and supplies the electrical hardware behind it. Its strongest assets are:

- **Real work photographs** — rooftops, ground mounts, inverters, street lights, transformers,
  CCTV, training sessions, the warehouse.
- **Range** — residential, industrial, agricultural, public infrastructure, supply-only.
- **A straight-talking identity** — "Quality is our key.", "We design. We supply. We install.",
  PHILGEPS-ready documents.

The first design iteration used an editorial serif, cream/ink sections and a "day-cycle" narrative.
It was polished but sat in a well-known contemporary awards template: eyebrow label, big serif
headline, image grid, repeat. It did not feel like *this* company, and the owner said so.

## 2. The direction

**"SUN, WIRED."** — industrial solar as a craft and an infrastructure business.

- **Black + solar yellow + cobalt + warm white.** The logo's own blue and yellow, pushed into a
  confident, high-contrast system. Yellow is used as a structural material (ticker, stockroom,
  markers) rather than decoration.
- **Archivo Variable at heavy weights and expanded width**, uppercase, with tight tracking. Big
  enough to be the image. IBM Plex Mono for measurements, labels, tags and technical notes.
- **Hard edges, hairlines, no soft cards.** The site should feel engineered, not "lifestyle".
- **Full-bleed real photography** carries the proof; the interface stays out of its way.
- **A floating paper nav bar** keeps navigation legible over every scene and gives the site a
  physical, product-like object at the top of the page.

## 3. References studied (and what was taken, not copied)

We reviewed the Awwwards winners named in the brief and a few others to isolate transferable
principles, not layouts:

| Reference | What it demonstrated | What we adapted |
|---|---|---|
| **Scout Motors** | Cinematic full-bleed media, floating nav, huge bottom-anchored type, reservation flow | Full-bleed hero with oversized type, floating nav bar, one clear primary action |
| **Jeton** | Product UI as art, oversized words, capsule navigation, playful weight | The ticker/word-scale contrast, pill CTAs, confidence with empty space |
| **Aramco — Shoot for the Future** | Flat colour fields, monumental uppercase sans, minimal chrome | The yellow and cobalt colour-block sections, huge section headlines |
| **Stripe Dot Dev** | Technical grid, mono labels, giant type, wit in the details | Mono measurements, index tags, technical line drawings, crossing rules |
| **Wise Design** | Design-system rigour as a brand statement, accessibility | Consistent tokens, reduced-motion support, focus states, restrained palette |
| **Hubtown / Bulgari / Max Mara / Indigo / Penelope** | Narrative scroll, product-as-expedition, sound-first identity | Kept the narrative ambition but rejected heavy scroll hijacking and audio; a solar installer's site must stay fast and usable |

The throughline of all of them is **restraint**: one strong idea per screen, real content treated as
the hero, motion that clarifies rather than performs.

## 4. Structure — why these scenes

| Scene | Decision | Why |
|---|---|---|
| **Hero + sun study** | Procedural Three.js solar field; a "sun study" slider (05:00–19:00) visibly changes the light | Solar is about the sun's position; letting a visitor *move the sun* explains the product better than a stock photo. It is honest: the scene is an illustration, not a claim. |
| **Ticker** | Yellow service ticker | Instantly communicates range in the brand's strongest colour; adds pace after the cinematic hero. |
| **The Array** | Six vertical cells that expand on hover/focus/click | A solar array is literally a grid of cells. The metaphor drives the interaction, keeps all six services in one screen, and works with keyboard and touch. |
| **Field Records reel** | Draggable horizontal reel of real projects | The photographs are the proof; a reel gives them cinematic scale and breaks the vertical rhythm. Native scroll-snap + drag + arrows + keyboard keeps it usable. |
| **Stockroom** | Full-yellow commerce block, black product plates | The trading side deserves its own visual world. Yellow is ownable and makes the stock feel like an event; black plates make product photos readable. |
| **System map** | Cobalt technical section with five accessible tabs and generated line diagrams | The process is the trust story for a contractor. A diagram beats a row of icons; tabs keep it scannable and keyboard accessible. |
| **Crew / About** | Real photographs, credential stamps, factual stats | Faces and evidence build more trust than a manifesto. The "quality is our key" line is the company's own. |
| **Contact** | Huge phone number, honest form, sunset colour glow | The conversion path must be immediate on mobile. The form never pretends to send when no endpoint is configured. |
| **Archive** | 17 projects, sticky chips, full-width chapter cards, full-screen lightbox | Maintainable via JSON; filters make a growing archive navigable; the lightbox gives each photograph the screen. |

## 5. Motion

- Motion is **content-driven**: sun study, array expansion, reel movement, tab transitions, line
  drawings, reveal-on-scroll. There is no cursor-follower gimmick doing the heavy lifting.
- Durations are 0.4–1.2 s with a consistent ease (`cubic-bezier(.22,1,.36,1)`); hover states are
  0.3 s.
- **Reduced motion** disables smooth scroll, ticker, reveal transforms and the WebGL animation loop
  (the hero renders a single composed frame). Nothing essential is hidden behind an animation.
- The custom cursor and sun rail were cut when they stopped earning their place; the scroll-progress
  line, sun study and reel are the interactions that survived.

## 6. Accessibility & performance as design constraints

- Semantic landmarks, one `h1`, ordered headings, skip link, visible focus rings that adapt to
  colour fields.
- All interactive controls are real `button`/`a` elements; the services array, reel, tabs and
  lightbox have keyboard paths and accessible names.
- Contrast was treated as a design token problem, not a patch: muted text tokens were raised until
  Lighthouse reported **100 accessibility** on both pages, with 48 contrast failures reduced to 0.
- The hero's 3D is lazy-loaded, instanced, DPR-capped, paused offscreen and replaced with a CSS
  poster / static frame when necessary. The page is fully usable before the scene arrives.
- Images are pre-generated in AVIF/WebP/JPG at responsive widths with LQIP; the homepage never
  downloads the full media library.

## 7. Content honesty

- Project titles, categories and descriptions are written from the company's own photographs and
  captions. **No locations, capacities, savings, client names or testimonials were invented.**
  Missing fields are `null` and simply not rendered.
- The DOE credential is shown as the company states it, with an explicit note and a README item to
  confirm the certificate.
- The quote form has two honest modes: prepared-message (default) and real endpoint (when configured).
- Stock notes say models/stock change with supply; the FAQ says warranty depends on the quotation.

## 8. Assumptions & limitations

- The business has no verified street address, opening hours or public email inbox beyond the
  supplied contacts; these are omitted rather than fabricated.
- The logo source is 561×545; the nav/footer use it at small sizes. A vector logo would improve
  large-format use.
- The project archive is a curated subset of the company's public photographs, not a complete
  project database.
- The site is a static export: no CMS, no server, no analytics by default.
- A future iteration could add: owner-editable projects (a tiny CMS or CSV → JSON job), a project
  detail URL per project for SEO, real form delivery, and original-resolution photographs.

## 9. File map for designers/developers

- Tokens: `app/globals.css` (`:root`, `.theme-*`), type classes `.d-xxl/.d-xl/.d-l`.
- Chrome: `components/layout/Nav.tsx`, `Footer.tsx`, `components/ui/ScrollProgress.tsx`.
- Scenes: `components/sections/*`, `components/sections/experience/*`, `components/hero/*`.
- Archive: `components/portfolio/*`, `app/work/page.tsx`.
- Media: `content/image-manifest.json` + `scripts/build-assets.mjs`.


---

## 10. Interaction layer — making it fun without making it slower

Added in a second pass after the first build was already complete: the owner asked for more fun and
surprise in the interactions, without losing the industrial restraint.

**Principle:** every effect must have a job or a payoff. If it does not reveal content, confirm an
action, or sharpen the brand's personality, it was not added.

| Effect | Job |
|---|---|
| Magnetic CTAs / phone | Makes the site feel physical and responsive; encourages the next click |
| Magnetic headline letters | Turns the hero typography into a playable object; the letters respond like a field to the sun |
| Pointer sunlight wash | Connects the cursor to the site's core metaphor |
| Context cursor labels | Explains ambiguous surfaces (reel = drag, array cell = expand, product = stock) |
| Text scramble | Adds industrial-instrument character to navigation without changing meaning |
| Click sparks + ring | Confirms a click landed, with the brand's yellow/blue palette |
| Reel velocity skew | Feels like film passing through a projector; makes dragging legible as motion |
| Copy phone + toast | Genuinely useful: saves the number while staying on the page |
| Image curtains | Makes the photography arrive rather than just appear |
| Button sheen / wordmark fill / logo tilt | Small reward loops on hover |

**Implementation:** `components/motion/EffectsLayer.tsx` (event delegation for magnetic elements,
scramble, sparks, reel skew), self-contained effects in `components/ui/Cursor.tsx`,
`components/ui/ScrollProgress.tsx`, `components/ui/CopyPhone.tsx`, and the hero proximity logic in
`components/sections/Hero.tsx`. All CSS-driven except pointer maths; no new dependencies.

**Guardrails:**
- Full `prefers-reduced-motion` opt-out (no magnetic movement, no scramble, no sparks, no curtain,
  no animated disclosure).
- Effects are pointer-only; touch and keyboard flows stay exactly as tested.
- No effect blocks interaction: `pointer-events: none` on all decorative layers.
- Click sparks are DOM nodes removed after <900 ms; no canvas and no rAF loop per effect.
- Lighthouse accessibility remained **100** after the layer shipped. Playwright flows remained
  **72/72**.
- `node scripts/qa-effects.mjs` re-runs the interaction-layer checks and writes screenshots to
  `shots/effects/`.
