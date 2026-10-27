import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs";

const url = process.argv[2] || "http://localhost:3100";
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
const prefix = process.argv[5] || "shots/review";
fs.mkdirSync("shots", { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 200)));
await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
await page.waitForTimeout(800);
// Force all lazy images to load so full-page captures are complete
await page.evaluate(() => { document.querySelectorAll("img").forEach((img) => { img.loading = "eager"; }); });
await page.waitForTimeout(600);
// scroll through to trigger reveals
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total; y += 800) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(900);
await page.screenshot({ path: `${prefix}-full.png`, fullPage: true });
const meta = await page.evaluate(() => ({
  h: document.body.scrollHeight,
  w: document.documentElement.scrollWidth,
  vw: window.innerWidth,
  title: document.title,
}));
await browser.close();

const img = sharp(`${prefix}-full.png`);
const info = await img.metadata();
const chunkH = 2400;
const scale = 900 / info.width;
const chunks = Math.ceil(info.height / chunkH);
const out = [];
for (let i = 0; i < chunks; i++) {
  const top = i * chunkH;
  const h = Math.min(chunkH, info.height - top);
  const file = `${prefix}-part${i + 1}.jpg`;
  await sharp(`${prefix}-full.png`).extract({ left: 0, top, width: info.width, height: h }).resize({ width: 900 }).jpeg({ quality: 78 }).toFile(file);
  out.push(file);
}
console.log(JSON.stringify({ errors: [...new Set(errors)].slice(0, 10), meta, size: info, chunks: out }, null, 2));
