// bonusPsy2 verification: dialogue 0 + Asch idea + a quiz, home with NEW badge.
import { chromium } from 'playwright-core';
import { createServer as _createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/scripts/bonuspsy2-shots';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
function startServer(root){const server=_createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);if(!abs.startsWith(root)){res.writeHead(403);res.end();return;}res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}});return new Promise(r=>server.listen(0,'127.0.0.1',()=>r({server,port:server.address().port})));}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true });

async function boot(lang, seedState) {
  const ctx = await browser.newContext({ viewport:{width:393,height:852}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
  const page = await ctx.newPage();
  await page.addInitScript((a)=>{
    window.Capacitor={isNativePlatform:()=>false,getPlatform:()=>'ios',Plugins:{Haptics:{impact:async()=>({})},SplashScreen:{hide:async()=>({})},App:{addListener:()=>({remove:()=>{}})},Preferences:{get:async()=>({})},StatusBar:{setStyle:async()=>({})}}};
    try{localStorage.clear();}catch(_){}
    localStorage.setItem('corpus_lang', a.lang);
    localStorage.setItem('corpus_subject', 'psychology');
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_onboarding_flow_version','7');
    if (a.seedState) localStorage.setItem('corpus_state', JSON.stringify(a.seedState));
  }, { lang, seedState });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil:'load' });
  await page.waitForTimeout(500);
  return { ctx, page };
}

// 1) Dialogue 0 (second section: "What will we explore?")
for (const lang of ['en','he']) {
  const { ctx, page } = await boot(lang);
  await page.evaluate((lang)=>{
    try{setAppLang(lang);}catch(_){}
    state.currentWeek = 'bonusPsy2';
    state.currentDay = 0;
    state.currentSection = 1;
    try{showScreen('reader');}catch(_){}
    try{renderReader();}catch(e){console.error(e);}
  }, lang);
  await page.waitForTimeout(400);
  const path = join(OUT, `d0-explore-${lang}.png`);
  await page.screenshot({ path });
  console.log('wrote', path);
  await ctx.close();
}

// 2) Asch (d2) idea section
for (const lang of ['en','he']) {
  const { ctx, page } = await boot(lang);
  await page.evaluate((lang)=>{
    try{setAppLang(lang);}catch(_){}
    state.currentWeek = 'bonusPsy2';
    state.currentDay = 2;
    state.currentSection = 0;
    try{showScreen('reader');}catch(_){}
    try{renderReader();}catch(e){console.error(e);}
  }, lang);
  await page.waitForTimeout(400);
  const path = join(OUT, `d2-idea-${lang}.png`);
  await page.screenshot({ path });
  console.log('wrote', path);
  await ctx.close();
}

// 3) Asch quiz (first quiz is section index 4 after idea+source+explanation+depth)
for (const lang of ['en','he']) {
  const { ctx, page } = await boot(lang);
  await page.evaluate((lang)=>{
    try{setAppLang(lang);}catch(_){}
    state.currentWeek = 'bonusPsy2';
    state.currentDay = 2;
    state.currentSection = 4;
    try{showScreen('reader');}catch(_){}
    try{renderReader();}catch(e){console.error(e);}
  }, lang);
  await page.waitForTimeout(400);
  const path = join(OUT, `d2-quiz1-${lang}.png`);
  await page.screenshot({ path });
  console.log('wrote', path);
  await ctx.close();
}

// 4) Home in psychology (with NEW badge eligible for bonusPsy2).
// Completed chapter 1, no bonus progress yet, so the NEW sticker should
// display when eligibility evaluates.
function seedHome() {
  const cd = {};
  for (let d = 1; d <= 7; d++) cd[`psychology-1-${d}`] = true;
  return {
    v:3, subject:'psychology', lang:'en',
    completedDays: cd, dailyStreak: 7, xp: 400,
    activeDates:['2026-11-14'],
    framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
    bonusUnlockShown:{psychology:true},
    currentScreen:'home',
  };
}
for (const lang of ['en','he']) {
  const seed = seedHome(); seed.lang = lang;
  const { ctx, page } = await boot(lang, seed);
  await page.evaluate(()=>{ try{renderHome();}catch(_){} try{showScreen('home');}catch(_){} });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const weeks = (typeof getW === 'function') ? getW().map(w=>String(w.id)) : [];
    const bonusCard = document.getElementById('level-card-bonusPsy2');
    const hasOldCard = !!document.getElementById('level-card-bonusPsy1');
    const bodyText = document.body.textContent || '';
    return {
      weeks,
      bonusPsy2CardMounted: !!bonusCard,
      oldBonusPsy1CardMounted: hasOldCard,
      mentionsNew: /NEW\b|חדש/i.test(bodyText),
      mentionsOldTitle: /Hard to Disconnect|קשה להתנתק/.test(bodyText),
    };
  });
  console.log('[home ' + lang + ']', JSON.stringify(info));
  const path = join(OUT, `home-${lang}.png`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path, fullPage: true });
  console.log('wrote', path);
  await ctx.close();
}

// 5) MIGRATION CASE: stored bonusPsy1 completedDays keys from an old
// user. Verify no crashes and the new bonus is 0/6 progress.
{
  const stale = { v:3, subject:'psychology', lang:'en',
    completedDays: {
      'psychology-bonusPsy1-1': true, 'psychology-bonusPsy1-2': true,
      'psychology-bonusPsy1-3': true,
    },
    dailyStreak:1, xp:150, activeDates:['2026-11-14'],
    framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
    currentScreen:'home',
  };
  const { ctx, page } = await boot('en', stale);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.evaluate(()=>{ try{renderHome();}catch(_){} try{showScreen('home');}catch(_){} });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const b = (typeof getW === 'function') ? getW().find(w=>w.id==='bonusPsy2') : null;
    const total = b ? b.days.length : -1;
    const done = b ? b.days.filter(d => state.completedDays[('psychology-bonusPsy2-'+d.id)]).length : -1;
    return { newBonusTotal: total, newBonusDone: done,
             oldKeysPresent: Object.keys(state.completedDays).filter(k=>k.includes('bonusPsy1')).length };
  });
  console.log('[migration]', JSON.stringify(info), 'errors=' + errors.length, errors.slice(0,3));
  await ctx.close();
}

await browser.close(); app.server.close();
