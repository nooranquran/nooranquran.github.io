// کتاب‌ها: نهج‌البلاغه و صحیفه سجادیه (و در دسته «بیشتر»: منتهی‌الآمال و رساله حقوق)، متن عربی با چند ترجمه (فارسی و زبان‌های دیگر) و صوت.
// - منوی سه‌خط (menu.js): بخش «کتاب‌ها»؛ هر کتاب برگه فهرست (بخش‌ها، جستجو، ادامه خواندن) و خواننده تمام‌صفحه دارد.
// - داده‌ها در books/<کتاب>/index.json (فهرست، مترجم‌ها، صوت‌ها) و books/<کتاب>/<بخش>/<NNN>.json (یک فایل برای هر خطبه، نامه، حکمت یا دعا).
//   قالب هر فایل همان قالب متن‌های چله (chelleh/*.json) است: {title, about?, sections: [{ar, fa?, tr?: {<مترجم>: متن}, note?}], audio?: [{name, url}]}؛
//   fa ترجمه مترجم اول فهرست است و بقیه در tr. جزئیات منبع‌ها در books/README.txt.
// - خواننده همان ظاهر خواننده متن‌های چله (کلاس‌های .cr در chelleh.js) را دارد؛ تنظیمات زبان و مترجم مثل قرآن‌خوان است.
// خود برگه‌ها و خواننده (books-page.js) فقط با اولین باز کردن یک کتاب بار می‌شوند تا صفحه اول سبک‌تر باشد.
// پیوند مستقیم: ‎?book=nahj‎ یا ‎?book=nahj&n=khutbah-1‎ (کتاب، بخش و شماره)؛ کتاب مقدس: ‎?book=jadid&n=joh-3‎ (کتاب، باب).
// کتاب مقدس (atiq، jadid) متن اصلی‌اش فارسی است (index.json → main) و آیه‌ها شماره دارند (v، ve)؛ جزئیات در tools/books/build_bible.py.
(function () {
  const BOOKS = [
    { key: 'nahj', title: 'نهج‌البلاغه', icon: '📕', sub: 'خطبه‌ها، نامه‌ها و حکمت‌های امام علی (ع)' },
    { key: 'sahifa', title: 'صحیفه سجادیه', icon: '📗', sub: 'دعاهای امام سجاد (ع)' },
    // کتاب‌های دسته «بیشتر» ته منو (more.js)، نه بخش «کتاب‌ها»؛ ساخت با tools/books/build_more.py.
    { key: 'muntaha', title: 'منتهی‌الآمال', icon: '📜', sub: 'زندگانی چهارده معصوم (ع)، نوشته محدث قمی', more: true },
    { key: 'huquq', title: 'رساله حقوق', icon: '⚖️', sub: 'پنجاه حق از امام سجاد (ع)', more: true },
    // بخش «دیگر کتب مقدس» (scripture: true): کتاب مقدس با ترجمه قدیم فارسی و ترجمه‌های دیگر؛ ساخت با tools/books/build_bible.py.
    { key: 'atiq', title: 'عهد عتیق (تورات و کتب انبیا)', icon: '📜', sub: 'تورات موسی، مزامیر داود (زبور) و کتاب‌های پیامبران، ترجمه فارسی معاصر', scripture: true },
    { key: 'jadid', title: 'عهد جدید (انجیل)', icon: '✝️', sub: 'چهار انجیل، اعمال رسولان، نامه‌ها و مکاشفه', scripture: true }
  ];
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const LAST = 'bookLast'; // همان کلید books-page.js: جای آخرین خواندن هر کتاب
  let loading = null;
  const load = () => loading || (loading = new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = 'books-page.js?v=5';
    s.onload = ok; s.onerror = () => { loading = null; s.remove(); bad(); };
    document.head.appendChild(s);
  }));
  const later = f => load().then(() => f(window.booksPage)).catch(() => alert('بارگذاری کتاب انجام نشد. اینترنت را بررسی کنید.'));
  const openSheet = key => later(P => P.openSheet(key));
  const openReader = (key, part, n) => later(P => P.openReader(key, part, n));

  // ---------- منو ----------
  window.siteMenu?.section({
    id: 'books', order: 7,
    render(box) {
      box.innerHTML = `<h3>کتاب‌ها</h3>${items(BOOKS.filter(b => !b.more && !b.scripture))}`;
      wire(box);
    }
  });
  // «دیگر کتب مقدس»: کتاب‌هایی که قرآن از آن‌ها یاد کرده (تورات، زبور، انجیل)، از ترجمه‌های آزاد و معتبر.
  window.siteMenu?.section({
    id: 'scripture', order: 7.5,
    render(box) { box.innerHTML = `<h3>دیگر کتب مقدس</h3>${items(BOOKS.filter(b => b.scripture))}`; wire(box); }
  });
  function items(list) {
    const last = read(LAST, {});
    return list.map(b => `<button type="button" class="sm-item" data-bk-book="${b.key}"><span class="sm-ic">${b.icon}</span><span>${b.title}<small>${last[b.key] ? 'ادامه از جایی که خواندید' : b.sub}</small></span><span class="sm-go">‹</span></button>`).join('');
  }
  function wire(box) { box.querySelectorAll('[data-bk-book]').forEach(x => x.onclick = () => { window.siteMenu.close(); setTimeout(() => openSheet(x.dataset.bkBook), 280); }); }
  window.books = { open: openSheet, read: openReader, more: BOOKS.filter(b => b.more), list: BOOKS };

  // پیوند ‎?book=nahj‎ یا ‎?book=sahifa&n=dua-20‎
  const qs = new URLSearchParams(location.search), qb = qs.get('book');
  if (qb && BOOKS.some(b => b.key === qb)) {
    const m = /^([a-z]+)-(\d+)$/.exec(qs.get('n') || '');
    try { const u = new URL(location.href); u.searchParams.delete('book'); u.searchParams.delete('n'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
    later(P => { P.openSheet(qb); if (m) P.openReader(qb, m[1], +m[2]); });
  }
})();
