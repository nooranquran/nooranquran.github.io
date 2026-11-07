// استفاده بدون اینترنت: «منوی ☰ › تنظیمات › استفاده بدون اینترنت» برگه‌ای باز می‌کند که هر بسته متن (offline.json) را
// روی همین گوشی ذخیره یا پاک می‌کند؛ کار ذخیره را سرویس‌ورکر (sw.js) انجام می‌دهد. صوت‌ها در هیچ بسته‌ای نیستند.
// در برنامه نصب‌شده (اندروید، یا افزودن به صفحه اصلی) بسته اصلی و ترجمه‌های فارسی (core و tr-fa، حدود ۱۵ مگ) بار اولی که با اینترنت باز شود، بی‌صدا ذخیره می‌شود؛
// اگر نیمه بماند بار بعد ادامه می‌یابد. با «حالت کم‌حجم» یا «صرفه‌جویی داده» گوشی، خودکار ذخیره نمی‌شود.
// کلید localStorage ‎offlineDone‎: {بسته: نسخه offline.json} برای بسته‌هایی که کامل ذخیره شده‌اند.
(function () {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  const KEY = 'offlineDone';
  const done = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const setDone = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const inApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const fa = n => Number(n).toLocaleString('fa-IR');
  const mb = b => b < 1e6 ? `${fa(Math.max(1, Math.round(b / 1e3)))} کیلوبایت` : `${fa(Math.round(b / 1e5) / 10)} مگ`;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let status = null, progress = null, sheet = null, running = null;
  const sw = async () => (await navigator.serviceWorker.ready).active;
  async function send(msg) { const w = await sw(); w?.postMessage(msg); }
  const ask = () => send({ type: 'offline-status' });

  navigator.serviceWorker.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === 'offline-status') { status = d.error ? null : d; if (status?.busy && !running) running = []; paint(); if (offerPending) { offerPending = false; offer(); } }
    else if (d.type === 'offline-progress') { progress = d; paint(); }
    else if (d.type === 'offline-done') {
      if (!d.error && !d.failed) { const v = done(); d.packs.forEach(p => { v[p] = d.v; }); setDone(v); }
      running = null; progress = null;
      if (sheet) ask();
      else if (!d.error && !d.failed && AUTO.every(p => d.packs.includes(p))) { offerPending = true; ask(); }
      if (d.error || d.failed) { failNote = d.error || !navigator.onLine ? 'اینترنت قطع شد؛ بار بعد از همان‌جا ادامه می‌یابد.' : `${fa(d.failed)} فایل گرفته نشد؛ دوباره بزنید.`; paint(); }
      window.siteMenu?.refresh();
    } else if (d.type === 'offline-dropped') { const v = done(); d.packs.forEach(p => delete v[p]); setDone(v); ask(); window.siteMenu?.refresh(); }
  });
  let failNote = '';
  const AUTO = ['core', 'tr-fa'];
  const rest = () => (status?.packs || []).filter(p => p.have < p.total);
  const restMb = () => rest().reduce((a, p) => a + p.download * (1 - p.have / p.total), 0);

  // ---------- پیشنهاد «همه متن‌ها» ----------
  // در برنامه نصب‌شده، پس از ذخیره خودکار بسته اصلی و ترجمه‌های فارسی، یک بار پیشنهاد می‌شود بقیه بسته‌ها (تفسیرها، زبان‌های دیگر، تورات و انجیل)
  // هم ذخیره شوند. «بعداً» یک هفته بعد دوباره می‌پرسد و «نه» دیگر نمی‌پرسد (کلید offlineOffer). از برگه «استفاده بدون اینترنت» همیشه می‌شود.
  let offerPending = false;
  const OK = 'offlineOffer';
  function offer() {
    const left = rest();
    if (!left.length || sheet || document.querySelector('.of-offer')) return;
    // راهنمای سایت (tour.js)، برگه‌ها یا منوی باز: کمی بعد دوباره امتحان می‌شود تا روی هم نیفتند.
    if (document.querySelector('.tr-root, .cf-shade, .sm.show')) { setTimeout(offer, 15000); return; }
    const o = (() => { try { return localStorage.getItem(OK) || ''; } catch { return 'no'; } })();
    if (o === 'no' || (o && Date.now() - +o < 7 * 864e5)) return;
    const el = document.createElement('div'); el.className = 'of-offer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'دسترسی بدون اینترنت');
    el.innerHTML = `<b>📥 همه متن‌ها و کتاب‌ها، بدون اینترنت؟</b><p>قرآن، دعاها و ترجمه‌های فارسی روی گوشی ذخیره شد. با ${mb(restMb())} دانلود، ${left.map(p => esc(p.title)).join('، ')} هم بدون اینترنت در دسترس است.</p>
<div><button type="button" data-of-yes>دانلود همه</button><button type="button" class="of-later" data-of-later>بعداً</button><button type="button" class="of-later" data-of-no>نه، ممنون</button></div>`;
    document.body.appendChild(el);
    const set = v => { try { localStorage.setItem(OK, v); } catch {} el.remove(); };
    el.querySelector('[data-of-yes]').onclick = () => { set('no'); get(left.map(p => p.id)); open(); };
    el.querySelector('[data-of-later]').onclick = () => set(String(Date.now()));
    el.querySelector('[data-of-no]').onclick = () => set('no');
  }

  function get(ids) {
    if (running) return;
    if (!navigator.onLine) { failNote = 'برای ذخیره کردن، اینترنت لازم است.'; paint(); return; }
    running = ids; progress = null; failNote = ''; paint();
    send({ type: 'offline-get', packs: ids });
  }

  // ---------- برگه ----------
  function paint() {
    if (!sheet) return;
    const box = sheet.querySelector('.of-list');
    if (!status) { box.innerHTML = '<p class="cf-hint">در حال بررسی…</p>'; return; }
    const left = rest();
    box.innerHTML = (left.length > 1 && !running ? `<button type="button" class="of-all" data-of-all>ذخیره همه متن‌ها و کتاب‌ها (${mb(restMb())} دانلود)</button>` : '') + status.packs.map(p => {
      const full = p.have >= p.total, part = !full && p.have / p.total >= 0.1, busy = running?.includes(p.id);
      const pct = busy && progress?.total ? Math.round(100 * progress.done / progress.total) : full ? 100 : Math.round(100 * p.have / p.total);
      const state = busy ? `در حال ذخیره… ${fa(pct)}٪` : full ? `✓ ذخیره شده (${mb(p.size)} روی گوشی)` : part ? `نیمه‌کاره (${fa(pct)}٪)` : `دانلود ${mb(p.download)}، روی گوشی ${mb(p.size)}`;
      const btn = busy ? '' : full ? `<button type="button" class="of-drop" data-of-drop="${p.id}">پاک کردن</button>` : `<button type="button" class="of-get" data-of-get="${p.id}" ${running ? 'disabled' : ''}>${part ? 'ادامه' : 'ذخیره'}</button>`;
      return `<div class="of-pack${full ? ' on' : ''}"><span><b>${esc(p.title)}</b>${p.sub ? `<small>${esc(p.sub)}</small>` : ''}<small class="of-st">${state}</small>${busy || part ? `<i class="of-bar"><i style="width:${pct}%"></i></i>` : ''}</span>${btn}</div>`;
    }).join('') + (failNote ? `<p class="cf-hint of-bad">${esc(failNote)}</p>` : '');
  }
  function open() {
    if (sheet) return;
    sheet = document.createElement('div'); sheet.className = 'cf-shade';
    sheet.innerHTML = `<div class="cf-box" role="dialog" aria-modal="true" aria-label="استفاده بدون اینترنت"><button type="button" class="cf-x" aria-label="بستن">✕</button>
<h2>استفاده بدون اینترنت</h2><p>هر بخشی که اینجا ذخیره شود، بدون اینترنت هم باز می‌شود. صوت‌ها همیشه اینترنت می‌خواهند.</p>
<div class="of-list"></div>
<p class="cf-hint">گزارش قرائت، ثبت‌نام و سهم تازه گروه همیشه اینترنت لازم دارند. متن‌ها با هر بار باز کردن، بی‌صدا به‌روز می‌شوند.</p></div>`;
    document.body.appendChild(sheet);
    const close = () => { sheet?.remove(); sheet = null; };
    sheet.addEventListener('click', e => {
      if (e.target === sheet || e.target.closest('.cf-x')) return close();
      const g = e.target.closest('[data-of-get]'), d = e.target.closest('[data-of-drop]');
      if (g) get([g.dataset.ofGet]);
      if (e.target.closest('[data-of-all]')) get(rest().map(p => p.id));
      if (d) send({ type: 'offline-drop', packs: [d.dataset.ofDrop] });
    });
    paint(); ask();
  }

  document.head.insertAdjacentHTML('beforeend', `<style>
.of-pack{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
.of-pack span{flex:1;min-width:0;line-height:1.6}
.of-pack b{display:block;color:var(--deep);font-weight:700}
.of-pack small{display:block;color:var(--muted);font-size:13px}
.of-pack.on .of-st{color:var(--ok-t,#1a7a4c)}
.of-pack button{flex:none;height:42px;padding:0 16px;font-size:15px}
.of-pack .of-drop{background:transparent;color:var(--muted);border:1px solid var(--line)}
.of-bar{display:block;height:6px;margin-top:6px;border-radius:3px;background:var(--line);overflow:hidden}
.of-bar i{display:block;height:100%;background:var(--emerald)}
.of-bad{color:var(--danger-t,#b3261e)}
.of-all{display:block;width:100%;height:auto;min-height:48px;margin:4px 0 10px;padding:8px 14px;font-size:15px;white-space:normal;line-height:1.5}
.of-offer{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:60;max-width:520px;margin:0 auto;padding:14px 16px;background:#fffaf0;color:var(--ink);text-shadow:none;border:2px solid var(--gold);border-radius:var(--r-card,14px);box-shadow:0 8px 30px #0007;line-height:1.8}
.of-offer b{display:block;color:var(--deep);font-size:16px}
.of-offer p{margin:4px 0 10px;font-size:14.5px}
.of-offer div{display:flex;gap:8px;flex-wrap:wrap}
.of-offer button{height:42px;padding:0 14px;font-size:15px}
.of-offer .of-later{background:transparent;color:var(--deep);border:1px solid var(--line)}</style>`);

  // ---------- منو ----------
  // در دسته «تنظیمات» (reminders.js) کنار راحتی خواندن و حالت کم‌حجم.
  window.offlinePack = {
    open,
    menuItem() {
      const n = Object.keys(done()).length;
      const sub = running ? 'در حال ذخیره روی گوشی…' : n ? `${fa(n)} بخش روی این گوشی ذخیره شده` : 'ذخیره قرآن، دعاها و کتاب‌ها روی گوشی';
      return `<button type="button" class="sm-item" data-of-menu><span class="sm-ic">📥</span><span>استفاده بدون اینترنت<small>${sub}</small></span><span class="sm-go">‹</span></button>`;
    }
  };
  document.addEventListener('click', e => { if (e.target.closest('[data-of-menu]')) { window.siteMenu?.close(); setTimeout(open, 280); } });

  // ---------- ذخیره خودکار بسته اصلی در برنامه نصب‌شده ----------
  const lite = () => document.documentElement.hasAttribute('data-lite') || navigator.connection?.saveData;
  async function auto() {
    if (!inApp || lite() || !navigator.onLine || running) return;
    // پس از ذخیره کامل، فقط هفته‌ای یک بار نگاه می‌شود که متن تازه‌ای اضافه شده یا نه (offline.json حدود ۶۰ کیلوبایت است).
    const CK = 'offlineCheck', last = +(localStorage.getItem(CK) || 0);
    if (AUTO.every(p => done()[p]) && Date.now() - last < 7 * 864e5) { offerPending = true; ask(); return; }
    try { localStorage.setItem(CK, String(Date.now())); } catch {}
    try {
      const v = (await (await fetch('offline.json', { cache: 'no-store' })).json()).v;
      if (AUTO.every(p => done()[p] === v)) { offerPending = true; ask(); return; }
    } catch { return; }
    get(AUTO);
  }
  const later = () => setTimeout(auto, 8000);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
})();
