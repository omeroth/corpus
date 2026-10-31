// R43 — audit that .rv-pc / .rv-flp (card), plate + "N more to" label,
// and .rd-cta rects never intersect across every reveal branch, viewport
// and language. Launches WebKit (iOS proxy) because the local emulator
// doesn't give us a knob to resize the Android WebView; the geometry
// bug is viewport-driven, so WebKit covers it.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/Desktop/r43-reveal-fit';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);

const viewports = [
  { w: 393, h: 814, name: 'android-393x814' },
  { w: 393, h: 852, name: 'iphone-393x852' },
];

const branches = [
  { name: 'met-again-point', points: 2, kind: 'point' },
  { name: 'frame-upgrade-settled', points: 3, kind: 'frame' },
];

const langs = ['en'];

function intersects(a, b) {
  if (!a || !b) return false;
  return !(a.right <= b.left + 0.5 || a.left >= b.right - 0.5 ||
           a.bottom <= b.top + 0.5 || a.top >= b.bottom - 0.5);
}

async function seedAndReveal(page, { lang, points, kind, mid }) {
  await page.evaluate(({ lang, points, kind }) => {
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', lang);
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:'philosophy', lang, completedDays:{},
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home',
      isPaid:true, dailyStreak:1, longestStreak:1,
      _debugThinkerPoints: { socrates: points - (kind === 'frame' ? 1 : 1) },
    }));
    try { loadState(); setAppLang(lang); showScreen('home'); } catch(_){}
    document.documentElement.classList.remove('dark');
    window._rvV8_ENABLED = false;
    document.body.classList.add('on-reader-v7');
  }, { lang, points, kind });
  // Open reveal
  await page.evaluate(({ points, kind }) => {
    try { __corpusPreviewReveal('socrates', points, { kind }); } catch(_){}
  }, { points, kind });
  // Wait long enough for mount; for 'mid' capture early during
  // animation; for settled capture after safety-net ungate.
  await page.waitForTimeout(mid ? 1500 : 4200);
}

async function measure(page) {
  return page.evaluate(() => {
    const dc = document.getElementById('dc-thinker-screen');
    if (!dc || dc.style.display === 'none') return { active: false };
    const rect = el => el ? (() => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) }; })() : null;
    const card = dc.querySelector('.rv-pc') || dc.querySelector('.rv-flp');
    const plate = dc.querySelector('.thinker-plate');
    const label = dc.querySelector('#rv-glab');
    const cta = dc.querySelector('.rd-cta');
    return {
      active: true,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      cardKind: dc.querySelector('.rv-pc') ? 'rv-pc' : (dc.querySelector('.rv-flp') ? 'rv-flp' : null),
      card: rect(card),
      plate: rect(plate),
      label: rect(label),
      cta: rect(cta),
    };
  });
}

const browser = await webkit.launch({ headless: true });
const results = [];
let failures = 0;

for (const vp of viewports) {
  for (const lang of langs) {
    for (const b of branches) {
      const label = `${vp.name}-${lang}-${b.name}`;
      const ctx = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light',
      });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        window.__CORPUS_DEBUG_BUILD = true;
        window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})}, CorpusWidgetBridge:{isWidgetInstalled:async()=>({installed:false,supported:true})} } };
      });
      await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
      await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
      try {
        await seedAndReveal(page, { ...b, lang });
      } catch (e) {
        results.push({ label, error: String(e.message || e) });
        await ctx.close();
        continue;
      }
      const m = await measure(page);
      await page.screenshot({ path: `${OUT}/${label}.png` });
      await ctx.close();
      if (!m.active) {
        results.push({ label, skipped: 'reveal did not open' });
        continue;
      }
      // Intersection checks
      const checks = {
        'card-vs-plate': intersects(m.card, m.plate),
        'card-vs-label': intersects(m.card, m.label),
        'card-vs-cta':   intersects(m.card, m.cta),
        'plate-vs-cta':  intersects(m.plate, m.cta),
        'label-vs-cta':  intersects(m.label, m.cta),
      };
      const gapAbovePlate = m.card && m.plate ? m.plate.top - m.card.bottom : null;
      const anyFail = Object.values(checks).some(Boolean);
      if (anyFail) failures++;
      results.push({ label, cardKind: m.cardKind, viewport: m.viewport, card: m.card, plate: m.plate, cta: m.cta, gapAbovePlate, checks, pass: !anyFail });
    }
  }
}

await browser.close();
app.s.close();

// Report
console.log('\n═══ REVEAL FIT AUDIT ═══\n');
for (const r of results) {
  if (r.error) { console.log(`❌ ${r.label}: ERROR ${r.error}`); continue; }
  if (r.skipped) { console.log(`⚠  ${r.label}: ${r.skipped}`); continue; }
  const flag = r.pass ? '✓' : '✗';
  const gap = r.gapAbovePlate != null ? `gap=${r.gapAbovePlate}px` : 'no plate';
  const fails = Object.entries(r.checks).filter(([_, v]) => v).map(([k]) => k).join(',') || 'none';
  console.log(`${flag} ${r.label.padEnd(50)} ${r.cardKind} ${gap} fail=${fails}`);
}
console.log(`\n${failures} failures out of ${results.length} runs.`);
process.exit(failures > 0 ? 1 : 0);
