import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3100";
const OUT = "shots/final";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktop.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120000 });
await desktop.waitForTimeout(2500);
await desktop.screenshot({ path: OUT + "/hero-1440.png" });
for (const [id, name] of [["services", "services"], ["work", "reel"], ["products", "stockroom"], ["process", "system"], ["about", "about"], ["contact", "contact"]]) {
  await desktop.locator("#" + id).scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(1200);
  await desktop.screenshot({ path: OUT + "/" + name + "-1440.png" });
}
// Wait for lazy images then full archive
await desktop.goto(BASE + "/work/", { waitUntil: "networkidle", timeout: 120000 });
await desktop.waitForTimeout(1800);
await desktop.screenshot({ path: OUT + "/work-1440.png" });
await desktop.locator('main button[aria-label^="Open project"]').first().click();
await desktop.waitForTimeout(1200);
await desktop.screenshot({ path: OUT + "/lightbox-1440.png" });
await desktop.close();

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mobile.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120000 });
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: OUT + "/hero-390.png" });
await mobile.locator(".nav__burger").click();
await mobile.waitForTimeout(900);
await mobile.screenshot({ path: OUT + "/menu-390.png" });
await mobile.keyboard.press("Escape");
await mobile.waitForTimeout(600);
await mobile.goto(BASE + "/work/", { waitUntil: "networkidle", timeout: 120000 });
await mobile.waitForTimeout(1500);
await mobile.screenshot({ path: OUT + "/work-390.png" });
await mobile.locator('main button[aria-label^="Open project"]').first().click();
await mobile.waitForTimeout(1100);
await mobile.screenshot({ path: OUT + "/lightbox-390.png" });
await mobile.close();
await browser.close();
console.log("captures written");
