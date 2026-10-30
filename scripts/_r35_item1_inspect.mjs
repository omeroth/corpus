// R35 item 1 — identify the mystery "white rect + lavender border +
// dark bottom bar + purple glow" that still shows during the
// frame-upgrade animation. Approach: at every pause (300/900/1500/
// 2500/4000 ms into the sequence), take elementsFromPoint samples
// (a) just inside the suspect white area between the frame and the
// card bounding box, and (b) on the lavender border strip; dump the
// FULL stack with tag/id/class + computed bg/border/outline/
// box-shadow + ::before and ::after.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) { const server = createServer(async (req, res) => { try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html'; const abs = join(root, p); res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' }); res.end(await readFile(abs)); } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port }))); }
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
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
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:{socrates:6}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
// Launch the frame-upgrade sequence (bronze → silver). Debug reveal
// with p=6 triggers the boundary (3→6 crosses into silver).
await page.evaluate(() => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 6);
});
// Wait for .rv-pc to attach, then start the clock.
await page.waitForSelector('.rv-pc', { timeout: 5000 });
const kickStart = Date.now();
const stamps = [300, 900, 1500, 2500, 4000];
for (const t of stamps) {
  const wait = (kickStart + t) - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/upgrade-t${t}-393-en.png`, fullPage: false });
  const info = await page.evaluate(() => {
    const pc = document.querySelector('.rv-pc');
    if (!pc) return { err: 'no .rv-pc' };
    const r = pc.getBoundingClientRect();
    // Probe A: 4 px inside each corner of .rv-pc (the "white between
    // frame and box edge" area). Probe B: directly on the right-edge
    // of the suspect lavender border, 2 px inside .rv-pc.
    const probes = {
      inside_tl: [r.left + 4,  r.top + 4],
      inside_tr: [r.right - 4, r.top + 4],
      inside_bl: [r.left + 4,  r.bottom - 4],
      inside_br: [r.right - 4, r.bottom - 4],
      right_mid: [r.right - 2, (r.top + r.bottom) / 2],
      left_mid:  [r.left + 2,  (r.top + r.bottom) / 2],
      bottom_mid:[(r.left + r.right) / 2, r.bottom - 2],
    };
    const dump = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const before = getComputedStyle(el, '::before');
      const after = getComputedStyle(el, '::after');
      const sx = (x) => (x || '').toString().slice(0, 100);
      return {
        tag: el.tagName,
        id: el.id || null,
        cls: el.className || null,
        bg: sx(cs.backgroundColor) + ' / ' + sx(cs.backgroundImage),
        border: sx(cs.border),
        outline: sx(cs.outline),
        box: sx(cs.boxShadow),
        before_bg: sx(before.backgroundColor) + ' / ' + sx(before.backgroundImage),
        before_box: sx(before.boxShadow),
        before_content: sx(before.content),
        after_bg: sx(after.backgroundColor) + ' / ' + sx(after.backgroundImage),
        after_box: sx(after.boxShadow),
        after_content: sx(after.content),
      };
    };
    const out = { pcCls: pc.className };
    for (const [name, [x, y]] of Object.entries(probes)) {
      const stack = document.elementsFromPoint(x, y).slice(0, 6);
      out[name] = { x, y, stack: stack.map(dump) };
    }
    return out;
  });
  console.log('=== t=' + t + 'ms ===');
  console.log(JSON.stringify(info, null, 2));
}
await browser.close(); app.server.close();
