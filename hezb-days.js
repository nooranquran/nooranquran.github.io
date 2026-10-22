// تقویم سهم روزها در حزب‌خوانی: زیر «سهم امروز» دکمه «سهم روزهای دیگر» یک تقویم شمسی ماهانه باز می‌کند؛
// با زدن هر روز، سهم آن روز (و شماره حزب)، روز چندم دوره و اینکه گزارشش ثبت شده یا نه دیده می‌شود،
// و می‌شود متن قرآن همان سهم را خواند یا (تا LATE_DAYS روز گذشته) گزارشش را ثبت کرد.
// گزارش‌های ثبت‌شده از سرور: hezb_report_history (backend/supabase/hezb-report-history.sql، تا حدود یک سال)؛
// اگر آن تابع هنوز در پایگاه داده ساخته نشده، hezb_reported_days (فقط هفته اخیر). هر چه یک بار دیده شد روی گوشی می‌ماند
// (localStorage، کلید hezbDays: { 'گروه:شناسه': [تاریخ‌ها] }) تا روزهای قدیمی‌تر هم وضعیت داشته باشند.
// استفاده: window.hezbDays.open(گروه، شناسه)؛ بی‌ورودی، گروه و شناسه ذخیره‌شده روی همین گوشی (کلید me).
(function () {
  const KEY = 'hezbDays', ME = 'me', WEEK = 'شیدسچپج';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const add = (iso, n) => isoShift(iso, n);
  const late = () => (typeof LATE_DAYS === 'number' ? LATE_DAYS : 7);
  const monthName = iso => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));

  const css = `
.hd-open{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:100%;height:auto;min-height:44px;margin:10px 0 0;padding:4px 12px;background:#fff;color:var(--deep);border:1px solid var(--emerald);border-radius:var(--r-card);font-size:16px;font-weight:600;text-shadow:none;white-space:normal;line-height:1.5}
.hd-open:hover{background:var(--hover)}
.hd-open small{display:block;color:var(--muted);font-weight:400;font-size:13.5px;line-height:1.5}
body.hd-lock{overflow:hidden}
.hd-shade[hidden]{display:none}
.hd-shade{position:fixed;inset:0;z-index:49;background:#000a;display:flex;align-items:flex-end;justify-content:center}
.hd-box{width:100%;max-width:480px;max-height:94vh;overflow-y:auto;overscroll-behavior:contain;background:#fffaf0;color:var(--ink);text-shadow:none;border:2px solid var(--gold);border-bottom:0;border-radius:var(--r-panel) var(--r-panel) 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #0007;line-height:1.7}
.hd-x{float:left;width:44px;height:44px;padding:0;background:transparent;border:0;color:var(--muted);font-size:24px}
.hd-x:hover{background:var(--hover)}
.hd-box h2{margin:4px 0 0;font:normal 28px/1.6 SiteFont,Tahoma,serif;color:var(--deep);text-align:center}
.hd-sub{margin:0 0 8px;text-align:center;color:var(--muted);font-size:14.5px}
.hd-quick{display:flex;gap:6px;margin:0 0 8px}
.hd-quick button{flex:1 1 0;min-width:0;height:40px;padding:0 6px;background:#fff;color:var(--deep);border:1px solid var(--line);border-radius:var(--pill);font-size:15px;font-weight:600}
.hd-quick button:hover{background:var(--hover)}
.hd-quick button[aria-pressed=true]{background:var(--emerald);border-color:var(--emerald);color:#fff}
.hd-mh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0 2px}
.hd-mh b{flex:1;text-align:center;font-size:17px;color:var(--deep)}
.hd-mh button{width:44px;height:40px;padding:0;background:#fff;color:var(--deep);border:1px solid var(--line);border-radius:var(--r);font-size:18px}
.hd-mh button:hover{background:var(--hover)}
.hd-mh button:disabled{opacity:.3;cursor:default;background:#fff}
.hd-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:6px 0 4px;direction:rtl}
.hd-cal>span{text-align:center;font-size:13px;font-weight:700;color:var(--muted)}
.hd-cal button{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:auto;aspect-ratio:1;max-height:46px;min-height:36px;padding:0;margin:0;background:#fffaf0;color:var(--ink);border:1px solid #e3d6b8;border-radius:8px;font-size:15px;font-weight:500;line-height:1}
.hd-cal button:hover{background:var(--hover)}
.hd-cal button.d{background:var(--emerald);border-color:var(--deep);color:#fff;font-weight:700}
.hd-cal button.m{background:#f6e3e3;border-color:#e5c3c3;color:#a35a5a}
.hd-cal button.f{color:#9a8b78;border-style:dashed}
.hd-cal button.t{outline:2px solid var(--gold);outline-offset:1px;font-weight:700}
.hd-cal button.on{box-shadow:0 0 0 2px #fffaf0,0 0 0 5px var(--deep);z-index:1}
.hd-cal button:disabled{opacity:.35;cursor:default;background:transparent;border-style:dotted}
.hd-cal i{visibility:hidden}
.hd-leg{display:flex;flex-wrap:wrap;gap:4px 14px;margin:2px 0 8px;font-size:13px;color:var(--muted)}
.hd-leg span{display:inline-flex;align-items:center;gap:5px}
.hd-leg b{display:inline-block;width:13px;height:13px;border-radius:3px;border:1px solid #e3d6b8}
.hd-leg b.d{background:var(--emerald);border-color:var(--deep)}
.hd-leg b.m{background:#f6e3e3;border-color:#e5c3c3}
.hd-leg b.t{outline:2px solid var(--gold)}
.hd-leg b.f{border-style:dashed}
.hd-sum{margin:0 0 4px;font-size:14.5px;color:var(--muted);text-align:center}
.hd-day{background:#fff;border:1px solid var(--gold);border-radius:var(--r-card);padding:10px 14px;margin-top:4px}
.hd-dh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}
.hd-dh b{color:var(--deep);font-size:16px}
.hd-dh span{color:var(--muted);font-size:13.5px}
.hd-por{margin:4px 0;font-size:22px;font-weight:700;color:var(--deep);line-height:1.6}
.hd-por .hizb{font-size:14px}
.hd-st{margin:0;padding:4px 10px;border-radius:var(--r);font-size:15px;font-weight:600}
.hd-st.ok{background:var(--mint);color:var(--deep)}
.hd-st.no{background:#fbeaea;color:#8a2f2f}
.hd-st.wait{background:#fff3d6;color:#7a520f}
.hd-st.mute{background:var(--cream);color:var(--muted);font-weight:500}
.hd-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.hd-btns button{height:auto;min-height:48px;padding:4px 10px;white-space:normal;line-height:1.5;font-size:15.5px}
.hd-btns button.alt{background:#fff;color:var(--deep);border:1px solid var(--emerald)}
.hd-btns button.alt:hover{background:var(--hover)}
.hd-btns .one{grid-column:1/-1}
.hd-load{margin:6px 0 0;font-size:13.5px;color:var(--muted);text-align:center;min-height:20px}
@media(min-width:700px){.hd-shade{align-items:center}.hd-box{border-bottom:2px solid var(--gold);border-radius:var(--r-panel);max-height:90vh;padding-bottom:18px}}`;
  { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  // ---------- گزارش‌های ثبت‌شده ----------
  const k = (g, id) => `${g}:${id}`;
  const stored = (g, id) => new Set(read(KEY, {})[k(g, id)] || []);
  function store(g, id, days) {
    const all = read(KEY, {}), s = new Set([...(all[k(g, id)] || []), ...days]);
    all[k(g, id)] = [...s].sort().slice(-400); write(KEY, all);
  }
  // ثبت از همین گوشی در extras.js (کلید reportedDays) هم شمرده می‌شود.
  const localDone = (g, id) => new Set([...stored(g, id), ...((read('reportedDays', {}) || {})[k(g, id)] || [])]);
  async function rpc(name, g, id) {
    const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_group: g, p_participant: id }) });
    if (!r.ok) throw Error(r.status);
    const a = await r.json(); if (!Array.isArray(a)) throw Error('bad');
    return a;
  }
  // known: از کدام تاریخ به بعد وضعیت سرور معلوم است (روزهای پیش از آن، اگر روی گوشی هم نبود، «نامعلوم» هستند).
  let hasHistory = null;
  async function fetchDone(g, id) {
    if (!backendReady()) throw Error('offline');
    const today = isoIran();
    if (hasHistory !== false) {
      try { const a = await rpc('hezb_report_history', g, id); hasHistory = true; return { days: a, known: add(today, -400) }; }
      catch (e) { if (!/^(404|400)$/.test(e.message)) throw e; hasHistory = false; }
    }
    return { days: await rpc('hezb_reported_days', g, id), known: add(today, -7) };
  }

  // ---------- برگه تقویم ----------
  let shade = null, opener = null, pushed = false, st = null;
  const box = () => shade.querySelector('.hd-box');

  function open(gNum, id) {
    if (gNum == null) { const me = read(ME, null); if (!me) return false; gNum = me.g; id = me.id; }
    const g = groups.find(x => x.number === gNum);
    if (!g || !(id >= 1 && id <= 120) || !portions.length) return false;
    const today = isoIran();
    const start = new Date(g.start).toISOString().slice(0, 10);
    st = { g, id, today, start, sel: today, month: today, done: localDone(g.number, id), known: null, loading: true, failed: false };
    if (!shade) {
      shade = document.createElement('div'); shade.className = 'hd-shade';
      shade.innerHTML = '<div class="hd-box" role="dialog" aria-modal="true" aria-labelledby="hdTitle"></div>';
      shade.addEventListener('click', onClick);
      document.body.appendChild(shade);
    }
    opener = document.activeElement;
    shade.hidden = false; document.body.classList.add('hd-lock');
    if (!pushed) { try { history.pushState({ hd: 1 }, ''); pushed = true; } catch {} }
    draw();
    box().scrollTop = 0;
    setTimeout(() => shade.querySelector('.hd-x')?.focus(), 30);
    const s0 = st;
    fetchDone(g.number, id).then(r => {
      store(g.number, id, r.days);
      if (st !== s0) return;
      st.done = localDone(g.number, id); st.known = r.known; st.loading = false; draw(true);
    }).catch(() => { if (st !== s0) return; st.loading = false; st.failed = true; draw(true); });
    return true;
  }
  function close(fromHistory) {
    if (!shade || shade.hidden) return;
    shade.hidden = true; document.body.classList.remove('hd-lock'); st = null;
    if (pushed && !fromHistory) { pushed = false; try { history.back(); } catch {} }
    pushed = false;
    if (opener && opener.isConnected && opener.focus) try { opener.focus({ preventScroll: true }); } catch {}
  }
  // قرآن‌خوانی که از روی تقویم باز شده، با بسته شدن به همین برگه برمی‌گردد (history.state دوباره hd است).
  addEventListener('popstate', () => { if (pushed && !history.state?.hd) { pushed = false; close(true); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && shade && !shade.hidden && !document.querySelector('.qr.show')) close(); }, true);

  // وضعیت هر روز: before (پیش از شروع گروه)، future، done، today (امروز، هنوز ثبت نشده)، miss، unknown
  function status(iso) {
    const s = st;
    if (iso < s.start) return 'before';
    if (iso > s.today) return 'future';
    if (s.done.has(iso)) return 'done';
    if (iso === s.today) return 'today';
    if (s.known && iso >= s.known) return 'miss';
    return 'unknown';
  }
  const first = iso => { const j = J.fromIso(iso); return J.toIso(j.y, j.m, 1); };
  const shiftMonth = (iso, n) => { const j = J.fromIso(iso); let y = j.y, m = j.m + n; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return J.toIso(y, m, 1); };
  const minMonth = () => first(st.start > add(st.today, -400) ? st.start : add(st.today, -400));
  const maxMonth = () => first(add(st.today, 30));

  function grid() {
    const f = first(st.month), j = J.fromIso(f), len = J.monthLen(j.y, j.m);
    // ستون اول شنبه است
    const wd = (new Date(f + 'T12:00:00Z').getUTCDay() + 1) % 7;
    let h = WEEK.split('').map(x => `<span aria-hidden="true">${x}</span>`).join('') + '<i></i>'.repeat(wd);
    for (let d = 0; d < len; d++) {
      const iso = add(f, d), s = status(iso);
      const cls = { done: 'd', miss: 'm', future: 'f' }[s] || '';
      const lab = `${shortDayFa(iso)}${{ done: '، گزارش ثبت شده', miss: '، گزارش ثبت نشده', today: '، امروز' }[s] || ''}`;
      h += `<button type="button" data-d="${iso}" class="${cls}${iso === st.today ? ' t' : ''}${iso === st.sel ? ' on' : ''}" aria-pressed="${iso === st.sel}" aria-label="${esc(lab)}"${s === 'before' ? ' disabled' : ''}>${toFa(d + 1)}</button>`;
    }
    return h;
  }
  function summary() {
    const f = first(st.month), j = J.fromIso(f), len = J.monthLen(j.y, j.m);
    let done = 0, miss = 0;
    for (let d = 0; d < len; d++) { const s = status(add(f, d)); if (s === 'done') done++; else if (s === 'miss') miss++; }
    if (!done && !miss) return '';
    return `این ماه: ${toFa(done)} روز گزارش ثبت شده${miss ? `، ${toFa(miss)} روز ثبت نشده` : ''}`;
  }
  function dayCard() {
    const iso = st.sel, s = status(iso), t = taskForDate(st.g, st.id, iso), canLate = iso >= add(st.today, -late());
    if (s === 'before') return '';
    const n = t.days % 120 + 1, round = Math.floor(t.days / 120);
    const name = iso === st.today ? 'امروز' : iso === add(st.today, -1) ? 'دیروز' : iso === add(st.today, 1) ? 'فردا' : '';
    const ahead = s === 'future' ? Math.round((Date.parse(iso) - Date.parse(st.today)) / 864e5) : 0;
    const msg = {
      done: '<p class="hd-st ok">✓ خوانده‌اید؛ گزارش این روز ثبت شده است.</p>',
      today: '<p class="hd-st wait">سهم امروز؛ گزارشش هنوز ثبت نشده است.</p>',
      miss: `<p class="hd-st no">گزارش این روز ثبت نشده است.${canLate ? ' اگر خوانده‌اید، هنوز می‌توانید ثبت کنید.' : ''}</p>`,
      unknown: `<p class="hd-st mute">${st.loading ? 'در حال دریافت وضعیت گزارش…' : 'وضعیت گزارش این روز روی سایت در دسترس نیست.'}</p>`,
      future: `<p class="hd-st mute">این سهم ${ahead === 1 ? 'فرداست' : `${toFa(ahead)} روز دیگر است`}؛ می‌توانید از حالا بخوانید.</p>`
    }[s];
    const report = (s === 'today' || (s === 'miss' || s === 'unknown') && canLate && iso < st.today);
    return `<div class="hd-day"><div class="hd-dh"><b>${esc(dateLabelFromIso(iso))}${name ? ` (${name})` : ''}</b><span>روز ${toFa(n)} از ۱۲۰${round ? ` · دور ${toFa(round + 1)}` : ''}</span></div>
<p class="hd-por">${toFa(portions[t.index])} ${hizbLabel(t.index)}</p>${msg}
<div class="hd-btns"><button type="button" data-read class="${report ? '' : 'one'}">📖 خواندن متن این سهم</button>${report ? `<button type="button" class="alt" data-report>${s === 'today' ? 'ثبت گزارش امروز' : 'ثبت گزارش این روز'}</button>` : ''}</div></div>`;
  }
  function draw(keep) {
    if (!st) return;
    const b = box(), y = b.scrollTop, mm = st.month, yest = add(st.today, -1), tom = add(st.today, 1);
    const quick = [[yest, 'دیروز'], [st.today, 'امروز'], [tom, 'فردا']].filter(([d]) => d >= st.start);
    b.innerHTML = `<button type="button" class="hd-x" aria-label="بستن">✕</button><h2 id="hdTitle">سهم روزها</h2>
<p class="hd-sub">${esc(st.g.names[st.id - 1])} · ${esc(st.g.name)} · شناسه ${toFa(st.id)}</p>
${quick.length > 1 ? `<div class="hd-quick">${quick.map(([d, l]) => `<button type="button" data-d="${d}" aria-pressed="${d === st.sel}">${l}</button>`).join('')}</div>` : ''}
<div class="hd-mh"><button type="button" data-m="-1" aria-label="ماه قبل"${shiftMonth(mm, -1) < minMonth() ? ' disabled' : ''}>→</button><b aria-live="polite">${esc(monthName(first(mm)))} ${toFa(J.fromIso(mm).y)}</b><button type="button" data-m="1" aria-label="ماه بعد"${shiftMonth(mm, 1) > maxMonth() ? ' disabled' : ''}>←</button></div>
<div class="hd-cal" role="group" aria-label="روزهای ماه">${grid()}</div>
<div class="hd-leg"><span><b class="d"></b>ثبت شده</span><span><b class="m"></b>ثبت نشده</span><span><b class="t"></b>امروز</span><span><b class="f"></b>روزهای آینده</span></div>
${(() => { const s = summary(); return s ? `<p class="hd-sum">${s}</p>` : ''; })()}
<div aria-live="polite">${dayCard()}</div>
<p class="hd-load">${st.loading ? 'در حال دریافت گزارش‌های ثبت‌شده…' : st.failed ? 'دریافت گزارش‌ها انجام نشد؛ وضعیت روزها از همین گوشی است.' : ''}</p>`;
    if (keep) b.scrollTop = y;
  }
  function pick(iso) {
    st.sel = iso;
    const f = first(iso); if (f !== first(st.month)) st.month = f;
    draw(true);
    // کارت روز روی گوشی زیر تقویم است؛ اگر بیرون از دید بود کمی پایین برود.
    const c = box().querySelector('.hd-day'); if (c) { const r = c.getBoundingClientRect(), br = box().getBoundingClientRect(); if (r.bottom > br.bottom) box().scrollBy({ top: r.bottom - br.bottom + 12, behavior: 'smooth' }); }
  }
  function onClick(e) {
    if (e.target === shade || e.target.closest('.hd-x')) return close();
    if (!st) return;
    const d = e.target.closest('[data-d]'); if (d) return pick(d.dataset.d);
    const m = e.target.closest('[data-m]');
    if (m) { st.month = shiftMonth(st.month, +m.dataset.m); return draw(true); }
    if (e.target.closest('[data-read]')) {
      const iso = st.sel, t = taskForDate(st.g, st.id, iso), s = status(iso), id = st.id;
      const canReport = s === 'today' || (s !== 'done' && s !== 'future' && iso >= add(st.today, -late()));
      const task = { index: t.index, id, title: portions[t.index], day: iso, dayName: iso === st.today ? 'امروز' : shortDayFa(iso), canReport };
      if (!window.quranReader?.openTask) return;
      // قرآن‌خوان (z-index بالاتر) روی همین برگه باز می‌شود؛ با بستنش تقویم سر جایش است.
      window.quranReader.openTask(task);
      return;
    }
    if (e.target.closest('[data-report]')) {
      const iso = st.sel, id = st.id, gNum = st.g.number;
      close();
      setTimeout(() => {
        window.hezbReveal?.();
        if (selected?.number !== gNum) { const b = groupsNav.querySelector(`button[data-n="${gNum}"]`); if (b) selectGroup(gNum, b); }
        reportId.value = toFa(id); verifyReportIdentity(iso);
        reportId.closest('.panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  // ---------- دکمه زیر «سهم امروز» ----------
  function addButton(id) {
    const task = document.querySelector('#result .task'); if (!task || !selected || !window.J || task.querySelector('.hd-open')) return;
    const gNum = selected.number;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hd-open';
    b.innerHTML = '<span>🗓️ سهم روزهای دیگر</span><small>دیروز، روزهای جامانده و فردا</small>';
    b.onclick = () => open(gNum, id);
    task.appendChild(b);
  }
  document.addEventListener('task:shown', e => addButton(e.detail.id));
  // اگر سهم امروز پیش از بار شدن این فایل نشان داده شده بود
  if (document.querySelector('#result.show .task')) { const id = +norm(pid.value); if (id >= 1 && id <= 120) addButton(id); }

  window.hezbDays = {
    open,
    // منو (menu.js): فقط وقتی گروه و شناسه روی این گوشی ذخیره شده است.
    can: () => { const me = read(ME, null); return !!(me && window.J && portions.length && groups.some(x => x.number === me.g)); }
  };
})();
