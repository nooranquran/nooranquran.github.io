// برگه‌های learn.js؛ فقط با اولین باز کردن یکی از آن‌ها بار می‌شود (window.learnSheets[نام](…)).
// learn: برنامه‌های کوتاه یادگیری (پیشرفت در localStorage، کلید learnPlans)؛ پیام‌های هر روز از تفسیر نور (quran/tafsir-noor، بخش «پیام ها»).
// asma: اسماء الحسنی (روایت مشهور ترمذی که در بیشتر کتاب‌ها و برنامه‌ها آمده است)؛ live: پیوند پخش زنده حرم‌ها؛
// reflect: پرسش تأمل آیه روز، فرستادن برداشت و دیدن برداشت‌های تأییدشده (backend/supabase/reflections.sql).
(function () {
  const L = window.learn, toFa = L.toFa, esc = L.esc;
  const css = `
.ln-shade{position:fixed;inset:0;z-index:47;background:#000a;display:flex;align-items:flex-end;justify-content:center}
.ln-box{width:100%;max-width:600px;max-height:94vh;overflow-y:auto;overscroll-behavior:contain;background:#fffaf0;color:var(--ink);text-shadow:none;border:2px solid var(--gold);border-bottom:0;border-radius:var(--r-panel) var(--r-panel) 0 0;padding:10px 16px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #0007;animation:lnup .25s ease;line-height:1.8}
@keyframes lnup{from{transform:translateY(40px);opacity:.4}}
.ln-x{float:left;width:44px;height:44px;padding:0;background:transparent;border:0;color:var(--muted);font-size:24px}
.ln-back{float:right;width:44px;height:44px;padding:0;background:transparent;border:0;color:var(--muted);font-size:22px}
.ln-box h2{margin:8px 0 0;text-align:center;font:normal 30px/1.6 SiteFont,Tahoma,serif;color:var(--deep)}
.ln-sub{margin:0 0 10px;text-align:center;color:var(--muted);font-size:15px}
.ln-plan{display:flex;align-items:center;gap:10px;width:100%;height:auto;min-height:60px;margin:8px 0;padding:8px 12px;background:#fff;color:var(--ink);border:1px solid var(--gold);border-radius:var(--r-card);text-align:right;white-space:normal;line-height:1.6;font-weight:400}
.ln-plan:hover{background:var(--hover)}
.ln-plan .ln-ic{flex:none;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--mint);font-size:20px}
.ln-plan>span:nth-child(2){flex:1;min-width:0}
.ln-plan>span:last-child{flex:none;color:var(--muted)}
.ln-plan b{display:block;color:var(--deep);font-size:16.5px}
.ln-plan small{display:block;color:var(--muted);font-size:13.5px}
.ln-bar{height:6px;margin-top:4px;border-radius:99px;background:var(--line);overflow:hidden}
.ln-bar i{display:block;height:100%;background:var(--emerald)}
.ln-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;margin:8px 0}
.ln-day{height:auto;min-height:52px;padding:4px;background:#fff;color:var(--deep);border:1px solid var(--line);border-radius:var(--r);font-size:14px;font-weight:600;line-height:1.4;white-space:normal}
.ln-day small{display:block;font-size:12px;font-weight:400;color:var(--muted)}
.ln-day.done{background:var(--mint);border-color:var(--emerald)}
.ln-day.next{border:2px solid var(--gold)}
.ln-btns{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
.ln-btns button,.ln-btn{flex:1 1 auto;height:auto;min-height:46px;padding:6px 12px;background:var(--deep);color:#fff;border:1px solid var(--deep);border-radius:var(--r);font-weight:600;font-size:15px;white-space:normal;line-height:1.5}
.ln-btns button.soft{background:var(--mint);color:var(--deep);border-color:var(--line)}
.ln-card{margin:10px 0;padding:8px 12px;background:#fff;border:1px solid var(--line);border-right:4px solid var(--gold);border-radius:var(--r)}
.ln-card h3{margin:0 0 4px;font-size:16px;color:var(--deep)}
.ln-msgs{margin:0;padding:0 18px 0 0;font-size:15px}
.ln-msgs li{margin:4px 0}
.ln-msgs li q{quotes:none;color:var(--deep);font-family:Vazirmatn,Tahoma,sans-serif}
.ln-more{height:auto;min-height:40px;margin-top:4px;padding:2px 12px;background:transparent;color:var(--deep);border:1px solid var(--line);border-radius:var(--pill);font-size:14px;font-weight:600}
.ln-note{margin:8px 0 0;font-size:14px;color:var(--muted)}
.ln-src{margin:14px 0 0;font-size:13px;color:var(--muted)}
.ln-ok{margin:8px 0;padding:8px 12px;border-radius:var(--r);background:var(--mint);color:var(--deep);font-weight:600;text-align:center}
.ln-asma{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin:8px 0}
.ln-name{display:block;width:100%;height:auto;min-height:72px;padding:6px 8px;background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:var(--r);text-align:center;white-space:normal;line-height:1.5;font-weight:400}
.ln-name:hover{background:var(--hover)}
.ln-name[hidden]{display:none}
.ln-name b{display:block;font:normal 24px/1.6 QuranHafs,'Traditional Arabic',serif;color:var(--deep)}
.ln-name small{display:block;font-size:13.5px;color:var(--muted)}
.ln-name i{font-style:normal;font-size:12px;color:var(--muted)}
.ln-big{margin:6px 0;text-align:center;font:normal 46px/1.7 QuranHafs,'Traditional Arabic',serif;color:var(--deep)}
.ln-find{width:100%;margin:4px 0 6px}
.ln-live{display:flex;align-items:center;gap:10px;margin:8px 0;padding:10px 12px;background:#fff;color:var(--ink);border:1px solid var(--gold);border-radius:var(--r-card);text-decoration:none;line-height:1.6}
.ln-live:hover{background:var(--hover)}
.ln-live .ln-ic{flex:none;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--mint);font-size:20px}
.ln-live span{flex:1;min-width:0}
.ln-live b{display:block;color:var(--deep);font-size:16px}
.ln-live small{display:block;color:var(--muted);font-size:13.5px}
.ln-live em{flex:none;font-style:normal;color:var(--muted);font-size:13px}
.ln-q{margin:6px 0;padding:10px 12px;background:var(--mint);border-radius:var(--r);font-size:16.5px;font-weight:600;color:var(--deep);text-align:center}
.ln-ar{margin:4px 0;text-align:center;font:normal 22px/2 QuranHafs,'Traditional Arabic',serif;color:var(--deep)}
.ln-fa{margin:0 0 6px;text-align:center;font-size:15px}
.ln-form textarea{width:100%;font-family:inherit;min-height:90px!important;resize:vertical;font-size:16px}
.ln-form input{width:100%;margin-top:6px}
.ln-count{display:block;text-align:left;font-size:13px;color:var(--muted)}
.ln-rf{margin:8px 0;padding:8px 12px;background:#fff;border:1px solid var(--line);border-radius:var(--r);white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px}
.ln-rf small{display:block;white-space:normal;color:var(--muted);font-size:12.5px}
.ln-msg{margin:6px 0 0;font-size:14px;color:var(--deep)}
.ln-msg.bad{color:#9b1c1c}
body.ln-lock{overflow:hidden}
@media(max-width:420px){.ln-asma{grid-template-columns:repeat(2,1fr)}}`;
  { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  let shade = null;
  function open(title, sub, html, back) {
    close();
    shade = document.createElement('div'); shade.className = 'ln-shade';
    shade.innerHTML = `<div class="ln-box" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button type="button" class="ln-x" aria-label="بستن">✕</button>${back ? '<button type="button" class="ln-back" aria-label="بازگشت">→</button>' : ''}<h2>${esc(title)}</h2>${sub ? `<p class="ln-sub">${esc(sub)}</p>` : ''}<div class="ln-body">${html}</div></div>`;
    shade.addEventListener('click', e => {
      if (e.target === shade || e.target.closest('.ln-x')) return close();
      if (e.target.closest('.ln-back')) return back();
    });
    document.body.appendChild(shade); document.body.classList.add('ln-lock');
    shade.querySelector('.ln-x').focus({ preventScroll: true });
    return shade.querySelector('.ln-body');
  }
  function close() { if (shade) { shade.remove(); shade = null; } document.body.classList.remove('ln-lock'); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && shade && !document.querySelector('.qr.show,.cr.show')) close(); });
  const getJson = (() => { const memo = {}; return f => memo[f] || (memo[f] = fetch(f).then(r => { if (!r.ok) throw Error(r.status); return r.json(); }).catch(e => { delete memo[f]; throw e; })); })();
  const ls = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // ================= برنامه‌های کوتاه یادگیری =================
  // days: هر روز [سوره، از آیه، تا آیه]؛ مرزها با بخش‌بندی تفسیر نور هم‌خوان است تا پیام‌های هر روز کامل باشد.
  const PLANS = [
    { id: 'fatiha', ic: '🌱', t: '۷ روز با سوره حمد', s: 'هر روز یک آیه از سوره‌ای که هر روز در نماز می‌خوانیم', days: [[1, 1, 1], [1, 2, 2], [1, 3, 3], [1, 4, 4], [1, 5, 5], [1, 6, 6], [1, 7, 7]] },
    { id: 'kursi', ic: '🛡️', t: 'آیة‌الکرسی در ۳ روز', s: 'سوره بقره، آیه‌های ۲۵۵ تا ۲۵۷', days: [[2, 255, 255], [2, 256, 256], [2, 257, 257]] },
    { id: 'short', ic: '🌿', t: 'هفت سوره کوتاه در ۷ روز', s: 'قدر، عصر، کوثر، نصر، اخلاص، فلق و ناس', days: [[97, 1, 5], [103, 1, 3], [108, 1, 3], [110, 1, 3], [112, 1, 4], [113, 1, 5], [114, 1, 6]] },
    { id: 'luqman', ic: '👨‍👦', t: 'اندرزهای لقمان در ۴ روز', s: 'سوره لقمان، آیه‌های ۱۲ تا ۱۹: سفارش‌های پدر به فرزند', days: [[31, 12, 13], [31, 14, 15], [31, 16, 17], [31, 18, 19]] },
    { id: 'hujurat', ic: '🤝', t: 'آداب اجتماعی: سوره حجرات در ۶ روز', s: 'ادب با پیامبر، تحقیق خبر، آشتی، غیبت و برادری', days: [[49, 1, 3], [49, 4, 6], [49, 7, 8], [49, 9, 10], [49, 11, 13], [49, 14, 18]] },
    { id: 'mulk', ic: '🌌', t: 'سوره ملک در ۶ روز', s: 'سوره‌ای که سفارش شده هر شب خوانده شود', days: [[67, 1, 5], [67, 6, 11], [67, 12, 15], [67, 16, 21], [67, 22, 26], [67, 27, 30]] },
    { id: 'yasin', ic: '💚', t: 'سوره یس در ۱۰ روز', s: 'قلب قرآن، روزی هفت تا ده آیه', days: [[36, 1, 12], [36, 13, 21], [36, 22, 29], [36, 30, 36], [36, 37, 44], [36, 45, 53], [36, 54, 62], [36, 63, 68], [36, 69, 76], [36, 77, 83]] }
  ];
  const KEY = 'learnPlans';
  const prog = () => ls.get(KEY, {});
  const doneOf = id => { const p = prog()[id]; return p && Array.isArray(p.done) ? p.done : []; };
  function mark(id, day, on) {
    const all = prog(), p = all[id] || { done: [] }, d = new Set(Array.isArray(p.done) ? p.done : []);
    on ? d.add(day) : d.delete(day);
    all[id] = { done: [...d].sort((a, b) => a - b), at: new Date().toISOString().slice(0, 10) };
    ls.set(KEY, all); window.siteMenu?.refresh();
  }
  // نام سوره‌های همین برنامه‌ها (قرآن‌خوان نام‌ها را فقط پس از باز کردن هر بخش می‌داند)
  const NAMES = { 1: 'حمد', 2: 'بقره', 31: 'لقمان', 36: 'یس', 49: 'حجرات', 67: 'ملک', 97: 'قدر', 103: 'عصر', 108: 'کوثر', 110: 'نصر', 112: 'اخلاص', 113: 'فلق', 114: 'ناس' };
  const sname = s => NAMES[s] || window.quranReader?.name?.(s) || toFa(s);
  const range = ([s, a, b]) => a === 1 && b === window.quranReader?.ayahs?.(s) ? `سوره ${sname(s)}` : `سوره ${sname(s)}، ${a === b ? `آیه ${toFa(a)}` : `آیه ${toFa(a)} تا ${toFa(b)}`}`;

  function learn() {
    const body = open('برنامه‌های کوتاه یادگیری', 'هر روز چند آیه، با پیام‌های تفسیر نور (حجت‌الاسلام قرائتی)', '');
    body.innerHTML = PLANS.map(p => {
      const n = doneOf(p.id).length, all = p.days.length;
      return `<button type="button" class="ln-plan" data-plan="${p.id}"><span class="ln-ic">${p.ic}</span><span><b>${esc(p.t)}</b><small>${n ? n >= all ? 'پایان یافت. قبول باشد' : `${toFa(n)} از ${toFa(all)} روز خوانده شد` : esc(p.s)}</small>${n ? `<span class="ln-bar"><i style="width:${Math.round(n / all * 100)}%"></i></span>` : ''}</span><span aria-hidden="true">‹</span></button>`;
    }).join('') + '<p class="ln-src">برگرفته از ایده «برنامه‌های یادگیری» Quran.com. پیشرفت هر برنامه فقط روی همین گوشی ذخیره می‌شود (و در «پشتیبان و انتقال» هست). هر روز را هر وقت خواستید بخوانید؛ لازم نیست پشت سر هم باشد.</p>';
    body.addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (b) plan(b.dataset.plan); });
  }
  function plan(id) {
    const p = PLANS.find(x => x.id === id); if (!p) return;
    const body = open(p.t, p.s, '', learn);
    const paint = () => {
      const done = doneOf(id), next = p.days.findIndex((_, i) => !done.includes(i + 1));
      body.innerHTML = `${done.length >= p.days.length ? '<p class="ln-ok">همه روزهای این برنامه خوانده شد. قبول باشد 🌷</p>' : ''}
<div class="ln-days">${p.days.map((d, i) => `<button type="button" class="ln-day${done.includes(i + 1) ? ' done' : ''}${i === next ? ' next' : ''}" data-day="${i + 1}">${done.includes(i + 1) ? '✓ ' : ''}روز ${toFa(i + 1)}<small>${esc(d[1] === d[2] ? `آیه ${toFa(d[1])}` : d[0] !== 1 && id === 'short' ? sname(d[0]) : `${toFa(d[1])} تا ${toFa(d[2])}`)}</small></button>`).join('')}</div>
${next >= 0 ? `<div class="ln-btns"><button type="button" data-day="${next + 1}">ادامه: روز ${toFa(next + 1)} ›</button></div>` : `<div class="ln-btns"><button type="button" class="soft" data-reset>از اول شروع کنم</button></div>`}`;
    };
    paint();
    body.addEventListener('click', e => {
      const d = e.target.closest('[data-day]'); if (d) return day(id, +d.dataset.day);
      if (e.target.closest('[data-reset]')) { const all = prog(); delete all[id]; ls.set(KEY, all); window.siteMenu?.refresh(); paint(); }
    });
  }
  // پیام‌های تفسیر نور برای آیه‌های یک روز: بخش «## پیام ها» هر بخش تفسیری که با این آیه‌ها هم‌پوشانی دارد.
  async function noor(s, a, b) {
    const ix = await getJson(`quran/tafsir-noor/${s}.json`);
    const files = ix.parts ? ix.parts.filter(p => p.to >= a && p.from <= b).map(p => p.file) : [null];
    const out = [];
    for (const f of files) {
      const d = f ? await getJson(`quran/tafsir-noor/${f}`) : ix;
      d.segments.filter(g => g.to >= a && g.from <= b).forEach(g => {
        const m = /## پیام ها\s*\n([\s\S]*?)(?:\n## |$)/.exec(g.text || '');
        if (!m) return;
        m[1].split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).forEach(x => out.push({ from: g.from, to: g.to, t: x.replace(/^[۰-۹0-9]+\s*-\s*/, '').replace(/\([۰-۹0-9]+\)/g, '').trim() }));
      });
    }
    return out;
  }
  // «اللَّه الصمد» نقل قول آیه است؛ کمی پررنگ‌تر نشان داده می‌شود.
  const msgHtml = t => esc(t).replace(/«([^»]{1,80})»/g, '<q>«$1»</q>');
  async function day(id, n) {
    const p = PLANS.find(x => x.id === id), d = p.days[n - 1]; if (!d) return;
    const [s, a, b] = d, body = open(`روز ${toFa(n)}: ${range(d)}`, p.t, '<p class="ln-note">…</p>', () => plan(id));
    const done = doneOf(id).includes(n);
    const R = window.quranReader;
    let msgs = [];
    try { msgs = await noor(s, a, b); } catch { body.innerHTML = '<p class="ln-note">پیام‌های تفسیر دریافت نشد. اینترنت را بررسی کنید و دوباره باز کنید.</p>'; }
    if (!body.isConnected) return;
    const SHOW = 8;
    body.innerHTML = `<div class="ln-btns"><button type="button" data-read>📖 خواندن آیه‌ها با ترجمه${R ? '' : ''}</button></div>
<p class="ln-note">اول آیه‌ها را با ترجمه بخوانید (صوت هم دارد)، بعد پیام‌های زیر را با حوصله مرور کنید.</p>
${msgs.length ? `<div class="ln-card"><h3>💡 پیام‌های این آیه‌ها</h3><ol class="ln-msgs">${msgs.map((m, i) => `<li${i >= SHOW ? ' hidden' : ''}>${msgHtml(m.t)}</li>`).join('')}</ol>${msgs.length > SHOW ? `<button type="button" class="ln-more" data-all>نمایش همه ${toFa(msgs.length)} پیام</button>` : ''}</div>` : ''}
<div class="ln-btns">${done ? '<button type="button" class="soft" data-undo>✓ خوانده شده (برداشتن تیک)</button>' : '<button type="button" data-done>✓ این روز را خواندم</button>'}${n < p.days.length ? `<button type="button" class="soft" data-next>روز ${toFa(n + 1)} ›</button>` : ''}</div>
<p class="ln-src">پیام‌ها از تفسیر نور، حجت‌الاسلام محسن قرائتی (مرکز فرهنگی درس‌هایی از قرآن). تفسیر کامل هر آیه در قرآن‌خوان، دکمه تفسیر.</p>`;
    body.onclick = async e => {
      if (e.target.closest('[data-all]')) { body.querySelectorAll('.ln-msgs li[hidden]').forEach(li => { li.hidden = false; }); e.target.closest('[data-all]').remove(); }
      else if (e.target.closest('[data-done]')) { mark(id, n, true); day(id, n); }
      else if (e.target.closest('[data-undo]')) { mark(id, n, false); day(id, n); }
      else if (e.target.closest('[data-next]')) day(id, n + 1);
      else if (e.target.closest('[data-read]') && R) {
        const ix = await R.index().catch(() => null); if (!ix) return alert('بارگذاری قرآن انجام نشد. اینترنت را بررسی کنید.');
        close();
        R.openRange({ title: range(d), sub: `${p.t}، روز ${toFa(n)}`, from: ix.surah[s - 1] + a - 1, to: ix.surah[s - 1] + b, endText: `پایان آیه‌های روز ${toFa(n)}.`,
          endButton: 'پیام‌های تفسیر و تیک امروز ›', onEnd: () => setTimeout(() => day(id, n), 50) });
      }
    };
  }

  // ================= اسماء الحسنی =================
  // [نام، معنی]؛ ترتیب روایت مشهور (سنن ترمذی) که در بیشتر کتاب‌ها و برنامه‌ها آمده است.
  const ASMA = [['اللّه', 'نام ذات پروردگار، جامع همه صفات کمال'], ['الرَّحْمٰن', 'بخشنده، که رحمتش همه را فرا گرفته'], ['الرَّحِيم', 'مهربان، به‌ویژه با مؤمنان'], ['المَلِك', 'فرمانروای حقیقی'],
    ['القُدُّوس', 'پاک و منزه از هر عیب'], ['السَّلام', 'سلامت‌بخش و دور از هر نقص'], ['المُؤْمِن', 'ایمنی‌بخش و تصدیق‌کننده'], ['المُهَيْمِن', 'نگهبان و چیره بر همه چیز'],
    ['العَزِيز', 'شکست‌ناپذیر و ارجمند'], ['الجَبَّار', 'جبران‌کننده و چیره'], ['المُتَكَبِّر', 'بزرگ‌مرتبه، برتر از همه'], ['الخالِق', 'آفریننده'],
    ['البارِئ', 'پدیدآورنده بی‌نمونه'], ['المُصَوِّر', 'صورتگر'], ['الغَفّار', 'بسیار آمرزنده'], ['القَهّار', 'چیره بر همه'],
    ['الوَهّاب', 'بسیار بخشنده، بی‌چشم‌داشت'], ['الرَّزّاق', 'روزی‌دهنده'], ['الفَتّاح', 'گشاینده درها و کارها'], ['العَلِيم', 'دانا به همه چیز'],
    ['القابِض', 'گیرنده و تنگ‌کننده روزی به حکمت'], ['الباسِط', 'گستراننده روزی'], ['الخافِض', 'پست‌کننده متکبران'], ['الرّافِع', 'بالابرنده'],
    ['المُعِزّ', 'عزت‌دهنده'], ['المُذِلّ', 'خوارکننده'], ['السَّمِيع', 'شنوا'], ['البَصِير', 'بینا'],
    ['الحَكَم', 'داور'], ['العَدْل', 'دادگر'], ['اللَّطِيف', 'باریک‌بین و نیکوکار پنهان'], ['الخَبِير', 'آگاه از درون‌ها'],
    ['الحَلِيم', 'بردبار'], ['العَظِيم', 'بزرگ'], ['الغَفُور', 'آمرزنده'], ['الشَّكُور', 'قدردان، پاداش‌دهنده کار اندک'],
    ['العَلِيّ', 'بلندمرتبه'], ['الكَبِير', 'بزرگ'], ['الحَفِيظ', 'نگهدارنده'], ['المُقِيت', 'روزی‌رسان و توانا'],
    ['الحَسِيب', 'حسابرس و کفایت‌کننده'], ['الجَلِيل', 'باشکوه'], ['الكَرِيم', 'بزرگوار و بخشنده'], ['الرَّقِيب', 'مراقب'],
    ['المُجِيب', 'پاسخ‌دهنده دعا'], ['الواسِع', 'گشاده‌رحمت و فراگیر'], ['الحَكِيم', 'فرزانه، کارهایش از روی حکمت'], ['الوَدُود', 'دوستدار بندگان'],
    ['المَجِيد', 'بزرگوار و ستوده'], ['الباعِث', 'برانگیزاننده مردگان'], ['الشَّهِيد', 'گواه و حاضر'], ['الحَقّ', 'حق و ثابت'],
    ['الوَكِيل', 'کارساز و تکیه‌گاه'], ['القَوِيّ', 'نیرومند'], ['المَتِين', 'استوار'], ['الوَلِيّ', 'سرپرست و یاور'],
    ['الحَمِيد', 'ستوده'], ['المُحْصِي', 'شمارنده همه چیز'], ['المُبْدِئ', 'آغازکننده آفرینش'], ['المُعِيد', 'بازگرداننده'],
    ['المُحْيِي', 'زنده‌کننده'], ['المُمِيت', 'میراننده'], ['الحَيّ', 'زنده'], ['القَيُّوم', 'پاینده و برپادارنده همه'],
    ['الواجِد', 'دارای همه چیز، بی‌نیاز'], ['الماجِد', 'بزرگوار'], ['الواحِد', 'یگانه'], ['الصَّمَد', 'بی‌نیاز که همه به او نیازمندند'],
    ['القادِر', 'توانا'], ['المُقْتَدِر', 'بسیار توانا'], ['المُقَدِّم', 'پیش‌اندازنده'], ['المُؤَخِّر', 'پس‌اندازنده'],
    ['الأوَّل', 'آغاز، پیش از همه'], ['الآخِر', 'پایان، پس از همه'], ['الظّاهِر', 'آشکار با نشانه‌هایش'], ['الباطِن', 'پنهان از چشم‌ها'],
    ['الوالِي', 'سرپرست و فرمانروا'], ['المُتَعالِي', 'برتر از هر وصف'], ['البَرّ', 'نیکوکار'], ['التَّوّاب', 'بسیار توبه‌پذیر'],
    ['المُنْتَقِم', 'کیفردهنده ستمگران'], ['العَفُوّ', 'درگذرنده و پاک‌کننده گناه'], ['الرَّؤُوف', 'بسیار مهربان'], ['مالِكُ المُلْك', 'دارنده فرمانروایی'],
    ['ذُو الجَلالِ وَالإكْرام', 'صاحب شکوه و بزرگواری'], ['المُقْسِط', 'دادگر'], ['الجامِع', 'گردآورنده'], ['الغَنِيّ', 'بی‌نیاز'],
    ['المُغْنِي', 'بی‌نیازکننده'], ['المانِع', 'بازدارنده از آسیب'], ['الضّارّ', 'زیان‌رسان به حکمت'], ['النّافِع', 'سودرسان'],
    ['النُّور', 'روشنی آسمان‌ها و زمین'], ['الهادِي', 'راهنما'], ['البَدِيع', 'نوآفرین'], ['الباقِي', 'ماندگار'],
    ['الوارِث', 'وارث همه پس از فنا'], ['الرَّشِيد', 'راهنمای درست'], ['الصَّبُور', 'شکیبا']];
  // «یا» + نام بی «ال» و بی تشدید حرف اول (الرَّحْمٰن ← یا رَحْمٰن)؛ «ذو» پس از حرف ندا «ذا» می‌شود.
  const zekrName = n => n === 'اللّه' ? 'یا اللّه' : /^ذُو /.test(n) ? n.replace(/^ذُو /, 'یا ذَا ') : /^ال/.test(n) ? 'یا ' + n.slice(2).replace(/^([^\u064B-\u0652]?[\u064B-\u0650]?)\u0651/, '$1') : `یا ${n}`;
  function asma() {
    const body = open('اسماء الحسنی', 'نودونه نام نیکوی خداوند', '');
    const cards = ASMA.map(([n, m], i) => `<button type="button" class="ln-name" data-nm="${i}"><i>${toFa(i + 1)}</i><b lang="ar">${esc(n)}</b><small>${esc(m)}</small></button>`).join('');
    body.innerHTML = `<p class="ln-note" style="text-align:center">«وَلِلّهِ الأسْماءُ الحُسْنىٰ فَادْعوهُ بِها» (سوره اعراف، آیه ۱۸۰). هر نام را بزنید تا بزرگ‌تر ببینید.</p>
<input type="search" class="ln-find" placeholder="جستجوی نام یا معنی" aria-label="جستجوی نام یا معنی"><div class="ln-asma">${cards}</div>
<div class="ln-btns">${window.mafatih?.openKey ? '<button type="button" class="soft" data-jk>📚 دعای جوشن کبیر: هزار نام خداوند</button>' : ''}</div>
<p class="ln-src">ترتیب نام‌ها بنا بر روایت مشهور (سنن ترمذی) است که در بیشتر کتاب‌ها آمده است. شیخ صدوق در کتاب «التوحید» روایتی دیگر با تفاوت در چند نام آورده است.</p>`;
    const plain = t => t.replace(/[ً-ّْٰ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ي/g, 'ی').replace(/ك/g, 'ک');
    body.querySelector('.ln-find').oninput = e => {
      const q = plain(e.target.value.trim());
      body.querySelectorAll('.ln-name').forEach(b => { const [n, m] = ASMA[+b.dataset.nm]; b.hidden = !!q && !plain(n).includes(q) && !m.includes(q); });
    };
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-nm]'); if (b) return name(+b.dataset.nm);
      if (e.target.closest('[data-jk]')) { close(); window.mafatih.openKey('049'); }
    });
  }
  function name(i) {
    const [n, m] = ASMA[i];
    const body = open(`${toFa(i + 1)}. ${n}`, m, '', asma);
    body.innerHTML = `<p class="ln-big" lang="ar">${esc(n)}</p><p class="ln-fa" style="font-size:17px">${esc(m)}</p>
<div class="ln-btns">${i > 0 ? '<button type="button" class="soft" data-p>‹ نام قبل</button>' : ''}${window.shareCard ? '<button type="button" class="soft" data-img>🖼️ تصویر</button>' : ''}${i < ASMA.length - 1 ? '<button type="button" class="soft" data-n>نام بعد ›</button>' : ''}</div>
${window.zekr?.open ? `<div class="ln-btns"><button type="button" data-zk>📿 ذکر «${esc(zekrName(n))}» با ذکرشمار</button></div>` : ''}`;
    body.onclick = e => {
      if (e.target.closest('[data-p]')) name(i - 1);
      else if (e.target.closest('[data-n]')) name(i + 1);
      else if (e.target.closest('[data-img]')) window.shareCard({ ar: n, fa: m, title: 'اسماء الحسنی', sub: `نام ${toFa(i + 1)} از ۹۹`, file: 'nooran-asma' });
      else if (e.target.closest('[data-zk]')) { close(); window.zekr.open('custom', zekrName(n)); }
    };
  }

  // ================= پخش زنده حرم‌ها =================
  // فقط سایت‌های داخل ایران (دامنه .ir و آپارات) که بی‌فیلترشکن باز می‌شوند. پخش زنده کربلا، نجف و مسجدالحرام روی یوتیوب است که در ایران فیلتر است.
  const LIVE = [
    ['🕌', 'حرم امام رضا (ع)', 'درگاه رسمی حرم مطهر رضوی: روضه منوره و صحن‌ها', 'https://haram.razavi.ir/live', 'haram.razavi.ir'],
    ['📺', 'برنامه‌های حرم رضوی در آپارات', 'رضوی‌تی‌وی، کانال آستان قدس رضوی', 'https://www.aparat.com/razavitv/live', 'aparat.com'],
    ['🕌', 'حرم حضرت معصومه (س)', 'پرتال آستان مقدس؛ بخش «پخش زنده»', 'https://amfm.ir/', 'amfm.ir'],
    ['🌟', 'مسجد مقدس جمکران', 'کانال رسمی مسجد در آپارات؛ مراسم‌ها زنده پخش می‌شوند', 'https://www.aparat.com/Jamkaran_ir', 'aparat.com'],
    ['📻', 'رادیو زیارت', 'صدای زنده حرم‌ها و برنامه‌های زیارت، از صدای جمهوری اسلامی', 'https://ziarat.seda.ir/', 'ziarat.seda.ir']
  ];
  function live() {
    const body = open('پخش زنده حرم‌ها', 'زیارت از راه دور', '');
    body.innerHTML = `${LIVE.map(([ic, t, s, u, h]) => `<a class="ln-live" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><span class="ln-ic">${ic}</span><span><b>${esc(t)}</b><small>${esc(s)}</small></span><em dir="ltr">${esc(h)} ↗</em></a>`).join('')}
${window.qibla?.open && window.features?.shown('shrines') ? '<div class="ln-btns"><button type="button" class="soft" data-qb>🧭 جهت حرم‌ها برای زیارت از راه دور</button></div>' : ''}
<p class="ln-note">همه این پیوندها سایت‌های داخل ایران‌اند و بی‌فیلترشکن باز می‌شوند؛ پخش در سایت خودشان (بیرون از نوران) باز می‌شود. پخش زنده حرم امام حسین (ع)، حضرت عباس (ع)، امیرالمؤمنین (ع) و مسجدالحرام فقط روی یوتیوب است که در ایران فیلتر است، به همین دلیل اینجا نیامده است.</p>`;
    body.addEventListener('click', e => { if (e.target.closest('[data-qb]')) { close(); window.qibla.open(); } });
  }

  // ================= پرسش تأمل و برداشت‌ها =================
  const MAX = 300;
  window.sbErrors = Object.assign(window.sbErrors || {}, {
    rf_empty: 'متن برداشت خالی است.', rf_long: `برداشت بلند است؛ حداکثر ${toFa(MAX)} نویسه.`,
    rf_limit: 'از این گوشی امروز برداشت کافی رسیده است؛ لطفاً فردا دوباره بنویسید.', bad_device: 'فرستاده نشد؛ صفحه را دوباره باز کنید.'
  });
  const device = () => {
    let d = null; try { d = localStorage.getItem('fbDevice'); } catch {}
    if (!d) { const a = new Uint8Array(18); crypto.getRandomValues(a); d = 'fb' + [...a].map(x => x.toString(16).padStart(2, '0')).join(''); try { localStorage.setItem('fbDevice', d); } catch {} }
    return d;
  };
  const when = iso => { try { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', day: 'numeric' }).format(new Date(iso)); } catch { return ''; } };
  // a: { ref: 's:v', ar, tr, name, v, q }
  function reflect(a) {
    const body = open('تأمل روز', `سوره ${a.name}، آیه ${toFa(a.v)}`, '');
    const sent = ls.get('rfSent', {})[a.ref];
    body.innerHTML = `<p class="ln-ar" lang="ar" dir="rtl">${esc(a.ar)}</p><p class="ln-fa">${esc(a.tr)}</p>
<p class="ln-q">🤔 ${esc(a.q)}</p>
<div class="ln-form"><label for="lnRf">برداشت یا تجربه شما (کوتاه، حداکثر ${toFa(MAX)} نویسه):</label>
<textarea id="lnRf" maxlength="${MAX}" placeholder="مثلاً: امروز می‌خواهم…"></textarea><span class="ln-count">۰ / ${toFa(MAX)}</span>
<input id="lnRfName" maxlength="40" placeholder="نام (اختیاری؛ خالی بماند «یکی از اعضا» نوشته می‌شود)">
<div class="ln-btns"><button type="button" data-send>فرستادن برداشت</button></div><p class="ln-msg" role="status">${sent ? 'برداشت شما برای این آیه فرستاده شده است؛ پس از تأیید مدیر این‌جا دیده می‌شود.' : ''}</p></div>
<div class="ln-card"><h3>💬 برداشت‌های اعضا</h3><div data-list><p class="ln-note">…</p></div></div>
<p class="ln-src">برداشت‌ها پیش از نمایش، از سوی مدیر خوانده و تأیید می‌شوند. هر برداشت فقط با نامی که خودتان نوشته‌اید (یا بی‌نام) دیده می‌شود.</p>`;
    const ta = body.querySelector('#lnRf'), nm = body.querySelector('#lnRfName'), msg = body.querySelector('.ln-msg');
    try { nm.value = localStorage.getItem('rfName') || ''; } catch {}
    ta.oninput = () => { body.querySelector('.ln-count').textContent = `${toFa(ta.value.length)} / ${toFa(MAX)}`; };
    body.querySelector('[data-send]').onclick = async e => {
      const b = e.target, t = ta.value.trim(), n = nm.value.trim();
      if (t.length < 2) { msg.className = 'ln-msg bad'; msg.textContent = window.sbErrors.rf_empty; return; }
      b.disabled = true; msg.className = 'ln-msg'; msg.textContent = '…';
      try {
        await window.sbRpc('reflect_send', { p_device: device(), p_ref: a.ref, p_body: t, p_name: n || null });
        try { localStorage.setItem('rfName', n); } catch {}
        const s = ls.get('rfSent', {}); s[a.ref] = Date.now(); ls.set('rfSent', s);
        ta.value = ''; ta.oninput();
        msg.textContent = 'فرستاده شد. سپاس! پس از تأیید مدیر برای همه دیده می‌شود.';
      } catch (err) { msg.className = 'ln-msg bad'; msg.textContent = err.message; }
      finally { b.disabled = false; }
    };
    const box = body.querySelector('[data-list]');
    (window.sbRpc ? window.sbRpc('reflect_list', { p_ref: a.ref }) : Promise.reject()).then(rows => {
      box.innerHTML = rows?.length ? rows.map(r => `<div class="ln-rf">${esc(r.body)}<small>${esc(r.name || 'یکی از اعضا')} · ${esc(when(r.created_at))}</small></div>`).join('')
        : '<p class="ln-note">هنوز برداشتی برای این آیه تأیید نشده است. شما اولین نفر باشید.</p>';
    }).catch(() => { box.innerHTML = '<p class="ln-note">برداشت‌ها دریافت نشد. اینترنت را بررسی کنید.</p>'; });
  }

  // مدیر: کارت «برداشت‌های تأمل روز» در زبانه «نظرها»
  async function adminCard(pane) {
    let card = document.getElementById('lnRfAdm');
    if (!card) {
      card = document.createElement('div'); card.className = 'adm-card'; card.id = 'lnRfAdm';
      pane.appendChild(card);
      card.addEventListener('click', async e => {
        const b = e.target.closest('[data-rfa]'); if (!b) return;
        const it = b.closest('[data-id]'), id = +it.dataset.id, m = card.querySelector('.adm-msg');
        b.disabled = true;
        try {
          if (b.dataset.rfa === 'del') { if (!confirm('این برداشت حذف شود؟')) return; await window.sbApi(`reflections?id=eq.${id}`, { method: 'DELETE', auth: true, prefer: 'return=minimal' }); it.remove(); }
          else { const on = b.dataset.rfa === 'ok'; await window.sbApi(`reflections?id=eq.${id}`, { method: 'PATCH', body: { approved: on }, auth: true, prefer: 'return=minimal' }); adminCard(pane); }
          m.className = 'adm-msg adm-ok'; m.textContent = 'ذخیره شد.';
        } catch (err) { m.className = 'adm-msg adm-bad'; m.textContent = err.message; }
        finally { b.disabled = false; }
      });
    }
    card.innerHTML = '<h3>برداشت‌های «تأمل روز»</h3><p class="hint">برداشت‌هایی که زیر آیه روز فرستاده شده‌اند. فقط برداشت‌های تأییدشده برای همه دیده می‌شوند.</p><div class="adm-msg"></div><div data-rfl class="hint">…</div>';
    const box = card.querySelector('[data-rfl]');
    try {
      const rows = await window.sbApi('reflections?select=id,ref,name,body,approved,created_at&order=approved.asc,created_at.desc&limit=100', { auth: true });
      box.className = '';
      box.innerHTML = rows.length ? rows.map(r => `<div class="fba-item${r.approved ? '' : ' new'}" data-id="${r.id}"><div class="fba-head"><span>${r.approved ? '✓ تأییدشده' : '🆕 در انتظار'} · ${esc(r.name || 'بی‌نام')}</span><span>آیه ${esc(toFa(r.ref))} · ${esc(when(r.created_at))}</span></div>
<div class="fba-body">${esc(r.body)}</div><div class="reg-tools">${r.approved ? '<button type="button" class="reg-light" data-rfa="no">برداشتن تأیید</button>' : '<button type="button" data-rfa="ok">تأیید و نمایش</button>'}<button type="button" class="reg-light" data-rfa="del">حذف</button></div></div>`).join('')
        : '<p class="hint">هنوز برداشتی نرسیده است.</p>';
    } catch (e) { box.textContent = e.message; }
  }

  window.learnSheets = { learn, asma, live, reflect, adminCard, close, PLANS, ASMA };
})();
