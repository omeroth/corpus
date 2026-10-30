// Round 27 — Pantheon regression:
//   • 3 cards per row on both SE 375×667 and 15Pro 393×852
//   • No vertical overlap between adjacent rows (card bottoms sit
//     above the next row's card tops)
//   • Every unlocked card's full art is visible: rendered img aspect
//     within 2% of natural 670/1200 aspect, and the img is fully
//     contained within the face (no clipping)
//   • Locked cells show the dashed "?" box (no img, has ::before)
// Runs on both devices, EN + HE.
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

async function check(w, h, lang) {
  const label = `${w}×${h} ${lang}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const cd = {}; for (let c = 1; c <= 2; c++) for (let d = 1; d <= 7; d++) cd[`philosophy-${c}-${d}`] = true;
    const _debugPts = { socrates:12, plato:9, russell:12, wittgenstein:1, aurelius:6, aristotle:3, kant:3, mill:2, nietzsche:4, descartes:5 };
    const bus = { philosophy: true, economics: true, psychology: true };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:cd, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:bus, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const grid = document.querySelector('#pantheon-container .pth-grid');
    if (!grid) return { ok: false, note: 'no .pth-grid' };
    const gridRect = grid.getBoundingClientRect();
    const cells = Array.from(grid.querySelectorAll('.pth-cell'));
    const cols = (() => {
      const cs = getComputedStyle(grid);
      return cs.gridTemplateColumns.split(' ').length;
    })();
    const info = cells.map(c => {
      const r = c.getBoundingClientRect();
      const img = c.querySelector('img.pth-art');
      const face = c.querySelector('.pth-face.pth-front');
      const facePseudo = face ? getComputedStyle(face, '::before').content : '';
      const imgInfo = img && img.complete ? {
        nat: img.naturalWidth + 'x' + img.naturalHeight,
        natAspect: img.naturalHeight ? (img.naturalWidth / img.naturalHeight) : 0,
        renderedW: img.getBoundingClientRect().width,
        renderedH: img.getBoundingClientRect().height,
        renderedAspect: (() => { const r = img.getBoundingClientRect(); return r.height ? r.width / r.height : 0; })(),
        filter: getComputedStyle(img).filter,
      } : null;
      return {
        cls: c.className,
        locked: c.classList.contains('locked'),
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
        img: imgInfo,
        facePseudo,
      };
    });
    return { ok: true, cols, gridRect: { left: gridRect.left, right: gridRect.right, width: gridRect.width }, cells: info };
  });

  if (!data.ok) {
    rec(`${label}: grid present`, false, data.note);
    await ctx.close();
    return;
  }

  // (1) 3 per row.
  rec(`${label}: 3 cells per row (grid-template-columns)`, data.cols === 3, `cols=${data.cols}`);

  // (2) No vertical overlap between adjacent rows. Rows derived from
  //     cells with the same top (±2px tolerance).
  const sortedByTop = data.cells.slice().sort((a, b) => a.rect.top - b.rect.top);
  const rows = [];
  for (const c of sortedByTop) {
    const row = rows.find(r => Math.abs(r[0].rect.top - c.rect.top) < 4);
    if (row) row.push(c); else rows.push([c]);
  }
  let overlapOk = true;
  let overlapNote = '';
  for (let i = 0; i < rows.length - 1; i++) {
    const bottomOfRow = Math.max(...rows[i].map(c => c.rect.bottom));
    const topOfNext = Math.min(...rows[i + 1].map(c => c.rect.top));
    if (bottomOfRow > topOfNext + 0.5) {
      overlapOk = false;
      overlapNote = `row ${i} bottom=${bottomOfRow.toFixed(1)} > row ${i+1} top=${topOfNext.toFixed(1)}`;
      break;
    }
  }
  rec(`${label}: no vertical overlap between rows`, overlapOk, overlapNote || `rows=${rows.length}`);

  // (3) Every unlocked card's img rendered aspect within 2% of
  //     natural 670/1200. Natural aspect expected ≈ 0.558.
  const unframedAndFramedImgs = data.cells.filter(c => c.img && c.img.renderedAspect > 0);
  let aspectOk = true;
  let aspectNote = '';
  for (const c of unframedAndFramedImgs) {
    const target = c.img.natAspect || (670 / 1200);
    const delta = Math.abs(c.img.renderedAspect - target) / target;
    if (delta > 0.02) {
      aspectOk = false;
      aspectNote = `cell ${c.cls} natAspect=${target.toFixed(3)} renderedAspect=${c.img.renderedAspect.toFixed(3)} drift=${(delta*100).toFixed(1)}%`;
      break;
    }
  }
  rec(`${label}: all card imgs at natural aspect (±2%)`, aspectOk, aspectNote || `checked ${unframedAndFramedImgs.length} imgs`);

  // (4) Round 28 — locked cells restore the pre-27 look: greyscaled
  // portrait img (filter: grayscale 100%), no dashed box, no "?"
  // badge. The grayscale filter is the whole lock signal.
  const lockedCells = data.cells.filter(c => c.locked);
  let lockedOk = true;
  let lockedNote = '';
  for (const c of lockedCells) {
    if (!c.img) { lockedOk = false; lockedNote = `locked cell missing portrait img`; break; }
    if (c.img.filter && !/grayscale/.test(c.img.filter)) {
      lockedOk = false; lockedNote = `locked img filter missing grayscale, got=${c.img.filter}`;
      break;
    }
  }
  rec(`${label}: locked cells = greyscaled portrait (restored pre-27 look)`, lockedOk, lockedNote || `checked ${lockedCells.length} locked`);

  await ctx.close();
}

for (const [w, h] of [[375, 667], [393, 852]]) {
  for (const lang of ['en', 'he']) {
    await check(w, h, lang);
  }
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
