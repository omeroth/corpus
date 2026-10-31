// Quick visual pass — 8 scenes × WebKit (iOS proxy) + Android, EN light.
import { webkit, chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { execSync } from 'node:child_process';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/Desktop/r43-scenes';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);

async function seedPaid(page) {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_appearance','light');
    const today = new Date(); const activeDates = []; for (let i=0;i<12;i++){const d=new Date(today);d.setDate(today.getDate()-i);activeDates.push(d.toISOString().slice(0,10));}
    const cd = {}; for (let d=1;d<=5;d++) cd[`philosophy-1-${d}`] = true;
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:'philosophy', lang:'en', completedDays:cd,
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:true,
      dailyStreak:12, longestStreak:12, activeDates, lastStreakShownDate:activeDates[0],
      chapterCompleteShown:{}, bonusUnlockShown:{'bonus-ch1':true},
      unlockedThinkers:['socrates','plato','aristotle','kant','nietzsche'],
      _debugThinkerPoints:{socrates:12,plato:9,aristotle:6,kant:3,nietzsche:1},
    }));
    try { loadState(); setAppLang('en'); showScreen('home'); } catch(_){}
    try { closeWelcomeBackModal(); } catch(_){}
    document.documentElement.classList.remove('dark');
    window._rvV8_ENABLED = false;
  });
}

const scenes = [
  { name: 'home', setup: async p => { await seedPaid(p); } },
  { name: 'reader', setup: async p => { await seedPaid(p); await p.evaluate(() => { try { openReader(1,1); } catch(_){} }); } },
  { name: 'quiz', setup: async p => {
    await seedPaid(p);
    await p.evaluate(() => { try { openReader(1,1); } catch(_){} });
    await p.waitForTimeout(800);
    for (let i=0;i<10;i++) {
      const at = await p.evaluate(() => !!document.querySelector('.quiz-option'));
      if (at) break;
      await p.evaluate(() => { const b=document.getElementById('reader-next-btn'); if(b && b.offsetParent) b.click(); });
      await p.waitForTimeout(500);
    }
  }},
  { name: 'stats', setup: async p => {
    await seedPaid(p);
    await p.evaluate(() => {
      state.currentWeek = 1; state.currentDay = 1; state.quizAttempts = {};
      document.body.classList.add('on-reader-v7');
      const modal = document.getElementById('modal-complete'); if (modal) modal.classList.add('active');
      try { _showDcStats('Dialogue complete!', 'What makes a question moral?', 50, state.dailyStreak||12, { label:'Next Dialogue', fn:()=>{} }, {}); } catch(_){}
    });
  }},
  { name: 'reveal', setup: async p => {
    await seedPaid(p);
    await p.evaluate(() => { try { __corpusPreviewReveal('socrates', 9, {kind:'frame'}); } catch(_){} });
    await p.waitForTimeout(4000); // settle
  }},
  { name: 'pantheon', setup: async p => {
    await seedPaid(p);
    await p.evaluate(() => { const b = document.getElementById('bnav-pantheon'); if (b) b.click(); });
    await p.waitForTimeout(1200);
  }},
  { name: 'streak', setup: async p => {
    await seedPaid(p);
    await p.evaluate(() => { const b = document.getElementById('bnav-streak'); if (b) b.click(); });
    await p.waitForTimeout(1200);
  }},
  { name: 'ch6-gift', setup: async p => {
    await seedPaid(p);
    await p.evaluate(() => { try { _openCh6GiftSheet(); } catch(_){} });
    await p.waitForTimeout(1000);
  }},
];

// WebKit pass
const browserK = await webkit.launch({ headless: true });
for (const s of scenes) {
  const ctx = await browserK.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})}, CorpusWidgetBridge:{isWidgetInstalled:async()=>({installed:false,supported:true})} } }; });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await s.setup(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${s.name}-webkit.png` });
  console.log(`webkit ${s.name}`);
  await ctx.close();
}
await browserK.close();

// Android pass
const browserA = await chromium.connectOverCDP('http://localhost:9222');
const pageA = browserA.contexts()[0].pages()[0];
for (const s of scenes) {
  await s.setup(pageA);
  await pageA.waitForTimeout(600);
  execSync(`adb exec-out screencap -p > ${OUT}/${s.name}-android.png`, { stdio: 'ignore' });
  console.log(`android ${s.name}`);
}
await browserA.close();
app.s.close();
console.log('done.');
