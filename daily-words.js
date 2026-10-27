// کارت «آیه و سخن روز» در صفحه اول، زیر کارت «امروز» (daily.js). دو امکان جدا در features.js:
//  ayahday: هر روز یکی از آیه‌های فهرست AYAT (آیه‌های کوتاه و پرکاربرد، از جمله آیه‌های ولایت، مودت و صلوات) با ترجمه آیت‌الله مکارم شیرازی.
//           متن از همان فایل‌های قرآن‌خوان (quran/p/<حزب>.json) خوانده می‌شود؛ «خواندن در قرآن» صفحه همان آیه را باز می‌کند.
//  hadithday: هر روز یکی از حکمت‌های کوتاه نهج‌البلاغه (books/nahj/hikmat/<شماره>.json، ترجمه پیش‌فرض کتاب: محمد دشتی)؛
//             «بیشتر» همان حکمت را در کتاب نهج‌البلاغه باز می‌کند.
// روز به وقت شهر انتخابی کارت «امروز» حساب می‌شود؛ پس همه در یک روز همان آیه و سخن را می‌بینند. ✕ کارت در hide-x.js است.
(function () {
  const shown = id => !!window.features?.shown(id);
  const fa = '۰۱۲۳۴۵۶۷۸۹', toFa = x => String(x).replace(/\d/g, d => fa[d]);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AYAT = ('2:45 2:152 2:153 2:156 2:186 2:201 3:8 3:31 3:92 3:104 3:139 3:173 3:200 5:55 6:162 7:23 7:56 9:51 10:62 12:87 13:11 13:28 13:29 '
    + '14:7 14:41 15:49 16:97 16:128 17:9 17:23 17:80 17:82 18:46 20:132 21:87 21:107 23:118 25:63 25:74 28:24 29:2 29:45 29:69 31:17 33:41 33:56 '
    + '35:15 39:10 39:53 40:60 42:23 47:7 49:10 49:13 50:16 51:56 55:13 55:60 57:16 59:18 64:16 65:3 67:2 76:8 89:27 93:5 93:11 94:5 97:3 2:110 '
    + '3:159 4:58 7:204 11:115 8:46 16:90 39:9').split(' ').map(r => r.split(':').map(Number));
  // شماره حکمت‌های کوتاه نهج‌البلاغه (یک بند، متن عربی تا ۱۶۰ و ترجمه تا ۲۲۰ نویسه) که در کارت جا می‌شوند.
  const HK = ('1 2 3 4 5 7 8 9 10 11 12 13 14 15 16 18 19 20 21 23 24 25 26 27 28 29 30 32 33 34 35 36 39 44 46 47 48 49 50 51 52 53 54 55 56 58 59 60 61 '
    + '63 64 65 66 67 68 69 70 71 72 74 75 76 80 83 84 85 86 87 91 92 95 97 98 101 106 107 109 110 117 118 121 124 127 129 132 133 134 137 138 139 '
    + '140 141 142 143 144 146 148 149 151 152 153 154 155 156 157 158 159 160 161 162 163 164 165 166 167 168 169 170 171 172 173 174 175 176 177 '
    + '178 179 180 181 182 183 184 185 186 187 188 189 192 193 196 197 198 200 201 205 206 207 208 212 213 214 215 216 217 218 219 220 221 222 223 '
    + '225 226 227 230 231 236 238 239 241 242 243 244 245 246 247 248 249 250 251 254 255 256 258 259 263 264 265 268 272 274 277 278 279 280 281 '
    + '282 283 284 285 286 287 288 290 293 294 296 297 298 299 301 302 303 304 305 306 308 309 310 312 313 314 324 326 327 329 330 331 332 334 335 '
    + '336 337 338 339 340 341 342 345 346 347 348 350 351 353 355 360 362 363 364 365 366 376 378 380 385 386 391 392 393 394 395 397 398 401 403 '
    + '407 408 409 410 411 412 413 418 419').split(' ').map(Number);

  // reflect (learn.js): پرسش تأمل برای هر آیه فهرست بالا؛ «✍️ برداشت من» برگه فرستادن و دیدن برداشت‌ها را باز می‌کند (learn-sheets.js).
  const Q = {
    '2:45': 'امروز برای کدام کار سختم می‌توانم از صبر و نماز کمک بگیرم؟',
    '2:152': 'امروز در چه لحظه‌ای می‌توانم آگاهانه به یاد خدا باشم؟',
    '2:153': 'کدام سختی این روزها صبر بیشتری از من می‌خواهد؟',
    '2:156': 'اگر باور کنم همه چیزم از آنِ خداست، نگاهم به کدام از دست‌دادنم عوض می‌شود؟',
    '2:186': 'خدا می‌گوید «من نزدیکم»؛ امروز چه چیزی را بی‌واسطه از او می‌خواهم؟',
    '2:201': '«نیکی دنیا» برای من یعنی چه و «نیکی آخرت» یعنی چه؟',
    '3:8': 'چه چیزی ممکن است دل مرا پس از هدایت منحرف کند و چطور از آن دوری کنم؟',
    '3:31': 'پیروی از پیامبر (ص) در کدام رفتار روزانه‌ام بیشتر لازم است؟',
    '3:92': 'چیزی که دوستش دارم و می‌توانم در راه خدا ببخشم چیست؟',
    '3:104': 'امروز چطور می‌توانم با زبان خوش کسی را به کار نیکی دعوت کنم؟',
    '3:139': 'کدام نگرانی را باید با تکیه بر ایمانم کنار بگذارم؟',
    '3:173': '«خدا ما را کافی است»؛ این جمله کدام ترسم را آرام می‌کند؟',
    '3:200': 'در برابر کدام هوس یا عادتم باید پایدارتر باشم؟',
    '5:55': 'ولایت خدا و پیامبر و امیرالمؤمنین (ع) در تصمیم‌های روزمره من چه جایی دارد؟',
    '6:162': 'کدام کار امروزم را می‌توانم با نیت «برای خدا» انجام دهم؟',
    '7:23': 'حضرت آدم بی‌بهانه اشتباهش را پذیرفت؛ کدام اشتباهم را باید صادقانه بپذیرم؟',
    '7:56': 'بیم و امیدم به خدا متعادل است یا یکی بر دیگری می‌چربد؟',
    '9:51': 'کدام اتفاق را اگر به خدا بسپارم، آرام‌تر می‌شوم؟',
    '10:62': 'ترس و اندوهی که این روزها دارم، با دوستی خدا چه نسبتی دارد؟',
    '12:87': 'در کدام کار از رحمت خدا ناامید شده‌ام و باید دوباره «جستجو» را شروع کنم؟',
    '13:11': 'کدام چیز را باید در خودم تغییر دهم تا زندگی‌ام تغییر کند؟',
    '13:28': 'چه وقت‌هایی یاد خدا واقعاً دلم را آرام کرده است؟',
    '13:29': 'یک کار شایسته کوچک که امروز می‌توانم انجام دهم چیست؟',
    '14:7': 'امروز برای کدام نعمت، که معمولاً نمی‌بینمش، شکر می‌کنم؟',
    '14:41': 'امروز برای پدر و مادرم و مؤمنان چه دعایی می‌کنم؟',
    '15:49': 'اگر یادم باشد خدا بخشنده مهربان است، با خطای خودم و دیگران چطور رفتار می‌کنم؟',
    '16:97': '«زندگی پاک» برای من چه نشانه‌هایی دارد؟',
    '16:128': 'تقوا و نیکوکاری در کدام رابطه‌ام باید بیشتر دیده شود؟',
    '17:9': 'کدام آیه قرآن تا به حال راه درست را به من نشان داده است؟',
    '17:23': 'امروز با چه سخن نرم یا کار کوچکی پدر و مادرم را شاد می‌کنم؟',
    '17:80': 'در کدام کار تازه‌ای که شروع می‌کنم، صداقت لازم‌تر است؟',
    '17:82': 'قرآن کدام درد دل یا ذهن مرا شفا داده است؟',
    '18:46': '«باقیات صالحات» من، کارهای ماندگارم، چیست؟',
    '20:132': 'چطور می‌توانم بی‌سخت‌گیری، خانواده‌ام را به نماز نزدیک‌تر کنم؟',
    '21:87': 'حضرت یونس در تاریکی خدا را صدا زد؛ من در تنگنا اول به چه کسی رو می‌کنم؟',
    '21:107': 'رحمت پیامبر (ص) را در رفتار خودم با دیگران چطور نشان دهم؟',
    '23:118': 'امروز از خدا آمرزش و رحمت برای چه چیزی می‌خواهم؟',
    '25:63': 'وقتی کسی با من نابخردانه حرف می‌زند، چطور «سلام» بگویم و بگذرم؟',
    '25:74': 'برای همسر و فرزندانم (یا خانواده آینده‌ام) چه آرزویی دارم؟',
    '28:24': 'حضرت موسی گفت «به هر خیری که بفرستی نیازمندم»؛ نیاز امروز من چیست؟',
    '29:2': 'کدام آزمایش این روزها ایمانم را محک می‌زند؟',
    '29:45': 'نمازم تا چه اندازه مرا از کار ناپسند بازداشته است؟',
    '29:69': 'در کدام راه خیر تلاش کرده‌ام و راه برایم باز شده است؟',
    '31:17': 'کدام سفارش لقمان به فرزندش امروز برای من مهم‌تر است؟',
    '33:41': 'چطور می‌توانم «بسیار» به یاد خدا باشم، حتی میان کار روزانه؟',
    '33:56': 'امروز چند بار با توجه صلوات می‌فرستم؟',
    '35:15': 'کدام نیازم را تا حالا فقط از مردم خواسته‌ام و نه از خدا؟',
    '39:10': 'کدام صبر من بی‌حساب پاداش می‌گیرد؟',
    '39:53': 'کدام گناه یا اشتباهم ناامیدم کرده است؟ این آیه به من چه می‌گوید؟',
    '40:60': 'دعایی که مدت‌ها نخوانده‌ام یا از خواستنش خجالت کشیده‌ام چیست؟',
    '42:23': 'دوستی اهل‌بیت (ع) در زندگی من چه نشانه‌ای دارد؟',
    '47:7': 'چطور «یاری دین خدا» را در کار روزانه‌ام معنا کنم؟',
    '49:10': 'میان کدام دو نفر می‌توانم آشتی ایجاد کنم؟',
    '49:13': 'کجا کسی را با معیاری غیر از تقوا سنجیده‌ام؟',
    '50:16': 'اگر باور کنم خدا از رگ گردن به من نزدیک‌تر است، امروز چه چیزی عوض می‌شود؟',
    '51:56': 'کدام کار عادی امروزم را می‌توانم به عبادت تبدیل کنم؟',
    '55:13': 'سه نعمتی که امروز دیدم و کمتر به آن فکر کرده بودم چیست؟',
    '55:60': 'به کسی که به من نیکی کرده، چه نیکی‌ای برگردانم؟',
    '57:16': 'چه چیزی دلم را سخت کرده و چطور دوباره نرمش کنم؟',
    '59:18': 'برای «فردای» خودم امروز چه چیزی از پیش می‌فرستم؟',
    '64:16': '«تا می‌توانید» تقوا داشته باشید؛ توان امروز من کجاست؟',
    '65:3': 'در کدام کار باید بیشتر توکل کنم و کمتر نگران باشم؟',
    '67:2': 'اگر زندگی امتحان «بهترین عمل» است، بهترین کار امروزم چه می‌تواند باشد؟',
    '76:8': 'امروز چه چیزی را که خودم دوست دارم به نیازمندی می‌دهم؟',
    '89:27': 'چه چیزی جانم را آرام می‌کند و چه چیزی آرامشم را می‌گیرد؟',
    '93:5': 'کدام وعده خدا دلم را امیدوار می‌کند؟',
    '93:11': 'امروز از کدام نعمت خدا برای دیگران با شکر سخن می‌گویم؟',
    '94:5': 'کدام سختی گذشته‌ام بعدها آسانی آورد؟',
    '97:3': 'یک ساعت «قدر» را در زندگی امروزم چطور پیدا کنم؟',
    '2:110': 'کدام کار خیر امروز را برای آخرتم «از پیش می‌فرستم»؟',
    '3:159': 'نرمی و مشورت را در کدام رابطه‌ام بیشتر لازم دارم؟',
    '4:58': 'کدام امانت (چیز، حرف یا مسئولیت) را باید درست‌تر ادا کنم؟',
    '7:204': 'آخرین باری که با سکوت و توجه به قرآن گوش دادم کی بود؟',
    '11:115': 'کدام کار نیکم دیده نشده؟ این آیه درباره آن چه می‌گوید؟',
    '8:46': 'کدام کشمکش بی‌حاصل را باید رها کنم؟',
    '16:90': 'عدل، احسان و رسیدگی به خویشان؛ امروز کدام را بیشتر انجام دهم؟',
    '39:9': 'امشب چند دقیقه از خوابم را به راز و نیاز می‌دهم؟'
  };

  const css = `
#dwCard{display:block;margin:6px 0 16px;padding:10px 14px;background:var(--cream);color:var(--ink);text-shadow:none;border:1px solid var(--gold);border-radius:var(--r-card);line-height:1.8;font-size:16px}
html[data-bg] #dwCard{background:var(--t-paper);color:var(--t-ink);padding:12px 34px;margin:30px 24px}
#dwCard[hidden]{display:none}
#dwCard .dw-it+.dw-it{margin-top:10px;padding-top:10px;border-top:1px dashed var(--t-line,var(--line))}
#dwCard h3{margin:0 0 4px;font-size:14.5px;font-weight:700;color:var(--t-head,var(--deep));text-align:center}
#dwCard .dw-ar{margin:0;font:400 22px/2 QuranHafs,'Traditional Arabic',serif;text-align:center;color:var(--t-head,var(--deep))}
#dwCard .dw-ar.h{font:500 19px/2 Vazirmatn,Tahoma,sans-serif}
#dwCard .dw-fa{margin:4px 0 0;font-size:15.5px;text-align:center}
#dwCard .dw-src{display:block;margin-top:2px;font-size:13px;color:var(--t-ink2,var(--muted));text-align:center}
#dwCard .dw-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:6px}
#dwCard .dw-btns button{height:auto;min-height:40px;padding:2px 12px;background:transparent!important;color:var(--t-head,var(--deep))!important;filter:none!important;border:1px solid var(--t-line,var(--line));border-radius:var(--pill);font-size:14px;font-weight:600}
#dwCard .dw-btns button:hover{background:var(--hover)!important}
#dwCard .dw-q{margin:8px 0 0;padding:6px 10px;border-radius:var(--r);background:color-mix(in srgb,var(--t-frame,var(--emerald)) 10%,transparent);font-size:15px;text-align:center;color:var(--t-head,var(--deep))}
#dwCard .dw-wait{margin:0;text-align:center;font-size:14px;color:var(--t-ink2,var(--muted))}
@media(max-width:600px){html[data-bg] #dwCard{margin:26px 18px;padding:10px 20px}#dwCard .dw-ar{font-size:20px}}`;
  { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }

  // روز امروز (به وقت شهر کارت «امروز»)، و شماره روز از ۱۹۷۰ برای چرخش
  const today = () => { try { return window.dailyInfo?.today() || new Date().toISOString().slice(0, 10); } catch { return new Date().toISOString().slice(0, 10); } };
  const dayNo = iso => Math.floor(Date.parse(iso + 'T00:00:00Z') / 864e5);

  const cache = {};
  const getJson = u => cache[u] || (cache[u] = fetch(u).then(r => { if (!r.ok) throw Error(r.status); return r.json(); }).catch(e => { delete cache[u]; throw e; }));
  const lastLE = (a, g) => { let i = 0; while (i + 1 < a.length && a[i + 1] <= g) i++; return i; };

  async function ayah(n) {
    const [s, v] = AYAT[n % AYAT.length], ix = await getJson('quran/index.json');
    const g = ix.surah[s - 1] + v - 1, p = lastLE(ix.portion, g);
    const d = await getJson(`quran/p/${String(p + 1).padStart(3, '0')}.json`);
    const seg = d.segments.find(x => x.s === s && x.from <= v && v < x.from + x.ayahs.length);
    if (!seg) throw Error('no ayah');
    const [ar, tr] = seg.ayahs[v - seg.from];
    return { s, v, g, ar, tr, name: seg.fa, page: lastLE(ix.page, g) + 1, ix, ref: `${s}:${v}`, q: Q[`${s}:${v}`] || '' };
  }
  async function hadith(n) {
    const k = HK[(n * 7) % HK.length], nnn = String(k).padStart(3, '0'); // گام ۷: هر روز از جای دیگری از کتاب
    const d = await getJson(`books/nahj/hikmat/${nnn}.json`);
    const x = d.sections.find(s => s.ar);
    return { n: k, ar: String(x.ar).replace(/^\s*(?:وَ\s*)?قَالَ\s*\(عليه السلام\)\s*:\s*/, ''), tr: String(x.fa || '').replace(/^\s*و?\s*درود خدا بر او فرمود:\s*/, ''), note: `نهج‌البلاغه، حکمت ${toFa(k)}` };
  }

  let card = null, data = {}, dayKey = '';
  function place() {
    if (card?.isConnected) return card;
    const intro = document.getElementById('introPanel'); if (!intro) return null;
    card = document.createElement('section'); card.id = 'dwCard'; card.setAttribute('aria-label', 'آیه و سخن روز');
    const after = document.getElementById('dlCard') || intro.querySelector('.intro-head') || intro.querySelector(':scope > .tagline') || intro.querySelector(':scope > h2');
    if (intro.querySelector('.intro-head')) { card.className = 'bgx-frame bgx-in'; setTimeout(() => card.classList.add('bgx-done'), 1300); }
    after?.after(card);
    card.addEventListener('click', onClick);
    return card;
  }
  async function render() {
    const A = shown('ayahday'), H = shown('hadithday');
    if (!A && !H) { card?.remove(); return; }
    if (!place()) return;
    // کارت «امروز» گاهی بعد از این کارت دوباره ساخته می‌شود؛ این کارت همیشه زیر آن می‌ماند.
    const dl = document.getElementById('dlCard'); if (dl && dl.nextElementSibling !== card) dl.after(card);
    const iso = today(), n = dayNo(iso);
    if (dayKey !== iso) { dayKey = iso; data = {}; }
    if (A && !data.a) data.a = ayah(n).catch(() => null);
    if (H && !data.h) data.h = hadith(n).catch(() => null);
    if (!card.innerHTML) card.innerHTML = '<p class="dw-wait">…</p>';
    const [a, h] = await Promise.all([A ? data.a : null, H ? data.h : null]);
    if (!card.isConnected) return;
    const share = shown('share') && window.shareCard, copy = shown('copy');
    let html = '';
    if (a) html += `<div class="dw-it"><h3>📖 آیه روز</h3><p class="dw-ar" lang="ar" dir="rtl">${esc(a.ar)}</p><p class="dw-fa">${esc(a.tr)}</p><small class="dw-src">سوره ${esc(a.name)}، آیه ${toFa(a.v)} · ترجمه آیت‌الله مکارم شیرازی</small>
${shown('reflect') && a.q ? `<p class="dw-q">🤔 <b>تأمل:</b> ${esc(a.q)}</p>` : ''}
<div class="dw-btns"><button type="button" data-dw="read">خواندن در قرآن</button>${shown('reflect') && a.q && window.learn ? '<button type="button" data-dw="rf">✍️ برداشت من</button>' : ''}${share ? '<button type="button" data-dw="img-a">🖼️ تصویر</button>' : ''}${copy ? '<button type="button" data-dw="cp-a">📋 کپی</button>' : ''}</div></div>`;
    if (h) html += `<div class="dw-it"><h3>💬 سخن روز</h3><p class="dw-ar h" lang="ar" dir="rtl">${esc(h.ar)}</p><p class="dw-fa">${esc(h.tr)}</p><small class="dw-src">امیرالمؤمنین علی (ع)، ${esc(h.note)}</small>
<div class="dw-btns">${window.books?.read ? '<button type="button" data-dw="more">سخنان بیشتر</button>' : ''}${share ? '<button type="button" data-dw="img-h">🖼️ تصویر</button>' : ''}${copy ? '<button type="button" data-dw="cp-h">📋 کپی</button>' : ''}</div></div>`;
    if (!html) { card.remove(); return; }
    if (card.innerHTML !== html) card.innerHTML = html;
  }
  function toast(t) {
    const d = document.createElement('div'); d.className = 'ft-toast'; d.setAttribute('role', 'status'); d.textContent = t;
    document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
  }
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); toast('📋 متن کپی شد'); } catch { toast('کپی انجام نشد'); }
  }
  async function onClick(e) {
    const b = e.target.closest('[data-dw]'); if (!b) return;
    const x = b.dataset.dw, a = await data.a, h = await data.h;
    if (x === 'read' && a && window.quranReader) {
      const ix = a.ix, p = a.page, from = ix.page[p - 1], to = p < 604 ? ix.page[p] : ix.total;
      window.quranReader.openRange({ title: `سوره ${a.name}، آیه ${toFa(a.v)}`, sub: `آیه روز · صفحه ${toFa(p)} قرآن`, from, to, focus: a.g, endText: `پایان صفحه ${toFa(p)}` });
    }
    if (x === 'rf' && a) window.learn?.sheet('reflect', { ref: a.ref, ar: a.ar, tr: a.tr, name: a.name, v: a.v, q: a.q });
    if (x === 'more' && h) window.books.read('nahj', 'hikmat', h.n);
    if (x === 'img-a' && a) window.shareCard({ ar: a.ar, fa: a.tr, title: `سوره ${a.name}، آیه ${toFa(a.v)}`, file: 'nooran-ayah' });
    if (x === 'img-h' && h) window.shareCard({ ar: h.ar, fa: h.tr, title: `امیرالمؤمنین علی (ع)، ${h.note}`, file: 'nooran-hadith' });
    if (x === 'cp-a' && a) copy(`${a.ar}\n\n${a.tr}\n\n(سوره ${a.name}، آیه ${toFa(a.v)}) · نوران`);
    if (x === 'cp-h' && h) copy(`${h.ar}\n\n${h.tr}\n\n(امیرالمؤمنین علی (ع)، ${h.note}) · نوران`);
  }
  ['features:changed', 'settings:changed'].forEach(ev => document.addEventListener(ev, render));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && dayKey && dayKey !== today()) render(); });
  // کارت «امروز» با هر بار ساختن دوباره ممکن است جابه‌جا شود؛ پس از بار شدن صفحه یک بار دیگر جای کارت درست می‌شود.
  render(); setTimeout(render, 1500);
})();
