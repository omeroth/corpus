// One screenshot per bonus (EN + HE) of a bolded section, to confirm
// the editorial pass renders as expected.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/scripts/bonus-bold-shots';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p); if (!abs.startsWith(root)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

// (subject, chapterId, dayId) + lang. Day 1 explanation is the richest
// prose section in each bonus; picking it ensures multiple bolds visible.
const SHOTS = [
  { subject: 'philosophy', chapter: 'bonus2',     day: 1, lang: 'en' },
  { subject: 'philosophy', chapter: 'bonus2',     day: 1, lang: 'he' },
  { subject: 'economics',  chapter: 'bonusEcon2', day: 1, lang: 'en' },
  { subject: 'economics',  chapter: 'bonusEcon2', day: 1, lang: 'he' },
];
for (const s of SHOTS) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_lang', args.lang);
    localStorage.setItem('corpus_subject', args.subject);
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  }, s);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.evaluate((args) => {
    try { setAppLang(args.lang); } catch(_){}
    try { setSubject(args.subject); } catch(_){}
    state.currentWeek = args.chapter;
    state.currentDay = args.day;
    state.currentSection = 2;  // 0:idea, 1:source, 2:explanation
    try { showScreen('reader'); } catch(_){}
    try { renderReader(); } catch(e){ console.error(e); }
  }, s);
  await page.waitForTimeout(300);
  const name = `${s.subject}-${s.chapter}-d${s.day}-explanation-${s.lang}.png`;
  await page.screenshot({ path: join(OUT, name) });
  console.log('wrote', name);
  await ctx.close();
}
await browser.close();
app.server.close();
