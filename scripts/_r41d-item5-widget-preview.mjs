// R41 D item 5 — onboarding widget preview vs real widget comparison.
//
// Mounts the #onb-v2-widget onboarding screen directly, screenshots the
// .wp-card preview, then grabs the real widget's render from
// design-ref/widgets/small-philosophy-ready-en-light.png so you can
// compare side-by-side.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41d-sim';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.evaluate((l) => {
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', l === 'he' ? 'rtl' : 'ltr');
    // Force-show the widget onboarding screen.
    const w = document.getElementById('onb-v2-widget');
    if (!w) return;
    document.querySelectorAll('.onb-screen').forEach(s => s.classList.remove('active'));
    w.style.display = 'block';
    w.classList.add('active');
    // Set thinker image.
    const fig = w.querySelector('.wp-card-thinker');
    if (fig) fig.src = './images/widget-thinkers/socrates-curious.png';
    // Simulate stat state.
    const n = w.querySelector('.wp-card-number'); if (n) n.textContent = '7';
    const c = w.querySelector('.wp-card-caption'); if (c) c.textContent = l === 'en' ? "Let's talk" : 'בוא נדבר';
  }, lang);
  await page.waitForTimeout(600);
  // Crop just the .wp-card.
  const rect = await page.evaluate(() => {
    const el = document.querySelector('#onb-v2-widget .wp-card');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 10), width: r.width + 20, height: r.height + 20 };
  });
  if (rect) await page.screenshot({ path: `${OUT}/item5-onbwidget-${lang}.png`, clip: rect });
  await ctx.close();
}
await browser.close(); app.s.close();
console.log('done.');
