// R45 — side-by-side iOS (Playwright WebKit at iPhone 17 Pro 393×852)
// vs Android (live emulator via chrome-remote-interface, since the
// Playwright 1.63 connectOverCDP shim is incompatible with newer WebView
// Chrome). For each scene × language, capture both and composite the
// pair as "{scene}-{lang}.png" into ~/Desktop/r45-compare/.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { execSync } from 'node:child_process';
import sharp from 'sharp';
import WebSocket from 'ws';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/Desktop/r45-compare';
await mkdir(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2', '.ttf':'font/ttf', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);

const SAFE_TOP = 59, SAFE_BOT = 34;

// Shared seed logic as a function; passed to both backends.
const SEED_SRC = `(function(lang, extraState) {
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done','1');
  localStorage.setItem('corpus_walkthrough_done','1');
  localStorage.setItem('corpus_subject','philosophy');
  localStorage.setItem('corpus_lang', lang);
  localStorage.setItem('corpus_appearance','light');
  localStorage.setItem('corpus_state', JSON.stringify(Object.assign({
    v:3, subject:'philosophy', lang,
    completedDays:{ 'philosophy-1-1':true, 'philosophy-1-2':true, 'philosophy-1-3':true },
    framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home',
    isPaid:true, dailyStreak:5, longestStreak:5,
    activeDates: (function(){ var r=[]; var t=new Date(); for (var i=0;i<5;i++){ var d=new Date(t); d.setDate(t.getDate()-i); r.push(d.toISOString().slice(0,10));} return r; })(),
    lastStreakShownDate: new Date().toISOString().slice(0,10),
    unlockedThinkers:['socrates','plato','aristotle','kant','nietzsche'],
    _debugThinkerPoints:{socrates:5,plato:3,aristotle:2,kant:1,nietzsche:1},
  }, extraState)));
  try { loadState(); setAppLang(lang); showScreen('home'); } catch(_){}
  try { closeWelcomeBackModal(); } catch(_){}
  document.documentElement.classList.remove('dark');
  window._rvV8_ENABLED = false;
  window.__CORPUS_DEBUG_BUILD = true;
  document.querySelectorAll('.modal-overlay.active, .onb-screen.onb-active').forEach(function(m){ m.classList.remove('active','onb-active'); });
  document.querySelectorAll('.modal-overlay, .onb-screen').forEach(function(m){ m.style.display=''; });
})`;

const SHOW_ONB_SRC = `(function(id){
  document.querySelectorAll('.onb-screen.onb-active').forEach(function(s){ s.classList.remove('onb-active'); });
  var s = document.getElementById(id);
  if (s) { s.classList.add('onb-active'); s.style.display = ''; }
  try {
    var prep = ({
      'onb-v2-how-it-works': '_onbV2PrepareHowItWorks',
      'onb-v2-reminder-promise': '_onbV2PrepareReminderPromise',
      'onb-v2-notifications': '_onbV2PrepareNotifications',
      'onb-signup': '_onbPrepareSignup',
      'onb-v2-trial': '_onbV2PrepareTrial',
    })[id];
    if (prep && window[prep]) window[prep]();
  } catch(_){}
})`;

// Scenes defined as { name, drive(evalFn, lang) } where evalFn(expr) is
// a function awaiting the eval of a JS expression (returns the value).
const scenes = [
  { name: 'home',               drive: async () => {} },
  { name: 'onb-how-it-works',   drive: async (ev) => { await ev(`${SHOW_ONB_SRC}('onb-v2-how-it-works')`); } },
  { name: 'onb-reminder-promise', drive: async (ev) => { await ev(`${SHOW_ONB_SRC}('onb-v2-reminder-promise')`); } },
  { name: 'onb-notifications',    drive: async (ev) => { await ev(`${SHOW_ONB_SRC}('onb-v2-notifications')`); } },
  { name: 'onb-signup',           drive: async (ev) => { await ev(`${SHOW_ONB_SRC}('onb-signup')`); } },
  { name: 'onb-trial',            drive: async (ev) => { await ev(`${SHOW_ONB_SRC}('onb-v2-trial')`); } },
  { name: 'reveal-first', drive: async (ev) => {
    await ev(`try { __corpusPreviewReveal('socrates', 1, {kind:'first'}); } catch(_){}`);
    await sleep(1800);
    await ev(`(function(){ var s = document.getElementById('rv-stg'); if (s) s.click(); })()`);
    await sleep(2500);
  }},
  { name: 'reveal-frame', drive: async (ev) => {
    await ev(`try { __corpusPreviewReveal('socrates', 3, {kind:'frame'}); } catch(_){}`);
    await sleep(4500);
  }},
  { name: 'streak', drive: async (ev) => {
    await ev(`(function(){ var b = document.getElementById('bnav-streak'); if (b) b.click(); })()`);
    await sleep(1200);
  }},
  { name: 'pantheon', drive: async (ev) => {
    await ev(`(function(){ var b = document.getElementById('bnav-pantheon'); if (b) b.click(); })()`);
    await sleep(1200);
  }},
  { name: 'paywall', drive: async (ev, lang) => {
    await ev(`${SEED_SRC}('${lang}', { isPaid: false })`);
    await sleep(400);
    await ev(`try { showPaywall({ reason: 'chapter_lock', chapter: 2 }); } catch(_){}`);
    await sleep(1200);
  }},
];

// ───────────── iOS WebKit side
const browserK = await webkit.launch({ headless: true });

async function iosShot(scene, lang) {
  const ctx = await browserK.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{
      Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})},
      App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})},
      StatusBar:{setStyle:async()=>({})},
      CorpusWidgetBridge:{isWidgetInstalled:async()=>({installed:false,supported:true})}
    } };
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: ${SAFE_TOP}px; --safe-bottom: ${SAFE_BOT}px; }` });
  const ev = (expr) => page.evaluate(expr);
  await ev(`${SEED_SRC}('${lang}', {})`);
  await sleep(400);
  await scene.drive(ev, lang);
  const buf = await page.screenshot();
  await ctx.close();
  return buf;
}

// ───────────── Android CDP side
// Fetch JSON via curl (Android WebView's HTTP server dislikes keep-alive).
function curlJson(url) {
  const out = execSync(`curl -s ${url}`).toString();
  return JSON.parse(out);
}

async function androidClient() {
  const list = curlJson('http://localhost:9222/json/list');
  const target = list.find(t => t.type === 'page');
  if (!target) throw new Error('no page target');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
  let msgId = 0;
  const pending = new Map();
  ws.on('message', (data) => {
    const m = JSON.parse(data);
    if (m.id != null && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message || JSON.stringify(m.error)));
      else resolve(m.result);
    }
  });
  function send(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  await send('Runtime.enable');
  await send('Page.enable');
  return {
    evaluate: (expression) => send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }).then(r => r.result && r.result.value),
    close: () => ws.close(),
  };
}

async function androidShot(scene, lang, client) {
  const ev = (expr) => client.evaluate(expr);
  await ev(`${SEED_SRC}('${lang}', {})`);
  await sleep(500);
  await scene.drive(ev, lang);
  const tmp = `${OUT}/_a-${scene.name}-${lang}.png`;
  execSync(`adb exec-out screencap -p > ${tmp}`, { stdio: 'ignore' });
  return tmp;
}

async function compose(iosBuf, androidPath, outPath) {
  const iosMeta = await sharp(iosBuf).metadata();
  const androidResized = await sharp(androidPath).resize({ height: iosMeta.height }).toBuffer();
  const aMeta = await sharp(androidResized).metadata();
  const gap = 20;
  await sharp({ create: { width: iosMeta.width + gap + aMeta.width, height: iosMeta.height, channels: 4, background: { r:0,g:0,b:0,alpha:1 } } })
    .composite([
      { input: iosBuf, left: 0, top: 0 },
      { input: androidResized, left: iosMeta.width + gap, top: 0 },
    ])
    .png()
    .toFile(outPath);
}

const client = await androidClient();
const langs = ['en', 'he'];
for (const lang of langs) {
  for (const scene of scenes) {
    const label = `${scene.name}-${lang}`;
    try {
      const [iosBuf, androidPath] = await Promise.all([
        iosShot(scene, lang),
        androidShot(scene, lang, client),
      ]);
      await compose(iosBuf, androidPath, `${OUT}/${label}.png`);
      console.log(`✓ ${label}`);
    } catch (e) {
      console.log(`✗ ${label}: ${e.message}`);
    }
  }
}
await client.close();
await browserK.close();
app.s.close();
console.log(`\nPairs in ${OUT}/`);
