import { chromium } from 'playwright-core';
import { createServer as _createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
const WWW='/Users/omeroth/CORPUS/www';
const OUT='/Users/omeroth/CORPUS/scripts/bonuspsy2-shots';
await mkdir(OUT, { recursive: true });
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
function startServer(root){const server=_createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);if(!abs.startsWith(root)){res.writeHead(403);res.end();return;}res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}});return new Promise(r=>server.listen(0,'127.0.0.1',()=>r({server,port:server.address().port})));}
const app = await startServer(WWW);
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
// Resolve thinker image path for each dialogue, check webp file exists on disk.
const EXPECTED = {
  1: { id:'galton',    file:'images/galton.webp' },
  2: { id:'asch',      file:'images/asch.webp' },
  3: { id:'kahneman',  file:'images/kahneman-psy.webp' },
  4: { id:'festinger', file:'images/festinger.webp' },
  5: { id:null,        file:null },
};
for (const [d, { id, file }] of Object.entries(EXPECTED)) {
  if (!id) { console.log('D'+d+'  no-thinker summary'); continue; }
  console.log('D'+d+'  thinkerId='+id+'  file='+file+'  exists='+existsSync('/Users/omeroth/CORPUS/' + file));
}
async function boot(lang){
  const ctx=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page=await ctx.newPage();
  await page.addInitScript((a)=>{
    window.Capacitor={isNativePlatform:()=>false,getPlatform:()=>'ios',Plugins:{Haptics:{impact:async()=>({})},SplashScreen:{hide:async()=>({})},App:{addListener:()=>({remove:()=>{}})},Preferences:{get:async()=>({})},StatusBar:{setStyle:async()=>({})}}};
    try{localStorage.clear();}catch(_){}
    localStorage.setItem('corpus_lang',a.lang);
    localStorage.setItem('corpus_subject','psychology');
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_onboarding_flow_version','7');
  },{lang});
  await page.goto(`http://127.0.0.1:${app.port}/index.html`,{waitUntil:'load'});
  await page.waitForTimeout(500);
  return { ctx, page };
}
{
  const { ctx, page } = await boot('en');
  await page.evaluate(() => {
    window.__resolve = (dayId) => {
      const w = getW().find(x => x.id === 'bonusPsy2');
      if (!w) return null;
      const day = w.days.find(x => x.id === dayId);
      if (!day) return null;
      if (!day.thinkerId) return { thinkerId: null };
      const t = getT().find(x => x.id === day.thinkerId);
      const img = (typeof _thinkerImage === 'function') ? _thinkerImage(t, 'psychology') : t.image;
      return { thinkerId: day.thinkerId, name: t.name, image: img };
    };
  });
  for (let d = 1; d <= 5; d++) {
    const r = await page.evaluate((dayId) => window.__resolve(dayId), d);
    console.log('D'+d, JSON.stringify(r));
  }
  const pantheon = await page.evaluate(() => {
    const order = (typeof CAROUSEL_ORDER !== 'undefined') ? CAROUSEL_ORDER.psychology : [];
    return { total: order.length, places: ['galton','asch','festinger'].map(id => ({ id, index: order.indexOf(id) })) };
  });
  console.log('[pantheon]', JSON.stringify(pantheon));
  await ctx.close();
}
// Shot: D1 "next thinker" preview + end-of-dialogue stats.
{
  const { ctx, page } = await boot('en');
  // Preview — fire _showThinkerIntroIfNeeded against galton.
  await page.evaluate(() => {
    const day = { id:1, title:'Galton: When Is the Crowd Right?', titleEn:'Galton: When Is the Crowd Right?',
      thinker:'Francis Galton', thinkerEn:'Francis Galton', thinkerId:'galton', xp:50 };
    if (typeof _showThinkerIntroIfNeeded === 'function') _showThinkerIntroIfNeeded(day, {});
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/d1-preview-en.png' });
  console.log('wrote', OUT + '/d1-preview-en.png');
  // End of dialogue stats.
  await page.evaluate(() => {
    try { document.querySelector('#thinker-intro')?.remove(); } catch(_){}
    state.currentWeek='bonusPsy2'; state.currentDay=1;
    state.completedDays['psychology-bonusPsy2-1']=true;
    try { showScreen('reader'); } catch(_){}
    const t = getT().find(x => x.id === 'galton');
    const w = getW().find(x => x.id === 'bonusPsy2');
    const day = w.days.find(x => x.id === 1);
    if (typeof showThinkerCardScreen === 'function') showThinkerCardScreen(t, w, day);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/d1-end-en.png' });
  console.log('wrote', OUT + '/d1-end-en.png');
  await ctx.close();
}
await browser.close(); app.server.close();
