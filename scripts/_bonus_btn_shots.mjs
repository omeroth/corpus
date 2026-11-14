// Bonus button + sheet verification shots across 3 subjects × EN/HE.
import { chromium } from 'playwright-core';
import { createServer as _createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW='/Users/omeroth/CORPUS/www';
const OUT='/Users/omeroth/CORPUS/scripts/bonus-btn-shots';
await mkdir(OUT, { recursive: true });
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
function startServer(root){const server=_createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);if(!abs.startsWith(root)){res.writeHead(403);res.end();return;}res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}});return new Promise(r=>server.listen(0,'127.0.0.1',()=>r({server,port:server.address().port})));}
const app = await startServer(WWW);
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});

async function boot(lang, subject){
  const ctx=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript((a)=>{
    window.Capacitor={isNativePlatform:()=>false,getPlatform:()=>'ios',Plugins:{Haptics:{impact:async()=>({})},SplashScreen:{hide:async()=>({})},App:{addListener:()=>({remove:()=>{}})},Preferences:{get:async()=>({})},StatusBar:{setStyle:async()=>({})}}};
    try{localStorage.clear();}catch(_){}
    localStorage.setItem('corpus_lang',a.lang);
    localStorage.setItem('corpus_subject',a.subject);
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_onboarding_flow_version','7');
  },{lang,subject});
  await page.goto(`http://127.0.0.1:${app.port}/index.html`,{waitUntil:'load'});
  await page.waitForTimeout(700);
  return { ctx, page, errs };
}

for (const subject of ['philosophy','economics','psychology']) {
  for (const lang of ['en','he']) {
    const { ctx, page, errs } = await boot(lang, subject);
    await page.evaluate(({lang, subject}) => {
      try{setAppLang(lang);}catch(_){}
      try{setSubject(subject);}catch(_){}
      try{renderHome();}catch(_){}
      try{showScreen('home');}catch(_){}
    }, {lang, subject});
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => {
      const btn = document.getElementById('bonus-btn');
      const img = btn && btn.querySelector('.bonus-btn-icon');
      const cs = btn ? getComputedStyle(btn) : null;
      return {
        mounted: !!btn,
        iconSrc: img ? img.getAttribute('src') : null,
        sparkCount: btn ? btn.querySelectorAll('.bonus-btn-spark').length : 0,
        hasSeenClass: btn ? btn.classList.contains('wt-seen') : null,
        bg: cs ? cs.backgroundColor : null,
      };
    });
    console.log('[home ' + subject + ' ' + lang + ']', JSON.stringify(info), 'errs=' + errs.length);
    await page.screenshot({ path: join(OUT, `home-${subject}-${lang}.png`) });
    // Open the sheet.
    await page.evaluate(() => { try { _openBonusSheet(); } catch(e){ console.error(e); } });
    await page.waitForTimeout(500);
    const sheet = await page.evaluate(() => {
      const el = document.getElementById('modal-bonus-info');
      const body = el && el.querySelector('.bonusg-body');
      const title = el && el.querySelector('.bonusg-title');
      const list = el && el.querySelectorAll('.bonusg-list li');
      const cta = el && el.querySelector('[data-act="open"]');
      return {
        mounted: !!el && el.classList.contains('active'),
        titleText: title && title.textContent,
        bodyText: body && body.textContent,
        listCount: list ? list.length : 0,
        ctaText: cta && cta.textContent,
      };
    });
    console.log('[sheet ' + subject + ' ' + lang + ']', JSON.stringify(sheet));
    await page.screenshot({ path: join(OUT, `sheet-${subject}-${lang}.png`) });
    await ctx.close();
  }
}
await browser.close(); app.server.close();
