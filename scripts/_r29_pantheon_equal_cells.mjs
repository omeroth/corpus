// Round 29 item 2 regression — Pantheon cells are all the same size.
//   • Every unlocked card's img.pth-art has equal width + height (±1 px)
//     across the whole grid, framed and unframed alike.
//   • No two cells overlap on screen (studs + top plate included —
//     those are inside the cell footprint because the metal border
//     pads the face from inside, not from a negative margin).
// Runs on SE 375×667 and 15Pro 393×852, EN + HE.
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
  await page.waitForTimeout(600);

  const info = await page.evaluate(() => {
    const grid = document.querySelector('#pantheon-container .pth-grid');
    const cells = Array.from((grid || document).querySelectorAll('.pth-cell'));
    const cellRects = cells.map(c => {
      const r = c.getBoundingClientRect();
      const img = c.querySelector('img.pth-art');
      const ir = img ? img.getBoundingClientRect() : null;
      const slot = c.querySelector('.pth-slot');
      const sr = slot ? slot.getBoundingClientRect() : null;
      const plate = c.querySelector(':scope > .thinker-plate');
      const pr = plate ? plate.getBoundingClientRect() : null;
      // Round 33 — also measure the frame overlay separately. In
      // round-33 the overlay matches the slot (fits inside cell), so
      // overlay-overlap and slot-overlap are equivalent — but if the
      // overlay ever extends beyond slot again the test still catches
      // it. Overlay bbox INCLUDES the crest at the top (gold shell,
      // diamond fan baked into the PNG).
      const ov = c.querySelector('.corpus-frame-overlay');
      const or = ov ? ov.getBoundingClientRect() : null;
      return {
        locked: c.classList.contains('locked'),
        tier: (c.className.match(/tier-(\w+)/) || [,'none'])[1],
        cellRect: { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom },
        slotRect: sr ? { x: sr.left, y: sr.top, w: sr.width, h: sr.height, right: sr.right, bottom: sr.bottom } : null,
        plateRect: pr ? { x: pr.left, y: pr.top, w: pr.width, h: pr.height, right: pr.right, bottom: pr.bottom } : null,
        overlayRect: or ? { x: or.left, y: or.top, w: or.width, h: or.height, right: or.right, bottom: or.bottom } : null,
        artRect: ir ? { x: ir.left, y: ir.top, w: ir.width, h: ir.height } : null,
      };
    });
    return cellRects;
  });

  // (1) Every UNLOCKED art rect has equal width + height (±1px).
  const unlocked = info.filter(c => !c.locked && c.artRect);
  if (unlocked.length < 3) {
    rec(`${label}: enough unlocked cells to compare`, false, `only ${unlocked.length} unlocked art rects`);
    await ctx.close();
    return;
  }
  const w0 = unlocked[0].artRect.w, h0 = unlocked[0].artRect.h;
  let eqOk = true, eqNote = '';
  for (const c of unlocked.slice(1)) {
    if (Math.abs(c.artRect.w - w0) > 1 || Math.abs(c.artRect.h - h0) > 1) {
      eqOk = false;
      eqNote = `cell tier=${c.tier} art=${c.artRect.w.toFixed(1)}x${c.artRect.h.toFixed(1)} vs reference ${w0.toFixed(1)}x${h0.toFixed(1)}`;
      break;
    }
  }
  rec(`${label}: all unlocked card art rects equal (±1 px)`, eqOk, eqNote || `checked ${unlocked.length} cards, ref=${w0.toFixed(1)}x${h0.toFixed(1)}`);

  // (2) No two cells overlap on screen. CSS grid rows should enforce
  //     this by construction — but studs + top plate can poke a few
  //     px outside the padding box. We check actual bounding rects.
  let overlapOk = true, overlapNote = '';
  for (let i = 0; i < info.length && overlapOk; i++) {
    for (let j = i + 1; j < info.length; j++) {
      const a = info[i].cellRect, b = info[j].cellRect;
      const xOverlap = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      if (xOverlap > 1 && yOverlap > 1) {
        overlapOk = false;
        overlapNote = `cell[${i}] (${a.x.toFixed(0)},${a.y.toFixed(0)},${a.w.toFixed(0)}x${a.h.toFixed(0)}) overlaps cell[${j}] (${b.x.toFixed(0)},${b.y.toFixed(0)},${b.w.toFixed(0)}x${b.h.toFixed(0)}) by ${xOverlap.toFixed(1)}×${yOverlap.toFixed(1)}`;
        break;
      }
    }
  }
  rec(`${label}: no two cells overlap on screen`, overlapOk, overlapNote || `checked ${info.length}×${info.length - 1} / 2 pairs`);

  // (3) 3-per-row holds.
  const colsInRow0 = info.filter(c => Math.abs(c.cellRect.y - info[0].cellRect.y) < 2).length;
  rec(`${label}: 3 cells per row`, colsInRow0 === 3, `row 0 has ${colsInRow0} cells`);

  // (4) Round 32 — no horizontal frame→frame overlap. Within each row,
  //     consecutive slots must have slot[i].right ≤ slot[i+1].left + 1.
  // Group cells into rows by y.
  const rows = [];
  for (const c of info) {
    const row = rows.find(r => Math.abs(r[0].cellRect.y - c.cellRect.y) < 2);
    if (row) row.push(c); else rows.push([c]);
  }
  let hOk = true, hNote = '';
  for (const row of rows) {
    row.sort((a, b) => a.cellRect.x - b.cellRect.x);
    for (let i = 0; i + 1 < row.length; i++) {
      const a = row[i].slotRect, b = row[i + 1].slotRect;
      if (!a || !b) continue;
      if (a.right > b.x + 1) {
        hOk = false;
        hNote = `row y=${row[0].cellRect.y.toFixed(0)} slot[${i}].right=${a.right.toFixed(1)} > slot[${i+1}].left=${b.x.toFixed(1)}`;
      }
    }
  }
  rec(`${label}: no horizontal frame→frame overlap`, hOk, hNote || `checked ${rows.length} row(s)`);

  // (5) Round 32 — frame bottom must not overlap its plate.
  let fpOk = true, fpNote = '';
  for (const c of info) {
    if (!c.slotRect || !c.plateRect) continue;
    if (c.slotRect.bottom > c.plateRect.y + 1) {
      fpOk = false;
      fpNote = `cell tier=${c.tier} slot.bottom=${c.slotRect.bottom.toFixed(1)} > plate.top=${c.plateRect.y.toFixed(1)}`;
      break;
    }
  }
  rec(`${label}: frame bottom ≤ plate top`, fpOk, fpNote || `${info.filter(c=>c.plateRect).length} framed/unframed plates checked`);

  // (6) Round 32 — plate bottom must not overlap the next row's frame top.
  let pnOk = true, pnNote = '';
  for (let ri = 0; ri + 1 < rows.length; ri++) {
    for (const a of rows[ri]) {
      if (!a.plateRect) continue;
      for (const b of rows[ri + 1]) {
        if (!b.slotRect) continue;
        if (a.plateRect.bottom > b.slotRect.y + 1) {
          pnOk = false;
          pnNote = `row ${ri} plate.bottom=${a.plateRect.bottom.toFixed(1)} > row ${ri+1} slot.top=${b.slotRect.y.toFixed(1)}`;
        }
      }
    }
  }
  rec(`${label}: plate bottom ≤ next-row frame top`, pnOk, pnNote || `checked ${Math.max(0, rows.length - 1)} row gap(s)`);

  // (7) Round 33 — on 393, art width ≥ 105 px (spec: ~108 px).
  if (w === 393) {
    const minArt = Math.min(...unlocked.map(c => c.artRect.w));
    rec(`${label}: art width ≥ 105 on 393`, minArt >= 105, `min art width = ${minArt.toFixed(1)}`);
  }

  // (8) Round 33 — crest region (top ~9% of frame) is not clipped by
  // the chip / stats bar above. The grid padding-top must leave the
  // overlay fully visible above its own top. Measured as: overlay[0].y
  // > 0 (not scrolled off) AND the pantheon container's top offset
  // doesn't cover row-0 overlay.
  const topOverlay = info.filter(c => c.overlayRect).sort((a, b) => a.overlayRect.y - b.overlayRect.y)[0];
  if (topOverlay) {
    rec(`${label}: top-row crest not clipped`, topOverlay.overlayRect.y >= 0, `top overlay y=${topOverlay.overlayRect.y.toFixed(1)}`);
  }

  // (9) Round 34 — for every framed card, sample the 4 pixels just
  // OUTSIDE the frame outer rect (corners, 2px out) and assert no
  // art pixels are visible there. Done via elementsFromPoint — the
  // top element at that pixel must not be the art img (nor any
  // descendant that routes to it).
  const outside = await page.evaluate(() => {
    const bads = [];
    const framed = Array.from(document.querySelectorAll('.pth-cell.unlocked.framed'));
    for (const c of framed) {
      const slot = c.querySelector('.pth-slot');
      if (!slot) continue;
      const r = slot.getBoundingClientRect();
      // Four probes: 2 px outside each corner, diagonally.
      const probes = [
        { name: 'tl', x: r.left - 2,  y: r.top - 2 },
        { name: 'tr', x: r.right + 2, y: r.top - 2 },
        { name: 'bl', x: r.left - 2,  y: r.bottom + 2 },
        { name: 'br', x: r.right + 2, y: r.bottom + 2 },
      ];
      const art = c.querySelector('img.pth-art');
      for (const p of probes) {
        if (p.x < 0 || p.y < 0 || p.x > window.innerWidth || p.y > window.innerHeight) continue;
        const stack = document.elementsFromPoint(p.x, p.y);
        if (stack.includes(art)) {
          bads.push({ probe: p.name, cell: c.className, px: p.x.toFixed(0), py: p.y.toFixed(0) });
        }
      }
    }
    return bads;
  });
  rec(`${label}: no art pixels outside frame outer rect`, outside.length === 0,
      outside.length ? `${outside.length} bad corners; first ${outside[0].probe} @(${outside[0].px},${outside[0].py}) cell=${outside[0].cell}` : `all 4 corners × ${info.filter(c => !c.locked && c.overlayRect).length} framed cards clean`);
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
