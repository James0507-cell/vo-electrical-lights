import { chromium } from "playwright";
import fs from "node:fs";

const url = process.argv[2] || "http://localhost:3100";
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
const out = process.argv[5] || "shots/quick.png";
const scroll = Number(process.argv[6] || 0);

fs.mkdirSync(out.split(/[\\/]/).slice(0, -1).join("/") || ".", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 300)));
await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
await page.waitForTimeout(1200);
if (scroll) {
  await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: out, fullPage: false });
const metrics = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelector("h1")?.innerText?.slice(0, 120),
  bodyH: document.body.scrollHeight,
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
console.log(JSON.stringify({ errors, metrics }, null, 2));
await browser.close();
