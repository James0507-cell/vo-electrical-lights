import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3100";
const OUT = "shots/effects";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 220)); });
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 220)));
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
await page.waitForTimeout(2600);
await page.screenshot({ path: OUT + "/hero-base.png" });

// magnetic headline + pointer sunlight
await page.mouse.move(760, 560);
await page.waitForTimeout(500);
await page.mouse.move(900, 620, { steps: 12 });
await page.waitForTimeout(450);
await page.screenshot({ path: OUT + "/hero-magnetic.png" });
const lift = await page.evaluate(() => {
  const chars = [...document.querySelectorAll(".hero__char")];
  return chars.map((c) => c.style.getPropertyValue("--lift")).filter((v) => Number(v) > 0).length;
});

// CTA hover / magnetic
await page.mouse.move(160, 790);
await page.waitForTimeout(300);
await page.mouse.move(150, 785, { steps: 6 });
await page.waitForTimeout(450);
await page.screenshot({ path: OUT + "/hero-cta.png" });

// click sparks on the array
await page.locator("#services").scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.mouse.move(760, 520);
await page.waitForTimeout(200);
await page.locator(".array__cell").nth(2).click();
await page.waitForTimeout(180);
await page.screenshot({ path: OUT + "/array-click.png" });
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + "/array-open.png" });

// reel drag skew
await page.locator("#work").scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
const reel = page.locator(".reel");
const box = await reel.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 });
  await page.waitForTimeout(80);
}
const skew = await reel.evaluate((el) => el.style.getPropertyValue("--reel-skew"));
await page.screenshot({ path: OUT + "/reel-drag.png" });
await page.mouse.up();
await page.waitForTimeout(600);

// stockroom lift
await page.locator("#products").scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
const firstCard = page.locator("#products article").first();
await firstCard.hover();
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + "/stockroom-hover.png" });

// system tab + sheen
await page.locator("#process").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.locator('#process [role="tab"]').nth(2).click();
await page.waitForTimeout(600);
await page.locator('#process [role="tabpanel"]').hover();
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + "/system-tab.png" });

// FAQ open
await page.locator("#faq").scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.locator("#faq details summary").first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: OUT + "/faq-open.png" });

// copy phone toast
await page.locator("#contact").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.locator(".copy-phone button").click();
await page.waitForTimeout(400);
const toast = await page.locator(".copy-phone__toast").innerText();
await page.screenshot({ path: OUT + "/contact-copy.png" });

// mobile menu stagger
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
await mobile.waitForTimeout(2000);
await mobile.locator(".nav__burger").click();
await mobile.waitForTimeout(450);
await mobile.screenshot({ path: OUT + "/menu-open.png" });

console.log(JSON.stringify({ errors: [...new Set(errors)], liftedChars: lift, reelSkew: skew, toast }, null, 2));
await browser.close();
