# Deployment

The site is a **static export**: `npm run build` writes plain HTML/CSS/JS + media to `out/`.
There is no server runtime and no database. Any static host works.

---

## 1. Environment variables

Create `.env.local` (development) and set the same variables in the hosting dashboard:

| Variable | Required | Example |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | production: yes | `https://www.voelectrical.com` (no trailing slash) |
| `NEXT_PUBLIC_QUOTE_ENDPOINT` | optional | `https://formspree.io/f/xxxxxxx` |

`NEXT_PUBLIC_*` values are baked in at build time — **rebuild after changing them**.

- `NEXT_PUBLIC_SITE_URL` powers canonical links, `sitemap.xml`, `robots.txt` and Open Graph URLs.
- Without `NEXT_PUBLIC_QUOTE_ENDPOINT` the quote form uses the honest "prepare an email / message"
  flow: it never claims to send anything.
- With an endpoint, the form POSTs JSON:
  ```json
  { "name": "…", "contact": "…", "projectType": "…", "location": "…", "message": "…",
    "company_website": "", "source": "website" }
  ```
  Any 2xx response shows success; non-2xx shows an honest error with the phone/email fallback.
  The field `company_website` is a honeypot: entries with a value should be rejected/ignored.

### Form endpoint options

- **Formspree** — create a form, copy the endpoint URL, set `NEXT_PUBLIC_QUOTE_ENDPOINT`.
- **Web3Forms** — create an access key; endpoint `https://api.web3forms.com/submit` with the key in
  the payload (the current form sends JSON only; if you use Web3Forms add the key to
  `QuoteForm.tsx`).
- **Custom serverless** — any HTTPS endpoint accepting JSON.

Test the real submission path with a test inbox before launch.

---

## 2. Build

```bash
npm ci
npm run typecheck
NEXT_PUBLIC_SITE_URL="https://www.example.com" npm run build
```

Output: `out/` (HTML, `_next/` assets, `media/`, `brand/`, `og.jpg`, `sitemap.xml`,
`robots.txt`).

Local preview of the exported site:

```bash
npm run start        # serves out/ on http://localhost:3100
```

---

## 3. Hosting

### Vercel
1. Import the repository.
2. Framework preset: Next.js. Build command `npm run build`, output `out`.
3. Add `NEXT_PUBLIC_SITE_URL` (+ optional form endpoint) in Project → Settings → Environment
   Variables.
4. Deploy, then add the custom domain.

### Netlify / Cloudflare Pages
- Build command: `npm run build`
- Publish directory: `out`
- Add the environment variables in site settings.
- Netlify: set `NEXT_PUBLIC_SITE_URL` before the first build.

### Traditional hosting / cPanel / S3 + CloudFront
- Upload the **contents** of `out/` to the web root.
- `trailingSlash: true` is enabled, so URLs look like `/work/`; ensure the server serves
  `/work/index.html` for `/work/` (Apache/Nginx do this by default).
- Suggested headers:
  - `/media/*`: `Cache-Control: public, max-age=31536000, immutable`
  - `/_next/static/*`: `Cache-Control: public, max-age=31536000, immutable`
  - HTML: `Cache-Control: public, max-age=0, must-revalidate`
- Enable gzip/brotli.

### DNS / domain
Point the domain (or `www`) at the host, enable HTTPS, then set `NEXT_PUBLIC_SITE_URL` to the
final origin and rebuild. Submit `/sitemap.xml` in Google Search Console. Set the same URL in the
Facebook Page's website field.

---

## 4. Post-launch checklist

- [ ] Production domain set in `NEXT_PUBLIC_SITE_URL` and rebuilt.
- [ ] Phone, email, Facebook links verified.
- [ ] Quote form tested end-to-end (or the prepared-email flow tested on iOS/Android/desktop).
- [ ] Share preview checked (Open Graph image `/og.jpg`).
- [ ] Google Search Console + sitemap submitted; robots.txt reachable.
- [ ] DOE credential wording confirmed by the owner (see README missing-info list).
- [ ] Project facts confirmed/updated in `content/projects.json`.
- [ ] Photo permissions confirmed for every published image.
- [ ] Privacy note added if the form endpoint is enabled.

## 5. Updating the site later

Content is in `content/` (see `docs/CONTENT.md`). Typical update:

```bash
# edit content/site.ts or content/projects.json; add photos to assets-raw/photos/
npm run assets
npm run build
# redeploy out/
```
