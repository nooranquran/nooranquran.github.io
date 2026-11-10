// «پیگیری اعضا» در زبانه گزارش‌های مدیریت: گزارش هفتگی، دوهفته‌ای و ماهانه حزب‌خوانی.
// برای هر گروه نشان می‌دهد چه کسانی در بازه انتخاب‌شده اصلاً گزارش نداده‌اند یا فقط یکی دو بار داده‌اند.
// داده از تابع admin_report_counts می‌آید (backend/supabase/admin-activity.sql)؛ به admin.js و app.js نیاز دارد.
(function () {
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fa = x => toFa(x);
  const css = `
.act-box{border:1px solid var(--gold);border-radius:var(--r-card);padding:12px 14px;margin:0 0 18px;background:#fffdf7;color:#2b2118;text-shadow:none}
.act-box h3{margin:0 0 6px}
.act-seg{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.act-seg button{height:38px;font-size:15px;padding:0 12px;background:#fff;color:var(--deep);border-color:var(--emerald)}
.act-seg button.on{background:var(--deep);color:#fff}
.act-grp{border-top:1px solid #eadfc8;padding-top:10px;margin-top:10px}
.act-grp h4{margin:0 0 4px;font-size:17px}
.act-sum{font-size:15px;color:var(--muted);margin-bottom:6px}
.act-list{margin:4px 0 10px}
.act-list summary{cursor:pointer;font-weight:700;padding:4px 0}
.act-list.zero summary{color:var(--danger)}
.act-row{display:flex;flex-wrap:wrap;gap:0 8px;align-items:baseline;padding:3px 0;border-bottom:1px dashed #efe6d2;font-size:16px}
.act-row b{flex:0 0 3.2em;color:var(--muted);font-weight:500}
.act-row span{flex:1}
.act-row small{color:var(--muted);font-size:14px;white-space:nowrap;margin-inline-start:auto}
.act-copy{height:34px;font-size:14px;padding:0 10px;margin-top:4px}`;
  { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  const PERIODS = [[7, 'هفته گذشته'], [14, 'دو هفته گذشته'], [30, 'ماه گذشته']];
  const KEY = 'nooran.act.period';
  let box = null, period = 7, seq = 0;
  try { period = +localStorage.getItem(KEY) || 7; } catch {}
  if (!PERIODS.some(p => p[0] === period)) period = 7;

  const toUtc = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const isoOf = ms => new Date(ms).toISOString().slice(0, 10);
  const addDays = (iso, k) => isoOf(toUtc(iso) + k * 86400000);
  const span = (a, b) => Math.round((toUtc(b) - toUtc(a)) / 86400000) + 1;
  const label = iso => { try { return dateLabelFromIso(iso); } catch { return iso; } };
  const short = iso => label(iso).split('، ').pop().replace(/\s*[۰-۹]{4}$/, '');

  function build() {
    const pane = document.getElementById('pane-reports'); if (!pane || box) return;
    box = document.createElement('section'); box.className = 'act-box'; box.id = 'actBox';
    box.innerHTML = `<h3>پیگیری اعضا</h3>
<p class="hint" style="margin:0">چه کسانی در این بازه اصلاً گزارش نداده‌اند یا فقط یکی دو بار داده‌اند. امروز حساب نمی‌شود چون هنوز تمام نشده است.</p>
<div class="act-seg" id="actSeg">${PERIODS.map(([n, t]) => `<button type="button" data-p="${n}">${t}</button>`).join('')}<button type="button" class="reg-light" id="actReload">تازه‌سازی</button></div>
<div id="actOut"><p class="hint">در حال دریافت…</p></div>`;
    pane.prepend(box);
    box.querySelector('#actSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-p]'); if (b) { period = +b.dataset.p; try { localStorage.setItem(KEY, period); } catch {} load(); }
    });
    box.querySelector('#actReload').onclick = load;
    box.querySelector('#actOut').addEventListener('click', e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      const t = b.dataset.copy, done = () => { const o = b.textContent; b.textContent = 'کپی شد ✓'; setTimeout(() => (b.textContent = o), 1600); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(done, () => fallback(t, done)); else fallback(t, done);
    });
  }
  function fallback(t, done) {
    const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select();
    try { document.execCommand('copy'); done(); } catch {} a.remove();
  }

  async function load() {
    if (!box) return;
    box.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', +b.dataset.p === period));
    const out = box.querySelector('#actOut'), my = ++seq;
    const to = addDays(isoIran(), -1), from = addDays(to, 1 - period);
    out.innerHTML = '<p class="hint">در حال دریافت…</p>';
    let rows;
    try { rows = await window.sbRpc('admin_report_counts', { p_from: from, p_to: to }, true); }
    catch (e) { if (my === seq) out.innerHTML = `<p class="error">${esc(e.message)}</p>`; return; }
    if (my !== seq) return;
    const by = new Map();
    (rows || []).forEach(r => by.set(r.group_number + ':' + r.participant_id, r));
    const list = (typeof groups !== 'undefined' ? groups : []).filter(g => Array.isArray(g.names) && g.names.length);
    if (!list.length) { out.innerHTML = '<p class="hint">گروهی برای نمایش نیست.</p>'; return; }
    out.innerHTML = `<p class="act-sum">بازه: ${esc(label(from))} تا ${esc(label(to))}</p>` + list.map(g => group(g, by, from, to)).join('');
  }

  function group(g, by, from, to) {
    const start = isoOf(g.start), a = start > from ? start : from;
    if (a > to) return `<div class="act-grp"><h4>${esc(g.name)}</h4><p class="act-sum">این گروه در این بازه هنوز شروع نشده بود.</p></div>`;
    const total = span(a, to), n = g.names.length, zero = [], few = [];
    let sum = 0, full = 0;
    for (let id = 1; id <= n; id++) {
      const r = by.get(g.number + ':' + id), d = r ? r.days : 0;
      sum += d; if (d >= total) full++;
      const item = { id, name: g.names[id - 1], d, last: r?.last_day };
      if (!d) zero.push(item); else if (d <= 2 && d < total) few.push(item);
    }
    const pct = Math.round(sum * 100 / (n * total));
    const row = x => `<div class="act-row"><b>${fa(x.id)}</b><span>${esc(x.name)}</span><small>${x.d ? `${fa(x.d)} از ${fa(total)} روز · آخرین: ${esc(short(x.last))}` : `۰ از ${fa(total)} روز`}</small></div>`;
    const text = (title, arr) => `${g.name} · ${title} (${label(a)} تا ${label(to)})\n` + arr.map(x => `${fa(x.id)}. ${x.name}${x.d ? ` (${fa(x.d)} بار)` : ''}`).join('\n');
    const part = (cls, title, arr, open) => arr.length
      ? `<details class="act-list ${cls}"${open ? ' open' : ''}><summary>${title}: ${fa(arr.length)} نفر</summary>${arr.map(row).join('')}<button type="button" class="reg-light act-copy" data-copy="${esc(text(title, arr))}">کپی فهرست برای گروه</button></details>`
      : `<p class="act-sum">${title}: کسی نیست ✓</p>`;
    return `<div class="act-grp"><h4>${esc(g.name)}</h4>
<p class="act-sum">${fa(total)} روز · میانگین گزارش: ${fa(pct)}٪ · همه روزها را گزارش داده‌اند: ${fa(full)} نفر از ${fa(n)}</p>
${part('zero', 'اصلاً گزارش نداده‌اند', zero, true)}${part('few', 'فقط یک یا دو بار گزارش داده‌اند', few, true)}</div>`;
  }

  document.addEventListener('admin:login', () => { build(); load(); });
  document.addEventListener('admin:tab', e => { if (e.detail === 'reports' && box) load(); });
  document.addEventListener('admin:logout', () => { seq++; });
})();
