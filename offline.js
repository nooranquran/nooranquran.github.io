// استفاده بدون اینترنت: «منوی ☰ › تنظیمات › استفاده بدون اینترنت» برگه‌ای باز می‌کند که هر بسته متن (offline.json) را
// روی همین گوشی ذخیره یا پاک می‌کند؛ کار ذخیره را سرویس‌ورکر (sw.js) انجام می‌دهد. صوت‌ها در هیچ بسته‌ای نیستند.
// در برنامه نصب‌شده (اندروید، یا افزودن به صفحه اصلی) بسته اصلی (core، حدود ۸ مگ) بار اولی که با اینترنت باز شود، بی‌صدا ذخیره می‌شود؛
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
    if (d.type === 'offline-status') { status = d.error ? null : d; if (status?.busy && !running) running = []; paint(); }
    else if (d.type === 'offline-progress') { progress = d; paint(); }
    else if (d.type === 'offline-done') {
      if (!d.error && !d.failed) { const v = done(); d.packs.forEach(p => { v[p] = d.v; }); setDone(v); }
      running = null; progress = null;
      if (sheet) ask();
      if (d.error || d.failed) { failNote = d.error || !navigator.onLine ? 'اینترنت قطع شد؛ بار بعد از همان‌جا ادامه می‌یابد.' : `${fa(d.failed)} فایل گرفته نشد؛ دوباره بزنید.`; paint(); }
      window.siteMenu?.refresh();
    } else if (d.type === 'offline-dropped') { const v = done(); d.packs.forEach(p => delete v[p]); setDone(v); ask(); window.siteMenu?.refresh(); }
  });
  let failNote = '';

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
    box.innerHTML = status.packs.map(p => {
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
.of-bad{color:var(--danger-t,#b3261e)}</style>`);

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
    if (done().core && Date.now() - last < 7 * 864e5) return;
    try { localStorage.setItem(CK, String(Date.now())); } catch {}
    try {
      const v = (await (await fetch('offline.json', { cache: 'no-store' })).json()).v;
      if (done().core === v) return;
    } catch { return; }
    get(['core']);
  }
  const later = () => setTimeout(auto, 8000);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
})();
