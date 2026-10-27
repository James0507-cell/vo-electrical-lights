#!/usr/bin/env node
/**
 * build-assets.mjs — V.O Electrical Lights Trading
 * ---------------------------------------------------------------------------
 * Production media + brand-asset pipeline.
 *
 *   source of truth : content/projects.json  (curated photo ids + roles)
 *   originals       : assets-raw/photos/<photoId>-<W>x<H>.jpg   (never modified)
 *   output (media)  : public/media/<photoId>/<photoId>-<w>.avif|.webp
 *                     public/media/<photoId>/<photoId>-960.jpg
 *                     public/media/hero/poster-{2400,1600,960}.{avif,webp,jpg}
 *   output (brand)  : public/brand/*, public/favicon.ico, public/icon-*.png,
 *                     public/apple-touch-icon.png
 *   manifest        : content/image-manifest.json  (dimensions, LQIP, colours, paths)
 *
 * Rules
 *  - photographic truth only: crop / resize / recompress. No generative edits.
 *  - never upscale in the photo pipeline. Requested widths are capped to the
 *    source width, so every photo also gets a native-resolution variant.
 *  - metadata stripped (auto-orient first).
 *  - idempotent: outputs newer than their source are skipped unless --force.
 *
 * Usage
 *   node scripts/build-assets.mjs                 # media + brand, skip fresh files
 *   node scripts/build-assets.mjs --force         # rebuild everything
 *   node scripts/build-assets.mjs --only=media    # media only
 *   node scripts/build-assets.mjs --only=brand    # brand only
 *   node scripts/build-assets.mjs --ids=id1,id2   # re-encode selected photo ids
 *   node scripts/build-assets.mjs --concurrency=4 # parallel sharp jobs
 *
 * npm run assets
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_JSON = path.join(ROOT, 'content', 'projects.json');
const RAW_DIR = path.join(ROOT, 'assets-raw', 'photos');
const MEDIA_DIR = path.join(ROOT, 'public', 'media');
const BRAND_DIR = path.join(ROOT, 'public', 'brand');
const PUBLIC_DIR = path.join(ROOT, 'public');
const MANIFEST_PATH = path.join(ROOT, 'content', 'image-manifest.json');
const LOGO_SOURCE = path.join(RAW_DIR, '563955069292819-561x545.jpg');

const ARGS = process.argv.slice(2);
const FORCE = ARGS.includes('--force');
const QUIET = ARGS.includes('--quiet');

function arg(name, fallback) {
  const hit = ARGS.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const ONLY = arg('only', 'all');
const CONCURRENCY = Math.max(1, Number(arg('concurrency', '3')) || 3);
const ID_FILTER = arg('ids', '') ? new Set(arg('ids', '').split(',').map((s) => s.trim()).filter(Boolean)) : null;

// Rendering targets. Capped to source width -> native variant, no upscaling.
const MEDIA_TARGET_WIDTHS = [480, 960, 1600, 2400];
const JPG_WIDTH = 960;
const HERO_TARGET_WIDTHS = [960, 1600, 2400]; // hero poster is the one documented resample
const QUALITY = {
  avif: { quality: 54, effort: 4 },
  webp: { quality: 76, effort: 6 },
  jpg: { quality: 80, mozjpeg: true },
  heroJpg: { quality: 84, mozjpeg: true },
  lqip: { width: 24, quality: 55 },
};

// Width policy: only generate the requested target widths that fit inside the
// source (never upscale). Sources narrower than 960 also get their native width
// so small originals are not downsampled to a single 480px file.
function photoWidths(sourceWidth) {
  const widths = MEDIA_TARGET_WIDTHS.filter((w) => w <= sourceWidth);
  if (!widths.length) return [sourceWidth];
  if (sourceWidth < JPG_WIDTH && sourceWidth > widths[widths.length - 1]) widths.push(sourceWidth);
  return [...new Set(widths)].sort((a, b) => a - b);
}
const BRAND = {
  ink: '#070A0F',
  paper: '#F3EDE2',
  logoCrop: { left: 8, top: 0, width: 545, height: 545 },
  circleInset: 1.6, // px in the 545 crop, removes the blue anti-aliased fringe
};
// Photographic PNG rendered through a 256-colour palette: visually identical at
// logo sizes, ~5x smaller than truecolour PNG (670 KB -> 128 KB at 512 px).
const BRAND_PNG = { compressionLevel: 9, palette: true, quality: 100, effort: 10 };

const started = Date.now();
const failures = [];
const stats = { created: 0, skipped: 0, pruned: 0, failures: 0, bytes: {} };

const log = (...a) => { if (!QUIET) console.log(...a); };
const fmtBytes = (n) => (n >= 1024 * 1024 ? (n / (1024 * 1024)).toFixed(2) + ' MB' : (n / 1024).toFixed(1) + ' KB');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const mediaUrl = (id, w, ext) => '/media/' + id + '/' + id + '-' + w + '.' + ext;

// ---------------------------------------------------------------------------
// 1. Curated source: collect every unique photo id and where it is used.
// ---------------------------------------------------------------------------
function readSource() {
  if (!fs.existsSync(SOURCE_JSON)) {
    throw new Error('Missing curated source: ' + rel(SOURCE_JSON));
  }
  const src = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));
  const ids = new Map();

  const add = (id, role) => {
    if (!id) return;
    if (!ids.has(String(id))) ids.set(String(id), new Set());
    ids.get(String(id)).add(role);
  };

  for (const project of src.projects ?? []) {
    add(project.cover, 'project.cover:' + project.slug);
    for (const id of project.photos ?? []) add(id, 'project.photo:' + project.slug);
  }

  const extras = src.extras ?? {};
  add(extras.heroPoster, 'extras.heroPoster');
  add(extras.og, 'extras.og');
  for (const id of extras.fieldStrip ?? []) add(id, 'extras.fieldStrip');
  for (const [key, id] of Object.entries(extras.about ?? {})) add(id, 'extras.about.' + key);
  for (const [key, id] of Object.entries(extras.services ?? {})) add(id, 'extras.services.' + key);
  for (const product of extras.products ?? []) add(product.id, 'extras.products:' + product.id);

  const heroId = String(extras.heroPoster ?? '');
  const ogId = String(extras.og ?? '');
  if (!heroId) throw new Error('content/projects.json has no extras.heroPoster');
  return { src, ids, heroId, ogId };
}

// ---------------------------------------------------------------------------
// 2. Originals index: <id>-<W>x<H>.jpg -> largest file wins.
// ---------------------------------------------------------------------------
function indexOriginals() {
  const index = new Map();
  const unparsed = [];
  for (const name of fs.readdirSync(RAW_DIR)) {
    const m = name.match(/^(\d+)-(\d+)x(\d+)\.(jpe?g|png|webp)$/i);
    if (!m) {
      unparsed.push(name);
      continue;
    }
    const [, id, w, h] = m;
    const file = path.join(RAW_DIR, name);
    const entry = { file, name, width: Number(w), height: Number(h), pixels: Number(w) * Number(h) };
    const existing = index.get(id);
    if (!existing || entry.pixels > existing.pixels || (entry.pixels === existing.pixels && entry.name < existing.name)) {
      index.set(id, entry);
    }
  }
  return { index, unparsed };
}

// ---------------------------------------------------------------------------
// 3. Small helpers: dominant colour + inline LQIP, metadata.
// ---------------------------------------------------------------------------
async function dominantColor(input) {
  const { data } = await sharp(input)
    .rotate()
    .resize(32, 32, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 3) {
    // 5 bits per channel -> 32 levels, filters out tiny noise clusters
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    const cur = buckets.get(key);
    if (cur) {
      cur.n++;
      cur.r += data[i];
      cur.g += data[i + 1];
      cur.b += data[i + 2];
    } else {
      buckets.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }
  let best = null;
  for (const b of buckets.values()) if (!best || b.n > best.n) best = b;
  const hex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + hex(best.r / best.n) + hex(best.g / best.n) + hex(best.b / best.n);
}

async function makeLqip(input) {
  const buf = await sharp(input)
    .rotate()
    .resize({ width: QUALITY.lqip.width, withoutEnlargement: true })
    .webp({ quality: QUALITY.lqip.quality, effort: 4 })
    .toBuffer();
  return 'data:image/webp;base64,' + buf.toString('base64');
}

async function sourceMeta(file) {
  const meta = await sharp(file).metadata();
  const swap = meta.orientation >= 5 && meta.orientation <= 8;
  return {
    width: swap ? meta.height : meta.width,
    height: swap ? meta.width : meta.height,
    format: meta.format,
  };
}

// ---------------------------------------------------------------------------
// 4. Encode scheduling.
// ---------------------------------------------------------------------------
function freshOutput(outPath, sourcePath) {
  if (FORCE) return false;
  try {
    const out = fs.statSync(outPath);
    const src = fs.statSync(sourcePath);
    return out.size > 0 && out.mtimeMs >= src.mtimeMs;
  } catch {
    return false;
  }
}

async function encode({ input, outPath, width, format, jpegOptions }) {
  let pipeline = sharp(input).rotate();
  if (width) pipeline = pipeline.resize({ width, kernel: 'lanczos3' });
  if (format === 'avif') pipeline = pipeline.avif(QUALITY.avif);
  else if (format === 'webp') pipeline = pipeline.webp(QUALITY.webp);
  else if (format === 'jpg') pipeline = pipeline.jpeg(jpegOptions ?? QUALITY.jpg);
  else throw new Error('Unknown format ' + format);
  await pipeline.toFile(outPath);
  const size = (await fsp.stat(outPath)).size;
  stats.created += 1;
  stats.bytes[format] = (stats.bytes[format] ?? 0) + size;
  return size;
}

let jobsDone = 0;
let jobsTotal = 0;
function progress(label) {
  jobsDone += 1;
  if (jobsDone === jobsTotal || jobsDone % 20 === 0) {
    log('  media ' + jobsDone + '/' + jobsTotal + ' files  (' + label + ')');
  }
}

async function runPool(items, limit, worker) {
  let cursor = 0;
  let completed = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      const item = items[idx];
      try {
        await worker(item);
      } catch (err) {
        stats.failures += 1;
        failures.push({ item: item.outPath ? rel(item.outPath) : String(item.id), error: String(err && err.message ? err.message : err) });
        console.error('  FAILED ' + (item.outPath ? rel(item.outPath) : item.id) + ': ' + (err && err.message ? err.message : err));
      } finally {
        completed += 1;
        if (completed % 10 === 0 || completed === items.length) progress(items.length + ' jobs');
      }
    }
  });
  await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// 5. Photo pipeline.
// ---------------------------------------------------------------------------
// Remove stale outputs from an earlier width policy / quality pass so the
// directory always mirrors exactly what the manifest advertises.
function pruneDir(dir, expectedNames) {
  if (!fs.existsSync(dir)) return;
  const expected = new Set(expectedNames);
  for (const name of fs.readdirSync(dir)) {
    if (expected.has(name)) continue;
    const target = path.join(dir, name);
    if (fs.statSync(target).isFile()) {
      fs.rmSync(target, { force: true });
      stats.pruned += 1;
    }
  }
}

async function buildPhotos(ids, index) {
  log('\n[media] ' + ids.size + ' unique photo ids from content/projects.json');
  const entries = [];
  const encodeJobs = [];

  const ordered = [...ids.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  for (const [id, roles] of ordered) {
    const original = index.get(id);
    if (!original) {
      failures.push({ item: 'photo:' + id, error: 'no original in assets-raw/photos (' + [...roles].join(', ') + ')' });
      stats.failures += 1;
      console.error('  MISSING original for id ' + id + ' (' + [...roles].join(', ') + ')');
      continue;
    }
    const meta = await sourceMeta(original.file);
    const widths = photoWidths(meta.width);
    const jpgWidth = Math.min(JPG_WIDTH, meta.width);
    const [color, lqip] = await Promise.all([dominantColor(original.file), makeLqip(original.file)]);

    const dir = path.join(MEDIA_DIR, id);
    await fsp.mkdir(dir, { recursive: true });
    pruneDir(dir, [
      ...widths.map((w) => id + '-' + w + '.avif'),
      ...widths.map((w) => id + '-' + w + '.webp'),
      id + '-' + jpgWidth + '.jpg',
    ]);

    const entry = {
      width: meta.width,
      height: meta.height,
      aspect: Number((meta.width / meta.height).toFixed(4)),
      color,
      lqip,
      widths,
      hasJpg: true,
      avif: {},
      webp: {},
      src: '',
      jpg: mediaUrl(id, jpgWidth, 'jpg'),
    };

    for (const w of widths) {
      for (const format of ['avif', 'webp']) {
        const outPath = path.join(dir, id + '-' + w + '.' + format);
        entry[format][String(w)] = mediaUrl(id, w, format);
        if (!ID_FILTER || ID_FILTER.has(id)) {
          if (freshOutput(outPath, original.file)) {
            stats.skipped += 1;
            continue;
          }
          encodeJobs.push({ id, outPath, input: original.file, width: w, format });
        }
      }
    }

    {
      const outPath = path.join(dir, id + '-' + jpgWidth + '.jpg');
      if (!ID_FILTER || ID_FILTER.has(id)) {
        if (freshOutput(outPath, original.file)) stats.skipped += 1;
        else encodeJobs.push({ id, outPath, input: original.file, width: jpgWidth, format: 'jpg' });
      }
    }

    const defaultWidth = widths.includes(1600) ? 1600 : widths[widths.length - 1];
    entry.src = mediaUrl(id, defaultWidth, 'webp');
    entries.push(entry);
  }

  jobsTotal = encodeJobs.length;
  log('  encoding ' + jobsTotal + ' files, ' + stats.skipped + ' up to date (skipped), concurrency ' + CONCURRENCY);
  await runPool(encodeJobs, CONCURRENCY, async (job) => {
    await encode(job);
    progress(rel(job.outPath));
  });

  return entries;
}

// ---------------------------------------------------------------------------
// 6. Hero poster set (video fallback).
// ---------------------------------------------------------------------------
async function buildHero(heroId, index) {
  const original = index.get(heroId);
  if (!original) throw new Error('Hero photo original missing: ' + heroId);
  const meta = await sourceMeta(original.file);
  const [color, lqip] = await Promise.all([dominantColor(original.file), makeLqip(original.file)]);
  const dir = path.join(MEDIA_DIR, 'hero');
  await fsp.mkdir(dir, { recursive: true });
  const widths = HERO_TARGET_WIDTHS;
  pruneDir(dir, widths.flatMap((w) => ['poster-' + w + '.avif', 'poster-' + w + '.webp', 'poster-' + w + '.jpg']));
  const hero = {
    id: heroId,
    width: meta.width,
    height: meta.height,
    aspect: Number((meta.width / meta.height).toFixed(4)),
    color,
    lqip,
    widths,
    nativeWidth: meta.width,
    avif: {},
    webp: {},
    jpg: {},
    poster: '/media/hero/poster-1600.jpg',
  };

  const jobs = [];
  for (const w of widths) {
    for (const format of ['avif', 'webp', 'jpg']) {
      const outPath = path.join(dir, 'poster-' + w + '.' + format);
      hero[format][String(w)] = '/media/hero/poster-' + w + '.' + format;
      if (freshOutput(outPath, original.file)) {
        stats.skipped += 1;
        continue;
      }
      jobs.push({ id: 'hero', outPath, input: original.file, width: w, format, jpegOptions: QUALITY.heroJpg });
    }
  }
  jobsTotal = jobs.length;
  await runPool(jobs, Math.min(CONCURRENCY, 3), async (job) => {
    await encode(job);
    progress(rel(job.outPath));
  });
  log('  hero poster: ' + widths.map((w) => 'poster-' + w).join(', ') + ' (source ' + meta.width + 'px; poster-2400 is a documented 1.17x resample)');
  return hero;
}

// ---------------------------------------------------------------------------
// 7. Brand assets: logo crop, favicons, app icons.
// ---------------------------------------------------------------------------
async function detectBadgeCircle(cropBuffer) {
  const { data, info } = await sharp(cropBuffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const isBackground = (r, g, b) => b > 90 && b > r + 35 && b > g + 15;

  let cx = width / 2;
  let cy = height / 2;
  let radius = Math.min(width, height) * 0.47;
  const maxScan = Math.min(width, height) / 2 - 2;

  for (let pass = 0; pass < 3; pass++) {
    const points = [];
    for (let a = 0; a < 360; a += 0.4) {
      const theta = (a * Math.PI) / 180;
      const dx = Math.cos(theta);
      const dy = Math.sin(theta);
      let last = -1;
      for (let r = Math.max(120, radius - 70); r <= maxScan; r += 0.4) {
        const x = Math.round(cx + dx * r);
        const y = Math.round(cy + dy * r);
        if (x < 0 || y < 0 || x >= width || y >= height) break;
        const i = (y * width + x) * channels;
        if (!isBackground(data[i], data[i + 1], data[i + 2])) last = r;
      }
      if (last > 0) points.push([cx + dx * last, cy + dy * last]);
    }
    // Kasa circle fit, then reject points that disagree with the fit and refit.
    const fit = (pts) => {
      let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0, sumX3 = 0, sumY3 = 0, sumXY2 = 0, sumX2Y = 0;
      for (const [x, y] of pts) {
        sumX += x; sumY += y; sumX2 += x * x; sumY2 += y * y; sumXY += x * y;
        sumX3 += x * x * x; sumY3 += y * y * y; sumXY2 += x * y * y; sumX2Y += x * x * y;
      }
      const n = pts.length;
      const A = n * sumX2 - sumX * sumX;
      const B = n * sumXY - sumX * sumY;
      const C = n * sumY2 - sumY * sumY;
      const D = 0.5 * (n * sumX3 + n * sumXY2 - sumX * (sumX2 + sumY2));
      const E = 0.5 * (n * sumY3 + n * sumX2Y - sumY * (sumX2 + sumY2));
      const det = A * C - B * B;
      if (!det) return null;
      const cxFit = (D * C - B * E) / det;
      const cyFit = (A * E - B * D) / det;
      const rFit = Math.sqrt((sumX2 - 2 * cxFit * sumX + n * cxFit * cxFit + sumY2 - 2 * cyFit * sumY + n * cyFit * cyFit) / n);
      return { cx: cxFit, cy: cyFit, r: rFit };
    };
    const first = fit(points);
    const refit = points.filter(([x, y]) => Math.abs(Math.hypot(x - first.cx, y - first.cy) - first.r) < 2.5);
    const fitted = fit(refit) ?? first;
    cx = fitted.cx; cy = fitted.cy; radius = fitted.r;
  }
  return { cx, cy, radius };
}

async function logoCircleMaster(circle, diameter) {
  const crop = await sharp(LOGO_SOURCE).extract(BRAND.logoCrop).png().toBuffer();
  const radius = circle.radius - BRAND.circleInset;
  const side = Math.ceil(radius * 2);
  // Square window centred on the measured badge -> the mask lands dead-centre.
  const left = Math.min(Math.max(0, Math.round(circle.cx - side / 2)), Math.max(0, BRAND.logoCrop.width - side));
  const top = Math.min(Math.max(0, Math.round(circle.cy - side / 2)), Math.max(0, BRAND.logoCrop.height - side));
  const rgb = await sharp(crop)
    .extract({ left, top, width: side, height: side })
    .resize(diameter, diameter, { fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer();

  const r = diameter / 2;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + diameter + '" height="' + diameter + '" viewBox="0 0 ' + diameter + ' ' + diameter + '">' +
    '<circle cx="' + r + '" cy="' + r + '" r="' + (r - 0.5).toFixed(2) + '" fill="#fff"/></svg>';
  const mask = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  if (mask.info.channels !== 1) throw new Error('Unexpected mask channels: ' + mask.info.channels);

  const out = Buffer.alloc(diameter * diameter * 4);
  for (let i = 0; i < diameter * diameter; i++) {
    out[i * 4] = rgb[i * 3];
    out[i * 4 + 1] = rgb[i * 3 + 1];
    out[i * 4 + 2] = rgb[i * 3 + 2];
    out[i * 4 + 3] = mask.data[i];
  }
  return sharp(out, { raw: { width: diameter, height: diameter, channels: 4 } }).png(BRAND_PNG).toBuffer();
}

function writeIco(entries) {
  // ICO container; PNG payloads (supported by all current browsers and Windows Vista+).
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const directory = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  entries.forEach((entry, index) => {
    const p = index * 16;
    const dim = entry.size >= 256 ? 0 : entry.size;
    directory.writeUInt8(dim, p);
    directory.writeUInt8(dim, p + 1);
    directory.writeUInt8(0, p + 2);
    directory.writeUInt8(0, p + 3);
    directory.writeUInt16LE(1, p + 4);
    directory.writeUInt16LE(32, p + 6);
    directory.writeUInt32LE(entry.png.length, p + 8);
    directory.writeUInt32LE(offset, p + 12);
    offset += entry.png.length;
  });
  return Buffer.concat([header, directory, ...entries.map((e) => e.png)]);
}

async function writeFile(outPath, buffer, sourcePath) {
  if (!FORCE && freshOutput(outPath, sourcePath)) {
    stats.skipped += 1;
    return;
  }
  await fsp.writeFile(outPath, buffer);
  stats.created += 1;
}

async function buildBrand() {
  log('\n[brand] logo crop + favicons');
  if (!fs.existsSync(LOGO_SOURCE)) throw new Error('Logo original missing: ' + rel(LOGO_SOURCE));
  await fsp.mkdir(BRAND_DIR, { recursive: true });

  const crop = await sharp(LOGO_SOURCE).extract(BRAND.logoCrop).png().toBuffer();
  const circle = await detectBadgeCircle(crop);
  log('  badge circle: centre ' + circle.cx.toFixed(1) + ',' + circle.cy.toFixed(1) + ' r=' + circle.radius.toFixed(1) + ' (545 crop)');

  const master = await logoCircleMaster(circle, 512);
  const logoPngs = new Map();
  for (const size of [512, 256, 128, 64]) {
    logoPngs.set(size, size === 512 ? master : await sharp(master).resize(size, size, { kernel: 'lanczos3' }).png(BRAND_PNG).toBuffer());
  }
  await writeFile(path.join(BRAND_DIR, 'logo-512.png'), logoPngs.get(512), LOGO_SOURCE);
  await writeFile(path.join(BRAND_DIR, 'logo-256.png'), logoPngs.get(256), LOGO_SOURCE);
  await writeFile(path.join(BRAND_DIR, 'logo-128.png'), logoPngs.get(128), LOGO_SOURCE);
  const logo64Webp = await sharp(logoPngs.get(64)).webp({ quality: 92, effort: 6 }).toBuffer();
  await writeFile(path.join(BRAND_DIR, 'logo-64.webp'), logo64Webp, LOGO_SOURCE);
  const logoWebp = await sharp(logoPngs.get(512)).webp({ quality: 92, effort: 6 }).toBuffer();
  await writeFile(path.join(BRAND_DIR, 'logo.webp'), logoWebp, LOGO_SOURCE);

  // Opaque app icons: badge on ink, with a 10% safe-zone margin (maskable-friendly).
  async function opaqueIcon(size, badgeFraction) {
    const badgeSize = Math.round(size * badgeFraction);
    const badge = await sharp(logoPngs.get(512)).resize(badgeSize, badgeSize, { kernel: 'lanczos3' }).png().toBuffer();
    const offset = Math.round((size - badgeSize) / 2);
    return sharp({ create: { width: size, height: size, channels: 3, background: BRAND.ink } })
      .composite([{ input: badge, left: offset, top: offset }])
      .png(BRAND_PNG)
      .toBuffer();
  }
  await writeFile(path.join(PUBLIC_DIR, 'icon-192.png'), await opaqueIcon(192, 0.78), LOGO_SOURCE);
  await writeFile(path.join(PUBLIC_DIR, 'icon-512.png'), await opaqueIcon(512, 0.78), LOGO_SOURCE);
  await writeFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), await opaqueIcon(180, 0.8), LOGO_SOURCE);

  // favicon.ico: transparent circular badge at 16 / 32 / 48.
  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    const png = await sharp(logoPngs.get(64)).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer();
    icoEntries.push({ size, png });
  }
  await writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), writeIco(icoEntries), LOGO_SOURCE);

  log('  wrote brand/logo-{512,256,128}.png, brand/logo-64.webp, brand/logo.webp, favicon.ico, icon-{192,512}.png, apple-touch-icon.png');
  return circle;
}

// ---------------------------------------------------------------------------
// 8. Size reporting.
// ---------------------------------------------------------------------------
function dirBytes(dir) {
  let total = 0;
  let files = 0;
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else {
        total += fs.statSync(p).size;
        files += 1;
      }
    }
  };
  walk(dir);
  return { bytes: total, files };
}

// ---------------------------------------------------------------------------
// 9. Main.
// ---------------------------------------------------------------------------
async function main() {
  log('V.O asset pipeline  —  root: ' + ROOT);
  log('  force: ' + FORCE + '   only: ' + ONLY + '   concurrency: ' + CONCURRENCY);

  const { ids, heroId } = readSource();
  const { index, unparsed } = indexOriginals();
  if (unparsed.length) log('  note: ' + unparsed.length + ' non-photo files in assets-raw/photos ignored');

  if (ONLY === 'all' || ONLY === 'media') {
    await buildPhotos(ids, index);
    await buildHero(heroId, index);
  }

  if (ONLY === 'all' || ONLY === 'brand') {
    await buildBrand();
  }

  if (ONLY === 'media' || ONLY === 'all') {
    // Rebuild the (cheap) full manifest even on filtered runs so it never loses entries.
    const full = {};
    for (const [id] of [...ids.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const original = index.get(id);
      if (!original) continue;
      const meta = await sourceMeta(original.file);
      const widths = photoWidths(meta.width);
      const [color, lqip] = await Promise.all([dominantColor(original.file), makeLqip(original.file)]);
      const jpgWidth = Math.min(JPG_WIDTH, meta.width);
      const entry = {
        width: meta.width,
        height: meta.height,
        aspect: Number((meta.width / meta.height).toFixed(4)),
        color,
        lqip,
        widths,
        hasJpg: true,
        avif: {},
        webp: {},
        src: mediaUrl(id, widths.includes(1600) ? 1600 : widths[widths.length - 1], 'webp'),
        jpg: mediaUrl(id, jpgWidth, 'jpg'),
      };
      for (const w of widths) {
        entry.avif[String(w)] = mediaUrl(id, w, 'avif');
        entry.webp[String(w)] = mediaUrl(id, w, 'webp');
      }
      full[id] = entry;
    }
    if (heroId) {
      const original = index.get(heroId);
      if (original) {
        const meta = await sourceMeta(original.file);
        const [color, lqip] = await Promise.all([dominantColor(original.file), makeLqip(original.file)]);
        const heroEntry = {
          id: heroId,
          width: meta.width,
          height: meta.height,
          aspect: Number((meta.width / meta.height).toFixed(4)),
          color,
          lqip,
          widths: HERO_TARGET_WIDTHS,
          nativeWidth: meta.width,
          avif: {},
          webp: {},
          jpg: {},
          poster: '/media/hero/poster-1600.jpg',
        };
        for (const w of HERO_TARGET_WIDTHS) {
          heroEntry.avif[String(w)] = '/media/hero/poster-' + w + '.avif';
          heroEntry.webp[String(w)] = '/media/hero/poster-' + w + '.webp';
          heroEntry.jpg[String(w)] = '/media/hero/poster-' + w + '.jpg';
        }
        full.hero = heroEntry;
      }
    }
    await fsp.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
    await fsp.writeFile(MANIFEST_PATH, JSON.stringify(full, null, 2) + '\n');
    log('\n[manifest] ' + rel(MANIFEST_PATH) + '  (' + Object.keys(full).length + ' keys including hero, ' + fmtBytes(fs.statSync(MANIFEST_PATH).size) + ')');
  }

  const hasManifest = fs.existsSync(MANIFEST_PATH);
  const manifestObj = hasManifest ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) : {};
  const missingEntries = hasManifest ? [...ids.keys()].filter((id) => !(id in manifestObj)) : [];
  const missingFiles = [];
  for (const [id, entry] of Object.entries(manifestObj)) {
    if (ONLY === 'brand') break;
    if (id === 'hero') {
      for (const w of entry.widths ?? []) {
        for (const fmt of ['avif', 'webp', 'jpg']) {
          const p = path.join(PUBLIC_DIR, (entry[fmt]?.[String(w)] ?? '').replace(/^\//, ''));
          if (!fs.existsSync(p)) missingFiles.push(rel(p));
        }
      }
      continue;
    }
    for (const w of entry.widths ?? []) {
      for (const fmt of ['avif', 'webp']) {
        const p = path.join(PUBLIC_DIR, (entry[fmt]?.[String(w)] ?? '').replace(/^\//, ''));
        if (!fs.existsSync(p)) missingFiles.push(rel(p));
      }
    }
    if (entry.hasJpg) {
      const p = path.join(PUBLIC_DIR, (entry.jpg ?? '').replace(/^\//, ''));
      if (!fs.existsSync(p)) missingFiles.push(rel(p));
    }
  }

  const media = dirBytes(MEDIA_DIR);
  const brand = dirBytes(BRAND_DIR);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  log('\n=== summary ===');
  log('  photo ids referenced : ' + ids.size);
  log('  manifest entries     : ' + (Object.keys(manifestObj).length - (manifestObj.hero ? 1 : 0)) + ' photos + ' + (manifestObj.hero ? '1 hero' : '0 hero'));
  log('  files created        : ' + stats.created + '   skipped (fresh): ' + stats.skipped + '   pruned stale: ' + stats.pruned + '   failures: ' + stats.failures);
  log('  public/media         : ' + media.files + ' files, ' + fmtBytes(media.bytes));
  log('  public/brand         : ' + brand.files + ' files, ' + fmtBytes(brand.bytes));
  log('  time                 : ' + elapsed + 's');
  if (missingEntries.length) {
    log('  MISSING manifest entries for referenced ids: ' + missingEntries.join(', '));
    stats.failures += missingEntries.length;
  }
  if (missingFiles.length) {
    log('  MISSING output files: ' + missingFiles.length + '  (first: ' + missingFiles.slice(0, 5).join(', ') + ')');
    stats.failures += missingFiles.length;
  }
  if (failures.length) {
    log('  failure log:');
    for (const failure of failures.slice(0, 20)) log('    - ' + failure.item + ': ' + failure.error);
  }
  log('  coverage proof: ' + ids.size + ' referenced ids / ' + Object.keys(manifestObj).length + ' manifest keys -> ' + (missingEntries.length ? 'INCOMPLETE' : 'complete'));

  if (stats.failures) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
