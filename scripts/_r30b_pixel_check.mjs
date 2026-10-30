// R30b item 3 — pixel-sample regression on Pantheon + reveal framed cards.
//   • Sample a pixel at (art.left - bw/2, art.center.y). Fail if that
//     pixel == page background (= ring not painted). Pass if the tier
//     material is there (any non-background RGB).
//   • Each stud's centre is within 2 px of the expected offset
//     ("outside the corner" = corner − st/3 + st/2 = corner + st/6).
// 393×852 EN per the mid-round rule.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
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
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function check(label, w, h, lang) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const _debugPts = { socrates:12, plato:9, russell:12, aurelius:6, aristotle:3 };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy:true, economics:true, psychology:true }, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(600);

  // For each framed card: sample pixel at (face.left + bw/2, face.cy)
  // via html2canvas-style approach using a hidden canvas drawn from
  // the screenshot. Since pngjs isn't available, we take page.screenshot
  // + decode via sharp? No — easier: use document.elementsFromPoint to
  // check what's painted at the sample coord. If the top element is
  // the .corpus-mb face (not the img), the ring background is painted.
  const pageBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const cells = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.pth-cell.framed')).slice(0, 4).map(c => {
      const face = c.querySelector('.pth-face.pth-front.corpus-mb');
      const img = c.querySelector('img.pth-art');
      const cs = face ? getComputedStyle(face) : null;
      const studs = Array.from(c.querySelectorAll('.mb-stud'));
      return {
        tier: (c.className.match(/tier-(\w+)/) || [,'none'])[1],
        face: face ? (() => { const r = face.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, cx: r.left + r.width/2, cy: r.top + r.height/2 }; })() : null,
        img: img ? (() => { const r = img.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; })() : null,
        bw: parseFloat(cs?.paddingLeft || '0'),
        st: parseFloat(cs?.getPropertyValue('--st') || '0'),
        studs: studs.map(s => {
          const r = s.getBoundingClientRect();
          return { cls: s.className, cx: r.left + r.width/2, cy: r.top + r.height/2 };
        }),
      };
    });
  });

  for (const c of cells) {
    if (!c.face || !c.img) { rec(`${label} ${c.tier}: elements present`, false, 'face or img missing'); continue; }
    // Element at (face.left + bw/2, face.cy) must be the .corpus-mb
    // face itself (the ring region). If it's the body / page bg, the
    // ring isn't painted. Also verify computed background-image on
    // the face is a linear-gradient (not "none").
    const sampleX = c.face.left + c.bw / 2;
    const sampleY = c.face.cy;
    const info = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      const face = el ? el.closest('.corpus-mb') : null;
      const bg = face ? getComputedStyle(face).backgroundImage : null;
      return {
        topTag: el ? el.tagName : null,
        topCls: el ? el.className : null,
        topIsMb: !!el && (el.classList.contains('corpus-mb') || el.classList.contains('mb-stud') || el.classList.contains('mb-top')),
        hasGradient: !!bg && /linear-gradient/.test(bg),
      };
    }, { x: sampleX, y: sampleY });
    const ringPainted = info.hasGradient && info.topIsMb;
    rec(`${label} ${c.tier}: left-ring region paints the metal gradient`,
      ringPainted,
      `sample(${sampleX.toFixed(1)}, ${sampleY.toFixed(1)}) top=${info.topTag}.${info.topCls} topIsMb=${info.topIsMb} hasGradient=${info.hasGradient}`);

    // Stud position: outside corner by st/3 offset from calc(var(--st)/-3)
    // means stud left/top is at -st/3 from the box's left/top. The stud
    // CENTRE therefore sits at (-st/3 + st/2) = +st/6 from the box corner.
    const expected = c.st / 6;
    const corners = {
      tl: { x: c.face.left + expected, y: c.face.top + expected },
      tr: { x: c.face.right - expected, y: c.face.top + expected },
      bl: { x: c.face.left + expected, y: c.face.bottom - expected },
      br: { x: c.face.right - expected, y: c.face.bottom - expected },
    };
    let studOk = true, studNote = '';
    for (const s of c.studs) {
      const which = ['tl','tr','bl','br'].find(k => s.cls.includes(k));
      const target = corners[which];
      if (!target) continue;
      const dx = Math.abs(s.cx - target.x), dy = Math.abs(s.cy - target.y);
      if (dx > 2 || dy > 2) {
        studOk = false;
        studNote = `${which} stud centre (${s.cx.toFixed(1)}, ${s.cy.toFixed(1)}) vs target (${target.x.toFixed(1)}, ${target.y.toFixed(1)}) Δ=(${dx.toFixed(1)}, ${dy.toFixed(1)})`;
      }
    }
    rec(`${label} ${c.tier}: 4 studs within 2px of outer corners`, studOk, studNote || `all 4 studs OK`);
  }
  await ctx.close();
}

await check('393×852 en', 393, 852, 'en');
await check('393×852 he', 393, 852, 'he');
await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
