window.APP_CONFIG = {
  SUPABASE_URL: 'https://wnswskzgfaywpmjhdgnx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_oMecZYzkE826ignXDc72Bw_mmHBpWmu',
  // کلید عمومی اعلان (VAPID). کلید خصوصی جفت آن فقط در Secrets تابع daily-reminders در Supabase است.
  VAPID_PUBLIC_KEY: 'BKrQ8ZqCBoafCsGdmyVecm9MnhBie3U6JQARQYUf3drvvKVQonnfYEPlkh3TEy4uD54uf0Sp9csZxiAwEpqHVSw'
};
// وقتی سرور Supabase از اینترنت ایران (بدون فیلترشکن) در دسترس نیست، همان درخواست از راه رله Cloudflare فرستاده می‌شود
// (backend/cloudflare/relay.js). خواندن‌ها: اگر مسیر اول تا ۳ ثانیه جواب نداد، مسیر دوم هم هم‌زمان امتحان می‌شود و هر کدام زودتر جواب داد به کار می‌رود
// (چون بعضی بخش‌ها خودشان بعد از ۵ ثانیه منصرف می‌شوند). ثبت‌ها (گزارش، ثبت‌نام، تیک چله…) دوبار فرستاده نمی‌شوند: اول یک مسیر تا ۶ ثانیه، بعد مسیر دیگر.
// راهی که جواب داد تا ۶ ساعت اول امتحان می‌شود. SUPABASE_PROXY خالی یعنی رله خاموش؛ نشانی رله باید در connect-src و img-src سیاست امنیتی index.html هم باشد.
self.APP_CONFIG.SUPABASE_PROXY = 'https://nooran-relay.hosseinkavianirad.workers.dev';
(function () {
  const c = self.APP_CONFIG, P = c.SUPABASE_PROXY, base = c.SUPABASE_URL;
  if (!P || typeof self.fetch !== 'function') return;
  const orig = self.fetch.bind(self), K = 'sbRoute';
  const first = () => { try { const v = JSON.parse(localStorage.getItem(K)); return v && Date.now() - v.at < 6 * 3600e3 ? v.via : null; } catch { return null; } };
  const remember = via => { try { localStorage.setItem(K, JSON.stringify({ via, at: Date.now() })); } catch {} };
  const READ_RPC = /^rpc\/(chl_types|chl_lookup|chl_type_rounds|reg_rounds|hezb_reported_days|hezb_report_history|khatm_list|reg_lookup|my_|.*_list$|.*_get$)/;
  const isRead = (path, init) => { const m = ((init && init.method) || 'GET').toUpperCase(); return m === 'GET' || m === 'HEAD' || (m === 'POST' && READ_RPC.test(path)); };
  self.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';
    if (!url.startsWith(base + '/')) return orig(input, init);
    const path = url.slice(base.length + '/rest/v1/'.length), sig = init && init.signal;
    const order = first() === 'proxy' ? [P, base] : [base, P], ctrls = [];
    const attempt = to => { const ac = new AbortController(); ctrls.push(ac); const stop = () => ac.abort(); if (sig) sig.addEventListener('abort', stop, { once: true });
      return orig(to + url.slice(base.length), Object.assign({}, init, { signal: ac.signal })).then(r => { remember(to === P ? 'proxy' : 'direct'); return r; }); };
    if (sig && sig.aborted) return Promise.reject(sig.reason || new DOMException('Aborted', 'AbortError'));
    if (isRead(path, init)) {
      // هر کدام زودتر جواب داد؛ دیگری لغو می‌شود. اگر هر دو خطا دادند، خطای آخر.
      return new Promise((resolve, reject) => {
        let done = false, started = 1, failed = 0, err, timer;
        const second = () => { clearTimeout(timer); if (started === 2 || done || (sig && sig.aborted)) return; started = 2; go(order[1], 1); };
        const go = (to, i) => attempt(to).then(r => { if (done) return; done = true; clearTimeout(timer); ctrls.forEach((a, j) => j !== i && a.abort()); resolve(r); },
          e => { err = e; failed++; if (done || failed < started) return; if (started === 1 && !(sig && sig.aborted)) second(); else reject(err); });
        go(order[0], 0); timer = setTimeout(second, 3000);
      });
    }
    return (async () => {
      let err;
      for (let i = 0; i < 2; i++) {
        const t = i === 0 ? setTimeout(() => ctrls[0] && ctrls[0].abort(), 6000) : 0;
        try { return await attempt(order[i]); } catch (e) { err = e; if (sig && sig.aborted) throw e; } finally { clearTimeout(t); }
      }
      throw err;
    })();
  };
})();
