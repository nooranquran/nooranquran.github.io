// ختم قرآن پیوسته و دسته‌جمعی، منوی ☰ › قرآن، پس از «قرآن آزاد» و «ختم قرآن شخصی»؛ پیوند ?pk=main.
// هر کس (عضو حزب‌خوانی باشد یا نه) می‌گوید امروز چند صفحه یا چند آیه می‌خواند؛ از اولین جای باز همان‌قدر به او داده می‌شود
// تا دو نفر یک بخش را نخوانند. تا پایان روز بعد باید «خواندم» بزند (همه یا بخشی)، وگرنه بخش آزاد می‌شود و به نفر بعد می‌رسد.
// وقتی همه قرآن خوانده شد، آن ختم کامل است و ختم بعدی ادامه دارد؛ اگر خواننده زیاد باشد، چند ختم هم‌زمان پیش می‌رود.
// شناسایی با همان کد تصادفی گوشی ختم جزء به جزء (localStorage: khDevice) و اگر وارد حساب شده، با حساب.
// جدول‌ها و تابع‌ها: backend/supabase/parallel-khatm.sql. اعلان‌ها (یادآوری مهلت و «بخش باز هست»): تابع khatm-notify.
(function () {
  const cfg = window.APP_CONFIG || {};
  const CIRCLE = 'main', TOTAL = 6236;
  const fa = '۰۱۲۳۴۵۶۷۸۹', toFa = x => String(x).replace(/\d/g, d => fa[d]);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const num = v => { const n = parseInt(String(v || '').replace(/[۰-۹]/g, d => fa.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10); return Number.isFinite(n) ? n : 0; };
  const tehran = ms => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date(ms));
  const pct = (a, b = TOTAL) => Math.max(0, Math.min(100, a / b * 100));
  const pages = a => Math.round(a * 604 / TOTAL);

  const device = () => {
    let d = ls.get('khDevice', '');
    if (!d) { const a = new Uint8Array(18); crypto.getRandomValues(a); d = 'kh' + [...a].map(x => x.toString(16).padStart(2, '0')).join(''); ls.set('khDevice', d); }
    return d;
  };
  const token = () => { const s = ls.get('userSession', null); return s && s.access_token && s.expires_at - Date.now() / 1000 > 60 ? s.access_token : cfg.SUPABASE_ANON_KEY; };
  async function rpc(fn, args, withDevice = true) {
    if (!cfg.SUPABASE_URL) throw Object.assign(Error('net'), { code: 'net' });
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 15000);
    let r;
    try { r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', cache: 'no-store', signal: ac.signal, headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(withDevice ? Object.assign({ p_device: device() }, args) : args) }); }
    catch { throw Object.assign(Error('net'), { code: 'net' }); }
    finally { clearTimeout(t); }
    const txt = await r.text(), d = txt ? (() => { try { return JSON.parse(txt); } catch { return null; } })() : null;
    if (r.ok) return d;
    const code = r.status === 404 || d?.code === 'PGRST202' ? 'nosql' : d?.message || 'err';
    throw Object.assign(Error(code), { code });
  }
  const ERR = {
    pk_too_many: 'سه بخش نخوانده دست شماست؛ اول یکی را تمام کنید یا پس دهید.',
    pk_not_mine: 'این بخش دیگر دست شما نیست (شاید مهلتش گذشته و به نفر دیگری رسیده است).',
    pk_bad_count: 'تعداد را درست بنویسید.',
    pk_busy: 'الان همه بخش‌ها دست خوانندگان است. کمی بعد دوباره سر بزنید.',
    pk_not_found: 'این ختم پیدا نشد.',
    khatm_limit: 'کمی صبر کنید و دوباره امتحان کنید.',
    net: 'ارتباط با سرور برقرار نشد. اینترنت را بررسی کنید و دوباره امتحان کنید.',
    nosql: 'ختم دسته‌جمعی هنوز در سرور راه‌اندازی نشده است. کمی بعد دوباره سر بزنید.'
  };
  const errText = e => e?.code === 'msg' ? e.message : ERR[e?.code] || ERR[e?.message] || 'انجام نشد. لطفاً دوباره امتحان کنید.';

  const css = `
.pk-shade{position:fixed;inset:0;z-index:48;background:#000a;display:flex;align-items:flex-end;justify-content:center}
.pk-box{width:100%;max-width:560px;max-height:94vh;overflow-y:auto;overscroll-behavior:contain;background:#fffaf0;color:var(--ink);text-shadow:none;border:2px solid var(--gold);border-bottom:0;border-radius:var(--r-panel) var(--r-panel) 0 0;padding:10px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #0007;animation:pkup .25s ease}
@keyframes pkup{from{transform:translateY(40px);opacity:.4}}
.pk-x{float:left;width:44px;height:44px;padding:0;background:transparent;border:0;color:var(--muted);font-size:24px}
.pk-x:hover{background:var(--hover)}
.pk-box h2{clear:both;margin:4px 0 0;text-align:center;font:normal 32px/1.6 SiteFont,Tahoma,serif;color:var(--deep)}
.pk-sub{margin:0 0 8px;text-align:center;color:var(--muted);font-size:15px}
.pk-card{background:#fff;border:1px solid var(--gold);border-radius:var(--r-card);padding:12px 14px;margin:10px 0}
.pk-card h3{margin:0 0 4px;font-size:17px;color:var(--deep)}
.pk-card.mine{border:2px solid var(--emerald);background:var(--mint)}
.pk-card.ok{border:2px solid var(--emerald)}
.pk-map{position:relative;height:16px;border-radius:999px;background:#ece3cf;overflow:hidden;margin:8px 0 4px}
.pk-map i{position:absolute;top:0;bottom:0;display:block}
.pk-map .d{background:var(--emerald)}.pk-map .t{background:#d9b65c}.pk-map .m{background:#2f8fd0}
.pk-key{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13px;color:var(--muted);margin:2px 0}
.pk-key i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-left:4px;vertical-align:-1px;background:#ece3cf}
.pk-key .d{background:var(--emerald)}.pk-key .t{background:#d9b65c}.pk-key .m{background:#2f8fd0}
.pk-mute{margin:4px 0;color:var(--muted);font-size:14.5px}
.pk-big{margin:6px 0;font-weight:700;font-size:17px;color:var(--deep)}
.pk-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.pk-btns button{flex:1 1 auto;min-height:46px;height:auto;white-space:normal}
.pk-light{background:transparent!important;color:var(--deep)!important;border:1px solid var(--gold)!important}
.pk-light:hover{background:var(--hover)!important}
.pk-row{display:flex;gap:8px;align-items:center;margin-top:6px}.pk-row>*{flex:1;min-width:0}
.pk-row input{min-height:44px;font-size:16px;width:100%;box-sizing:border-box}
.pk-seg{display:flex;gap:6px;flex:none!important}.pk-seg input{width:auto;min-height:0;margin:0}.pk-seg label{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;border:1px solid var(--gold);border-radius:12px;background:#fff;font-weight:600;cursor:pointer}
.pk-seg label:has(input:checked){background:var(--mint);border-color:var(--emerald)}
.pk-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.pk-quick button{flex:1 1 auto;min-height:38px;height:auto;padding:4px 10px;font-size:14px}
.pk-msg{font-weight:700;margin:6px 0 0;color:#a23b2a}.pk-msg:empty{display:none}
.pk-more summary{cursor:pointer;color:var(--deep);font-weight:600;margin-top:8px}
.pk-lbl{display:block;margin:10px 0 2px;font-weight:600;font-size:15px}
body.pk-lock{overflow:hidden}`;
  { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  let toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.style.cssText = 'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;max-width:90vw;background:#1f1a14;color:#fff;padding:10px 18px;border:1px solid var(--gold);text-shadow:none;font-size:15px;text-align:center'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.style.display = 'block';
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.style.display = 'none'; }, 4000);
  }

  // ---------- قرآن (فهرست صفحه‌ها و سوره‌ها) ----------
  let ix = null;
  const getIx = async () => ix || (ix = await window.quranReader.index());
  const lastLE = (arr, g) => { let lo = 0, hi = arr.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= g) lo = m; else hi = m - 1; } return lo; };
  const pageOf = g => lastLE(ix.page, g) + 1;
  const pageStart = p => (p > 604 ? TOTAL : p < 1 ? 0 : ix.page[p - 1]);
  const sname = s => (window.quranFree?.names || [])[s - 1] || toFa(s);
  const where = g => { const s = lastLE(ix.surah, g); return { s: s + 1, n: g - ix.surah[s] + 1 }; };
  function rangeText(f, t) {
    if (!ix) return '';
    const a = where(f), b = where(t - 1), pa = pageOf(f), pb = pageOf(t - 1);
    const pg = pa === pb ? `صفحه ${toFa(pa)}` : `صفحه ${toFa(pa)} تا ${toFa(pb)}`;
    const ay = a.s === b.s ? `سوره ${sname(a.s)}، آیه ${toFa(a.n)}${b.n > a.n ? ` تا ${toFa(b.n)}` : ''}` : `از ${sname(a.s)} ${toFa(a.n)} تا ${sname(b.s)} ${toFa(b.n)}`;
    return `${pg}؛ ${ay}`;
  }
  const size = (f, t, unit) => unit === 'page' ? `${toFa(pageOf(t - 1) - pageOf(f) + 1)} صفحه` : `${toFa(t - f)} آیه`;

  // ---------- وضعیت ----------
  let view = ls.get('pkView', null), loadedAt = 0, loading = null, lastFinished = null, afterDone = false;
  async function refresh() {
    if (loading) return loading;
    return (loading = rpc('pk_get', { p_id: CIRCLE })
      .then(v => { setView(v); return v; })
      .finally(() => { loading = null; }));
  }
  function setView(v) {
    if (!v || typeof v !== 'object') return;
    view = v; loadedAt = Date.now();
    ls.set('pkView', { cycle: v.cycle, completed: v.completed, cycles: v.cycles, mine: v.mine, t: Date.now() });
    window.siteMenu?.refresh();
  }

  // ---------- برگه ----------
  let shade = null;
  async function open() {
    if (!shade) {
      shade = document.createElement('div'); shade.className = 'pk-shade'; shade.hidden = true;
      shade.innerHTML = '<div class="pk-box" role="dialog" aria-modal="true"></div>';
      shade.addEventListener('click', e => { if (e.target === shade) close(); else onClick(e); });
      document.body.appendChild(shade);
    }
    shade.hidden = false; document.body.classList.add('pk-lock');
    try { if (!history.state?.pk) history.pushState({ pk: 1 }, ''); } catch {}
    lastFinished = null; afterDone = false;
    box().innerHTML = '<button type="button" class="pk-x" data-pk="close" aria-label="بستن">✕</button><h2>ختم قرآن پیوسته و دسته‌جمعی</h2><p class="pk-sub">در حال دریافت…</p>';
    try { await getIx(); } catch {}
    try { await refresh(); render(); }
    catch (e) { box().innerHTML = `<button type="button" class="pk-x" data-pk="close" aria-label="بستن">✕</button><h2>ختم قرآن پیوسته و دسته‌جمعی</h2><p class="pk-sub">${esc(errText(e))}</p><div class="pk-btns"><button type="button" data-pk="retry">دوباره</button></div>`; }
    pushState();
  }
  function close(fromHistory) {
    if (!shade || shade.hidden) return;
    shade.hidden = true; document.body.classList.remove('pk-lock');
    if (!fromHistory) try { if (history.state?.pk) history.back(); } catch {}
  }
  addEventListener('popstate', () => { if (!history.state?.pk) close(true); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && shade && !shade.hidden && !document.querySelector('.qr.show')) close(); });
  const box = () => shade.querySelector('.pk-box');

  function deadlineText(iso) {
    const last = tehran(Date.parse(iso) - 60000), t = tehran(Date.now());
    if (last === t) return 'تا پایان امشب';
    const d = Math.round((Date.parse(last + 'T12:00:00Z') - Date.parse(t + 'T12:00:00Z')) / 864e5);
    return d === 1 ? 'تا پایان فردا' : `تا ${window.J ? J.label(last) : last}`;
  }

  function render() {
    if (!shade || shade.hidden || !view) return;
    const v = view, cyc = v.cycles || [], cur = cyc.find(c => c.c === v.cycle) || { done: 0, taken: 0 };
    const mine = v.mine || [], segs = v.segs || [], nx = v.next || { c: v.cycle, f: 0, t: TOTAL };
    const mineIds = new Set(mine.map(m => `${m.c}:${m.f}`));
    const map = c => segs.filter(s => s.c === c).map(s => `<i class="${s.d ? 'd' : mineIds.has(`${s.c}:${s.f}`) ? 'm' : 't'}" style="right:${pct(s.f)}%;width:${Math.max(0.35, pct(s.t - s.f))}%"></i>`).join('');
    const openA = TOTAL - (cur.done || 0) - (cur.taken || 0);
    const after = cyc.filter(c => c.c > v.cycle);
    let h = '<button type="button" class="pk-x" data-pk="close" aria-label="بستن">✕</button><h2>ختم قرآن پیوسته و دسته‌جمعی</h2><p class="pk-sub">هر کس هر روز به اندازه فرصتش چند صفحه یا آیه برمی‌دارد و می‌خواند؛ با هم قرآن ختم می‌شود، گاهی در چند روز و گاهی چند بار در یک روز</p>';
    if (lastFinished) h += `<div class="pk-card ok" style="text-align:center"><p class="pk-big">🎉 با خواندن شما، ختم ${toFa(lastFinished)}‌ام قرآن کامل شد. قبول باشد.</p>${window.contentPlus?.shown('khatmdua') ? '<div class="pk-btns"><button type="button" data-pk="khatmdua">📖 دعای ختم قرآن (صحیفه سجادیه، دعای ۴۲)</button></div>' : ''}</div>`;
    // وضعیت ختم جاری
    h += `<div class="pk-card"><h3>ختم ${toFa(v.cycle)}${v.completed ? ` <small class="pk-mute" style="font-weight:400">(تاکنون ${toFa(v.completed)} ختم کامل شده)</small>` : ''}</h3>
<div class="pk-map" role="img" aria-label="${toFa(Math.round(pct(cur.done || 0)))}٪ خوانده شده">${map(v.cycle)}</div>
<div class="pk-key"><span><i class="d"></i>خوانده شد</span><span><i class="t"></i>دست خوانندگان</span>${mine.length ? '<span><i class="m"></i>دست شما</span>' : ''}<span><i></i>باز</span></div>
<p class="pk-mute">حدود ${toFa(pages(cur.done || 0))} صفحه خوانده شده، ${toFa(pages(cur.taken || 0))} صفحه دست خوانندگان و ${toFa(pages(openA))} صفحه باز است.</p>
${after.map(c => `<p class="pk-mute">ختم ${toFa(c.c)} هم شروع شده: حدود ${toFa(pages((c.done || 0) + (c.taken || 0)))} صفحه برداشته شده.</p><div class="pk-map">${c.c === v.cycle + 1 ? map(c.c) : ''}</div>`).join('')}
${v.today?.readers ? `<p class="pk-mute">امروز ${toFa(v.today.readers)} نفر حدود ${toFa(Math.max(1, pages(v.today.ayahs)))} صفحه خواندند.</p>` : ''}
${v.my_read ? `<p class="pk-mute">سهم شما تاکنون: حدود ${toFa(Math.max(1, pages(v.my_read)))} صفحه (${toFa(v.my_read)} آیه).</p>` : ''}</div>`;
    // بخش‌های من
    mine.forEach(m => {
      h += `<div class="pk-card mine"><h3>بخش شما${m.c !== v.cycle ? ` (ختم ${toFa(m.c)})` : ''}: ${esc(size(m.f, m.t, m.unit))}</h3>
<p class="pk-big" style="font-weight:600">${esc(rangeText(m.f, m.t))}</p>
<p class="pk-mute">مهلت «خواندم»: ${esc(deadlineText(m.deadline))}؛ پس از آن، این بخش به نفر دیگری داده می‌شود.</p>
<div class="pk-btns"><button type="button" data-pk="read" data-id="${m.id}">📖 خواندن</button><button type="button" class="pk-light" data-pk="done" data-id="${m.id}">✓ همه را خواندم</button></div>
<details class="pk-more"><summary>فقط بخشی را خواندم / پس دادن</summary><p class="pk-mute">چند ${m.unit === 'page' ? 'صفحه' : 'آیه'} از ابتدای این بخش را خواندید؟ همان ثبت می‌شود و بقیه برای دیگران باز می‌شود.</p>
<div class="pk-row"><input id="pkPart${m.id}" inputmode="numeric" placeholder="تعداد ${m.unit === 'page' ? 'صفحه' : 'آیه'}"><button type="button" data-pk="part" data-id="${m.id}">ثبت</button></div>
<div class="pk-btns"><button type="button" class="pk-light" data-pk="release" data-id="${m.id}">پس دادن بخش (نمی‌رسم بخوانم)</button></div><p class="pk-msg" id="pkMsg${m.id}"></p></details></div>`;
    });
    // برداشتن بخش تازه
    const pref = ls.get('pkPref', { unit: 'page', n: 2 }), unit = pref.unit === 'ayah' ? 'ayah' : 'page';
    if (mine.length < 3) {
      const from = nx.f, gapNote = nx.t - nx.f < 60 && nx.t < TOTAL ? `<p class="pk-mute">بخش باز پیش رو ${toFa(nx.t - nx.f)} آیه است (بخشی که کسی پس داده یا مهلتش گذشته)؛ اگر بیشتر بخواهید، همین‌قدر داده می‌شود و دفعه بعد ادامه را برمی‌دارید.</p>` : '';
      h += `<div class="pk-card"><h3>${afterDone ? 'باز هم فرصت دارید؟ بخش‌های باز مانده' : mine.length ? 'برداشتن بخش دیگر' : 'امروز چقدر می‌خوانید؟'}</h3>
<p class="pk-mute">بخش شما از ${ix ? esc(rangeText(from, from + 1).split('؛ ').reverse().join('، ')) : 'اولین جای باز'}${nx.c !== v.cycle ? ` (ختم ${toFa(nx.c)}؛ همه ختم ${toFa(v.cycle)} برداشته شده است)` : ''} شروع می‌شود.</p>${gapNote}
<div class="pk-row"><input id="pkN" inputmode="numeric" value="${toFa(pref.n || 1)}" aria-label="اندازه"><div class="pk-seg"><label><input type="radio" name="pkUnit" value="page"${unit === 'page' ? ' checked' : ''}>صفحه</label><label><input type="radio" name="pkUnit" value="ayah"${unit === 'ayah' ? ' checked' : ''}>آیه</label></div></div>
<div class="pk-quick">${[1, 2, 5, 10, 20].map(n => `<button type="button" class="pk-light" data-pk="quick" data-n="${n}">${n === 20 ? 'یک جزء' : `${toFa(n)} صفحه`}</button>`).join('')}</div>
<details class="pk-more"><summary>نام شما (اختیاری)</summary><input id="pkName" maxlength="40" style="width:100%;min-height:44px;margin-top:6px;box-sizing:border-box" placeholder="فقط برای ثبت؛ به دیگران نشان داده نمی‌شود" value="${esc(ls.get('khatmName', '') || ls.get('chlName', ''))}"></details>
<div class="pk-btns"><button type="button" data-pk="claim">برداشتن بخش</button></div><p class="pk-msg" id="pkMsg"></p>
<p class="pk-mute">تا پایان فردا فرصت دارید «خواندم» را بزنید. اگر فقط بخشی را خواندید، همان‌قدر را ثبت کنید تا بقیه به دیگران برسد.</p></div>`;
    } else h += '<div class="pk-card"><p class="pk-mute">سه بخش نخوانده دست شماست؛ برای برداشتن بخش تازه، اول یکی را تمام کنید یا پس دهید.</p></div>';
    // اعلان
    if (window.sitePush?.supported && cfg.VAPID_PUBLIC_KEY) h += `<div class="pk-card"><h3>🔔 اعلان</h3><p class="pk-mute" id="pkPushLine">${pushOn() ? 'روشن است: شب آخر مهلت یادآوری می‌شود و هر روز اگر بخشی باز بود و بخشی دست شما نبود، خبر می‌دهیم.' : 'یادآوری شب آخر مهلت، و هر روز خبر بخش‌های باز (اگر بخشی دست شما نیست).'}</p>
<div class="pk-btns"><button type="button" class="pk-light" data-pk="${pushOn() ? 'pushOff' : 'pushOn'}">${pushOn() ? 'خاموش کردن اعلان ختم دسته‌جمعی' : 'روشن کردن اعلان'}</button></div></div>`;
    if (v.recent?.length) h += `<div class="pk-card"><h3>ختم‌های کامل اخیر</h3>${v.recent.map(r => `<p class="pk-mute">ختم ${toFa(r.c)}: ${esc(window.J ? J.label(tehran(Date.parse(r.at))) : tehran(Date.parse(r.at)))}، با ${toFa(r.readers)} خواننده</p>`).join('')}</div>`;
    h += `<div class="pk-btns"><button type="button" class="pk-light" data-pk="share">📨 فرستادن پیوند ختم برای دیگران</button></div>`;
    const top = box().scrollTop;
    box().innerHTML = h;
    box().scrollTop = top;
  }

  // ---------- اعلان (اشتراک خود سایت، sw.js) ----------
  const pushOn = () => !!ls.get('pkPush', false);
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  async function currentSub() { try { const r = await navigator.serviceWorker.getRegistration(); return r ? await r.pushManager.getSubscription() : null; } catch { return null; } }
  async function ensureSub() {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw Error(perm === 'denied' ? 'denied' : 'dismissed');
    const r = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    return await r.pushManager.getSubscription() || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.VAPID_PUBLIC_KEY) });
  }
  async function pushEnable() {
    const sub = await ensureSub(), k = sub.toJSON().keys;
    await rpc('pk_push_on', { p_id: CIRCLE, p_endpoint: sub.endpoint, p_p256dh: k.p256dh, p_auth: k.auth, p_open: true });
    ls.set('pkPush', true);
  }

  // ---------- کارها ----------
  async function act(b, fn) {
    const label = b.textContent; b.disabled = true; b.textContent = 'لطفاً صبر کنید…';
    try { await fn(); }
    catch (e) { b.disabled = false; b.textContent = label; const id = b.dataset.id, m = box().querySelector(id ? '#pkMsg' + id : '#pkMsg'); if (m) m.textContent = errText(e); else toast(errText(e)); if (e.code === 'pk_not_mine') refresh().then(render).catch(() => {}); }
  }
  async function done(id, upto) {
    const r = await rpc('pk_done', { p_id: CIRCLE, p_claim: id, p_upto: upto ?? null });
    lastFinished = r?.finished || null; afterDone = true;
    setView(r?.view); render();
    toast(lastFinished ? `ختم ${toFa(lastFinished)}‌ام قرآن کامل شد. قبول باشد.` : 'ثبت شد. قبول باشد. بخش‌های بعدی هنوز باز است.');
    box().scrollTop = 0;
  }
  function readClaim(m) {
    if (!ix) return toast('بارگذاری متن قرآن انجام نشد. اینترنت را بررسی کنید.');
    window.quranReader.openRange({
      title: 'ختم قرآن پیوسته و دسته‌جمعی', sub: rangeText(m.f, m.t), from: m.f, to: m.t,
      endText: m.t >= TOTAL ? 'پایان قرآن کریم. قبول باشد.' : 'پایان بخش شما. قبول باشد.', endButton: 'خواندم؛ ثبت',
      onEnd: () => done(m.id).catch(e => toast(errText(e)))
    });
  }
  async function onClick(e) {
    const b = e.target.closest('[data-pk]'); if (!b) return;
    const a = b.dataset.pk, id = +b.dataset.id || 0, m = id && (view?.mine || []).find(x => x.id === id);
    if (a === 'close') return close();
    if (a === 'retry') { close(true); try { if (history.state?.pk) history.back(); } catch {} return setTimeout(open, 300); }
    if (a === 'khatmdua') { close(); return setTimeout(() => window.contentPlus?.khatmDua(), 300); }
    if (a === 'quick') { const n = +b.dataset.n; box().querySelector('#pkN').value = toFa(n); box().querySelector('[name=pkUnit][value=page]').checked = true; return; }
    if (a === 'read' && m) return readClaim(m);
    if (a === 'done' && m) return act(b, () => done(m.id));
    if (a === 'part' && m) {
      const n = num(box().querySelector('#pkPart' + m.id)?.value), msg = box().querySelector('#pkMsg' + m.id);
      if (n < 1) { msg.textContent = 'تعداد را بنویسید.'; return; }
      const upto = m.unit === 'page' ? pageStart(pageOf(m.f) + n) : m.f + n;
      return act(b, () => done(m.id, upto >= m.t ? null : upto));
    }
    if (a === 'release' && m) {
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'مطمئنید؟ دوباره بزنید تا پس داده شود'; return; }
      return act(b, async () => { setView(await rpc('pk_release', { p_id: CIRCLE, p_claim: m.id })); render(); toast('بخش پس داده شد و برای دیگران باز است.'); });
    }
    if (a === 'claim') {
      const n = num(box().querySelector('#pkN').value), unit = box().querySelector('[name=pkUnit]:checked')?.value || 'page', msg = box().querySelector('#pkMsg');
      if (n < 1 || n > (unit === 'page' ? 604 : TOTAL)) { msg.textContent = unit === 'page' ? 'تعداد صفحه را بین ۱ و ۶۰۴ بنویسید.' : 'تعداد آیه را بنویسید.'; return; }
      const name = (box().querySelector('#pkName')?.value || '').trim().slice(0, 40);
      if (name) ls.set('khatmName', name);
      ls.set('pkPref', { unit, n });
      let ep = null; if (pushOn()) ep = (await currentSub())?.endpoint || null;
      return act(b, async () => {
        const r = await rpc('pk_claim', { p_id: CIRCLE, p_unit: unit, p_count: n, p_name: name, p_endpoint: ep });
        lastFinished = null; afterDone = false; setView(r?.view); render();
        const c = (view.mine || []).find(x => x.id === r?.claimed);
        toast(c ? `بخش شما: ${rangeText(c.f, c.t).split('؛ ')[0]}` : 'برداشته شد.');
        const el = [...box().querySelectorAll('.pk-card.mine')].pop(); el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
    if (a === 'pushOn') return act(b, async () => {
      try { await pushEnable(); } catch (e) { if (e.message === 'denied' || e.message === 'dismissed') throw Object.assign(Error('x'), { code: 'msg', message: 'اجازه اعلان داده نشد. از تنظیمات مرورگر یا گوشی، اعلان این سایت را مجاز کنید.' }); throw e; }
      render(); toast('اعلان ختم دسته‌جمعی روشن شد.');
    });
    if (a === 'pushOff') return act(b, async () => { const s = await currentSub(); if (s) await rpc('pk_push_off', { p_endpoint: s.endpoint }, false); ls.set('pkPush', false); render(); });
    if (a === 'share') {
      const url = `${location.origin}${location.pathname}?pk=${CIRCLE}`, text = 'ختم قرآن پیوسته و دسته‌جمعی نوران: هر روز چند صفحه یا چند آیه بردارید و بخوانید تا با هم قرآن ختم شود.';
      if (navigator.share) return navigator.share({ title: 'ختم قرآن پیوسته و دسته‌جمعی', text, url }).catch(() => {});
      try { await navigator.clipboard.writeText(`${text}\n${url}`); toast('پیوند کپی شد.'); } catch { toast(url); }
    }
  }

  // ---------- منو ----------
  function sub() {
    const v = view; if (!v) return 'هر کس امروز چند صفحه یا آیه برمی‌دارد؛ با هم ختم می‌شود';
    const mine = v.mine || [];
    if (mine.length && ix) { const m = mine[0]; return `بخش شما: ${rangeText(m.f, m.t).split('؛ ')[0]}؛ ${deadlineText(m.deadline)}`; }
    if (mine.length) return `${toFa(mine.length)} بخش دست شماست`;
    const cur = (v.cycles || []).find(c => c.c === v.cycle) || { done: 0 };
    return `ختم ${toFa(v.cycle)}: ${toFa(Math.floor(pct(cur.done || 0)))}٪ خوانده شده${v.completed ? `، ${toFa(v.completed)} ختم کامل` : ''}`;
  }
  window.pkMenu = () => {
    // وضعیت هر ده دقیقه یک بار در پس‌زمینه تازه می‌شود
    if (Date.now() - loadedAt > 6e5 && !loading) { loadedAt = Date.now(); refresh().catch(() => {}); }
    return `<button type="button" class="sm-item" data-pk-open><span class="sm-ic">🤝</span><span>ختم قرآن پیوسته و دسته‌جمعی<small>${esc(sub())}</small></span><span class="sm-go">‹</span></button>`;
  };
  document.addEventListener('click', e => {
    if (!e.target.closest('.sm [data-pk-open]')) return;
    getIx().catch(() => {});
    let fired = false, t = 0;
    const go = () => { if (fired) return; fired = true; clearTimeout(t); removeEventListener('popstate', go); setTimeout(open); };
    const wait = !!history.state?.sm;
    if (wait) addEventListener('popstate', go);
    window.siteMenu?.close();
    t = setTimeout(go, wait ? 400 : 0);
  });
  // اعلان‌ها پس از دوباره ساخته شدن اشتراک: اگر روشن بوده، دوباره ثبت می‌شود.
  async function pushState() {
    if (!pushOn()) return;
    const s = await currentSub(); if (!s) return;
    const st = await rpc('pk_push_status', { p_endpoint: s.endpoint }, false).catch(() => undefined);
    if (st === null) { const k = s.toJSON().keys; rpc('pk_push_on', { p_id: CIRCLE, p_endpoint: s.endpoint, p_p256dh: k.p256dh, p_auth: k.auth, p_open: true }).catch(() => {}); }
  }

  window.pkhatm = { open, refresh };
  if (view?.mine?.length) setTimeout(() => getIx().then(() => window.siteMenu?.refresh()).catch(() => {}), 1500);

  // پیوند ?pk=main
  const q = new URLSearchParams(location.search).get('pk');
  if (q) {
    try { const u = new URL(location.href); u.searchParams.delete('pk'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
    open();
  }
})();
