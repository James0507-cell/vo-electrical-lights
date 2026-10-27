import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs";

const BASE = process.env.QA_BASE || "http://localhost:3100";
const OUT = "shots/qa";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const consoleErrors = [];
const pageErrors = [];
const badResponses = [];
let currentContext = "";

function check(name, condition, detail = "") {
  results.push({ name, pass: Boolean(condition), detail: detail ? String(detail).slice(0, 220) : "" });
}

async function newPage(browser, width, height, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error" && currentContext !== "404") consoleErrors.push(currentContext + " " + m.text().slice(0, 200)); });
  page.on("pageerror", (e) => pageErrors.push(currentContext + " " + e.message.slice(0, 200)));
  page.on("response", (r) => { if (r.status() >= 400 && currentContext !== "404") badResponses.push(currentContext + " " + r.status() + " " + r.url()); });
  return { context, page };
}

async function settle(page, ms = 1200) { await page.waitForTimeout(ms); }

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check("no horizontal overflow — " + label, !overflow);
}

async function a11yBasics(page, label) {
  const stats = await page.evaluate(() => {
    const imgsMissingAlt = [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length;
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const buttons = [...document.querySelectorAll("button")].filter(visible);
    const unnamedButtons = buttons.filter((b) => !((b.innerText || "").trim() || b.getAttribute("aria-label") || b.getAttribute("title"))).length;
    const h1 = document.querySelectorAll("h1").length;
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
    let jumps = 0;
    for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) jumps++;
    const labels = [...document.querySelectorAll("input,select,textarea")].filter((el) => el.type !== "hidden").filter((el) => {
      if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
      if (el.id && document.querySelector('label[for="' + el.id + '"]')) return false;
      if (el.closest("label")) return false;
      return true;
    }).length;
    return { imgsMissingAlt, unnamedButtons, h1, jumps, unlabeledFields: labels,
      landmarks: { main: !!document.querySelector("main"), nav: !!document.querySelector("nav"), footer: !!document.querySelector("footer") } };
  });
  check("all images have alt — " + label, stats.imgsMissingAlt === 0, stats.imgsMissingAlt);
  check("all buttons named — " + label, stats.unnamedButtons === 0, stats.unnamedButtons);
  check("one h1 — " + label, stats.h1 === 1, stats.h1);
  check("no heading-level jumps — " + label, stats.jumps === 0, stats.jumps);
  check("form fields labelled — " + label, stats.unlabeledFields === 0, stats.unlabeledFields);
  check("landmarks present — " + label, stats.landmarks.main && stats.landmarks.nav && stats.landmarks.footer, JSON.stringify(stats.landmarks));
}

async function testHome(browser) {
  currentContext = "home-1440";
  const { context, page } = await newPage(browser, 1440, 900);
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  await settle(page, 1600);
  await noOverflow(page, "home 1440");
  await a11yBasics(page, "home 1440");
  // every image should eventually decode (no 404 / corrupt media)
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, { timeout: 20000 }).catch(() => {});
  const brokenImgs = await page.evaluate(() => Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src));
  check("all homepage images load", brokenImgs.length === 0, brokenImgs.slice(0, 3).join(", "));

  const h1 = await page.locator("h1").innerText();
  check("home h1 says WE WIRE THE SUN", /WE WIRE/i.test(h1) && /SUN/i.test(h1), h1);
  const ids = ["services", "work", "products", "process", "about", "faq", "contact"];
  for (const id of ids) check("section present #" + id, await page.locator("#" + id).count() === 1);

  const heroReady = await page.evaluate(() => window.__solarReady === true).catch(() => false);
  check("hero WebGL reports ready", heroReady);
  const sceneMode = await page.evaluate(() => document.querySelector("[data-hero-scene]")?.getAttribute("data-hero-scene") || null);
  check("hero scene mode webgl (desktop)", sceneMode === "webgl", sceneMode);

  // sun slider changes the scene + label
  const before = await page.screenshot({ clip: { x: 700, y: 120, width: 700, height: 640 } });
  await page.evaluate(() => {
    const range = document.querySelector(".hero__range");
    if (!range) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(range, "0.82");
    range.dispatchEvent(new Event("input", { bubbles: true }));
    range.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(1500);
  const after = await page.screenshot({ clip: { x: 700, y: 120, width: 700, height: 640 } });
  const [bRaw, aRaw] = await Promise.all([sharp(before).raw().toBuffer(), sharp(after).raw().toBuffer()]);
  let diff = 0;
  const n = Math.min(bRaw.length, aRaw.length);
  for (let i = 0; i < n; i += 40) diff += Math.abs(bRaw[i] - aRaw[i]);
  const avgDiff = diff / (n / 40);
  check("sun study visibly changes the scene", avgDiff > 2, "avg pixel diff " + avgDiff.toFixed(2));
  const solarTime = await page.evaluate(() => window.__solarTime ?? null);
  check("sun time API updated", typeof solarTime === "number" && solarTime > 0.7, solarTime);
  const timeLabel = await page.locator(".hero__sun-time").innerText();
  check("sun study label updates", /1[5-9]:|16:|17:|18:/.test(timeLabel) || timeLabel !== "07:14", timeLabel);

  // services array
  const cells = page.locator(".array__cell");
  check("array has six services", await cells.count() === 6, await cells.count());
  await cells.nth(2).click();
  await page.waitForTimeout(800);
  check("array cell expands on click", (await cells.nth(2).getAttribute("aria-expanded")) === "true");
  const arrayText = await cells.nth(2).innerText();
  check("array detail copy visible", /farms|agricultur/i.test(arrayText), arrayText.slice(0, 80));

  // reel
  const reelCards = page.locator(".reel__card");
  check("reel has featured projects", await reelCards.count() >= 5, await reelCards.count());
  const scrollBefore = await page.locator(".reel").evaluate((el) => el.scrollLeft);
  await page.locator('.reel__arrow[aria-label="Next projects"]').click();
  await page.waitForTimeout(900);
  const scrollAfter = await page.locator(".reel").evaluate((el) => el.scrollLeft);
  check("reel next control scrolls", scrollAfter > scrollBefore, scrollBefore + " -> " + scrollAfter);

  // stockroom
  const productCards = page.locator("#products article");
  check("stockroom shows product cards", await productCards.count() >= 6, await productCards.count());
  const conveyor = page.locator('#products [aria-label*="Product conveyor"]');
  if (await conveyor.count()) {
    const beforeP = await conveyor.evaluate((el) => el.scrollLeft);
    await page.locator('#products button[aria-label="Show next products"]').click();
    await page.waitForTimeout(900);
    const afterP = await conveyor.evaluate((el) => el.scrollLeft);
    check("stockroom conveyor scrolls", afterP > beforeP, beforeP + " -> " + afterP);
  } else {
    check("stockroom conveyor present", false);
  }

  // system tabs
  const tabs = page.locator('#process [role="tab"]');
  check("system has five tabs", await tabs.count() === 5, await tabs.count());
  await tabs.nth(2).click();
  await page.waitForTimeout(600);
  check("system tab activates", (await tabs.nth(2).getAttribute("aria-selected")) === "true");
  const panelText = await page.locator('#process [role="tabpanel"]').innerText();
  check("system panel updates", /supply|materials/i.test(panelText), panelText.slice(0, 80));
  await tabs.nth(2).focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  check("system tabs keyboard arrows work", (await page.locator('#process [role="tab"]').nth(3).getAttribute("aria-selected")) === "true");

  // FAQ
  await page.locator("#faq details").first().locator("summary").click();
  await page.waitForTimeout(300);
  check("FAQ opens", await page.locator("#faq details").first().evaluate((el) => el.open));

  // Quote form validation + honest flow
  await page.locator("#quote-name").scrollIntoViewIfNeeded();
  await page.locator('.contact__form button[type="submit"]').click();
  await page.waitForTimeout(400);
  check("quote form shows validation errors", await page.locator(".contact__form .field__error").count() >= 2);
  await page.locator("#quote-name").fill("QA Test");
  await page.locator("#quote-contact").fill("qa@example.com");
  await page.locator("#quote-type").selectOption({ index: 1 });
  await page.locator("#quote-location").fill("Davao");
  await page.locator("#quote-message").fill("Testing the enquiry flow for a rooftop solar project.");
  await page.locator('.contact__form button[type="submit"]').click();
  await page.waitForTimeout(600);
  const panel = page.locator(".contact__form .quote__panel");
  check("quote form prepares a message", await panel.count() === 1);
  const quotePanelText = (await panel.count()) ? await panel.innerText() : "";
  check("quote form is honest (nothing sent)", /nothing has been sent|nothing is sent/i.test(quotePanelText), quotePanelText.slice(0, 80));
  const mailto = await page.locator('.contact__form .quote__panel a[href^="mailto:"]').first().getAttribute("href");
  check("quote email link built", Boolean(mailto && mailto.includes("villanuevaongtrading")), mailto?.slice(0, 60));

  // mobile menu / nav on 390
  await context.close();
  currentContext = "home-390";
  const mob = await newPage(browser, 390, 844);
  await mob.page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  await settle(mob.page, 1800);
  await noOverflow(mob.page, "home 390");
  const ctaVisible = await mob.page.locator(".nav__cta").isVisible();
  check("mobile nav hides quote CTA", !ctaVisible);
  check("mobile burger visible", await mob.page.locator(".nav__burger").isVisible());
  const heroReadyMobile = await mob.page.evaluate(() => window.__solarReady === true).catch(() => false);
  check("hero ready on mobile", heroReadyMobile);
  const sceneModeMobile = await mob.page.evaluate(() => document.querySelector("[data-hero-scene]")?.getAttribute("data-hero-scene") || null);
  check("hero mobile uses webgl", sceneModeMobile === "webgl", sceneModeMobile);
  await mob.page.locator(".nav__burger").click();
  await mob.page.waitForTimeout(700);
  check("mobile menu opens", await mob.page.locator("#site-menu").evaluate((el) => el.classList.contains("is-open")));
  check("mobile menu locks scroll", await mob.page.evaluate(() => document.documentElement.style.overflow === "hidden"));
  await mob.page.keyboard.press("Escape");
  await mob.page.waitForTimeout(700);
  check("mobile menu closes on Escape", !(await mob.page.locator("#site-menu").evaluate((el) => el.classList.contains("is-open"))));
  check("focus returns to burger", await mob.page.evaluate(() => document.activeElement?.classList.contains("nav__burger")));
  await mob.page.screenshot({ path: OUT + "/home-390.png" });
  await mob.context.close();

  // reduced motion
  currentContext = "home-reduced";
  const red = await newPage(browser, 1440, 900, "reduce");
  await red.page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  await settle(red.page, 1600);
  check("reduced motion: page loads", (await red.page.locator("h1").count()) === 1);
  check("reduced motion: no page errors", pageErrors.filter((e) => e.startsWith("home-reduced")).length === 0);
  await red.page.screenshot({ path: OUT + "/home-reduced.png" });
  await red.context.close();

  // viewport widths overflow check
  for (const [w, h] of [[768, 1024], [1024, 768], [1920, 1080]]) {
    currentContext = "home-" + w;
    const v = await newPage(browser, w, h);
    await v.page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
    await settle(v.page, 700);
    await noOverflow(v.page, "home " + w);
    if (w === 1920) await v.page.screenshot({ path: OUT + "/home-1920.png" });
    await v.context.close();
  }

  // 404
  currentContext = "404";
  const nf = await newPage(browser, 1440, 900);
  const res = await nf.page.goto(BASE + "/definitely-not-a-page/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle(nf.page, 600);
  check("404 page returns 404 status", res?.status() === 404, res?.status());
  check("404 page has helpful copy", /circuit|not found|nowhere/i.test(await nf.page.locator("body").innerText()));
  await nf.context.close();
}

async function testWork(browser) {
  currentContext = "work-1440";
  const { context, page } = await newPage(browser, 1440, 900);
  await page.goto(BASE + "/work/", { waitUntil: "networkidle", timeout: 180000 });
  await settle(page, 1200);
  await noOverflow(page, "work 1440");
  await a11yBasics(page, "work 1440");
  await page.waitForTimeout(800);
  const brokenWorkImgs = await page.evaluate(() => Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src));
  check("all archive images load", brokenWorkImgs.length === 0, brokenWorkImgs.slice(0, 3).join(", "));
  const cards = page.locator('main button[aria-label^="Open project"]');
  const allCount = await cards.count();
  const articleCount = await page.locator("main article").count();
  check("archive shows 17 project cards", allCount === 17 && articleCount === 17, allCount + "/" + articleCount);
  const filters = page.locator('main [aria-pressed]');
  check("archive has filter chips", await filters.count() >= 6, await filters.count());
  const solarChip = page.locator('main [aria-pressed]', { hasText: /^Solar/ }).first();
  await solarChip.click();
  await page.waitForTimeout(700);
  const filteredCount = await cards.count();
  check("solar filter reduces project count", filteredCount > 0 && filteredCount < allCount, filteredCount);
  check("solar filter aria-pressed", (await solarChip.getAttribute("aria-pressed")) === "true");
  await page.locator('main [aria-pressed]', { hasText: /^All/ }).first().click();
  await page.waitForTimeout(600);

  await cards.first().click();
  await page.waitForTimeout(900);
  const dialog = page.locator('[role="dialog"][aria-modal="true"]');
  check("lightbox opens with dialog role", await dialog.count() === 1);
  check("lightbox aria-modal", (await dialog.getAttribute("aria-modal")) === "true");
  const counterBefore = await dialog.innerText();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  const counterAfter = await dialog.innerText();
  check("lightbox arrow advances photo", counterBefore !== counterAfter);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  check("lightbox closes on Escape", await page.locator('[role="dialog"][aria-modal="true"]').count() === 0);
  const focusRestored = await page.evaluate(() => Boolean(document.activeElement?.getAttribute?.("aria-label")?.startsWith("Open project")));
  check("focus returns to project card", focusRestored);
  await page.screenshot({ path: OUT + "/work-1440.png" });

  // deep link
  currentContext = "work-deeplink";
  const dl = await newPage(browser, 1440, 900);
  await dl.page.goto(BASE + "/work/?project=365kw-rooftop-solar-lgu", { waitUntil: "networkidle", timeout: 180000 });
  await settle(dl.page, 1400);
  check("deep link opens lightbox", await dl.page.locator('[role="dialog"][aria-modal="true"]').count() === 1);
  await dl.page.screenshot({ path: OUT + "/lightbox-1440.png" });
  await dl.context.close();

  // mobile work
  currentContext = "work-390";
  const mw = await newPage(browser, 390, 844);
  await mw.page.goto(BASE + "/work/", { waitUntil: "networkidle", timeout: 180000 });
  await settle(mw.page, 1200);
  await noOverflow(mw.page, "work 390");
  await mw.page.screenshot({ path: OUT + "/work-390.png" });
  await mw.context.close();
  await context.close();
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  try { await testHome(browser); } catch (error) { results.push({ name: "FATAL home test", pass: false, detail: String(error).slice(0, 300) }); }
  try { await testWork(browser); } catch (error) { results.push({ name: "FATAL work test", pass: false, detail: String(error).slice(0, 300) }); }
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
const summary = {
  timestamp: new Date().toISOString(),
  base: BASE,
  passed,
  total: results.length,
  failed: failed.map((f) => ({ name: f.name, detail: f.detail })),
  consoleErrors: [...new Set(consoleErrors)].slice(0, 30),
  pageErrors: [...new Set(pageErrors)].slice(0, 30),
  badResponses: [...new Set(badResponses)].slice(0, 30),
};
fs.writeFileSync(OUT + "/qa-report.json", JSON.stringify({ summary, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (failed.length) process.exitCode = 1;
