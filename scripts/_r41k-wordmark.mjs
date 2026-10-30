// R41k wordmark build — measure the "Corpus" text once in Playwright
// using the Nunito-900 TTF embedded via @font-face, then write both:
//   • corpus-wordmark.svg (self-contained, text + embedded font)
//   • corpus-wordmark.png (rasterized from the measured HTML, ink)
//   • corpus-wordmark-white.svg / .png (same, white on accent purple)
// Spec from index.html:150 .html-splash-wordmark: Nunito 900, letter-
// spacing −0.5px (at ~96px baseline → proportional at other sizes),
// colour #FFFFFF (we also produce the ink variant for use on light).
import { webkit } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const KIT = '/Users/omeroth/Desktop/launch-video-kit/brand';
const ttf = readFileSync(`${KIT}/fonts/Nunito-900.ttf`);
const b64 = ttf.toString('base64');
const BASE_SIZE = 96;
const RENDER_SIZE = 400;
const LS = -0.5 * (RENDER_SIZE / BASE_SIZE);  // keep CSS proportion

async function render(colour, bgCss, outStem) {
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 600 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(`
    <!doctype html><html><head><style>
      @font-face {
        font-family: 'Nunito';
        font-weight: 900;
        src: url(data:font/ttf;base64,${b64}) format('truetype');
      }
      html, body { margin: 0; padding: 0; background: ${bgCss}; }
      body { display: flex; align-items: center; justify-content: flex-start; height: 100vh; padding: 0 16px; }
      .w {
        font-family: 'Nunito', sans-serif;
        font-weight: 900;
        font-size: ${RENDER_SIZE}px;
        letter-spacing: ${LS}px;
        line-height: 1;
        color: ${colour};
        white-space: nowrap;
      }
    </style></head><body><span class="w">Corpus</span></body></html>`, { waitUntil: 'load' });
  // Allow the embedded font a tick to decode.
  await page.waitForTimeout(300);
  await page.evaluateHandle('document.fonts.ready');
  const rect = await page.evaluate(() => {
    const el = document.querySelector('.w');
    const r = el.getBoundingClientRect();
    return { x: Math.floor(r.x), y: Math.floor(r.y), w: Math.ceil(r.width), h: Math.ceil(r.height) };
  });
  const padX = 6, padY = 6;
  await page.screenshot({
    path: `${KIT}/${outStem}.png`,
    clip: { x: rect.x - padX, y: rect.y - padY, width: rect.w + padX * 2, height: rect.h + padY * 2 },
    omitBackground: bgCss === 'transparent',
  });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rect.w} ${rect.h}" width="${rect.w}" height="${rect.h}">
  <defs>
    <style type="text/css"><![CDATA[
      @font-face {
        font-family: 'Nunito';
        font-weight: 900;
        src: url(data:font/ttf;base64,${b64}) format('truetype');
      }
      text { font-family: 'Nunito', 'Assistant', sans-serif; font-weight: 900; letter-spacing: ${LS.toFixed(3)}px; }
    ]]></style>
  </defs>
  <text x="0" y="${Math.round(RENDER_SIZE * 0.80)}" font-size="${RENDER_SIZE}" fill="${colour}">Corpus</text>
</svg>`;
  writeFileSync(`${KIT}/${outStem}.svg`, svg);
  console.log(`${outStem}: measured ${rect.w}×${rect.h} CSS px (−→ PNG @ 2× = ${(rect.w+padX*2)*2}×${(rect.h+padY*2)*2})`);
  await browser.close();
}

await render('#2A1266', 'transparent', 'corpus-wordmark');          // ink glyph, transparent
await render('#FFFFFF', '#7B4FD4',     'corpus-wordmark-white');    // white glyph on accent purple
console.log('done.');
