// اعلان اذان (امکان azan در features.js): اعلان اذان صبح، ظهر و مغرب به افق شهری که در کارت «امروز» انتخاب شده (daily.js، prayerLoc).
// هر کدام جدا و پیش‌فرض خاموش؛ کلیدها در همان برگه «تنظیم اعلان‌ها» (reminders.js) است و در بخش اوقات شرعی کارت «امروز» یک پیوند به آن.
// وقت اذان را سرور حساب می‌کند (تابع daily-reminders، azan.ts، همان فرمول daily.js) پس شهر (گرد شده تا دو رقم اعشار، حدود ۱ کیلومتر)،
// منطقه زمانی و اذان‌های انتخابی با push_azan_set (backend/supabase/azan.sql) کنار اشتراک همین گوشی ذخیره می‌شود.
// انتخاب روی گوشی هم (azanPush) می‌ماند تا اگر اشتراک دوباره ساخته شد یا شهر عوض شد، دوباره فرستاده شود.
// پخش صدای اذان (اختیاری، azanSound): مرورگرها صدای دلخواه برای اعلان نمی‌پذیرند و سرویس‌ورکر نمی‌تواند صوت پخش کند؛
// پس اگر سایت باز است، سرویس‌ورکر (sw.js) به آن خبر می‌دهد و اذان همان‌جا پخش می‌شود، و با زدن روی اعلان سایت با ?azanplay= باز می‌شود و پخش می‌کند.
// مؤذن همان است که در «اذان و اقامه» (chelleh/azan.json، فهرست «صوت») انتخاب شده: chlReader.audio.azan در chelleh.js.
(function () {
  const cfg = window.APP_CONFIG || {}, KEY = 'azanPush', SENT = 'azanPushSent';
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const P = [['fajr', 'اذان صبح'], ['dhuhr', 'اذان ظهر'], ['maghrib', 'اذان مغرب']];
  const shown = () => !!window.features?.shown('azan');
  const mine = () => { const v = store.get(KEY); return Array.isArray(v) ? P.map(p => p[0]).filter(k => v.includes(k)) : []; };
  const city = () => window.daily?.loc?.() || null;
  const usable = () => !!window.sitePush?.enabled?.() && shown();
  const SOUND = 'azanSound', RKEY = 'chlReader', PLAYED = 'azanPlayed';
  const soundOn = () => store.get(SOUND) === true;
  let voices = [];
  const voicesP = fetch('chelleh/azan.json').then(r => r.json()).then(t => (voices = (t.audio || []).filter(a => a && /^https:\/\//.test(a.url)))).catch(() => voices);
  const voice = () => { const u = store.get(RKEY)?.audio?.azan; return voices.find(a => a.url === u) || (u ? { name: 'مؤذن انتخابی شما', url: u } : voices[0]) || null; };
  const setVoice = url => { const r = store.get(RKEY) || {}; r.audio = Object.assign(r.audio || {}, { azan: url }); store.set(RKEY, r); };

  const rpc = (name, body) => fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(async r => { if (!r.ok) throw Error('rpc ' + r.status); const t = await r.text(); return t ? JSON.parse(t) : null; });
  async function currentSub() {
    try { if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return null; const r = await navigator.serviceWorker.getRegistration(); return r ? await r.pushManager.getSubscription() : null; } catch { return null; }
  }

  // فرستادن انتخاب و شهر به سرور، فقط وقتی عوض شده باشد (یا force). امکان پنهان باشد: اذان‌ها خاموش فرستاده می‌شود.
  async function sync(sub, force) {
    sub = sub || await currentSub(); const L = city(); if (!sub || !L) return;
    const want = shown() ? mine() : [], lat = +(+L.lat).toFixed(2), lng = +(+L.lng).toFixed(2);
    const sig = sub.endpoint.slice(-24) + JSON.stringify([want, lat, lng, L.tz]);
    if (!force && store.get(SENT) === sig) return;
    if (!want.length && !store.get(SENT)) return; // این گوشی هرگز اعلان اذان نداشته است.
    const k = sub.toJSON().keys;
    await rpc('push_azan_set', { p_endpoint: sub.endpoint, p_p256dh: k.p256dh, p_auth: k.auth, p_lat: lat, p_lng: lng, p_tz: L.tz, p_prayers: want });
    store.set(SENT, want.length ? sig : null);
  }
  const quiet = () => sync().catch(() => {});

  // ---------- بخش «اذان» در برگه تنظیم اعلان‌ها (reminders.js) ----------
  (window.pushExtra = window.pushExtra || []).push({
    offLabel: () => usable() ? 'اذان صبح، ظهر و مغرب به افق شهر شما (اختیاری)' : '',
    html: async () => {
      if (!usable()) return '';
      const L = city(), m = mine();
      await voicesP; const v = voice(), vs = v && !voices.some(a => a.url === v.url) ? [v, ...voices] : voices;
      return `<section><h5>🕌 اعلان اذان</h5><p class="ns-who">به افق ${esc(L ? L.name : 'تهران')}؛ شهر را در کارت «امروز» › اوقات شرعی عوض کنید.</p>
${P.map(([k, t]) => `<label class="rm-t"><input type="checkbox" data-azan="${k}"${m.includes(k) ? ' checked' : ''}><span>${t}</span></label>`).join('')}
<p class="hint" style="margin:4px 0 0">ساعت اذان به وقت همان شهر است. اعلان در وقت اذان یا چند دقیقه پس از آن می‌رسد، نه زودتر.</p>
<label class="rm-t"><input type="checkbox" data-azan-sound${soundOn() ? ' checked' : ''}><span>🔊 پخش صدای اذان با اعلان</span></label>
<div class="az-voice"><span>مؤذن</span><select data-azan-voice aria-label="مؤذن">${vs.map(a => `<option value="${esc(a.url)}"${a.url === v?.url ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select><button type="button" class="az-try" data-azan-try>▶ شنیدن</button></div>
<p class="hint" style="margin:4px 0 0">اگر سایت باز باشد اذان خودش پخش می‌شود؛ اگر بسته باشد، اعلان با صدای معمول گوشی می‌آید و با زدن روی آن سایت باز می‌شود و اذان پخش می‌شود. مرورگرها اجازه نمی‌دهند صدای اعلان عوض شود یا وقتی سایت بسته است صوتی پخش شود.</p></section>`;
    },
    save: async (sub, box) => {
      const cs = [...box.querySelectorAll('[data-azan]')]; if (!cs.length) return;
      store.set(KEY, cs.filter(c => c.checked).map(c => c.dataset.azan));
      store.set(SOUND, !!box.querySelector('[data-azan-sound]')?.checked || null);
      const sel = box.querySelector('[data-azan-voice]'); if (sel?.value) setVoice(sel.value);
      await sync(sub, true);
      window.daily?.refresh();
    },
    restore: sub => sync(sub, true).catch(() => {}),
    active: () => shown() && mine().length > 0
  });

  // ---------- پخش اذان ----------
  // نوار کوچک پایین صفحه با نام اذان و مؤذن و دکمه قطع. اگر مرورگر پخش خودکار را نپذیرفت (معمولاً وقتی سایت تازه از روی اعلان باز شده)،
  // دکمه «پخش اذان» نشان داده می‌شود. هر اذان (نماز و روز) یک بار پخش می‌شود، چه از خبر سرویس‌ورکر چه از زدن روی اعلان.
  const NAMES = Object.fromEntries(P);
  let bar = null, au = null;
  function stop() { try { au?.pause(); } catch {} au = null; bar?.remove(); bar = null; }
  async function playAzan(prayer, key, test) {
    if (!test && (!soundOn() || !NAMES[prayer])) return;
    await voicesP; const v = voice(); if (!v) return;
    if (!test) { const k = key || prayer + ':' + new Date().toDateString(); if (store.get(PLAYED) === k) return; store.set(PLAYED, k); }
    stop();
    au = new Audio(v.url); au.preload = 'auto';
    bar = document.createElement('div'); bar.className = 'az-bar'; bar.setAttribute('role', 'status');
    bar.innerHTML = `<span>🕌 <b>${esc(NAMES[prayer] || 'اذان')}</b> <small>${esc(v.name)}</small></span><button type="button" class="az-go" hidden>▶ پخش اذان</button><button type="button" class="az-stop">⏹ قطع</button>`;
    document.body.append(bar);
    const a = au, go = bar.querySelector('.az-go');
    bar.querySelector('.az-stop').onclick = stop;
    go.onclick = () => { go.hidden = true; a.play().catch(() => { go.hidden = false; }); };
    a.onended = () => { if (au === a) stop(); };
    a.onerror = () => { if (au === a) { bar.querySelector('small').textContent = 'صوت باز نشد؛ اینترنت را بررسی کنید.'; go.hidden = true; } };
    a.play().catch(() => { if (au === a) go.hidden = false; });
  }
  document.head.insertAdjacentHTML('beforeend', '<style>.az-bar{position:fixed;inset-inline:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9000;display:flex;align-items:center;gap:8px;max-width:520px;margin:0 auto;padding:8px 12px;background:var(--deep,#0f4c3a);color:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.25);font-size:15px}.az-bar span{flex:1;line-height:1.5}.az-bar small{opacity:.85;margin-inline-start:4px}.az-bar button{min-height:40px;padding:4px 12px;border:0;border-radius:10px;background:rgba(255,255,255,.18);color:#fff;font:inherit;font-weight:600;cursor:pointer}.az-bar .az-go{background:var(--gold,#c9a227);color:#111}.ns-in .az-voice{display:flex;align-items:center;gap:8px;padding:6px 0}.ns-in .az-voice select{flex:1;min-width:0;min-height:40px}.ns-in .az-voice button{min-height:40px;padding:4px 10px}</style>');

  // سایت باز است و اعلان اذان رسید (sw.js)
  navigator.serviceWorker?.addEventListener('message', e => { if (e.data?.type === 'azan') playAzan(e.data.prayer, e.data.key); });
  // سایت از روی اعلان اذان باز شد: ?azanplay=<نماز>&azanat=<زمان اعلان>؛ فقط تا نیم ساعت پس از اعلان پخش می‌شود.
  try {
    const u = new URL(location.href), pr = u.searchParams.get('azanplay'), at = +u.searchParams.get('azanat') || Date.now(), key = u.searchParams.get('azankey');
    if (pr) {
      ['azanplay', 'azanat', 'azankey'].forEach(k => u.searchParams.delete(k)); history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      if (Date.now() - at < 30 * 60e3) playAzan(pr, key);
    }
  } catch {}
  // دکمه «شنیدن» در برگه تنظیم اعلان‌ها: همان مؤذنی که در فهرست انتخاب شده
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-azan-try]')) return;
    const sel = e.target.closest('section')?.querySelector('[data-azan-voice]'); if (sel?.value) setVoice(sel.value);
    playAzan(null, null, true);
  });
  document.addEventListener('change', e => { if (e.target.matches?.('[data-azan-voice]')) setVoice(e.target.value); });

  // ---------- پیوند کوچک در بخش اوقات شرعی کارت «امروز» ----------
  document.head.insertAdjacentHTML('beforeend', '<style>#dlCard .dl-azan{display:block;width:100%;height:auto;min-height:44px;margin-top:8px;padding:4px 10px;background:transparent;color:var(--dl-h);border:1px dashed var(--dl-line);border-radius:var(--r);font-weight:600;font-size:14.5px;white-space:normal;cursor:pointer}</style>');
  window.daily?.more(() => {
    if (!usable()) return '';
    const m = mine(), on = window.Notification?.permission === 'granted' && m.length;
    return `<button type="button" class="dl-azan" data-ns-open>🔔 اعلان اذان: ${on ? esc(P.filter(p => m.includes(p[0])).map(p => p[1].replace('اذان ', '')).join('، ')) : 'خاموش'} · تنظیم</button>`;
  });

  // از کارت «امروز» آمده: برگه که ساخته شد، بخش اذان (پایین برگه) دیده شود
  document.addEventListener('click', e => {
    if (!e.target.closest('#dlCard .dl-azan')) return;
    let n = 0; const t = setInterval(() => { const x = document.querySelector('.ns.show [data-azan]'); if (x || ++n > 40) { clearInterval(t); x?.closest('section')?.scrollIntoView({ block: 'center' }); } }, 100);
  });
  document.addEventListener('prayer:loc', quiet);
  document.addEventListener('features:changed', () => { quiet(); window.daily?.refresh(); });
  document.addEventListener('push:changed', () => window.daily?.refresh());
  quiet();
})();
