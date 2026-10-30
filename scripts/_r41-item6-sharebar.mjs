// R41 item 6 — v7 share bar on the dialogue-complete stats screen.
// Open modal-complete via _showDcStats, confirm #dc-share-btn is visible
// and shareCompletion is wired. EN + HE screenshots.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41-sharebar';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });

async function run(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    try { localStorage.clear(); } catch(_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{'philosophy-1-1':true}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  // Open modal-complete on the stats screen under v7.
  const probe = await page.evaluate((l) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    state.currentWeek = 1; state.currentDay = 1;
    try {
      _showDcStats(
        l === 'en' ? 'Lesson complete' : 'השיעור הושלם',
        l === 'en' ? 'The Examined Life' : 'החיים הראויים לחקירה',
        20, 1,
        { fn: closeCompleteModal }, {}
      );
      const m = document.getElementById('modal-complete');
      if (m) m.classList.add('active');
      const btn = document.getElementById('dc-share-btn');
      return {
        btnPresent: !!btn,
        btnDisplay: btn ? getComputedStyle(btn).display : null,
        btnVisible: btn && getComputedStyle(btn).display !== 'none' && btn.offsetHeight > 0,
        btnHandler: btn ? !!btn.onclick : null,
      };
    } catch(e) { return { err: e.message }; }
  }, lang);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${lang}-stats-with-sharebar.png`, fullPage: false });
  console.log(lang, JSON.stringify(probe));
  await ctx.close();
  return probe;
}
const en = await run('en');
const he = await run('he');
await browser.close(); app.s.close();
const okEn = en.btnPresent && en.btnVisible;
const okHe = he.btnPresent && he.btnVisible;
console.log(`\nen share bar visible: ${okEn ? 'PASS' : 'FAIL'}`);
console.log(`he share bar visible: ${okHe ? 'PASS' : 'FAIL'}`);
process.exit((okEn && okHe) ? 0 : 1);
