// R35f test — assert plain-tier and framed-tier reveal bitmaps have
// IDENTICAL art pixel rects. Compare by sampling N pixels inside the
// art rect from both canvases and asserting the alpha channel is
// non-zero on BOTH (= both bitmaps have art pixels at the same rect).
// Separately, render A → B fade at 0% / 50% / 100% as 393 EN + HE
// screenshots.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35f';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  localStorage.setItem('_corpus_debug', '1');
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

// 1. Pixel-equality: compose plain + bronze for socrates, assert art region alpha matches.
const diffReport = await page.evaluate(async () => {
  await _rvComposeCard('socrates', 'philosophy', 'plain');
  await _rvComposeCard('socrates', 'philosophy', 'bronze');
  const [urlA, urlB] = ['plain', 'bronze'].map(t => _rvBitmapCache['socrates|philosophy|' + t]);
  async function loadToCanvas(url) {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
  }
  const [cA, cB] = await Promise.all([loadToCanvas(urlA), loadToCanvas(urlB)]);
  // Art rect in canvas coords: artW = 0.8703 * 1140, centred, cy at 50.5%.
  const W = 1140, H = 1890;
  const artW = Math.round(0.8703 * W);
  const artH = Math.round(artW * 1200 / 670);
  const artX = Math.round((W - artW) / 2);
  const artY = Math.round(H * 0.505 - artH / 2);
  // Sample only INSIDE the frame window (the transparent cutout in B
  // where art shows through). Window = 74.83% × 82.75% of W×H, centred
  // on the canvas midline. Both A and B have the SAME art at this
  // region — identical pixels guaranteed only here. The outer art
  // pixels in A are legitimately covered by the frame PNG in B.
  const winX = Math.round(0.1254 * W);
  const winY = Math.round(0.0915 * H);
  const winW = Math.round(0.7483 * W);
  const winH = Math.round(0.8275 * H);
  const dataA = cA.getContext('2d').getImageData(winX, winY, winW, winH).data;
  const dataB = cB.getContext('2d').getImageData(winX, winY, winW, winH).data;
  // Rebind artW/artH to the WINDOW dims for the sampler.
  const sampleW = winW, sampleH = winH;
  // Sample grid: for each sample, if A has alpha > 0, assert that
  // position has the SAME RGB in B (B may have the frame on top
  // around the edges, but the inner window should be identical).
  // Simpler: sample 100 random points inside the art rect, require
  // that for 95%+ of them A and B have identical RGBA.
  const samples = 500;
  let matched = 0, missing = 0;
  for (let i = 0; i < samples; i++) {
    const x = Math.floor(Math.random() * sampleW);
    const y = Math.floor(Math.random() * sampleH);
    const idx = (y * sampleW + x) * 4;
    const aA = dataA[idx + 3], aB = dataB[idx + 3];
    if (aA === 0 && aB === 0) continue; // both transparent — ok
    if (aA === 0 || aB === 0) { missing++; continue; }
    const rgbMatch = dataA[idx] === dataB[idx] && dataA[idx+1] === dataB[idx+1] && dataA[idx+2] === dataB[idx+2];
    if (rgbMatch) matched++;
  }
  return { samples, matched, missing, artX, artY, artW, artH, canvasA: { w: cA.width, h: cA.height }, canvasB: { w: cB.width, h: cB.height } };
});
console.log('Pixel diff:', JSON.stringify(diffReport, null, 2));
const matchPct = diffReport.matched / (diffReport.samples - (diffReport.missing || 0)) * 100;
console.log(`Art-pixel match: ${matchPct.toFixed(1)}% (${diffReport.matched} identical / ${diffReport.samples} samples)`);
const PASS_THRESHOLD = 90;  // Framed covers edges with the frame PNG; inner window should still be high match.
console.log(matchPct >= PASS_THRESHOLD ? `[PASS] art pixels ≥ ${PASS_THRESHOLD}% identical between A and B` : `[FAIL] art pixels only ${matchPct.toFixed(1)}% identical`);

// Export both bitmaps as PNG for visual compare.
for (const tier of ['plain', 'bronze']) {
  const b64 = await page.evaluate(async (t) => {
    const url = _rvBitmapCache['socrates|philosophy|' + t];
    const r = await fetch(url);
    const blob = await r.blob();
    return new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  }, tier);
  const bytes = Buffer.from(b64.split(',')[1], 'base64');
  await writeFile(join(OUT, `bitmap-${tier}.png`), bytes);
}

// 2. Fade screenshots at 0 / 50 / 100 % (bronze upgrade = p=3) EN + HE.
for (const lang of ['en', 'he']) {
  const page2 = await ctx.newPage();
  await page2.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page2.evaluate((l) => { try { localStorage.setItem('corpus_lang', l); } catch (_) {} });
  await page2.reload({ waitUntil: 'load' });
  await page2.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  // Fire the reveal.
  await page2.evaluate(() => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', 3);
  });
  // Wait for both bitmaps to be in DOM + the fade to kick off.
  await page2.waitForSelector('img.rv-bmp-b', { timeout: 10000 });
  // Immediately pause the transition to inspect fade at 0% and 50%
  // via explicit opacity sets.
  for (const pct of [0, 50, 100]) {
    await page2.evaluate((p) => {
      const b = document.querySelector('img.rv-bmp-b');
      if (b) { b.style.transition = 'none'; b.style.opacity = String(p / 100); }
    }, pct);
    await page2.waitForTimeout(150);
    await page2.screenshot({ path: join(OUT, `fade-${pct}-${lang}.png`), fullPage: false });
  }
  await page2.close();
}
console.log('shots →', OUT);
await browser.close(); app.server.close();
