import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const archivo = path.join(root, "node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2");
const plex = path.join(root, "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2");
const photo = path.join(root, "public/media/876920137996309/876920137996309-1600.webp");
const logo = path.join(root, "public/brand/logo-256.png");

const b64 = async (file, mime) => `data:${mime};base64,${(await fs.readFile(file)).toString("base64")}`;
const [archivoData, plexData, photoData, logoData] = await Promise.all([
  b64(archivo, "font/woff2"),
  b64(plex, "font/woff2"),
  b64(photo, "image/webp"),
  b64(logo, "image/png"),
]);

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @font-face { font-family: "Archivo"; src: url("${archivoData}") format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; }
  @font-face { font-family: "Plex"; src: url("${plexData}") format("woff2"); font-weight: 400; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #08090b; overflow: hidden; font-family: "Archivo", Arial, sans-serif; }
  .canvas { position: relative; width: 1200px; height: 630px; display: flex; }
  .photo { position: absolute; top: 0; right: 0; width: 660px; height: 630px; object-fit: cover; filter: saturate(1.05) contrast(1.02); }
  .wash { position: absolute; inset: 0; background:
     linear-gradient(90deg, #08090b 0%, #08090b 40%, rgba(8,9,11,0.55) 62%, rgba(8,9,11,0.15) 100%),
     linear-gradient(0deg, rgba(8,9,11,0.8) 0%, transparent 42%); }
  .sun { position: absolute; right: 118px; top: 84px; width: 150px; height: 150px; border-radius: 50%;
     background: radial-gradient(circle at 50% 50%, #ffd21e 0%, #ffd21e 38%, rgba(255,210,30,0.25) 58%, transparent 70%);
     filter: blur(0.3px); opacity: 0.9; }
  .bar { position: absolute; left: 0; top: 0; width: 12px; height: 630px; background: #ffd21e; }
  .content { position: relative; z-index: 3; width: 720px; padding: 52px 0 42px 76px; display: flex; flex-direction: column; height: 100%; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { width: 52px; height: 52px; border-radius: 50%; background: #1b45e8; }
  .brand-text { font-family: "Plex", monospace; font-size: 12px; letter-spacing: 0.16em; color: #f2ede1; line-height: 1.75; text-transform: uppercase; }
  .brand-text b { display: block; font-family: "Archivo"; font-weight: 800; font-stretch: 112%; font-size: 15px; letter-spacing: 0.02em; }
  h1 { margin-top: 62px; font-size: 104px; line-height: 0.82; font-weight: 900; font-stretch: 118%; letter-spacing: -0.045em; color: #fff; text-transform: uppercase; }
  h1 span { color: #ffd21e; }
  .deck { margin-top: 26px; font-family: "Plex", monospace; font-size: 13px; letter-spacing: 0.14em; color: rgba(242,237,225,0.82); text-transform: uppercase; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-right: 40px; }
  .phone { font-family: "Archivo"; font-weight: 800; font-stretch: 110%; font-size: 30px; letter-spacing: -0.02em; color: #ffd21e; }
  .badge { font-family: "Plex", monospace; font-size: 11px; letter-spacing: 0.12em; color: #08090b; background: #ffd21e; padding: 10px 14px; text-transform: uppercase; }
</style></head>
<body>
  <div class="canvas">
    <img class="photo" src="${photoData}" alt="" />
    <div class="wash"></div>
    <div class="sun"></div>
    <div class="bar"></div>
    <div class="content">
      <div class="brand">
        <img src="${logoData}" alt="" />
        <div class="brand-text"><b>V.O Electrical</b>Lights Trading</div>
      </div>
      <h1>We wire<br/>the <span>sun.</span></h1>
      <div class="deck">Solar installation · Electrical supply · Street lighting</div>
      <div class="foot">
        <div class="phone">0992 659 5090</div>
        <div class="badge">Philippines</div>
      </div>
    </div>
  </div>
</body></html>`;

const tmp = path.join(root, "scripts/.og.html");
await fs.writeFile(tmp, html);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.goto("file://" + tmp.replace(/\\/g, "/"), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const png = path.join(root, "scripts/.og.png");
await page.screenshot({ path: png });
await browser.close();
await sharp(png).resize(1200, 630).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(root, "public/og.jpg"));
await fs.unlink(tmp);
await fs.unlink(png);
console.log("og written");
