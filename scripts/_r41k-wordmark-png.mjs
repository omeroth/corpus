// R41k wordmark PNG rasterizer — load the self-contained SVGs in a
// Playwright page and screenshot each one at a crisp 1024px width.
import { webkit } from 'playwright-core';
import { readFileSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/launch-video-kit/brand';
const browser = await webkit.launch({ headless: true });

for (const [stem, bgCss] of [
  ['corpus-wordmark',       'transparent'],      // ink glyph, transparent bg
  ['corpus-wordmark-white', '#7B4FD4'],          // white glyph on accent purple
]) {
  const svg = readFileSync(`${OUT}/${stem}.svg`, 'utf8');
  // Render in a page that forces the SVG to 1024px wide and crops to its
  // bounding box; omitBackground preserves the transparent background.
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 500 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(`
    <!doctype html><html><head><style>
      html, body { margin: 0; padding: 0; background: ${bgCss}; }
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      svg { width: 1024px; height: auto; display: block; }
    </style></head><body>${svg}</body></html>`, { waitUntil: 'load' });
  // Give the font an extra beat to decode before snapshot.
  await page.waitForTimeout(400);
  const rect = await page.evaluate(() => {
    const s = document.querySelector('svg');
    const r = s.getBoundingClientRect();
    return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
  });
  const outPath = `${OUT}/${stem}.png`;
  await page.screenshot({ path: outPath, clip: rect, omitBackground: bgCss === 'transparent' });
  console.log(`wrote ${outPath}  (${rect.width}×${rect.height} CSS px → 2× pixel density)`);
  await ctx.close();
}
await browser.close();
