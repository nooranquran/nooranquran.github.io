// دور هفتم: ایده‌های برگرفته از سایت‌ها و برنامه‌های مشابه (Quran.com، QuranReflect، Muslim Pro و برنامه‌های مذهبی کافه‌بازار).
// هر کدام یک امکان در features.js دارد؛ برگه‌ها در learn-sheets.js هستند که فقط با اولین باز کردن یکی از آن‌ها بار می‌شود.
// - learn: برنامه‌های کوتاه یادگیری (۷ روز با سوره حمد، آیة‌الکرسی، یس، ملک، حجرات، اندرزهای لقمان، سوره‌های کوتاه)، با پیام‌های تفسیر نور.
// - reflect: پرسش تأمل زیر آیه روز (daily-words.js) و برداشت‌های کوتاه اعضا که پس از تأیید مدیر دیده می‌شوند (backend/supabase/reflections.sql).
// - asma: اسماء الحسنی؛ greet: کارت تبریک عیدها و ولادت‌ها در کارت «امروز»؛ live: پیوند پخش زنده حرم‌ها از سایت‌های داخل ایران.
// بیرون از امکان‌ها:
// - میان‌برهای نماد برنامه (manifest.webmanifest › shortcuts): ‎?go=portion|report|zekr|qibla|learn‎ همان بخش را باز می‌کند.
// - مینی‌اپ بله و ایتا: نشانی ‎?app=bale‎ یا ‎?app=eitaa‎ (که در ربات پیام‌رسان ثبت می‌شود). guard.js همان اول hezbApp را می‌گذارد
//   تا بخش نصب و اعلان‌ها (که درون پیام‌رسان کار نمی‌کنند) پنهان شوند؛ اینجا کتابخانه پیام‌رسان بار می‌شود و صفحه تمام‌قد باز می‌شود.
(function () {
  const shown = id => !!window.features?.shown(id);
  const fa = '۰۱۲۳۴۵۶۷۸۹', toFa = x => String(x).replace(/\d/g, d => fa[d]);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- بار کردن برگه‌ها ----------
  let loading = null;
  const load = () => loading || (loading = new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = 'learn-sheets.js?v=1';
    s.onload = ok; s.onerror = () => { loading = null; s.remove(); bad(); };
    document.head.appendChild(s);
  }));
  const sheet = (name, arg) => load().then(() => window.learnSheets[name](arg)).catch(() => alert('بارگذاری انجام نشد. اینترنت را بررسی کنید.'));

  // ---------- منو: هر گزینه کنار گزینه هم‌خانواده‌اش ----------
  const item = (k, ic, t, s) => `<button type="button" class="sm-item" data-ln-open="${k}"><span class="sm-ic">${ic}</span><span>${esc(t)}<small>${esc(s)}</small></span><span class="sm-go">‹</span></button>`;
  const PLANS = 'learnPlans';
  const learnSub = () => {
    let p = {}; try { p = JSON.parse(localStorage.getItem(PLANS)) || {}; } catch {}
    const on = Object.values(p).filter(x => x && Array.isArray(x.done) && x.done.length).length;
    return on ? `${toFa(on)} برنامه شروع‌شده` : '۷ روز با سوره حمد، یس در ۱۰ روز و…';
  };
  window.siteMenu?.section({
    id: 'learn', order: 5.95,
    render(box) {
      const put = (sel, html, head) => { const a = sel.map(s => document.querySelector(`.sm ${s}`)).find(Boolean); if (a) a.insertAdjacentHTML('afterend', html); else box.insertAdjacentHTML('beforeend', `<h3>${head}</h3>${html}`); };
      if (shown('learn')) put(['[data-nm-open="plan"]', '[data-qp-saved]', '[data-qf-open]'], item('learn', '🎓', 'برنامه‌های کوتاه یادگیری', learnSub()), 'قرآن');
      if (shown('asma')) put(['[data-zk-open]'], item('asma', '✨', 'اسماء الحسنی', 'نودونه نام خداوند، با معنی'), 'ذکر و تسبیح');
      if (shown('live')) put(['[data-qb-menu]', '[data-cal-menu]'], item('live', '📡', 'پخش زنده حرم‌ها', 'حرم امام رضا (ع)، حضرت معصومه (س) و جمکران'), 'زیارت');
    }
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ln-open]'); if (!b) return;
    window.siteMenu?.close(); setTimeout(() => sheet(b.dataset.lnOpen), 280);
  });
  document.addEventListener('features:changed', () => window.siteMenu?.refresh());

  // ---------- کارت تبریک در کارت «امروز» (greet) ----------
  // [ماه قمری، روز، کلید، عنوان کارت]؛ متن عربی و ترجمه هر کلید در GREET.
  const DAYS = [[10, 1, 'eid', 'عید سعید فطر مبارک'], [12, 10, 'eid', 'عید سعید قربان مبارک'], [12, 18, 'ghadir', 'عید سعید غدیر خم مبارک'],
    [7, 27, 'mabath', 'عید سعید مبعث مبارک'], [3, 17, 'nabi', 'میلاد پیامبر اکرم (ص) و امام صادق (ع) مبارک'], [8, 15, 'mahdi', 'میلاد امام زمان (عج) مبارک'],
    [7, 13, 'ali', 'میلاد امیرالمؤمنین علی (ع) مبارک'], [6, 20, 'zahra', 'میلاد حضرت فاطمه زهرا (س) مبارک'], [8, 3, 'husain', 'میلاد امام حسین (ع) مبارک'],
    [8, 4, 'salawat', 'میلاد حضرت ابوالفضل العباس (ع) مبارک'], [8, 5, 'salawat', 'میلاد امام سجاد (ع) مبارک'], [9, 15, 'hasan', 'میلاد امام حسن مجتبی (ع) مبارک'],
    [11, 1, 'masumeh', 'میلاد حضرت فاطمه معصومه (س) مبارک'], [11, 11, 'reza', 'میلاد امام رضا (ع) مبارک'], [7, 1, 'salawat', 'میلاد امام محمد باقر (ع) مبارک'],
    [7, 10, 'salawat', 'میلاد امام محمد تقی الجواد (ع) مبارک'], [12, 15, 'salawat', 'میلاد امام علی النقی الهادی (ع) مبارک'], [4, 8, 'salawat', 'میلاد امام حسن عسکری (ع) مبارک'],
    [5, 5, 'salawat', 'میلاد حضرت زینب (س) مبارک'], [2, 7, 'salawat', 'میلاد امام موسی کاظم (ع) مبارک']];
  const GREET = {
    eid: ['تَقَبَّلَ اللّهُ مِنّا وَمِنْكُمْ', 'خداوند از ما و شما بپذیرد.', ''],
    ghadir: ['الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي', 'امروز دینتان را برایتان کامل کردم و نعمتم را بر شما تمام نمودم.', 'سوره مائده، آیه ۳'],
    mabath: ['اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', 'بخوان به نام پروردگارت که آفرید.', 'سوره علق، آیه ۱'],
    nabi: ['وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِلْعَالَمِينَ', 'ما تو را جز برای رحمت جهانیان نفرستادیم.', 'سوره انبیاء، آیه ۱۰۷'],
    mahdi: ['بَقِيَّتُ اللَّهِ خَيْرٌ لَكُمْ إِنْ كُنْتُمْ مُؤْمِنِينَ', 'آنچه خدا برایتان باقی گذارده، برایتان بهتر است اگر ایمان داشته باشید.', 'سوره هود، آیه ۸۶'],
    ali: ['عَلِيٌّ مَعَ الْحَقِّ وَالْحَقُّ مَعَ عَلِيٍّ', 'علی با حق است و حق با علی.', 'پیامبر اکرم (ص)'],
    zahra: ['إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', 'ما به تو کوثر [خیر فراوان] عطا کردیم.', 'سوره کوثر، آیه ۱'],
    husain: ['حُسَيْنٌ مِنِّي وَأَنَا مِنْ حُسَيْنٍ', 'حسین از من است و من از حسینم.', 'پیامبر اکرم (ص)'],
    hasan: ['الْحَسَنُ وَالْحُسَيْنُ سَيِّدَا شَبَابِ أَهْلِ الْجَنَّةِ', 'حسن و حسین سرور جوانان اهل بهشت‌اند.', 'پیامبر اکرم (ص)'],
    masumeh: ['يا فاطِمَةُ اشْفَعي لي فِي الْجَنَّةِ', 'ای فاطمه، در بهشت شفیع من باش.', 'زیارت حضرت معصومه (س)'],
    reza: ['السَّلامُ عَلَيْكَ يا عَلِيَّ بْنَ موسَى الرِّضا الْمُرْتَضى', 'سلام بر تو ای علی بن موسی الرضا.', 'زیارت امام رضا (ع)'],
    salawat: ['اللّهُمَّ صَلِّ عَلى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ', 'خدایا بر محمد و خاندان محمد درود فرست و در فرجشان شتاب کن.', '']
  };
  const D = window.daily;
  const greetOf = iso => {
    const h = D?.hijri(iso); if (!h) return [];
    return DAYS.filter(([m, d]) => h.m === m && h.d === d);
  };
  if (D) {
    document.head.insertAdjacentHTML('beforeend', `<style>
#dlCard .ln-gc{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:6px 0 2px}
#dlCard .ln-gc button{height:auto;min-height:40px;padding:2px 14px;background:transparent!important;color:var(--dl-h)!important;filter:none!important;border:1px solid var(--dl-line);border-radius:var(--pill);font-size:14px;font-weight:600}
#dlCard .ln-gc button:hover{background:var(--dl-soft)!important}
</style>`);
    // پس از اذان صبح همان روز؛ پیش از آن هنوز روز قبل است (مثل بقیه کارت «امروز»).
    D.block(({ iso, T, now }) => {
      if (!shown('greet') || !window.shareCard) return '';
      const day = now < T.fajr ? D.addDays(iso, -1) : iso;
      return greetOf(day).map(([m, d, k, t]) => `<div class="ln-gc"><button type="button" data-ln-greet="${m}-${d}">🎉 کارت تبریک: ${esc(t.replace(/ مبارک$/, ''))}</button></div>`).join('');
    });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-ln-greet]'); if (!b) return;
      const [m, d] = b.dataset.lnGreet.split('-').map(Number), x = DAYS.find(r => r[0] === m && r[1] === d); if (!x) return;
      const [ar, tr, src] = GREET[x[2]];
      window.shareCard?.({ ar, fa: tr, title: x[3], sub: src, file: 'nooran-greeting' });
    });
  }

  // ---------- پرسش تأمل روز (reflect): دکمه‌ها در کارت آیه روز (daily-words.js) ----------
  // برداشت‌ها با شناسه تصادفی همین گوشی (همان کد «پیشنهادها و نظرها»، localStorage: fbDevice) فرستاده می‌شوند.
  // مدیر برداشت‌ها را در زبانه «نظرها» (کارت زیر پیام‌ها) تأیید یا حذف می‌کند؛ feedback.js پیش از این، محتوای زبانه را ساخته است.
  document.addEventListener('admin:tab', e => {
    if (e.detail !== 'fb' || !shown('reflect')) return;
    setTimeout(() => { const p = document.getElementById('pane-fb'); if (p) load().then(() => window.learnSheets.adminCard(p)).catch(() => {}); }, 0);
  });

  // ---------- میان‌برهای نماد برنامه ----------
  const qs = new URLSearchParams(location.search), goTo = qs.get('go');
  if (goTo) {
    try { const u = new URL(location.href); u.searchParams.delete('go'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
    const reveal = id => {
      window.hezbReveal?.();
      const el = document.getElementById(id), panel = el && (el.closest('.panel') || el);
      if (!panel) return;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (el.tagName === 'INPUT' && !el.value) setTimeout(() => el.focus({ preventScroll: true }), 400);
    };
    // تنظیمات سایت (کدام امکان روشن است) کمی پس از بار شدن صفحه می‌رسد؛ تا ۶ ثانیه صبر می‌شود.
    const need = { zekr: 'zekr', qibla: 'qibla', learn: 'learn' }[goTo];
    let tries = 0;
    const run = () => {
      if (need && !shown(need)) { if (++tries < 12) setTimeout(run, 500); return; }
      if (goTo === 'portion') reveal('pid');
      else if (goTo === 'report') reveal('reportId');
      else if (goTo === 'zekr') window.zekr?.open?.();
      else if (goTo === 'qibla') window.qibla?.open?.();
      else if (goTo === 'learn') sheet('learn');
    };
    document.readyState === 'complete' ? setTimeout(run, 400) : addEventListener('load', () => setTimeout(run, 400), { once: true });
  }

  // ---------- مینی‌اپ بله و ایتا ----------
  const mini = (() => { try { return sessionStorage.getItem('miniApp') || ''; } catch { return ''; } })();
  if (mini === 'bale' || mini === 'eitaa') {
    document.documentElement.setAttribute('data-mini', mini);
    // کتابخانه هر پیام‌رسان شیء WebApp را می‌سازد (مانند مینی‌اپ تلگرام). اگر بار نشد، سایت همان‌طور کار می‌کند.
    const SDK = { bale: 'https://tapi.bale.ai/miniapp.js', eitaa: 'https://developer.eitaa.com/eitaa-web-app.js' }[mini];
    const s = document.createElement('script'); s.src = SDK; s.async = true;
    s.onload = () => {
      const W = (mini === 'bale' ? window.Bale : window.Eitaa)?.WebApp || window.Telegram?.WebApp;
      try { W?.ready?.(); W?.expand?.(); } catch {}
    };
    document.head.appendChild(s);
  }

  window.learn = { sheet, shown, toFa, esc, greetOf, DAYS, GREET };
})();
