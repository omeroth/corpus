// R45 — force each onboarding step on Android to compare bell + how-it-works
import { execSync } from 'node:child_process';
import WebSocket from 'ws';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/r45-android-only';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const list = JSON.parse(execSync('curl -s http://localhost:9222/json/list').toString());
const target = list.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
let msgId = 0;
const pending = new Map();
ws.on('message', (data) => {
  const m = JSON.parse(data);
  if (m.id != null && pending.has(m.id)) {
    const { resolve } = pending.get(m.id);
    pending.delete(m.id);
    resolve(m.result);
  }
});
function send(method, params) {
  return new Promise(res => { const id = ++msgId; pending.set(id, { resolve: res }); ws.send(JSON.stringify({ id, method, params })); });
}
async function ev(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.value; }
await send('Runtime.enable');
await send('Page.enable');

async function seed(lang) {
  await ev(`
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','${lang}');
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'${lang}', completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:true, dailyStreak:5, longestStreak:5 }));
    try { loadState(); } catch(_){}
    try { setAppLang('${lang}'); } catch(_){}
    try { showScreen('home'); } catch(_){}
    try { closeWelcomeBackModal(); } catch(_){}
    document.documentElement.classList.remove('dark');
    window.__CORPUS_DEBUG_BUILD = true;
    document.querySelectorAll('.modal-overlay.active, .onb-screen.onb-active').forEach(m => m.classList.remove('active','onb-active'));
    document.querySelectorAll('.modal-overlay, .onb-screen').forEach(m => { m.style.display=''; });
    document.body.className = 'has-topbar';
  `);
  await sleep(800);
}
async function openStep(id) {
  await ev(`
    document.querySelectorAll('.onb-screen.onb-active').forEach(s => { s.classList.remove('onb-active'); s.style.display='none'; });
    const s = document.getElementById('${id}');
    if (s) {
      s.classList.add('onb-active');
      s.style.display = 'flex';
      s.style.position = 'fixed';
      s.style.inset = '0';
      s.style.zIndex = '9999';
      s.style.background = '#F8F5FF';
    }
    try {
      const prep = ({ 'onb-v2-how-it-works':'_onbV2PrepareHowItWorks','onb-v2-reminder-promise':'_onbV2PrepareReminderPromise','onb-v2-notifications':'_onbV2PrepareNotifications' })['${id}'];
      if (prep && window[prep]) window[prep]();
    } catch(_){}
  `);
  await sleep(900);
}

const steps = [
  { lang: 'en', step: 'onb-v2-reminder-promise', label: 'reminder-en' },
  { lang: 'he', step: 'onb-v2-reminder-promise', label: 'reminder-he' },
  { lang: 'en', step: 'onb-v2-how-it-works', label: 'how-en' },
  { lang: 'he', step: 'onb-v2-how-it-works', label: 'how-he' },
];
for (const s of steps) {
  await seed(s.lang);
  await openStep(s.step);
  const info = await ev(`(function(){
    const bell = document.querySelector('.onb-v7-rp-bell svg');
    const bellRect = bell ? JSON.stringify(bell.getBoundingClientRect()) : null;
    const bellPath = bell ? bell.innerHTML.slice(0, 100) : null;
    const howImgs = Array.from(document.querySelectorAll('#onb-v2-how-it-works img')).map(i => ({
      src: i.src.split('/').slice(-2).join('/'),
      natW: i.naturalWidth, natH: i.naturalHeight,
      rW: Math.round(i.getBoundingClientRect().width),
      rH: Math.round(i.getBoundingClientRect().height),
    }));
    return { bellRect, bellPath, howImgs };
  })()`);
  console.log(`${s.label}:`, JSON.stringify(info, null, 2));
  execSync(`adb exec-out screencap -p > ${OUT}/${s.label}.png`);
}
ws.close();
console.log(`\n${OUT}`);
