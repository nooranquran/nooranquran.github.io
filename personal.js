// برنامه‌های شخصی، فقط روی همین گوشی (localStorage):
// ۱) «چله و ختم شخصی» در منوی ☰ › اعمال و ختم‌ها: هر کس هر متنی (زیارت، دعا یا سوره) را به هر مدت و از هر روزی که بخواهد
//    برای خودش شروع می‌کند، بی‌ثبت‌نام و بی‌گروه. کلید ppList: [{ id, key, title, days, times, start, niyyat, marks: { روز: تعداد } }]
//    key: کلید متن در پوشه chelleh یا books/mafatih/…، یا q:<شماره سوره> برای سوره‌های قرآن، یا '' برای کار دلخواه (مثل ذکر صلوات).
// ۲) «ختم قرآن شخصی» در منوی ☰ › قرآن، پس از «قرآن آزاد»: خود شخص تعیین می‌کند روزی چند صفحه یا چند آیه بخواند و جلو می‌رود تا ختم.
//    کلید pqKhatm: { unit: 'page' | 'ayah'، per، pos: اندیس سراسری آیه بعدی (۰ تا ۶۲۳۵)، n: ختم‌های کامل، s: شروع ختم جاری، log: { روز: [از، تا] }، hist: [[شروع، پایان]] }
// پیوندها: ?pp=1 (چله شخصی) و ?pq=1 (ختم شخصی).
(function () {
  const fa = '۰۱۲۳۴۵۶۷۸۹', toFa = x => String(x).replace(/\d/g, d => fa[d]);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const DAY = 864e5, TOTAL = 6236;
  const isoAdd = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * DAY).toISOString().slice(0, 10);
  const isoDiff = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / DAY);
  // روز قرائت سایت (app.js: از اذان صبح عوض می‌شود)، مثل چله‌ها و حزب‌خوانی
  const today = () => typeof isoIran === 'function' ? isoIran() : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
  const dateFa = iso => (iso && window.J ? J.label(iso) : iso || '');
  const num = v => { const n = parseInt(String(v || '').replace(/[۰-۹]/g, d => fa.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10); return Number.isFinite(n) ? n : 0; };
  const DAYRE = /^\d{4}-\d{2}-\d{2}$/;

  const css = `
.ps-shade{position:fixed;inset:0;z-index:48;background:#000a;display:flex;align-items:flex-end;justify-content:center}
.ps-box{width:100%;max-width:560px;max-height:94vh;overflow-y:auto;overscroll-behavior:contain;background:#fffaf0;color:var(--ink);text-shadow:none;border:2px solid var(--gold);border-bottom:0;border-radius:var(--r-panel) var(--r-panel) 0 0;padding:10px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #0007;animation:psup .25s ease}
@keyframes psup{from{transform:translateY(40px);opacity:.4}}
.ps-x{float:left;width:44px;height:44px;padding:0;background:transparent;border:0;color:var(--muted);font-size:24px}
.ps-x:hover{background:var(--hover)}
.ps-box h2{clear:both;margin:4px 0 0;text-align:center;font:normal 32px/1.6 SiteFont,Tahoma,serif;color:var(--deep)}
.ps-sub{margin:0 0 10px;text-align:center;color:var(--muted);font-size:15px}
.ps-card{background:#fff;border:1px solid var(--gold);border-radius:var(--r-card);padding:12px 14px;margin:10px 0}
.ps-card h3{margin:0 0 4px;font-size:17px;color:var(--deep)}
.ps-card.ok{border:2px solid var(--emerald)}
.ps-niy{margin:0 0 4px;color:#8a6a1f;font-size:14.5px}
.ps-mute{margin:4px 0;color:var(--muted);font-size:14.5px}
.ps-big{margin:6px 0;font-weight:700;font-size:17px;color:var(--deep)}
.ps-bar{height:10px;border-radius:999px;background:#ece3cf;overflow:hidden;margin:8px 0 4px}
.ps-bar i{display:block;height:100%;background:var(--emerald)}
.ps-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.ps-btns button{flex:1 1 auto;min-height:46px;height:auto;white-space:normal}
.ps-light{background:transparent!important;color:var(--deep)!important;border:1px solid var(--gold)!important}
.ps-light:hover{background:var(--hover)!important}
.ps-link{height:auto;padding:0;border:0;background:none;color:var(--deep);text-decoration:underline;font-weight:600;font-size:14.5px}
.ps-form label{display:block;margin:10px 0 4px;font-weight:600;font-size:15px}
.ps-form select,.ps-form input{width:100%;box-sizing:border-box;min-height:44px;font-size:16px}
.ps-row{display:flex;gap:8px;align-items:center}.ps-row>*{flex:1;min-width:0}
.ps-seg{display:flex;gap:6px;flex-wrap:wrap}.ps-seg label{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:6px;margin:0;padding:8px 10px;border:1px solid var(--gold);border-radius:12px;background:#fff;font-weight:600;cursor:pointer}
.ps-form .ps-seg input,.ps-seg input{width:auto;min-height:0;margin:0;flex:none}
.ps-row .ps-seg{flex:none;flex-wrap:nowrap}.ps-row .ps-seg label{flex:none}
.ps-seg label:has(input:checked){background:var(--mint);border-color:var(--emerald)}
.ps-days{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:8px 0 2px}
.ps-d{height:26px;min-height:0;padding:0;border-radius:6px;border:1px solid var(--gold);background:#fff;color:var(--muted);font-size:11px;font-weight:600;line-height:1}
.ps-d.dn{background:var(--emerald);border-color:var(--emerald);color:#fff}
.ps-d.pt{background:#d9b65c;border-color:#d9b65c;color:#fff}
.ps-d.ms{background:#f6e3df;border-color:#e2b6ad;color:#9b4b3c}
.ps-d.td{outline:2px solid var(--deep);outline-offset:1px}
.ps-d:disabled{opacity:.55;cursor:default}
.ps-key{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;color:var(--muted)}
.ps-key i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-left:4px;vertical-align:-1px;border:1px solid var(--gold);background:#fff}
.ps-key .dn{background:var(--emerald);border-color:var(--emerald)}.ps-key .ms{background:#f6e3df;border-color:#e2b6ad}
.ps-msg{font-weight:700;margin:6px 0 0;color:var(--deep)}.ps-msg:empty{display:none}.ps-msg.bad{color:#a23b2a}
.ps-more summary{cursor:pointer;color:var(--deep);font-weight:600;margin-top:8px}
.ps-cele{text-align:center;font-size:19px}
body.ps-lock{overflow:hidden}`;
  { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  let toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.style.cssText = 'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;max-width:90vw;background:#1f1a14;color:#fff;padding:10px 18px;border:1px solid var(--gold);text-shadow:none;font-size:15px;text-align:center'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.style.display = 'block';
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.style.display = 'none'; }, 3500);
  }

  // ---------- برگه پایین‌صفحه (هر دو بخش) ----------
  let shade = null, mode = null;
  function sheet(m) {
    mode = m;
    if (!shade) {
      shade = document.createElement('div'); shade.className = 'ps-shade'; shade.hidden = true;
      shade.innerHTML = '<div class="ps-box" role="dialog" aria-modal="true"></div>';
      shade.addEventListener('click', e => { if (e.target === shade) close(); else onClick(e); });
      document.body.appendChild(shade);
    }
    shade.hidden = false; document.body.classList.add('ps-lock');
    try { if (!history.state?.ps) history.pushState({ ps: 1 }, ''); } catch {}
    render();
  }
  function close(fromHistory) {
    if (!shade || shade.hidden) return;
    shade.hidden = true; document.body.classList.remove('ps-lock');
    if (!fromHistory) try { if (history.state?.ps) history.back(); } catch {}
    window.siteMenu?.refresh();
  }
  addEventListener('popstate', () => { if (!history.state?.ps) close(true); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && shade && !shade.hidden && !document.querySelector('.qr.show,.cr.show')) close(); });
  const box = () => shade.querySelector('.ps-box');
  async function render() {
    const html = mode === 'pq' ? await pqHtml() : await ppHtml();
    box().innerHTML = '<button type="button" class="ps-x" data-ps="close" aria-label="بستن">✕</button>' + html;
    if (mode === 'pq') pqAfter();
  }
  // منو با history.back بسته می‌شود؛ برگه پس از آن باز می‌شود تا برگشت تاریخچه منو آن را نبندد.
  function afterMenu(fn) {
    let done = false, t = 0;
    const go = () => { if (done) return; done = true; clearTimeout(t); removeEventListener('popstate', go); setTimeout(fn); };
    const wait = !!history.state?.sm;
    if (wait) addEventListener('popstate', go);
    window.siteMenu?.close();
    t = setTimeout(go, wait ? 400 : 0);
  }

  // ---------- قرآن ----------
  let ix = null;
  const getIx = async () => ix || (ix = await window.quranReader.index());
  const lastLE = (arr, g) => { let lo = 0, hi = arr.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= g) lo = m; else hi = m - 1; } return lo; };
  const pageOf = g => lastLE(ix.page, g) + 1;
  const pageStart = p => (p > 604 ? TOTAL : p < 1 ? 0 : ix.page[p - 1]);
  const NAMES = () => window.quranFree?.names || [];
  const where = g => { const s = lastLE(ix.surah, g); return { s: s + 1, n: g - ix.surah[s] + 1, juz: lastLE(ix.juz, g) + 1 }; };
  const sname = s => NAMES()[s - 1] || toFa(s);
  // «صفحه ۱۲ تا ۱۴ · بقره ۷۵ تا ۹۲»
  function rangeText(f, t) {
    if (!ix) return '';
    const a = where(f), b = where(t - 1), pa = pageOf(f), pb = pageOf(t - 1);
    const pg = pa === pb ? `صفحه ${toFa(pa)}` : `صفحه ${toFa(pa)} تا ${toFa(pb)}`;
    const ay = a.s === b.s ? `سوره ${sname(a.s)}، آیه ${toFa(a.n)}${b.n > a.n ? ` تا ${toFa(b.n)}` : ''}` : `از ${sname(a.s)} ${toFa(a.n)} تا ${sname(b.s)} ${toFa(b.n)}`;
    return `${pg}؛ ${ay}`;
  }
  window.quranRange = { rangeText, getIx, pageOf: g => pageOf(g), pageStart: p => pageStart(p) };

  // ========== ۱) ختم قرآن شخصی ==========
  const pq = {
    get() {
      const p = read('pqKhatm', null), int = Number.isInteger;
      if (!p || !['page', 'ayah'].includes(p.unit) || !int(p.per) || p.per < 1 || !int(p.pos) || p.pos < 0 || p.pos >= TOTAL || !int(p.n) || !DAYRE.test(p.s) || !p.log || typeof p.log !== 'object') return null;
      if (!Object.entries(p.log).every(([d, L]) => DAYRE.test(d) && Array.isArray(L) && L.length === 2 && L.every(int))) return null;
      if (!Array.isArray(p.hist)) p.hist = [];
      return p;
    },
    save(p) { write('pqKhatm', p); window.siteMenu?.refresh(); return p; },
    // بخش بعدی از آیه pos به اندازه سهم روزانه
    next(p, pos = p.pos) {
      const to = p.unit === 'page' ? pageStart(pageOf(pos) + p.per) : pos + p.per;
      return { from: pos, to: Math.min(TOTAL, to) };
    },
    // خواندم تا پیش از آیه to (امروز)
    mark(p, to) {
      const t = today(), L = p.log[t];
      to = Math.max(p.pos + 1, Math.min(TOTAL, to));
      p.log[t] = [L ? L[0] : p.pos, to];
      let fin = false;
      if (to >= TOTAL) { p.hist.push([p.s, t]); p.n++; p.pos = 0; p.s = isoAdd(t, 1); fin = true; p.fin = t; }
      else p.pos = to;
      // روزهای خیلی قدیمی فقط شمرده می‌شوند
      const ks = Object.keys(p.log).sort(); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(k => delete p.log[k]);
      pq.save(p);
      return fin;
    }
  };
  let pqFin = false, pqEdit = false;
  function pqSub() {
    const p = pq.get(); if (!p) return 'خودتان تعیین می‌کنید روزی چند صفحه یا چند آیه';
    const t = today();
    if (p.log[t]) return `✓ امروز خواندید${p.n ? `، ${toFa(p.n)} ختم کامل` : ''}`;
    if (!ix) return `روزی ${toFa(p.per)} ${p.unit === 'page' ? 'صفحه' : 'آیه'}؛ سهم امروز مانده`;
    const r = pq.next(p);
    return `امروز ${p.unit === 'page' ? (pageOf(r.from) === pageOf(r.to - 1) ? `صفحه ${toFa(pageOf(r.from))}` : `صفحه ${toFa(pageOf(r.from))} تا ${toFa(pageOf(r.to - 1))}`) : `${toFa(r.to - r.from)} آیه از ${sname(where(r.from).s)} ${toFa(where(r.from).n)}`}`;
  }
  function pqSetup(p) {
    const unit = p?.unit || 'page', per = p?.per || (unit === 'page' ? 5 : 20);
    return `<div class="ps-card ps-form"><h3>${p ? 'تغییر سهم روزانه' : 'روزی چقدر می‌خوانید؟'}</h3>
<p class="ps-mute">${p ? 'از همان جایی که رسیده‌اید ادامه می‌دهید؛ فقط اندازه سهم هر روز عوض می‌شود.' : 'هر روز همین اندازه را می‌خوانید و جلو می‌روید تا قرآن ختم شود. اگر روزی بیشتر خواستید، بخش بعد هم آماده است. فقط روی همین گوشی ذخیره می‌شود.'}</p>
<div class="ps-row"><input id="pqPer" inputmode="numeric" value="${toFa(per)}" aria-label="اندازه سهم روزانه"><div class="ps-seg"><label><input type="radio" name="pqUnit" value="page"${unit === 'page' ? ' checked' : ''}>صفحه</label><label><input type="radio" name="pqUnit" value="ayah"${unit === 'ayah' ? ' checked' : ''}>آیه</label></div></div>
<p class="ps-mute" id="pqEst"></p>
${p ? '' : `<label for="pqFrom">از کجا شروع می‌کنید؟</label><select id="pqFrom"><option value="1">از ابتدای قرآن (سوره حمد)</option><option value="page">از صفحه دلخواه</option></select>
<input id="pqFromPage" inputmode="numeric" placeholder="شماره صفحه (۱ تا ۶۰۴)" hidden style="margin-top:6px">`}
<div class="ps-btns"><button type="button" data-ps="pqSave">${p ? 'ذخیره' : 'شروع ختم'}</button>${p ? '<button type="button" class="ps-light" data-ps="pqCancel">انصراف</button>' : ''}</div><p class="ps-msg bad" id="pqMsg"></p></div>`;
  }
  async function pqHtml() {
    try { await getIx(); } catch { return '<h2>ختم قرآن شخصی</h2><p class="ps-sub">بارگذاری فهرست قرآن انجام نشد. اینترنت را بررسی کنید.</p>'; }
    const p = pq.get(), head = '<h2>ختم قرآن شخصی</h2><p class="ps-sub">خودتان تعیین می‌کنید روزی چند صفحه یا آیه بخوانید و جلو می‌روید تا ختم</p>';
    if (!p) return head + pqSetup(null);
    if (pqEdit) return head + pqSetup(p);
    const t = today(), L = p.log[t], r = pq.next(p), u = p.unit === 'page' ? 'صفحه' : 'آیه';
    const pct = Math.floor(p.pos / TOTAL * 1000) / 10, days = Object.keys(p.log).filter(d => d >= p.s).length;
    const cele = pqFin && p.fin === t ? `<div class="ps-card ok ps-cele"><p class="ps-big">🎉 ختم ${toFa(p.n)}${p.n === 1 ? '' : '‌ام'} قرآن شما کامل شد. قبول باشد.</p>${window.contentPlus?.shown('khatmdua') ? '<div class="ps-btns"><button type="button" data-ps="khatmdua">📖 دعای ختم قرآن (صحیفه سجادیه، دعای ۴۲)</button></div>' : ''}<p class="ps-mute">ختم بعدی از همین حالا آماده است.</p></div>` : '';
    return head + cele + `<div class="ps-card"><p class="ps-mute">ختم ${toFa(p.n + 1)}، روزی ${toFa(p.per)} ${u}، از ${esc(dateFa(p.s))}${p.n ? `، تاکنون ${toFa(p.n)} ختم کامل` : ''}</p>
<div class="ps-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="پیشرفت ختم"><i style="width:${pct}%"></i></div>
<p class="ps-mute">به ${esc(rangeText(p.pos, p.pos + 1).split('؛ ')[1] || '')} رسیده‌اید (صفحه ${toFa(pageOf(p.pos))} از ۶۰۴، ${toFa(String(pct).replace('.', '٫'))}٪)${days ? `، ${toFa(days)} روز خواندن` : ''}.</p>
${L ? `<p class="ps-big">✓ امروز خواندید: ${esc(rangeText(L[0], L[1]))}</p><p class="ps-mute">باز هم فرصت دارید؟ بخش بعد:</p>` : '<p class="ps-big">سهم امروز:</p>'}
<p class="ps-big" style="font-weight:600">${esc(rangeText(r.from, r.to))}</p>
<div class="ps-btns"><button type="button" data-ps="pqRead">📖 ${L ? 'خواندن بخش بعد' : 'خواندن سهم امروز'}</button><button type="button" class="ps-light" data-ps="pqDone">✓ خواندم</button></div>
<details class="ps-more"><summary>کمتر یا بیشتر خواندید؟</summary><p class="ps-mute">چند ${u} از همین‌جا خواندید؟</p>
<div class="ps-row"><input id="pqCount" inputmode="numeric" placeholder="تعداد ${u}" aria-label="تعداد خوانده‌شده"><button type="button" data-ps="pqPart">ثبت</button></div><p class="ps-msg bad" id="pqPartMsg"></p></details>
<details class="ps-more"><summary>تنظیمات</summary><div class="ps-btns"><button type="button" class="ps-light" data-ps="pqEdit">تغییر سهم روزانه</button><button type="button" class="ps-light" data-ps="pqRestart">از اول قرآن</button><button type="button" class="ps-light" data-ps="pqDel">حذف ختم</button></div></details></div>
${p.hist.length ? `<div class="ps-card"><h3>ختم‌های کامل</h3>${p.hist.slice(-5).reverse().map(([a, b], i) => `<p class="ps-mute">ختم ${toFa(p.hist.length - i)}: ${esc(dateFa(a))} تا ${esc(dateFa(b))}</p>`).join('')}</div>` : ''}`;
  }
  function pqAfter() {
    const per = box().querySelector('#pqPer'); if (!per) return;
    const est = () => {
      const n = num(per.value), u = box().querySelector('[name=pqUnit]:checked')?.value, el = box().querySelector('#pqEst');
      if (!el) return;
      el.textContent = n > 0 ? `حدود ${toFa(Math.max(1, Math.ceil((u === 'page' ? 604 : TOTAL) / n)))} روز یک ختم.` : '';
    };
    per.oninput = est; box().querySelectorAll('[name=pqUnit]').forEach(x => x.onchange = () => {
      const n = num(per.value); if (x.value === 'ayah' && n > 0 && n <= 30) per.value = toFa(n * 10); else if (x.value === 'page' && n > 60) per.value = toFa(Math.max(1, Math.round(n / 10)));
      est();
    });
    const from = box().querySelector('#pqFrom'); if (from) from.onchange = () => { box().querySelector('#pqFromPage').hidden = from.value !== 'page'; };
    est();
  }
  async function pqOpenReader(p) {
    const r = pq.next(p), qr = window.quranReader;
    qr.openRange({
      title: 'ختم قرآن شخصی', sub: rangeText(r.from, r.to), from: r.from, to: r.to,
      endText: r.to >= TOTAL ? 'پایان قرآن کریم. قبول باشد.' : 'پایان سهم امروز. قبول باشد.', endButton: 'خواندم؛ ثبت',
      onEnd: () => { const q = pq.get(); if (q && q.pos === r.from) { pqFin = pq.mark(q, r.to); toast(pqFin ? 'ختم قرآن کامل شد. قبول باشد.' : 'ثبت شد. قبول باشد.'); } if (shade && !shade.hidden && mode === 'pq') render(); }
    });
  }

  // ========== ۲) چله و ختم شخصی ==========
  // متن‌ها: پوشه chelleh (فهرست chelleh/index.json) به‌علاوه چند متن مفاتیح و همه سوره‌های قرآن.
  let texts = null;
  async function loadTexts() {
    if (texts) return texts;
    const list = await fetch('chelleh/index.json').then(r => r.json()).catch(() => []);
    texts = (Array.isArray(list) ? list : []).filter(x => !x.quran && x.key && x.title).map(x => ({ key: x.key, title: x.title }));
    for (const [key, title] of [['books/mafatih/336', 'دعای ندبه'], ['books/mafatih/049', 'دعای جوشن کبیر']]) if (!texts.some(x => x.title === title)) texts.push({ key, title });
    return texts;
  }
  const pp = {
    all() {
      const a = read('ppList', []), int = Number.isInteger;
      return (Array.isArray(a) ? a : []).filter(x => x && typeof x.id === 'string' && typeof x.title === 'string' && int(x.days) && x.days >= 1 && x.days <= 400
        && int(x.times) && x.times >= 1 && x.times <= 100 && DAYRE.test(x.start) && typeof x.key === 'string' && x.marks && typeof x.marks === 'object');
    },
    save(list) { write('ppList', list); window.siteMenu?.refresh(); },
    put(x) { const l = pp.all(), i = l.findIndex(y => y.id === x.id); if (i >= 0) l[i] = x; else l.unshift(x); pp.save(l); },
    del(id) { pp.save(pp.all().filter(x => x.id !== id)); },
    dayNo: (x, t = today()) => isoDiff(t, x.start) + 1,
    state(x, t = today()) { const n = pp.dayNo(x, t); return n < 1 ? 'soon' : n > x.days ? 'end' : 'run'; },
    count: (x, d) => Math.max(0, Math.min(x.times, x.marks[d] | 0)),
    doneDays: x => Object.keys(x.marks).filter(d => pp.count(x, d) >= x.times && isoDiff(d, x.start) >= 0 && isoDiff(d, x.start) < x.days).length
  };
  const ppLeft = () => pp.all().filter(x => pp.state(x) === 'run' && pp.count(x, today()) < x.times).length;
  function ppSub() {
    const l = pp.all(), left = ppLeft();
    if (!l.length) return 'هر متنی، هر مدتی، از هر روزی؛ برنامه خودتان';
    return left ? `امروز ${toFa(left)} برنامه مانده` : `${toFa(l.length)} برنامه${l.some(x => pp.state(x) === 'run') ? '؛ امروز همه خوانده شد' : ''}`;
  }
  let ppNew = false;
  const surahOpts = () => NAMES().map((n, i) => `<option value="q:${i + 1}">سوره ${esc(n)}</option>`).join('');
  async function ppForm() {
    const T = await loadTexts();
    return `<div class="ps-card ps-form"><h3>برنامه تازه</h3>
<label for="ppText">چه چیزی می‌خوانید؟</label>
<select id="ppText"><optgroup label="زیارت و دعا">${T.map(x => `<option value="${esc(x.key)}">${esc(x.title)}</option>`).join('')}</optgroup>
<optgroup label="سوره‌های قرآن">${surahOpts()}</optgroup><optgroup label="دیگر"><option value="">کار دلخواه (ذکر، صلوات، نماز و …)</option></optgroup></select>
<input id="ppTitle" maxlength="60" placeholder="نام برنامه، مثلاً ختم صلوات یا نماز امام زمان (عج)" hidden style="margin-top:6px">
<label>چند روز؟</label><div class="ps-seg" id="ppDays">${[7, 14, 21, 40].map(n => `<label><input type="radio" name="ppDays" value="${n}"${n === 40 ? ' checked' : ''}>${toFa(n)} روز</label>`).join('')}<label><input type="radio" name="ppDays" value="x">دلخواه</label></div>
<input id="ppDaysX" inputmode="numeric" placeholder="تعداد روز (۱ تا ۴۰۰)" hidden style="margin-top:6px">
<label for="ppTimes">روزی چند بار؟</label><input id="ppTimes" inputmode="numeric" value="۱">
<label>از کی؟</label><div class="ps-seg">${[['0', 'از امروز'], ['1', 'از فردا']].map(([v, l], i) => `<label><input type="radio" name="ppStart" value="${v}"${i ? '' : ' checked'}>${l}</label>`).join('')}</div>
<label for="ppNiy">نیت (اختیاری)</label><input id="ppNiy" maxlength="120" placeholder="مثلاً برای شفای بیماران">
<div class="ps-btns"><button type="button" data-ps="ppCreate">شروع برنامه</button>${pp.all().length ? '<button type="button" class="ps-light" data-ps="ppCancel">انصراف</button>' : ''}</div><p class="ps-msg bad" id="ppMsg"></p>
<p class="ps-mute">فقط روی همین گوشی ذخیره می‌شود؛ ثبت‌نام و گروه ندارد.${window.features?.shown('backup') ? ' برای بردن به گوشی دیگر، «پشتیبان» در تنظیمات.' : ''}</p></div>`;
  }
  function ppCard(x) {
    const t = today(), st = pp.state(x), n = pp.dayNo(x, t), c = pp.count(x, t), done = pp.doneDays(x);
    const cells = Array.from({ length: x.days }, (_, i) => {
      const d = isoAdd(x.start, i), k = pp.count(x, d), cls = k >= x.times ? 'dn' : k ? 'pt' : d < t ? 'ms' : '';
      return `<button type="button" class="ps-d ${cls}${d === t ? ' td' : ''}" data-ps="ppDay" data-id="${esc(x.id)}" data-d="${d}"${d > t ? ' disabled' : ''} aria-label="روز ${toFa(i + 1)}${k >= x.times ? '، خوانده شد' : ''}">${toFa(i + 1)}</button>`;
    }).join('');
    const missed = Array.from({ length: Math.min(x.days, Math.max(0, n - 1)) }, (_, i) => isoAdd(x.start, i)).filter(d => pp.count(x, d) < x.times).length;
    const line = st === 'soon' ? `از ${esc(dateFa(x.start))} شروع می‌شود` : st === 'end' ? (done >= x.days ? '🎉 کامل شد. قبول باشد.' : `پایان یافت: ${toFa(done)} از ${toFa(x.days)} روز`) : `روز ${toFa(n)} از ${toFa(x.days)}${x.times > 1 ? `، امروز ${toFa(c)} از ${toFa(x.times)} بار` : c ? '، ✓ امروز خوانده شد' : ''}`;
    const readBtn = x.key ? `<button type="button" data-ps="ppRead" data-id="${esc(x.id)}">📖 خواندن</button>` : '';
    const markBtn = st === 'run' && c < x.times ? `<button type="button" class="${x.key ? 'ps-light' : ''}" data-ps="ppMark" data-id="${esc(x.id)}">✓ ${x.times > 1 ? `یک بار خواندم (${toFa(c + 1)} از ${toFa(x.times)})` : 'امروز خواندم'}</button>` : '';
    return `<div class="ps-card${st === 'end' && done >= x.days ? ' ok' : ''}" id="pp-${esc(x.id)}"><h3>${esc(x.title)}</h3>${x.niyyat ? `<p class="ps-niy">${esc(x.niyyat)}</p>` : ''}
<p class="ps-mute">${toFa(x.days)} روز${x.times > 1 ? `، روزی ${toFa(x.times)} بار` : ''}، از ${esc(dateFa(x.start))}</p><p class="ps-big">${line}</p>
<div class="ps-days">${cells}</div>${st !== 'soon' ? `<div class="ps-key"><span><i class="dn"></i>خوانده</span><span><i class="ms"></i>جا مانده</span><span>روز جامانده را هم با زدن خانه‌اش می‌شود ثبت کرد</span></div>` : ''}
${missed && st === 'run' ? `<p class="ps-mute">${toFa(missed)} روز جا مانده است.</p>` : ''}
<div class="ps-btns">${readBtn}${markBtn}</div>
<details class="ps-more"><summary>بیشتر</summary><div class="ps-btns">${st === 'end' ? `<button type="button" class="ps-light" data-ps="ppAgain" data-id="${esc(x.id)}">دوباره از امروز</button>` : ''}<button type="button" class="ps-light" data-ps="ppDel" data-id="${esc(x.id)}">حذف برنامه</button></div></details></div>`;
  }
  async function ppHtml() {
    const l = pp.all(), head = '<h2>چله و ختم شخصی</h2><p class="ps-sub">هر متنی را، به هر مدتی و از هر روزی که بخواهید، برای خودتان شروع کنید</p>';
    try { if (window.quranReader) await getIx(); } catch {}
    if (!l.length || ppNew) return head + await ppForm() + (ppNew ? l.map(ppCard).join('') : '');
    const order = { run: 0, soon: 1, end: 2 };
    return head + `<div class="ps-btns" style="margin-bottom:4px"><button type="button" data-ps="ppNew">＋ برنامه تازه</button></div>` + [...l].sort((a, b) => order[pp.state(a)] - order[pp.state(b)]).map(ppCard).join('');
  }
  function ppMark(x, d, step = 1) {
    const k = pp.count(x, d);
    const v = step > 0 ? (k >= x.times ? 0 : k + 1) : 0;
    if (v) x.marks[d] = v; else delete x.marks[d];
    pp.put(x);
    return v;
  }
  async function ppRead(x) {
    const q = /^q:(\d{1,3})$/.exec(x.key);
    if (q) {
      const s = +q[1]; let I; try { I = await getIx(); } catch { return toast('بارگذاری متن قرآن انجام نشد. اینترنت را بررسی کنید.'); }
      const run = pp.state(x) === 'run' && pp.count(x, today()) < x.times;
      window.quranReader.openRange({
        title: `سوره ${sname(s)}`, sub: x.title, from: I.surah[s - 1], to: s < 114 ? I.surah[s] : I.total,
        endText: `پایان سوره ${sname(s)}. قبول باشد.`, endButton: x.times > 1 ? 'خواندم؛ یک بار ثبت شود' : 'خواندم؛ ثبت برای امروز',
        onEnd: run ? () => { const y = pp.all().find(z => z.id === x.id); if (y && pp.count(y, today()) < y.times) { ppMark(y, today()); toast('ثبت شد. قبول باشد.'); } if (shade && !shade.hidden) render(); } : null
      });
      return;
    }
    if (window.chlRead) return window.chlRead(x.key);
    toast('خواننده متن هنوز آماده نیست؛ چند لحظه دیگر دوباره بزنید.');
  }

  // ---------- دکمه‌ها ----------
  async function onClick(e) {
    const b = e.target.closest('[data-ps]'); if (!b) return;
    const a = b.dataset.ps, id = b.dataset.id, x = id && pp.all().find(y => y.id === id);
    if (a === 'close') return close();
    // ---- ختم شخصی ----
    if (a === 'pqSave') {
      const per = num(box().querySelector('#pqPer').value), unit = box().querySelector('[name=pqUnit]:checked')?.value || 'page', msg = box().querySelector('#pqMsg');
      if (per < 1 || per > (unit === 'page' ? 604 : TOTAL)) { msg.textContent = unit === 'page' ? 'تعداد صفحه را بین ۱ و ۶۰۴ بنویسید.' : 'تعداد آیه را بنویسید (دست‌کم ۱).'; return; }
      const old = pq.get();
      if (old && pqEdit) { old.unit = unit; old.per = per; pq.save(old); pqEdit = false; return render(); }
      let pos = 0;
      if (box().querySelector('#pqFrom')?.value === 'page') {
        const pg = num(box().querySelector('#pqFromPage').value);
        if (pg < 1 || pg > 604) { msg.textContent = 'شماره صفحه را بین ۱ و ۶۰۴ بنویسید.'; return; }
        pos = pageStart(pg);
      }
      pq.save({ unit, per, pos, n: 0, s: today(), log: {}, hist: [], t: Date.now() });
      return render();
    }
    if (a === 'pqCancel') { pqEdit = false; return render(); }
    if (a === 'pqEdit') { pqEdit = true; return render(); }
    if (a === 'pqRead') { const p = pq.get(); if (p) pqOpenReader(p); return; }
    if (a === 'pqDone') { const p = pq.get(); if (!p) return; pqFin = pq.mark(p, pq.next(p).to); toast(pqFin ? 'ختم قرآن کامل شد. قبول باشد.' : 'ثبت شد. قبول باشد.'); return render(); }
    if (a === 'pqPart') {
      const p = pq.get(), n = num(box().querySelector('#pqCount').value), msg = box().querySelector('#pqPartMsg'); if (!p) return;
      if (n < 1) { msg.textContent = 'تعداد را بنویسید.'; return; }
      const to = p.unit === 'page' ? pageStart(pageOf(p.pos) + n) : p.pos + n;
      pqFin = pq.mark(p, to); toast('ثبت شد. قبول باشد.'); return render();
    }
    if (a === 'pqRestart') { const p = pq.get(); if (p && confirmSoft(b, 'از اول قرآن شروع شود؟ دوباره بزنید.')) { p.pos = 0; p.s = today(); pq.save(p); render(); } return; }
    if (a === 'pqDel') { if (confirmSoft(b, 'ختم شخصی حذف شود؟ دوباره بزنید.')) { write('pqKhatm', null); window.siteMenu?.refresh(); render(); } return; }
    if (a === 'khatmdua') { close(); setTimeout(() => window.contentPlus?.khatmDua(), 300); return; }
    // ---- چله شخصی ----
    if (a === 'ppNew') { ppNew = true; await render(); box().scrollTop = 0; return; }
    if (a === 'ppCancel') { ppNew = false; return render(); }
    if (a === 'ppCreate') return ppCreate();
    if (a === 'ppRead' && x) return ppRead(x);
    if (a === 'ppMark' && x) { ppMark(x, today()); toast(pp.count(x, today()) >= x.times ? 'ثبت شد. قبول باشد.' : `${toFa(pp.count(x, today()))} از ${toFa(x.times)} بار`); return render(); }
    if (a === 'ppDay' && x) { const d = b.dataset.d; if (!DAYRE.test(d) || d > today()) return; ppMark(x, d); return render(); }
    if (a === 'ppAgain' && x) { x.start = today(); x.marks = {}; pp.put(x); return render(); }
    if (a === 'ppDel' && x) { if (confirmSoft(b, 'حذف شود؟ دوباره بزنید.')) { pp.del(x.id); render(); } return; }
  }
  // دکمه‌های پاک‌کننده با دو بار زدن (بی‌پنجره confirm مرورگر)
  function confirmSoft(b, text) {
    if (b.dataset.sure) return true;
    b.dataset.sure = '1'; const old = b.textContent; b.textContent = text;
    setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = old; } }, 4000);
    return false;
  }
  async function ppCreate() {
    const q = s => box().querySelector(s), msg = q('#ppMsg');
    const key = q('#ppText').value, T = await loadTexts();
    let title = key === '' ? q('#ppTitle').value.trim().replace(/\s+/g, ' ') : (T.find(t => t.key === key)?.title || (/^q:(\d+)$/.test(key) ? `سوره ${sname(+key.slice(2))}` : ''));
    if (!title || title.length < 2) { msg.textContent = 'نام برنامه را بنویسید.'; q('#ppTitle').hidden = false; q('#ppTitle').focus(); return; }
    const dv = q('[name=ppDays]:checked')?.value, days = dv === 'x' ? num(q('#ppDaysX').value) : +dv;
    if (!(days >= 1 && days <= 400)) { msg.textContent = 'تعداد روز را بین ۱ و ۴۰۰ بنویسید.'; return; }
    const times = num(q('#ppTimes').value) || 1;
    if (times < 1 || times > 100) { msg.textContent = 'تعداد بار در روز را بین ۱ و ۱۰۰ بنویسید.'; return; }
    const start = isoAdd(today(), +(q('[name=ppStart]:checked')?.value || 0));
    if (key && !/^q:\d+$/.test(key)) title = (days === 40 ? 'چله ' : 'ختم ') + title;
    else if (/^q:/.test(key)) title = `ختم ${title}`;
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    pp.put({ id, key, title: title.slice(0, 80), days, times, start, niyyat: q('#ppNiy').value.trim().slice(0, 120), marks: {}, t: Date.now() });
    ppNew = false; toast('برنامه ساخته شد. قبول باشد.');
    await render();
  }
  // فرم: نمایش فیلدهای وابسته
  document.addEventListener('change', e => {
    if (!shade || !shade.contains(e.target)) return;
    if (e.target.id === 'ppText') shade.querySelector('#ppTitle').hidden = e.target.value !== '';
    if (e.target.name === 'ppDays') shade.querySelector('#ppDaysX').hidden = e.target.value !== 'x';
  });

  // ---------- منو ----------
  // «ختم قرآن شخصی» پس از «قرآن آزاد» (quran-free.js این را صدا می‌زند) و «چله و ختم شخصی» در «اعمال و ختم‌ها» (ibadat.js).
  window.pqMenu = () => `<button type="button" class="sm-item" data-ps-open="pq"><span class="sm-ic">🎯</span><span>ختم قرآن شخصی<small>${esc(pqSub())}</small></span><span class="sm-go">‹</span></button>`;
  window.ppMenu = () => `<button type="button" class="sm-item" data-ps-open="pp"><span class="sm-ic">🗓️</span><span>چله و ختم شخصی<small>${esc(ppSub())}</small></span><span class="sm-go">‹</span></button>`;
  document.addEventListener('click', e => {
    const o = e.target.closest('.sm [data-ps-open]'); if (!o) return;
    if (o.dataset.psOpen === 'pq') window.quranReader?.index().then(r => { ix = r; }).catch(() => {});
    afterMenu(() => sheet(o.dataset.psOpen));
  });
  if (pq.get()) setTimeout(() => window.quranReader?.index().then(r => { ix = r; window.siteMenu?.refresh(); }).catch(() => {}), 1500);

  window.personalPlans = { open: m => sheet(m === 'pq' ? 'pq' : 'pp'), pq, pp };

  // پیوند ?pp=1 و ?pq=1
  const sp = new URLSearchParams(location.search), qk = sp.has('pq') ? 'pq' : sp.has('pp') ? 'pp' : null;
  if (qk) {
    try { const u = new URL(location.href); u.searchParams.delete(qk); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
    sheet(qk);
  }
})();
