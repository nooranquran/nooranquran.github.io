window.APP_CONFIG = {
  SUPABASE_URL: 'https://wnswskzgfaywpmjhdgnx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_oMecZYzkE826ignXDc72Bw_mmHBpWmu',
  // کلید عمومی اعلان (VAPID). کلید خصوصی جفت آن فقط در Secrets تابع daily-reminders در Supabase است.
  VAPID_PUBLIC_KEY: 'BKrQ8ZqCBoafCsGdmyVecm9MnhBie3U6JQARQYUf3drvvKVQonnfYEPlkh3TEy4uD54uf0Sp9csZxiAwEpqHVSw'
};
// وقتی سرور Supabase از اینترنت ایران (بدون فیلترشکن) در دسترس نیست، همان درخواست از راه رله Cloudflare فرستاده می‌شود
// (backend/cloudflare/relay.js). درخواست مستقیم هیچ‌وقت به خاطر کندی قطع نمی‌شود (با اینترنت کند ایران، جواب گاهی ۱۰ ثانیه طول می‌کشد
// و پیش از این، ثبت‌هایی که بیش از ۶ ثانیه طول می‌کشید قطع می‌شد و گزارش و تیک چله به سرور نمی‌رسید).
// خواندن‌ها و ثبت‌هایی که تکرارشان بی‌ضرر است (گزارش روزانه، تیک چله): اگر مسیر اول تا ۵ ثانیه جواب نداد یا خطا داد، مسیر دوم هم هم‌زمان امتحان می‌شود
// و اولین جواب موفق به کار می‌رود. ثبت‌های دیگر (ثبت‌نام، …) دوبار فرستاده نمی‌شوند: مسیر دوم فقط وقتی که مسیر اول واقعاً خطا داد.
// راهی که جواب داد تا ۶ ساعت اول امتحان می‌شود. SUPABASE_PROXY خالی یعنی رله خاموش؛ نشانی رله باید در connect-src و img-src سیاست امنیتی index.html هم باشد.
self.APP_CONFIG.SUPABASE_PROXY = 'https://nooran-relay.hosseinkavianirad.workers.dev';
(function () {
  const c = self.APP_CONFIG, P = c.SUPABASE_PROXY, base = c.SUPABASE_URL;
  if (!P || typeof self.fetch !== 'function') return;
  const orig = self.fetch.bind(self), K = 'sbRoute';
  const first = () => { try { const v = JSON.parse(localStorage.getItem(K)); return v && Date.now() - v.at < 6 * 3600e3 ? v.via : null; } catch { return null; } };
  const remember = via => { try { localStorage.setItem(K, JSON.stringify({ via, at: Date.now() })); } catch {} };
  const READ_RPC = /^rpc\/(chl_types|chl_lookup|chl_type_rounds|reg_rounds|hezb_reported_days|hezb_report_history|khatm_list|reg_lookup|my_|.*_list$|.*_get$)/;
  // ثبت‌هایی که اگر دو بار برسند، فقط یک بار ثبت می‌شوند (گزارش تکراری ۴۰۹ می‌گیرد؛ chl_mark با on conflict do nothing).
  const SAFE_WRITE = /^(daily_reports(\?|$)|rpc\/chl_mark$)/;
  const parallel = (path, init) => { const m = ((init && init.method) || 'GET').toUpperCase(); return m === 'GET' || m === 'HEAD' || (m === 'POST' && (READ_RPC.test(path) || SAFE_WRITE.test(path))); };
  self.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';
    if (!url.startsWith(base + '/')) return orig(input, init);
    const path = url.slice(base.length + '/rest/v1/'.length), sig = init && init.signal;
    const order = first() === 'proxy' ? [P, base] : [base, P], ctrls = [];
    const attempt = to => { const ac = new AbortController(); ctrls.push(ac); const stop = () => ac.abort(); if (sig) sig.addEventListener('abort', stop, { once: true });
      return orig(to + url.slice(base.length), Object.assign({}, init, { signal: ac.signal })).then(r => { if (r.status < 500) remember(to === P ? 'proxy' : 'direct'); return r; }); };
    if (sig && sig.aborted) return Promise.reject(sig.reason || new DOMException('Aborted', 'AbortError'));
    if (parallel(path, init)) {
      // اولین جواب سرور (حتی ۴۰۹ «قبلاً ثبت شده») به کار می‌رود و دیگری لغو می‌شود. خطای ۵xx (مثلاً از رله) فقط وقتی برگردانده می‌شود که مسیر دیگر هم تمام شده باشد.
      return new Promise((resolve, reject) => {
        let done = false, started = 1, finished = 0, err, bad, timer;
        const end = () => { if (done || finished < started) return; if (started === 1 && !(sig && sig.aborted)) return second(); done = true; clearTimeout(timer); bad ? resolve(bad) : reject(err); };
        const second = () => { clearTimeout(timer); if (started === 2 || done || (sig && sig.aborted)) return; started = 2; go(order[1], 1); };
        const go = (to, i) => attempt(to).then(r => { if (done) return; if (r.status < 500) { done = true; clearTimeout(timer); ctrls.forEach((a, j) => j !== i && a.abort()); return resolve(r); } finished++; bad = bad || r; end(); },
          e => { err = e; finished++; end(); });
        go(order[0], 0); timer = setTimeout(second, 5000);
      });
    }
    return attempt(order[0]).catch(e => { if (sig && sig.aborted) throw e; return attempt(order[1]); });
  };
})();
