window.APP_CONFIG = {
  SUPABASE_URL: 'https://wnswskzgfaywpmjhdgnx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_oMecZYzkE826ignXDc72Bw_mmHBpWmu',
  // کلید عمومی اعلان (VAPID). کلید خصوصی جفت آن فقط در Secrets تابع daily-reminders در Supabase است.
  VAPID_PUBLIC_KEY: 'BKrQ8ZqCBoafCsGdmyVecm9MnhBie3U6JQARQYUf3drvvKVQonnfYEPlkh3TEy4uD54uf0Sp9csZxiAwEpqHVSw'
};
// وقتی سرور Supabase از اینترنت ایران (بدون فیلترشکن) در دسترس نیست، همان درخواست از راه رله Cloudflare فرستاده می‌شود
// (backend/cloudflare/relay.js). اول مستقیم امتحان می‌شود (حداکثر ۸ ثانیه)، اگر نرسید از رله؛ راهی که جواب داد تا ۶ ساعت اول امتحان می‌شود.
// SUPABASE_PROXY خالی باشد یعنی رله خاموش است. نشانی رله باید در connect-src و img-src سیاست امنیتی index.html هم باشد.
self.APP_CONFIG.SUPABASE_PROXY = '';
(function () {
  const c = self.APP_CONFIG, P = c.SUPABASE_PROXY, base = c.SUPABASE_URL;
  if (!P || typeof self.fetch !== 'function') return;
  const orig = self.fetch.bind(self), K = 'sbRoute';
  const first = () => { try { const v = JSON.parse(localStorage.getItem(K)); return v && Date.now() - v.at < 6 * 3600e3 ? v.via : null; } catch { return null; } };
  const remember = via => { try { localStorage.setItem(K, JSON.stringify({ via, at: Date.now() })); } catch {} };
  self.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';
    if (!url.startsWith(base + '/')) return orig(input, init);
    const sig = init && init.signal, order = first() === 'proxy' ? [P, base] : [base, P];
    let err;
    for (let i = 0; i < 2; i++) {
      const to = order[i], ac = new AbortController(), stop = () => ac.abort();
      if (sig) { if (sig.aborted) throw sig.reason || new DOMException('Aborted', 'AbortError'); sig.addEventListener('abort', stop); }
      const t = i === 0 ? setTimeout(stop, 8000) : 0;
      try { const r = await orig(to + url.slice(base.length), Object.assign({}, init, { signal: ac.signal })); remember(to === P ? 'proxy' : 'direct'); return r; }
      catch (e) { err = e; if (sig && sig.aborted) throw e; }
      finally { clearTimeout(t); if (sig) sig.removeEventListener('abort', stop); }
    }
    throw err;
  };
})();
