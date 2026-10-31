// Paywall side-by-side: Android via CDP + WebKit at 393×852, EN, light.
import { webkit, chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { execSync } from 'node:child_process';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/Desktop/r43-paywall';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);

async function seedAndShowPaywall(page, { dark, bonus }) {
  await page.evaluate(({ dark, bonus }) => {
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_appearance', dark ? 'dark' : 'light');
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:false }));
    try { loadState(); setAppLang('en'); showScreen('home'); } catch(_){}
    try { closeWelcomeBackModal(); } catch(_){}
    if (dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    try { showPaywall({ reason: bonus ? 'bonus_lock' : 'chapter_lock', chapter: bonus ? null : 2 }); } catch(_){}
  }, { dark, bonus });
}

async function measurePaywall(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#modal-paywall.active .pwv7-ben-row'));
    const visibleRows = rows.filter(r => getComputedStyle(r).display !== 'none').length;
    const body = document.querySelector('#modal-paywall.active .pwv7-body');
    const ben = document.querySelector('#modal-paywall.active .pwv7-ben');
    const cards = document.querySelector('#modal-paywall.active .paywall-cards');
    const rect = el => el ? (() => { const r = el.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height), b: Math.round(r.bottom) }; })() : null;
    return {
      rowsTotal: rows.length,
      rowsVisible: visibleRows,
      body: rect(body),
      ben: rect(ben),
      cards: rect(cards),
      gap: body && ben && cards ? Math.round(cards.getBoundingClientRect().y - ben.getBoundingClientRect().bottom) : null,
      innerHeight: window.innerHeight,
      legal: document.querySelector('#modal-paywall.active .paywall-legal')?.textContent?.slice(0, 100),
    };
  });
}

// --- WebKit (iOS proxy) ---
const browserK = await webkit.launch({ headless: true });
const results = {};
for (const dark of [false, true]) {
  for (const bonus of [false, true]) {
    const label = `webkit-${bonus?'bonus':'chapter'}-${dark?'dark':'light'}`;
    const ctx = await browserK.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light' });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})}, CorpusWidgetBridge:{isWidgetInstalled:async()=>({installed:false,supported:true})} } };
    });
    await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
    await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
    await seedAndShowPaywall(page, { dark, bonus });
    await page.waitForTimeout(1200);
    results[label] = await measurePaywall(page);
    await page.screenshot({ path: `${OUT}/${label}.png` });
    await ctx.close();
  }
}
await browserK.close();

// --- Android via CDP ---
const browserA = await chromium.connectOverCDP('http://localhost:9222');
const pageA = browserA.contexts()[0].pages()[0];
for (const dark of [false, true]) {
  for (const bonus of [false, true]) {
    const label = `android-${bonus?'bonus':'chapter'}-${dark?'dark':'light'}`;
    await seedAndShowPaywall(pageA, { dark, bonus });
    await pageA.waitForTimeout(1200);
    results[label] = await measurePaywall(pageA);
    execSync(`adb exec-out screencap -p > ${OUT}/${label}.png`, { stdio: 'ignore' });
  }
}
await browserA.close();
app.s.close();

console.log(JSON.stringify(results, null, 2));
